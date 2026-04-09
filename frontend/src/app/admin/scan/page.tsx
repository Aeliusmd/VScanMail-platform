"use client";

import { useEffect, useMemo, useState, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

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
  return 3;
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

const PROCESSING_MSGS = ['Uploading encrypted scans…', 'GPT-4o Vision Analysis…', 'Security & Tamper Audit…', 'Identifying Organization…', '6-Point Cheque Validation…'];

export default function AdminScanPage() {
  const [phase, setPhase] = useState<ScanPhase>('step1_ready');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMsgIndex, setScanMsgIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // AI & Client State
  const [scannedImages, setScannedImages] = useState<{
    front: string | null;
    back: string | null;
    content: string | null;
  }>({ front: null, back: null, content: null });
  const [isSkipped, setIsSkipped] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [confirmedClientId, setConfirmedClientId] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all clients for the override dropdown
  useEffect(() => {
    apiClient<{ clients: any[] }>('/api/clients')
      .then(data => {
        if (data.clients) setClients(data.clients);
      })
      .catch(err => console.error('Failed to load clients:', err));
  }, []);

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
      setScanMsgIndex((prev) => Math.min(prev + 1, 4));
    }, 1200);

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
              handleAnalyzeAll();
            }
          }, 300);
          return 100;
        }
        return prev + (phase === 'processing' ? 1 : 2);
      });
    }, 80);

    return () => {
      window.clearInterval(msgInterval);
      window.clearInterval(progressInterval);
    };
  }, [phase]);

  const handleAnalyzeAll = async () => {
    // Validation: Ensure we actually have front and back images before calling AI
    if (!scannedImages.front || !scannedImages.back) {
      console.warn("AI Analysis aborted: Missing envelope images.");
      setPhase('step1_ready'); // Reset to step 1
      alert("AI Analysis aborted: Front and Back envelope images are required.");
      return;
    }

    try {
      const result = await apiClient<{ success: boolean; data: any }>('/api/records/analyze', {
        method: 'POST',
        body: JSON.stringify({
          front: scannedImages.front,
          back: scannedImages.back,
          content: scannedImages.content,
          isSkipped
        }),
      });

      setAnalysisResult(result.data);
      if (result.data.suggestedClient) {
        setConfirmedClientId(result.data.suggestedClient.id);
      }
      setPhase('complete');
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setPhase('step3_done');
      alert(`AI Analysis failed: ${err.message || 'Please try again.'}`);
    }
  };

  const handleFinalize = async () => {
    setSendingEmail(true);
    try {
      await apiClient<{ success: boolean; recordId: string }>('/api/records/finalize', {
        method: 'POST',
        body: JSON.stringify({
          clientId: confirmedClientId,
          docType: analysisResult.docType || 'letter',
          urls: analysisResult.urls,
          tampering: analysisResult.tampering,
          aiResults: analysisResult.aiResults,
          ocrText: analysisResult.ocrText
        }),
      });

      setSendingEmail(false);
      setShowSuccess(true);
    } catch (err: any) {
      setSendingEmail(false);
      alert(`Finalization failed: ${err.message || 'Please try again.'}`);
    }
  };

  const handleReset = () => {
    setPhase('step1_ready');
    setScanProgress(0);
    setScanMsgIndex(0);
    setShowPopup(false);
    setEmailSent(false);
    setSendingEmail(false);
    setShowSuccess(false);
    setScannedImages({ front: null, back: null, content: null });
    setIsSkipped(false);
    setAnalysisResult(null);
    setConfirmedClientId('');
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const stepIdx = getStepIndex(phase);

      setScannedImages(prev => {
        const next = { ...prev };
        if (stepIdx === 0) next.front = base64;
        else if (stepIdx === 1) next.back = base64;
        else if (stepIdx === 2) next.content = base64;
        return next;
      });

      if (phase === 'step1_ready') setPhase('step1_done');
      else if (phase === 'step2_ready') setPhase('step2_done');
      else if (phase === 'step3_ready') setPhase('step3_done');
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be selected again later
    e.target.value = '';
  };

  const handleSkipContent = () => {
    setIsSkipped(true);
    setPhase('processing');
  };

  const currentStepIndex = getStepIndex(phase);
  const currentStepConfig = STEPS_CONFIG[Math.min(currentStepIndex, 2)];

  const activeScanMsgs = useMemo(() => {
    return phase === 'processing' ? PROCESSING_MSGS : currentStepConfig.scanningMessages;
  }, [phase, currentStepConfig.scanningMessages]);

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === confirmedClientId);
  }, [clients, confirmedClientId]);

  return (
    <div className="p-4 sm:p-6 min-h-full flex flex-col gap-4">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Light Blue Scan Area */}
      <div className="bg-[#DAEAF7] rounded-2xl p-6 sm:p-8 flex flex-col min-h-[calc(100vh-200px)]">
        {/* Step Progress Bar */}
        <div className="mb-6 sm:mb-10 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] max-w-3xl mx-auto w-full">
            {['Front Side', 'Back Side', 'Content', 'Processing'].map((label, i) => {
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
                      {completed ? <i className="ri-check-line text-xl"></i> : <i className={`${STEPS_CONFIG[Math.min(i, 2)]?.icon || 'ri-cpu-line'} text-xl`}></i>}
                    </div>
                    <p className={`text-xs font-semibold mt-2 whitespace-nowrap ${isActive ? 'text-[#0A3D8F]' : completed ? 'text-[#2F8F3A]' : 'text-slate-400'}`}>
                      {label}
                    </p>
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-500 ${isStepCompleted(i, phase) ? 'bg-[#2F8F3A]' : 'bg-slate-300/60'}`}></div>
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
              const isComp = isStepCompleted(i, phase);
              const idAct = getStepIndex(phase) === i;
              return (
                <div key={i} className={`rounded-xl p-4 border transition-all duration-300 ${isComp ? 'bg-green-50 border-green-200' : idAct ? 'bg-white border-[#0A3D8F]/30 shadow-sm' : 'bg-white/40 border-slate-200'}`}>
                   <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isComp ? 'bg-[#2F8F3A] text-white' : idAct ? 'bg-[#0A3D8F] text-white' : 'bg-slate-100 text-slate-400'}`}>
                         {isComp ? <i className="ri-check-line text-sm"></i> : <i className={`${cfg.icon} text-sm`}></i>}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isComp ? 'text-[#2F8F3A]' : idAct ? 'text-[#0A3D8F]' : 'text-slate-400'}`}>Step {cfg.stepNumber}</p>
                        <p className={`text-xs ${isComp ? 'text-[#2F8F3A]' : idAct ? 'text-slate-700' : 'text-slate-400'}`}>{cfg.label}</p>
                      </div>
                   </div>
                </div>
              );
            })}
            
            <div className={`rounded-xl p-4 border transition-all duration-300 ${phase === 'complete' ? 'bg-green-50 border-green-200' : phase === 'processing' ? 'bg-white border-[#0A3D8F]/30 shadow-sm' : 'bg-white/40 border-slate-200'}`}>
               <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${phase === 'complete' ? 'bg-[#2F8F3A] text-white' : phase === 'processing' ? 'bg-[#0A3D8F] text-white' : 'bg-slate-100 text-slate-400'}`}>
                     {phase === 'complete' ? <i className="ri-check-line text-sm"></i> : <i className="ri-cpu-line text-sm"></i>}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${phase === 'complete' ? 'text-[#2F8F3A]' : phase === 'processing' ? 'text-[#0A3D8F]' : 'text-slate-400'}`}>Step 4</p>
                    <p className={`text-xs ${phase === 'complete' ? 'text-[#2F8F3A]' : phase === 'processing' ? 'text-slate-700' : 'text-slate-400'}`}>AI Analysis</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Right: Main Action Card */}
          <div className="flex-1">
            {/* READY PHASE */}
            {(phase === 'step1_ready' || phase === 'step2_ready' || phase === 'step3_ready') && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center px-4 py-1.5 bg-[#0A3D8F]/10 text-[#0A3D8F] text-xs font-bold rounded-full mb-6 uppercase tracking-wide">
                    Step {currentStepConfig.stepNumber} of 4
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{currentStepConfig.readyTitle}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8">{currentStepConfig.readyMessage}</p>
                  <div className="bg-slate-50 rounded-xl p-8 mb-8 flex items-center justify-center">
                     <div className={`w-32 h-20 border-3 border-dashed rounded-xl flex items-center justify-center ${currentStepConfig.envelopeColor}`}>
                        <i className={`${currentStepConfig.icon} text-4xl animate-pulse`}></i>
                     </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] transition-colors flex items-center justify-center gap-2">
                    <i className="ri-scan-2-line text-lg"></i>
                    {currentStepConfig.scanLabel}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border border-dashed border-[#0A3D8F]/50 text-[#0A3D8F] text-xs font-bold rounded-xl hover:bg-[#0A3D8F]/5">
                    <i className="ri-upload-2-line mr-1"></i> Manual Upload (Hardware Free)
                  </button>
                  {phase === 'step3_ready' && (
                    <button onClick={handleSkipContent} className="w-full py-2.5 text-slate-500 text-xs font-bold hover:bg-slate-100 rounded-xl">Skip Content Scan (Process Envelope Only)</button>
                  )}
                </div>
              </div>
            )}

            {/* SCANNING PHASE */}
            {(phase === 'step1_scanning' || phase === 'step2_scanning' || phase === 'step3_scanning' || phase === 'processing') && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-[#0A3D8F]/10 rounded-full flex items-center justify-center mb-8 relative">
                   <i className={`${phase === 'processing' ? 'ri-cpu-line' : currentStepConfig.icon} text-[#0A3D8F] text-5xl`}></i>
                   <div className="absolute inset-0 rounded-full border-4 border-[#0A3D8F]/20 border-t-[#0A3D8F] animate-spin"></div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{phase === 'processing' ? 'AI Analysis in Progress…' : `Scanning ${currentStepConfig.label}…`}</h2>
                <p className="text-sm text-[#0A3D8F] font-medium mb-6">{activeScanMsgs[scanMsgIndex]}</p>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden max-w-sm">
                   <div className="h-full bg-[#0A3D8F] transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* DONE PHASE */}
            {(phase === 'step1_done' || phase === 'step2_done' || phase === 'step3_done') && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-10 border border-white/60 h-full flex flex-col justify-between text-center items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                   <i className="ri-check-line text-[#2F8F3A] text-5xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{currentStepConfig.label} Captured</h2>
                <p className="text-slate-600 text-sm mb-8">{currentStepConfig.doneMessage}</p>
                <button 
                  onClick={() => {
                    if (phase === 'step1_done') setPhase('step2_ready');
                    else if (phase === 'step2_done') setPhase('step3_ready');
                    else if (phase === 'step3_done') setPhase('processing');
                  }}
                  className="w-full py-4 bg-[#0A3D8F] text-white font-bold rounded-xl"
                >
                  {phase === 'step3_done' ? 'Run Intelligent Intelligence' : 'Next Step'}
                </button>
              </div>
            )}

            {/* COMPLETE PHASE - THE RESULT REPORT */}
            {phase === 'complete' && analysisResult && (
              <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/60 h-full flex flex-col gap-6 overflow-y-auto max-h-[700px]">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Digitization Report</h2>
                    <span className="px-3 py-1 bg-[#2F8F3A]/10 text-[#2F8F3A] text-xs font-bold rounded-full uppercase tracking-tighter">AI Verified</span>
                 </div>

                 {/* 1. Security & Tampering */}
                 <div className={`p-5 rounded-2xl border ${analysisResult.tampering?.tamper_detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                       <p className="text-sm font-bold flex items-center gap-2">
                          <i className={analysisResult.tampering?.tamper_detected ? 'ri-shield-cross-line text-red-600' : 'ri-shield-check-line text-green-600'}></i>
                          Envelope Security Audit
                       </p>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${analysisResult.tampering?.tamper_detected ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                          {analysisResult.tampering?.tamper_detected ? 'Tamper Detected' : 'Passed'}
                       </span>
                    </div>
                    {analysisResult.tampering?.findings?.length > 0 && (
                      <ul className="space-y-2">
                         {analysisResult.tampering.findings.map((f:any, i:number) => (
                           <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                              <i className="ri-error-warning-fill text-red-400 mt-0.5"></i>
                              <div>
                                 <span className="font-bold text-slate-800">{f.type}:</span> {f.description} ({f.location})
                              </div>
                           </li>
                         ))}
                      </ul>
                    )}
                    <p className="mt-3 text-[11px] italic text-slate-500 italic">Recommendation: {analysisResult.tampering?.recommendation}</p>
                 </div>

                 {/* 2. Content Intel */}
                 <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <p className="text-sm font-bold mb-4 flex items-center gap-2">
                       <i className="ri-lightbulb-line text-orange-400"></i>
                       Content Intelligence
                    </p>
                    {analysisResult.docType === 'cheque' ? (
                       <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Payee</p>
                                <p className="text-xs font-bold text-slate-800">{analysisResult.aiResults?.extracted?.payee_name || 'N/A'}</p>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Amount</p>
                                <p className="text-xs font-bold text-slate-800">${analysisResult.aiResults?.extracted?.amount_figures?.toLocaleString() || '0'}</p>
                             </div>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                             <p className="text-[10px] text-blue-600 font-bold uppercase mb-2">6-Point Validation Engine</p>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {analysisResult.aiResults?.validation?.checks?.map((c:any, i:number) => (
                                   <div key={i} className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-500 capitalize">{c.check.replace(/_/g, ' ')}</span>
                                      <i className={c.passed ? "ri-checkbox-circle-fill text-green-50" : "ri-error-warning-fill text-red-50"}></i>
                                      <i className={c.passed ? "ri-checkbox-circle-fill text-green-500" : "ri-close-circle-fill text-red-500"}></i>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Executive Summary</p>
                             <p className="text-xs text-slate-700 leading-relaxed font-medium">{analysisResult.aiResults?.summary || 'No summary available'}</p>
                          </div>
                          {analysisResult.aiResults?.actions?.length > 0 && (
                             <div className="space-y-2">
                                {analysisResult.aiResults.actions.map((a:any, i:number) => (
                                   <div key={i} className="flex items-center gap-2 p-2 bg-orange-50/50 rounded-lg border border-orange-100 text-[10px] font-bold text-orange-700">
                                      <i className="ri-notification-3-line"></i> {a.action} {a.deadline && `(By ${a.deadline})`}
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    )}
                 </div>

                 {/* 3. Organization Confirmation */}
                 <div className="p-5 bg-[#0A3D8F]/5 border border-[#0A3D8F]/20 rounded-2xl">
                    <p className="text-sm font-bold text-[#0A3D8F] mb-3 flex items-center gap-2">
                       <i className="ri-building-line text-[#0A3D8F]"></i>
                       Assign to Organization
                    </p>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0A3D8F] text-white flex items-center justify-center rounded-lg font-bold">
                             {selectedClient?.company_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] text-slate-400 font-bold uppercase">AI Ssuggested</p>
                             <p className="text-sm font-bold text-slate-800">{selectedClient?.company_name || 'Unidentified'}</p>
                          </div>
                       </div>
                       
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Change/Correct Organization</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3D8F] shadow-sm"
                            value={confirmedClientId}
                            onChange={(e) => setConfirmedClientId(e.target.value)}
                          >
                             <option value="">Select Organization Manually...</option>
                             {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 pt-4 mt-auto">
                    <button onClick={handleReset} className="px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-white transition-all">Scan New</button>
                    <button 
                       disabled={!confirmedClientId || sendingEmail}
                       onClick={handleFinalize} 
                       className="flex-1 py-4 bg-[#0A3D8F] text-white font-bold rounded-xl hover:bg-[#083170] shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                       {sendingEmail ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <i className="ri-send-plane-fill"></i>}
                       Confirm & Forward
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#2F8F3A]"></div>
            <div className="w-20 h-20 bg-green-100 text-[#2F8F3A] rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
               <i className="ri-checkbox-circle-fill"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
            <p className="text-slate-500 mb-8 text-sm">Digitization confirmed. The record is now permanently stored for {selectedClient?.company_name}.</p>
            <div className="flex flex-col gap-3">
               <Link href="/admin/mails" className="w-full py-4 bg-[#0A3D8F] text-white font-bold rounded-2xl shadow-lg shadow-blue-100">View Active Records</Link>
               <button onClick={handleReset} className="w-full py-4 text-[#0A3D8F] font-bold rounded-2xl border border-[#0A3D8F]/20 hover:bg-[#0A3D8F]/5">Scan Next Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
