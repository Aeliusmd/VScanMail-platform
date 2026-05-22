"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../../lib/api/auth";
import {
  HiOutlineShieldCheck,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineArrowDownTray,
  HiInformationCircle,
} from "react-icons/hi2";

export default function Setup2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/customer/account";
  const [step, setStep] = useState<1 | 2>(1);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [codesSaved, setCodesSaved] = useState(false);

  useEffect(() => {
    if (step === 1) {
      setLoading(true);
      authApi
        .getSetup2FA()
        .then((res) => {
          setQrCode(res.qrCode);
          setSecret(res.secret);
        })
        .catch((err: any) => {
          setError(err.message || "Failed to load Google Authenticator setup details.");
        })
        .finally(() => setLoading(false));
    }
  }, [step]);

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      setError("Please enter a valid 6-digit Google Authenticator code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.confirm2FA(totpCode);
      const res = await authApi.skipBackupEmail();
      setRecoveryCodes(res.codes);
      setSuccess("2-Factor Authentication enabled successfully!");
      setTimeout(() => {
        setSuccess("");
        setStep(2);
      }, 800);
    } catch (err: any) {
      setError(err.message || "Invalid Google Authenticator code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCodes = () => {
    const text = `VScanMail Account Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\nStore these codes in a safe place. Each code can be used once.\n\n${recoveryCodes.join("\n")}\n`;
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    el.download = "vscanmail-recovery-codes.txt";
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const stepLabel = step === 1 ? "Link Authenticator" : "Save Recovery Codes";
  const stepPercent = step === 1 ? "50%" : "100%";
  const stepProgressWidth = step === 1 ? "50%" : "100%";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#BAD9F5",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      {/* ── Left Panel ── */}
      <div
        style={{
          width: "50%",
          display: "flex",
          justifyContent: "flex-start",
          background: "#BAD9F5",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            width: "calc(50vw - 340px)",
            minWidth: 180,
            height: "100%",
            minHeight: "100vh",
            borderRadius: "0 30px 30px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 12px 24px",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(24px, 3vw, 38px)",
              fontWeight: 700,
              color: "#000000",
              textAlign: "center",
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            Secure Your Account
          </h1>
          <p
            style={{
              fontSize: "clamp(14px, 1.8vw, 20px)",
              color: "#656565",
              textAlign: "center",
              margin: "0 0 24px",
              lineHeight: 1.35,
              padding: "0 8px",
            }}
          >
            Set up 2-Factor Authentication to protect your digital mailroom
          </p>
          <Image
            src="/images/signup.png"
            alt="VScanMail Security"
            width={576}
            height={864}
            style={{
              width: "100%",
              maxHeight: "calc(100vh - 260px)",
              height: "auto",
              objectFit: "contain",
              flexShrink: 1,
            }}
          />
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        style={{
          width: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#BAD9F5",
          paddingTop: 40,
          paddingBottom: 40,
          paddingRight: "min(340px, 22vw)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "min(620px, 42vw)",
            minWidth: 0,
            background: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.10), 0px 8px 10px -6px rgba(0,0,0,0.10)",
            padding: 28,
            boxSizing: "border-box",
          }}
        >
          {/* Progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                Step {step} of 2 — {stepLabel}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{stepPercent}</span>
            </div>
            <div
              style={{
                width: "100%",
                height: 6,
                background: "#E5E7EB",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: stepProgressWidth,
                  height: "100%",
                  background: "#0A3D8F",
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#FEF2F2",
                color: "#B91C1C",
                fontSize: 13,
                lineHeight: "20px",
                marginBottom: 16,
              }}
            >
              <HiInformationCircle style={{ flexShrink: 0, fontSize: 18, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #BBF7D0",
                background: "#F0FDF4",
                color: "#15803D",
                fontSize: 13,
                lineHeight: "20px",
                marginBottom: 16,
              }}
            >
              <HiOutlineCheck style={{ flexShrink: 0, fontSize: 18, marginTop: 1 }} />
              <span>{success}</span>
            </div>
          )}

          {/* ── STEP 1: Link Google Authenticator ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                  Link Google Authenticator
                </h2>
                <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
                  Scan the QR code with Google Authenticator, then enter the 6-digit code to enable 2-Factor Authentication.
                </p>
              </div>

              {/* Info banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 20,
                }}
              >
                <HiOutlineShieldCheck style={{ flexShrink: 0, fontSize: 18, color: "#0A3D8F", marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A3D8F", margin: "0 0 2px" }}>
                    Why add this?
                  </p>
                  <p style={{ fontSize: 13, color: "#1D4ED8", margin: 0, lineHeight: "18px" }}>
                    2-Factor Authentication adds a 6-digit code check to help protect your mailroom account if your password is compromised.
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 12 }}>
                  Step 1 — Scan this QR code with Google Authenticator
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#FFFFFF",
                    border: "2px solid #E5E7EB",
                    borderRadius: 12,
                    padding: 12,
                    width: 176,
                    height: 176,
                  }}
                >
                  {qrCode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCode} alt="Google Authenticator QR code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        border: "3px solid #0A3D8F",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Secret Key */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Or enter this key manually
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <code style={{ fontSize: 13, color: "#111827", wordBreak: "break-all", fontFamily: "monospace", userSelect: "all" }}>
                    {secret || "Loading…"}
                  </code>
                  <button
                    type="button"
                    onClick={copySecret}
                    style={{
                      flexShrink: 0,
                      background: "none",
                      border: "1px solid #D1D5DB",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "#374151",
                    }}
                  >
                    {copied ? <HiOutlineCheck style={{ fontSize: 14, color: "#16A34A" }} /> : <HiOutlineClipboardDocument style={{ fontSize: 14 }} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* TOTP Input */}
              <form onSubmit={handleVerifyTotp}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                    Step 2 — Enter the 6-digit code from Google Authenticator
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    disabled={loading}
                    style={{
                      boxSizing: "border-box",
                      width: "100%",
                      height: 48,
                      padding: "10px 12px",
                      background: "#FFFFFF",
                      border: "1px solid #D1D5DB",
                      borderRadius: 8,
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      color: "#111827",
                      textAlign: "center",
                      outline: "none",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    height: 44,
                    background: loading || totpCode.length !== 6 ? "#93C5FD" : "#0A3D8F",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: loading || totpCode.length !== 6 ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  {loading ? "Verifying…" : <><span>Verify & Continue</span><HiOutlineArrowRight /></>}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Recovery Codes ── */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                  Save Your Recovery Codes
                </h2>
                <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
                  Store these codes somewhere safe. Each code works once. They will <strong>not</strong> be shown again.
                </p>
              </div>

              {/* Warning banner */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 16,
                }}
              >
                <HiInformationCircle style={{ flexShrink: 0, fontSize: 18, color: "#B45309", marginTop: 1 }} />
                <p style={{ fontSize: 13, color: "#92400E", margin: 0, lineHeight: "18px" }}>
                  If you lose access to Google Authenticator and recovery codes, you will be permanently locked out of your account.
                </p>
              </div>

              {/* Codes grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                {recoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: 6,
                      padding: "8px 10px",
                      textAlign: "center",
                      fontFamily: "monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                      letterSpacing: "0.05em",
                      userSelect: "all",
                    }}
                  >
                    {code}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={copyCodes}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    height: 40,
                    background: "#FFFFFF",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {copied
                    ? <><HiOutlineCheck style={{ color: "#16A34A" }} /> Copied</>
                    : <><HiOutlineClipboardDocument /> Copy Codes</>}
                </button>
                <button
                  type="button"
                  onClick={downloadCodes}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    height: 40,
                    background: "#FFFFFF",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <HiOutlineArrowDownTray /> Download (.txt)
                </button>
              </div>

              {/* Acknowledgement */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  padding: "14px",
                  background: codesSaved ? "#F0FDF4" : "#F9FAFB",
                  border: `1px solid ${codesSaved ? "#BBF7D0" : "#E5E7EB"}`,
                  borderRadius: 8,
                  marginBottom: 20,
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={codesSaved}
                  onChange={(e) => setCodesSaved(e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0A3D8F", flexShrink: 0, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, color: "#374151", lineHeight: "20px" }}>
                  I have saved these recovery codes in a safe place. I understand they will not be shown again.
                </span>
              </label>

              <button
                type="button"
                onClick={() => router.replace(returnTo.startsWith("/customer") ? returnTo : "/customer/account")}
                disabled={!codesSaved || loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  height: 44,
                  background: !codesSaved ? "#E5E7EB" : "#0A3D8F",
                  color: !codesSaved ? "#9CA3AF" : "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: !codesSaved ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                Go to Dashboard <HiOutlineArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1200px) {
          .setup2fa-left { display: none !important; }
          .setup2fa-right { width: 100% !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
