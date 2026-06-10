#!/usr/bin/env node
/**
 * Vision-Enhanced Bug Fixer
 * Fetches a bug from Azure DevOps (including screenshots), analyzes visually
 * with Claude, then runs Claude Code to implement the fix.
 *
 * Usage:
 *   node scripts/fix-bug.mjs --id 16068
 *   node scripts/fix-bug.mjs --name "Remember Me"
 *   node scripts/fix-bug.mjs --id 16068 --dry-run
 *
 * Required env vars:
 *   AZURE_DEVOPS_PAT    — Azure DevOps Personal Access Token
 *   ANTHROPIC_API_KEY   — Anthropic API key (for vision analysis)
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] ?? null : null;
};
const hasFlag = (flag) => args.includes(flag);

const ORG = getArg("--org") ?? "MedCubeUSA";
const PROJECT = getArg("--project") ?? "Medcube AI";
const BUG_ID = getArg("--id");
const BUG_NAME = getArg("--name");
const DRY_RUN = hasFlag("--dry-run");
const PAT = process.env.AZURE_DEVOPS_PAT;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!PAT) { console.error("[fix-bug] ERROR: AZURE_DEVOPS_PAT not set"); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error("[fix-bug] ERROR: ANTHROPIC_API_KEY not set"); process.exit(1); }
if (!BUG_ID && !BUG_NAME) {
  console.error("[fix-bug] ERROR: Provide --id <bugId> or --name <bugName>");
  process.exit(1);
}

// ── Azure DevOps helpers ────────────────────────────────────────────────────
const base64Pat = Buffer.from(`:${PAT}`).toString("base64");
const azHeaders = {
  Authorization: `Basic ${base64Pat}`,
  "Content-Type": "application/json",
};
const encodedProject = encodeURIComponent(PROJECT);
const baseUrl = `https://dev.azure.com/${ORG}`;

async function azGet(url) {
  const res = await fetch(url, { headers: azHeaders });
  if (!res.ok) throw new Error(`Azure DevOps API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function azDownloadBinary(url, destPath) {
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${base64Pat}` },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

// ── Find bug ID by name (WIQL) ──────────────────────────────────────────────
async function resolveBugId() {
  if (BUG_ID) return BUG_ID;

  const wiql = {
    query: `SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = '${PROJECT}' AND [System.WorkItemType] = 'Bug' AND [System.Title] Contains '${BUG_NAME}' ORDER BY [System.ChangedDate] DESC`,
  };
  const resp = await fetch(
    `${baseUrl}/${encodedProject}/_apis/wit/wiql?api-version=7.1`,
    { method: "POST", headers: azHeaders, body: JSON.stringify(wiql) }
  );
  const data = await resp.json();
  if (!data.workItems?.length) {
    throw new Error(`No bug found matching: "${BUG_NAME}"`);
  }
  console.log(`[fix-bug] Found ${data.workItems.length} match(es) — using #${data.workItems[0].id}`);
  return String(data.workItems[0].id);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const bugId = await resolveBugId();
  console.log(`\n[fix-bug] ══════════════════════════════════`);
  console.log(`[fix-bug] Bug #${bugId}`);
  console.log(`[fix-bug] ══════════════════════════════════`);

  // Fetch work item with relations (attachments)
  const item = await azGet(
    `${baseUrl}/_apis/wit/workitems/${bugId}?$expand=relations&api-version=7.1`
  );

  const f = item.fields;
  const title = f["System.Title"] ?? "(no title)";
  const desc = (f["System.Description"] ?? "").replace(/<[^>]+>/g, "").trim();
  const repro = (f["Microsoft.VSTS.TCM.ReproSteps"] ?? "").replace(/<[^>]+>/g, "").trim();
  const acceptCrit = (f["Microsoft.VSTS.Common.AcceptanceCriteria"] ?? "").replace(/<[^>]+>/g, "").trim();
  const workUrl = `${baseUrl}/${encodedProject}/_workitems/edit/${bugId}`;

  console.log(`[fix-bug] Title : ${title}`);
  console.log(`[fix-bug] URL   : ${workUrl}`);

  // ── Collect image attachments ─────────────────────────────────────────────
  const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"]);
  const attachments = (item.relations ?? []).filter((r) => r.rel === "AttachedFile");
  const imageAttachments = attachments.filter((r) => {
    const name = (r.attributes?.name ?? "").toLowerCase();
    return IMAGE_EXTS.has(path.extname(name));
  });

  console.log(`[fix-bug] Attachments: ${attachments.length} total, ${imageAttachments.length} image(s)`);

  const tmpDir = path.join(ROOT, ".tmp-bug-images");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const downloadedImages = [];
  for (const att of imageAttachments) {
    const name = att.attributes?.name ?? `attachment-${Date.now()}`;
    const localPath = path.join(tmpDir, `bug${bugId}-${name}`);
    console.log(`[fix-bug] Downloading: ${name}`);
    await azDownloadBinary(att.url, localPath);
    downloadedImages.push({ path: localPath, name });
  }

  // ── Build Claude vision message ───────────────────────────────────────────
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

  const messageContent = [];

  // Attach screenshots as base64 images
  for (const img of downloadedImages) {
    const ext = path.extname(img.name).slice(1).toLowerCase();
    const mediaType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "gif"
        ? "image/gif"
        : ext === "webp"
        ? "image/webp"
        : "image/png";

    messageContent.push({ type: "text", text: `--- Screenshot: ${img.name} ---` });
    messageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: fs.readFileSync(img.path).toString("base64"),
      },
    });
  }

  // Add the bug text context
  messageContent.push({
    type: "text",
    text: `
You are a senior developer analyzing a QA bug report for the VScanmail / Medcube AI project.
This is a Next.js + Node.js app. Backend: app/api/**, Frontend: frontend/src/**, Lib: lib/modules/**

BUG #${bugId}: ${title}
URL: ${workUrl}

DESCRIPTION:
${desc || "(none)"}

REPRO STEPS:
${repro || "(none)"}

ACCEPTANCE CRITERIA:
${acceptCrit || "(none)"}

${downloadedImages.length > 0 ? "Screenshots are attached above." : "No screenshots attached."}

Provide a structured analysis:

VISUAL_ANALYSIS:
(What you see in the screenshots — describe the exact UI problem visible)

ROOT_CAUSE:
(What is likely wrong in the code — be specific about the type of issue)

FILES_TO_CHECK:
(Comma-separated list of file paths or patterns to grep for, e.g.: frontend/src/app/login/page.tsx, app/api/auth/login/route.ts)

FIX_PLAN:
(Step-by-step: exactly what to change in which file — be precise so another developer can implement it without seeing the screenshots)

VERIFICATION_STEPS:
(How to confirm the fix works — UI steps or test to run)
`,
  });

  // ── Call Claude Vision API ────────────────────────────────────────────────
  console.log(`\n[fix-bug] Analyzing with Claude Vision (${downloadedImages.length} image(s))...`);

  const visionResp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    messages: [{ role: "user", content: messageContent }],
  });

  const analysis = visionResp.content[0].text;

  console.log("\n[fix-bug] ── Vision Analysis ──────────────────────");
  console.log(analysis);
  console.log("[fix-bug] ──────────────────────────────────────────\n");

  if (DRY_RUN) {
    console.log("[fix-bug] DRY RUN — skipping code fix.");
    return;
  }

  // ── Write fix prompt to temp file & run Claude Code ──────────────────────
  const fixPrompt = `You are fixing Bug #${bugId} in the VScanmail / Medcube AI codebase.

BUG TITLE: ${title}
URL: ${workUrl}

VISUAL ANALYSIS & FIX PLAN (from screenshot analysis):
${analysis}

ORIGINAL BUG DESCRIPTION:
${desc}

REPRO STEPS:
${repro}

TASK:
1. Search the codebase for the files mentioned in FILES_TO_CHECK above
2. Read those files and understand the current code
3. Apply the minimal fix described in FIX_PLAN
4. Do not refactor, add comments, or change anything else
5. After fixing, output a brief SUMMARY: list each changed file and one sentence about what you changed

If you cannot find the relevant code or the fix requires info not in the codebase, output:
NEEDS_CLARIFICATION: <specific reason>`;

  const promptFile = path.join(tmpDir, `prompt-bug${bugId}.txt`);
  fs.writeFileSync(promptFile, fixPrompt, "utf8");

  console.log("[fix-bug] Running Claude Code to implement fix...\n");

  const result = spawnSync(
    "claude",
    ["--print", "--no-markdown"],
    {
      input: fixPrompt,
      encoding: "utf8",
      cwd: ROOT,
      shell: false,
      timeout: 300_000,
    }
  );

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);

  const fixOutput = result.stdout ?? "";
  const succeeded = result.status === 0 && !fixOutput.startsWith("NEEDS_CLARIFICATION:");

  // ── Verify: TypeScript check ──────────────────────────────────────────────
  if (succeeded) {
    console.log("\n[fix-bug] Running TypeScript check...");
    const tsCheck = spawnSync("npx", ["tsc", "--noEmit", "--pretty"], {
      cwd: ROOT,
      encoding: "utf8",
      shell: true,
      timeout: 60_000,
    });
    if (tsCheck.status === 0) {
      console.log("[fix-bug] TypeScript check PASSED.");
    } else {
      console.warn("[fix-bug] TypeScript check FAILED — review changes:");
      if (tsCheck.stdout) console.warn(tsCheck.stdout);
    }

    // Check changed files
    const gitStatus = spawnSync("git", ["status", "--porcelain"], {
      cwd: ROOT, encoding: "utf8", shell: false,
    });
    const changedFiles = (gitStatus.stdout ?? "").trim();
    if (changedFiles) {
      console.log("\n[fix-bug] Changed files:");
      console.log(changedFiles);
    } else {
      console.log("\n[fix-bug] No files changed.");
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  for (const img of downloadedImages) {
    try { fs.unlinkSync(img.path); } catch {}
  }
  try { fs.unlinkSync(promptFile); } catch {}

  // ── Final report ─────────────────────────────────────────────────────────
  console.log("\n[fix-bug] ══════════════════════════════════");
  if (succeeded) {
    console.log(`[fix-bug] DONE — Bug #${bugId} fix applied.`);
    console.log(`[fix-bug] Next: review changes with 'git diff', then commit and push.`);
  } else {
    console.log(`[fix-bug] NEEDS MANUAL REVIEW — Bug #${bugId} could not be auto-fixed.`);
    console.log(`[fix-bug] Reason: ${fixOutput.substring(0, 200)}`);
  }
  console.log("[fix-bug] ══════════════════════════════════\n");

  process.exit(succeeded ? 0 : 1);
}

main().catch((err) => {
  console.error("[fix-bug] Fatal error:", err.message);
  process.exit(1);
});
