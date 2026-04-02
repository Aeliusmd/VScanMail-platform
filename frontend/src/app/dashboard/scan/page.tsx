"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ScanPhase =
  | 'step1_ready'
  | 'step1_scanning'
  | 'step1_done'
  | 'step2_ready'
  | 'step2_scanning'
  | 'step2_done'
  | 'step3_ready'
  | 'step3_scanning'
  | 'step3_done'
  | 'processing'
  | 'complete';

interface StepConfig {
  stepNumber: number;
  label: string;
  icon: string;
  readyTitle: string;
  readyMessage: string;
  helperText: string;
  scanLabel: string;
  scanningMessages: string[];
  doneLabel: string;
  doneMessage: string;
  envelopeColor: string;
}

const STEPS_CONFIG: StepConfig[] = [
  {
    stepNumber: 1,
    label: 'Front Side',
    icon: 'ri-file-line',
    readyTitle: 'Insert Front Side of Envelope',
    readyMessage:
      'Welcome back! Please insert your envelope containing the mail or cheque into the scanner with the front side facing up.',
    helperText: 'Ensure the front side is clearly visible and aligned with the scanner guides.',
    scanLabel: 'Scan Front Side',
    scanningMessages: ['Detecting document…', 'Calibrating scanner…', 'Scanning front side…', 'Capturing image…'],
    doneLabel: 'Front Side Scanned',
    doneMessage: 'Front side captured successfully. The image is clear and ready.',
    envelopeColor: 'border-[#0A3D8F] text-[#0A3D8F] bg-blue-50',
  },
  {
    stepNumber: 2,
    label: 'Back Side',
    icon: 'ri-file-copy-line',
    readyTitle: 'Flip & Insert Back Side',
    readyMessage:
      'Now turn the envelope over and insert the back side into the scanner facing up.',
    helperText: 'Make sure the back side is aligned properly with the scanner edges.',
    scanLabel: 'Scan Back Side',
    scanningMessages: ['Detecting document…', 'Calibrating scanner…', 'Scanning back side…', 'Capturing image…'],
    doneLabel: 'Back Side Scanned',
    doneMessage: 'Back side captured successfully. Envelope condition looks normal.',
    envelopeColor: 'border-orange-400 text-orange-500 bg-orange-50',
  },
  {
    stepNumber: 3,
    label: 'Document Content',
    icon: 'ri-file-text-line',
    readyTitle: 'Open Envelope & Insert Content',
    readyMessage:
      'Please open the envelope carefully and insert the mail or cheque document into the scanner.',
    helperText: 'Handle documents carefully to avoid damage. Lay flat and aligned.',
    scanLabel: 'Scan Document Content',
    scanningMessages: ['Detecting document…', 'Reading content…', 'Extracting data via OCR…', 'Finalizing scan…'],
    doneLabel: 'Content Scanned',
    doneMessage: 'Document content captured. AI is analyzing the text and data.',
    envelopeColor: 'border-[#2F8F3A] text-[#2F8F3A] bg-green-50',
  },
];

function getStepIndex(phase: ScanPhase): number {
  if (phase.startsWith('step1')) return 0;
  if (phase.startsWith('step2')) return 1;
  if (phase.startsWith('step3')) return 2;
  return 3; // processing / complete
}

function isStepCompleted(stepIndex: number, phase: ScanPhase): boolean {
  if (stepIndex === 0)
    return ['step2_ready', 'step2_scanning', 'step2_done', 'step3_ready', 'step3_scanning', 'step3_done', 'processing', 'complete'].includes(
      phase
    );
  if (stepIndex === 1)
    return ['step3_ready', 'step3_scanning', 'step3_done', 'processing', 'complete'].includes(phase);
  if (stepIndex === 2) return ['processing', 'complete'].includes(phase);
  if (stepIndex === 3) return phase === 'complete';
  return false;
}

const PROCESSING_MSGS = ['Merging scanned images…', 'Running AI analysis…', 'Detecting company & recipient…', 'Finalizing document…'];

