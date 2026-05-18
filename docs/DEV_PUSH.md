# Dev server — push to trigger QA deploy

QA updates **only** when code is pushed to the **`dev_visal`** branch.

## Workflow (10.103.0.91)

```bash
cd /path/to/VScanmail
git checkout dev_visal
git pull origin dev_visal

# ... make changes ...

git add .
git commit -m "describe your change"
git push origin dev_visal
```

| Action | Triggers QA CI/CD? |
|--------|-------------------|
| `git push origin dev_visal` | **Yes** |
| `git push origin main` | No |
| `git push origin tharukshi-dev` | No |

## After push

1. Open: https://github.com/Aeliusmd/VScanMail-platform/actions
2. Confirm workflow **Deploy QA** runs (branch `dev_visal`).
3. QA machine pulls `origin/dev_visal`, builds, and reloads PM2 (~few minutes).

The dev server working copy is **not** updated by this pipeline. Pull or deploy on dev separately if needed.

## First-time: commit CI/CD files

If `.github/workflows/deploy-qa.yml` is new, commit it on `dev_visal` and push once so GitHub can run the workflow.