export default function AdminScanPage() {
  const [phase, setPhase] = useState<ScanPhase>('step1_ready');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMsgIndex, setScanMsgIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Run scanning animation for any scanning phase.
  useEffect(() => {
    const isScanningPhase =
      phase === 'step1_scanning' ||
      phase === 'step2_scanning' ||
      phase === 'step3_scanning' ||
      phase === 'processing';
    if (!isScanningPhase) return;

    setScanProgress(0);
    setScanMsgIndex(0);

    const msgInterval = window.setInterval(() => {
      setScanMsgIndex((prev) => Math.min(prev + 1, 3));
    }, 1100);

    const progressInterval = window.setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(progressInterval);
          window.clearInterval(msgInterval);
          window.setTimeout(() => {
            if (phase === 'step1_scanning') setPhase('step1_done');
            else if (phase === 'step2_scanning') setPhase('step2_done');
            else if (phase === 'step3_scanning') setPhase('step3_done');
            else if (phase === 'processing') {
              setPhase('complete');
              window.setTimeout(() => setShowPopup(true), 500);
            }
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 90);

    return () => {
      window.clearInterval(msgInterval);
      window.clearInterval(progressInterval);
    };
  }, [phase]);

  const handleReset = () => {
    setPhase('step1_ready');
    setScanProgress(0);
    setScanMsgIndex(0);
    setShowPopup(false);
    setEmailSent(false);
    setSendingEmail(false);
    setShowSuccess(false);
  };

  const handleSend = () => {
    setSendingEmail(true);
    window.setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      setShowPopup(false);
      setShowSuccess(true);
    }, 1800);
  };

  const currentStepIndex = getStepIndex(phase);
  const currentStepConfig = STEPS_CONFIG[Math.min(currentStepIndex, 2)];

  const activeScanMsgs = useMemo(() => {
    return phase === 'processing' ? PROCESSING_MSGS : currentStepConfig.scanningMessages;
  }, [phase, currentStepConfig.scanningMessages]);

  const STEPS_NAV = useMemo(
    () => [
      { label: 'Front Side', icon: 'ri-file-line' },
      { label: 'Back Side', icon: 'ri-file-copy-line' },
      { label: 'Content', icon: 'ri-file-text-line' },
      { label: 'Processing', icon: 'ri-cpu-line' },
    ],
    []
  );

  return (
    <div className="p-4 sm:p-6 min-h-full flex flex-col gap-4">
      {/* Light Blue Scan Area */}
      <div className="bg-[#DAEAF7] rounded-2xl p-6 sm:p-8 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Step Progress Bar */}
        <div className="mb-6 sm:mb-10 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] max-w-3xl mx-auto w-full">
            {STEPS_NAV.map((s, i) => {
              const completed = isStepCompleted(i, phase);
              const isActive = currentStepIndex === i;
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        completed
                          ? 'bg-[#2F8F3A] text-white'
                          : isActive
                            ? 'bg-[#0A3D8F] text-white shadow-lg shadow-blue-300'
                            : 'bg-white/70 text-slate-400 border-2 border-slate-300'
                      }`}
                    >
                      {completed ? <i className="ri-check-line text-xl"></i> : <i className={`${s.icon} text-xl`}></i>}
                    </div>
                    <p
                      className={`text-xs font-semibold mt-2 whitespace-nowrap transition-colors ${
                        isActive ? 'text-[#0A3D8F]' : completed ? 'text-[#2F8F3A]' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                  {i < STEPS_NAV.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-3 rounded-full transition-all duration-500 ${
                        isStepCompleted(i, phase) ? 'bg-[#2F8F3A]' : 'bg-slate-300/60'
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 sm:gap-8 max-w-5xl mx-auto w-full">
          {/* Left: Scan Status Panel */}
          <div className="w-full lg:w-56 flex-shrink-0 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 lg:mb-4">Scan Progress</p>

            {STEPS_CONFIG.map((cfg, i) => {
              const isCompleted = isStepCompleted(i, phase);
              const isCurrentReady = phase === `step${i + 1}_ready`;
              const isCurrentScanning = phase === `step${i + 1}_scanning`;
              const isCurrentDone = phase === `step${i + 1}_done`;
              const isActive = isCurrentReady || isCurrentScanning || isCurrentDone;

              return (
                <div
                  key={i}
                  className={`rounded-xl p-4 border transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : isActive
                        ? 'bg-white border-[#0A3D8F]/30 shadow-sm'
                        : 'bg-white/40 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-[#2F8F3A] text-white'
                          : isCurrentScanning
                            ? 'bg-[#0A3D8F] text-white'
                            : isCurrentDone
                              ? 'bg-[#2F8F3A] text-white'
                              : isActive
                                ? 'bg-[#0A3D8F]/10 text-[#0A3D8F]'
                                : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted || isCurrentDone ? (
                        <i className="ri-check-line text-sm"></i>
                      ) : isCurrentScanning ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <i className={`${cfg.icon} text-sm`}></i>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isCompleted || isCurrentDone ? 'text-[#2F8F3A]' : isActive ? 'text-[#0A3D8F]' : 'text-slate-400'
                        }`}
                      >
                        Step {cfg.stepNumber}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isCompleted || isCurrentDone ? 'text-[#2F8F3A]' : isActive ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {cfg.label}
                      </p>
                    </div>
                  </div>

                  {(isCurrentDone || isCompleted) && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-[#2F8F3A] font-medium">✓ {cfg.doneLabel}</p>
                    </div>
                  )}

                  {isCurrentScanning && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0A3D8F] rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Processing block */}
            <div
              className={`rounded-xl p-4 border transition-all duration-300 ${
                phase === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : phase === 'processing'
                    ? 'bg-white border-[#0A3D8F]/30 shadow-sm'
                    : 'bg-white/40 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    phase === 'complete'
                      ? 'bg-[#2F8F3A] text-white'
                      : phase === 'processing'
                        ? 'bg-[#0A3D8F] text-white'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {phase === 'complete' ? (
                    <i className="ri-check-line text-sm"></i>
                  ) : phase === 'processing' ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <i className="ri-cpu-line text-sm"></i>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold ${phase === 'complete' ? 'text-[#2F8F3A]' : phase === 'processing' ? 'text-[#0A3D8F]' : 'text-slate-400'}`}>
                    Step 4
                  </p>
                  <p className={`text-xs ${phase === 'complete' ? 'text-[#2F8F3A]' : phase === 'processing' ? 'text-slate-700' : 'text-slate-400'}`}>AI Processing</p>
                </div>
              </div>

              {phase === 'processing' && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0A3D8F] rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Main action card */}
          <div className="flex-1">
            {/* READY STATE */}
            {(phase === 'step1_ready' || phase === 'step2_ready' || phase === 'step3_ready') && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center px-4 py-1.5 bg-[#0A3D8F]/10 text-[#0A3D8F] text-xs font-bold rounded-full mb-6 uppercase tracking-wide">
                    Step {currentStepConfig.stepNumber} of 4
                  </span>

                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{currentStepConfig.readyTitle}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8">{currentStepConfig.readyMessage}</p>

                  {/* Visual scanner illustration */}
                  <div className="bg-slate-50 rounded-xl p-5 sm:p-6 mb-8 flex items-center justify-center">
                    <div className="relative w-full max-w-xs h-40 flex items-center justify-center">
                      <div className="w-full h-24 bg-gradient-to-b from-slate-200 to-slate-300 rounded-xl border-2 border-slate-400 flex items-center justify-center relative overflow-hidden shadow-md">
                        <div className="w-4/5 h-1.5 bg-slate-500 rounded-full opacity-60"></div>
                        <div className="absolute top-3 left-4 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-3 right-4 flex space-x-1">
                          <div className="w-8 h-2 bg-slate-500 rounded-sm"></div>
                          <div className="w-4 h-2 bg-slate-400 rounded-sm"></div>
                        </div>
                      </div>

                      <div
                        className={`absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-14 border-2 rounded-lg flex items-center justify-center ${currentStepConfig.envelopeColor}`}
                      >
                        <i
                          className={`text-3xl ${
                            phase === 'step1_ready' ? 'ri-mail-line' : phase === 'step2_ready' ? 'ri-mail-unread-line' : 'ri-file-text-line'
                          }`}
                        ></i>
                        {phase === 'step2_ready' && <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">↩</span>}
                      </div>

                      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                        <div className="w-0.5 h-4 bg-[#0A3D8F]/40"></div>
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#0A3D8F]/40"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-information-line text-[#0A3D8F] text-lg"></i>
                    </div>
                    <p className="text-sm text-[#0A3D8F] font-medium">{currentStepConfig.helperText}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-8">
                  {phase !== 'step1_ready' && (
                    <button
                      onClick={() => {
                        if (phase === 'step2_ready') setPhase('step1_done');
                        else if (phase === 'step3_ready') setPhase('step2_done');
                      }}
                      className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (phase === 'step1_ready') setPhase('step1_scanning');
                      else if (phase === 'step2_ready') setPhase('step2_scanning');
                      else if (phase === 'step3_ready') setPhase('step3_scanning');
                    }}
                    className="flex-1 py-4 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer flex items-center justify-center"
                  >
                    <i className="ri-scan-2-line mr-2 text-lg"></i>
                    {currentStepConfig.scanLabel}
                  </button>
                </div>
              </div>
            )}

            {/* SCANNING STATE */}
            {(phase === 'step1_scanning' || phase === 'step2_scanning' || phase === 'step3_scanning') && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col items-center justify-center text-center">
                <span className="inline-flex items-center px-4 py-1.5 bg-[#0A3D8F]/10 text-[#0A3D8F] text-xs font-bold rounded-full mb-6 uppercase tracking-wide">
                  Scanning Step {currentStepConfig.stepNumber} — {currentStepConfig.label}
                </span>

                <div className="w-64 h-44 bg-slate-100 rounded-xl border-2 border-[#0A3D8F]/30 flex items-center justify-center relative overflow-hidden mb-8">
                  <div className="w-44 h-32 bg-white border border-slate-300 rounded-lg flex items-center justify-center relative overflow-hidden shadow-sm">
                    <i className={`${currentStepConfig.icon} text-slate-200 text-5xl`}></i>
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-[#0A3D8F]"
                      style={{
                        top: `${scanProgress}%`,
                        transition: 'top 0.09s linear',
                        boxShadow: '0 0 10px 3px rgba(10,61,143,0.35)',
                      }}
                    ></div>
                    <div className="absolute left-0 top-0 right-0 bg-[#0A3D8F]/5" style={{ height: `${scanProgress}%`, transition: 'height 0.09s linear' }}></div>
                  </div>
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#0A3D8F]"></div>
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#0A3D8F]"></div>
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#0A3D8F]"></div>
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#0A3D8F]"></div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-1">Scanning {currentStepConfig.label}…</h2>
                <p className="text-sm text-[#0A3D8F] font-medium mb-6 h-5">{activeScanMsgs[scanMsgIndex]}</p>

                <div className="w-full max-w-sm mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Progress</span>
                    <span className="font-semibold text-[#0A3D8F]">{scanProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0A3D8F] to-[#1a6dd4] rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>

                <div className="w-full max-w-xs mt-6 space-y-2">
                  {activeScanMsgs.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-center space-x-2 text-xs transition-all ${
                        i < scanMsgIndex ? 'text-[#2F8F3A]' : i === scanMsgIndex ? 'text-[#0A3D8F] font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {i < scanMsgIndex ? (
                          <i className="ri-checkbox-circle-fill text-[#2F8F3A] text-base"></i>
                        ) : i === scanMsgIndex ? (
                          <div className="w-3 h-3 border-2 border-[#0A3D8F] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="ri-circle-line text-slate-300 text-base"></i>
                        )}
                      </div>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DONE STATE */}
            {(phase === 'step1_done' || phase === 'step2_done' || phase === 'step3_done') && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col justify-between">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
                    <i className="ri-checkbox-circle-fill text-[#2F8F3A] text-4xl"></i>
                  </div>
                  <span className="inline-flex items-center px-4 py-1.5 bg-green-100 text-[#2F8F3A] text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
                    ✓ {currentStepConfig.doneLabel}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Scan Successful!</h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md">{currentStepConfig.doneMessage}</p>

                  <div className="w-full bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-start gap-4">
                    <div className={`w-12 h-16 border-2 rounded-lg flex items-center justify-center flex-shrink-0 ${currentStepConfig.envelopeColor}`}>
                      <i className={`${currentStepConfig.icon} text-2xl`}></i>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {currentStepConfig.label} — Scanned
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Resolution: 300 DPI &nbsp;·&nbsp; Format: PDF/TIFF</p>
                      <div className="flex items-center space-x-2 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">Image is damaged</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-[#0A3D8F] text-xs font-semibold rounded-full">Saved</span>
                      </div>
                    </div>
                    <div className="sm:ml-auto text-slate-300">
                      <i className="ri-image-2-line text-3xl"></i>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-8">
                  <button
                    onClick={() => {
                      if (phase === 'step1_done') setPhase('step1_scanning');
                      else if (phase === 'step2_done') setPhase('step2_scanning');
                      else if (phase === 'step3_done') setPhase('step3_scanning');
                    }}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-refresh-line mr-2"></i>Rescan
                  </button>
                  <button
                    onClick={() => {
                      if (phase === 'step1_done') setPhase('step2_ready');
                      else if (phase === 'step2_done') setPhase('step3_ready');
                      else if (phase === 'step3_done') setPhase('processing');
                    }}
                    className="flex-1 py-3.5 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer flex items-center justify-center"
                  >
                    {phase === 'step3_done' ? (
                      <>
                        <i className="ri-cpu-line mr-2"></i>Process All Scans
                      </>
                    ) : (
                      <>
                        Continue to Next Step<i className="ri-arrow-right-line ml-2"></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PROCESSING STATE */}
            {phase === 'processing' && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col items-center justify-center text-center">
                <span className="inline-flex items-center px-4 py-1.5 bg-[#0A3D8F]/10 text-[#0A3D8F] text-xs font-bold rounded-full mb-6 uppercase tracking-wide">
                  Step 4 — AI Processing
                </span>

                <div className="w-24 h-24 bg-[#0A3D8F]/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <i className="ri-cpu-line text-[#0A3D8F] text-5xl"></i>
                  <div className="absolute inset-0 rounded-full border-4 border-[#0A3D8F]/20 border-t-[#0A3D8F] animate-spin"></div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">Processing All Scans…</h2>
                <p className="text-sm text-[#0A3D8F] font-medium mb-6 h-5">{activeScanMsgs[scanMsgIndex]}</p>

                <div className="flex items-center justify-center flex-wrap gap-3 mb-8">
                  {STEPS_CONFIG.map((cfg, i) => (
                    <div key={i} className={`w-16 h-20 border-2 rounded-lg flex flex-col items-center justify-center ${cfg.envelopeColor} opacity-80`}>
                      <i className={`${cfg.icon} text-xl`}></i>
                      <p className="text-xs font-semibold mt-1">{cfg.label.split(' ')[0]}</p>
                    </div>
                  ))}
                  <div className="flex items-center">
                    <i className="ri-arrow-right-line text-slate-400 text-2xl mx-2"></i>
                  </div>
                  <div className="w-16 h-20 border-2 border-[#0A3D8F] rounded-lg bg-[#0A3D8F]/5 flex flex-col items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#0A3D8F] border-t-transparent rounded-full animate-spin mb-1"></div>
                    <p className="text-xs font-semibold text-[#0A3D8F]">AI</p>
                  </div>
                </div>

                <div className="w-full max-w-sm mb-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Processing</span>
                    <span className="font-semibold text-[#0A3D8F]">{scanProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0A3D8F] to-[#1a6dd4] rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* COMPLETE STATE */}
            {phase === 'complete' && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col justify-between">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                    <i className="ri-checkbox-circle-fill text-[#2F8F3A] text-5xl"></i>
                  </div>
                  <span className="inline-flex items-center px-4 py-1.5 bg-green-100 text-[#2F8F3A] text-xs font-bold rounded-full mb-4 uppercase tracking-wide">
                    All Documents Scanned Successfully
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Scanning Complete!</h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-md">
                    All 3 scans have been processed. AI has identified the recipient and prepared the forwarding summary.
                  </p>

                  <div className="flex items-center justify-center flex-wrap gap-3 mb-8">
                    {['Front Side Scanned', 'Back Side Scanned', 'Content Scanned', 'AI Analysis Done'].map((item, i) => (
                      <span key={i} className="flex items-center space-x-1.5 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-[#2F8F3A]">
                        <i className="ri-check-line"></i>
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>

                  <div className="w-full bg-slate-50 rounded-xl p-5 border border-slate-200 text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Identified</p>
                    <div className="flex items-center space-x-3 flex-wrap">
                      <div className="w-11 h-11 bg-[#0A3D8F] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        TS
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Tech Solutions Inc</p>
                        <p className="text-xs text-slate-500">info@techsolutions.com · Document: Mail/Invoice</p>
                      </div>
                      <span className="ml-auto px-2.5 py-1 bg-blue-100 text-[#0A3D8F] text-xs font-bold rounded-full whitespace-nowrap">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mt-8">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-refresh-line mr-2"></i>Scan Another
                  </button>
                  <button
                    onClick={() => setShowPopup(true)}
                    className="flex-1 py-3.5 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap cursor-pointer flex items-center justify-center"
                  >
                    <i className="ri-send-plane-fill mr-2"></i>Forward Scanned Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setShowPopup(false)}>
          <div className="bg-white rounded-2xl overflow-hidden p-8 w-full max-w-[448px]" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="ri-mail-send-line text-[#0A3D8F] text-[30px]"></i>
            </div>
            <h2 className="text-[28px] leading-7 font-bold text-slate-900 text-center mb-3">Forward Scanned Copy</h2>
            <p className="text-slate-600 text-sm text-center mb-6 leading-[23px]">
              We&apos;ve pre-selected a company for you. <strong>Not quite right?</strong> Choose the correct one.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-[#0A3D8F] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    TS
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">Tech Solutions Inc</p>
                    <p className="text-xs text-slate-500 truncate">info@techsolutions.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-1 bg-blue-100 text-[#0A3D8F] text-xs font-semibold rounded-full whitespace-nowrap">
                    AI Detected
                  </span>
                  <button type="button" className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center">
                    <i className="ri-arrow-down-s-line text-sm"></i>
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-200"></div>

              {[
                { initial: 'T', name: 'Tech Solutions Inc', email: 'info@techsolutions.com', bg: 'bg-[#0A3D8F]' },
                { initial: 'I', name: 'Innovatech Co', email: 'contact@innovatech.co', bg: 'bg-[#2F8F3A]' },
                { initial: '2', name: 'NextGen Systems', email: 'support@nextgensystems.com', bg: 'bg-[#D97706]' },
                { initial: '3', name: 'SmartTech Ltd', email: 'hello@smarttechltd.com', bg: 'bg-[#0A3D8F]' },
                { initial: '4', name: 'Digital Dynamics', email: 'info@digitaldynamics.com', bg: 'bg-[#EF4444]' },
              ].map((company) => (
                <div key={company.email} className="flex items-center py-1">
                  <div className="flex items-center gap-2 min-w-0 w-[58%]">
                    <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${company.bg}`}>
                      {company.initial}
                    </div>
                    <p className="text-[14px] leading-5 font-semibold text-slate-900 truncate">{company.name}</p>
                  </div>
                  <p className="text-[14px] leading-5 text-slate-400 truncate w-[42%] text-right">{company.email}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
              <p className="text-xs text-slate-400 mb-1 font-semibold">Subject</p>
              <p className="text-slate-800 font-medium text-sm">New Mail Scanned - Requires Your Attention</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="flex-1 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingEmail}
                onClick={handleSend}
                className={`flex-1 py-3 font-semibold rounded-xl transition-all text-sm whitespace-nowrap flex items-center justify-center ${
                  sendingEmail ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#0A3D8F] text-white hover:bg-[#083170] cursor-pointer'
                }`}
              >
                {sendingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>Sending…
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-fill mr-2"></i>Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl overflow-hidden p-6 sm:p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-checkbox-circle-fill text-[#2F8F3A] text-5xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Successfully Sent!</h2>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              The scanned copy has been forwarded to <strong>Tech Solutions Inc</strong> at info@techsolutions.com.
            </p>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard/mails"
                className="flex-1 py-3 bg-[#0A3D8F] text-white font-semibold rounded-xl hover:bg-[#083170] transition-colors text-sm whitespace-nowrap text-center"
              >
                View All Mails
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

