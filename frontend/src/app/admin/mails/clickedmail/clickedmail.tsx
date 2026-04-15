import { useMemo, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import styles from './clickedmail.module.css';
import { apiClient } from '@/lib/api-client';
import { ImageLightbox } from '../../components/ImageLightbox';

interface ClickedMailProps {
  mail: any;
  onClose: () => void;
}

const tagStyles: Record<string, string> = {
  Inbox: styles.tagInbox,
  Delivered: styles.tagDelivered,
  Pending: styles.tagPending,
  Processed: styles.tagInbox,
  Scanned: styles.tagPending,
  Received: styles.tagDelivered,
};

const tagLabel: Record<string, string> = {
  Inbox: 'Processed',
  Delivered: 'Delivered',
  Pending: 'Pending',
  Processed: 'Processed',
  Scanned: 'Scanned',
  Received: 'Received',
  Processed_delivery: 'Processed',
  Scanned_delivery: 'Scanned',
};

export default function ClickedMail({ mail, onClose }: ClickedMailProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleResendEmail = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendSuccess(false);

    try {
      await apiClient(`/api/records/mail/${mail.id}/resend`, {
        method: 'POST',
      });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || "Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };
  
  const raw = mail.raw || {};
  const images = useMemo(() => {
    const inside: string[] = Array.isArray(raw.content_scan_urls)
      ? raw.content_scan_urls.filter(Boolean)
      : [];

    const legacyInside = raw.content_url ? [raw.content_url] : [];

    return [
      raw.envelope_front_url,
      raw.envelope_back_url,
      ...inside,
      ...legacyInside,
    ].filter(Boolean);
  }, [raw]);

  const aiResults = typeof raw.ai_results === 'string' 
    ? JSON.parse(raw.ai_results) 
    : raw.ai_results || {};

  const isCheque = raw.type === 'cheque';
  const riskLevel = raw.ai_risk_level || 'none';

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!hasMounted) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.mailIconBox}>
              <Icon icon={isCheque ? "ri:bank-card-line" : "ri:mail-line"} className={styles.iconMail} />
            </div>
            <div>
              <h2 className={styles.subject}>{mail.subject}</h2>
              <p className={styles.metaInfo}>ML-00{mail.id} &bull; Today, {mail.time}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <Icon icon="ri:close-line" className={styles.iconClose} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Document Carousel */}
          <div className={styles.documentPreviewBox}>
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImgIndex]}
                  alt={`Document page ${currentImgIndex + 1}`}
                  className={styles.documentPreviewImg}
                  onClick={() => setLightboxOpen(true)}
                  style={{ cursor: "zoom-in" }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow text-slate-800 cursor-pointer z-10"
                  aria-label="Open full image"
                >
                  <Icon icon="ri:fullscreen-line" className="text-lg" />
                </button>
                {images.length > 1 && (
                  <>
                    <button className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`} onClick={prevImage}>
                      <Icon icon="ri:arrow-left-s-line" />
                    </button>
                    <button className={`${styles.carouselBtn} ${styles.carouselBtnRight}`} onClick={nextImage}>
                      <Icon icon="ri:arrow-right-s-line" />
                    </button>
                    <div className={styles.imageIndicator}>
                      {currentImgIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 italic text-sm">
                No images available
              </div>
            )}
            <div className={styles.documentOverlay}></div>
          </div>
 
          <ImageLightbox
            open={lightboxOpen}
            images={images}
            index={currentImgIndex}
            onClose={() => setLightboxOpen(false)}
            onPrev={() =>
              setCurrentImgIndex((p) => (p > 0 ? p - 1 : images.length - 1))
            }
            onNext={() => setCurrentImgIndex((p) => (p < images.length - 1 ? p + 1 : 0))}
          />

          {/* Security Status Banner */}
          <div className={`${styles.securityBanner} ${
            riskLevel === 'none' ? styles.securityBannerNone :
            riskLevel === 'low' ? styles.securityBannerLow :
            styles.securityBannerHigh
          }`}>
            <div className={styles.securityIcon}>
              <Icon icon={riskLevel === 'none' ? "ri:shield-check-line" : "ri:shield-cross-line"} className="text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider">Security Analysis</p>
              <p className="text-sm">
                {aiResults.tampering?.tamper_detected 
                  ? `Potential tampering detected: ${aiResults.tampering. findings?.[0]?.description || 'Suspicious alterations found.'}`
                  : `Document verified. Risk Level: ${riskLevel.toUpperCase()}`
                }
              </p>
            </div>
          </div>

          {/* Recipient & Sender */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailCard}>
              <p className={`${styles.detailLabel} ${styles.labelPrimary}`}>Recipient Company</p>
              <div className={styles.companyGroup}>
                <div className={`${styles.companyAvatar} ${mail.senderColor}`}>
                  {mail.company.charAt(0)}
                </div>
                <div>
                  <p className={styles.companyName}>{mail.company}</p>
                  <p className={styles.companyEmail}>info@{mail.company.toLowerCase().replace(/\s+/g, '')}.com</p>
                </div>
              </div>
            </div>

            <div className={styles.detailCard}>
              <p className={`${styles.detailLabel} ${styles.labelSecondary}`}>Sender</p>
              <p className={styles.senderName}>{mail.sender}</p>
              <span className={`${styles.tagBase} ${tagStyles[mail.tag]}`}>
                {tagLabel[mail.tag]}
              </span>
            </div>
          </div>

          {/* Cheque Validation Grid (Only for Cheques) */}
          {isCheque && (
            <div className={styles.validationGrid}>
              {[
                { 
                  label: 'Beneficiary', 
                  value: raw.cheque_beneficiary || aiResults.payee_name, 
                  status: raw.cheque_beneficiary_match !== null ? (raw.cheque_beneficiary_match > 80) : !!(raw.cheque_beneficiary || aiResults.payee_name) 
                },
                { 
                  label: 'Amount (Figures)', 
                  value: raw.cheque_amount_figures !== null ? `$${Number(raw.cheque_amount_figures).toLocaleString()}` : (aiResults.amount_figures ? `$${aiResults.amount_figures.toLocaleString()}` : 'N/A'), 
                  status: !!(raw.cheque_amount_figures !== null || aiResults.amount_figures) 
                },
                { 
                  label: 'Date', 
                  value: raw.cheque_date_on_cheque || aiResults.date, 
                  status: raw.cheque_date_valid !== null ? !!raw.cheque_date_valid : !!(raw.cheque_date_on_cheque || aiResults.date) 
                },
                { 
                  label: 'Signature', 
                  value: (raw.cheque_signature_present ?? aiResults.signature_present) ? 'Detected' : 'Missing', 
                  status: !!(raw.cheque_signature_present ?? aiResults.signature_present) 
                },
                { 
                  label: 'Amount Match', 
                  value: (raw.cheque_amounts_match ?? aiResults.validation?.checks?.find((c:any) => c.check === 'amount_match')?.passed) ? 'Match' : 'Mismatch', 
                  status: !!(raw.cheque_amounts_match ?? aiResults.validation?.checks?.find((c:any) => c.check === 'amount_match')?.passed) 
                },
                { 
                  label: 'Alteration Check', 
                  value: (raw.cheque_alteration_detected ?? false) ? 'Detected' : 'Clean', 
                  status: !(raw.cheque_alteration_detected ?? false) 
                },
              ].map((check, idx) => (
                <div key={idx} className={styles.validationItem}>
                  <div className={styles.validationHeader}>
                    <span className={styles.validationLabel}>{check.label}</span>
                    <Icon 
                      icon={check.status ? "ri:checkbox-circle-fill" : "ri:close-circle-fill"} 
                      className={`${styles.statusIcon} ${check.status ? styles.statusSuccess : styles.statusError}`} 
                    />
                  </div>
                  <p className={styles.validationValue}>{check.value || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          <div className={styles.aiSummaryBox}>
            <div className={styles.aiHeader}>
              <div className={styles.aiIconWrapper}>
                <Icon icon="ri:sparkling-2-fill" className={styles.iconSparkling} />
              </div>
              <span className={styles.aiTitle}>AI-Generated Summary</span>
            </div>
            <p className={styles.aiPreviewText}>
              {aiResults.executive_summary || raw.ai_summary || mail.preview || 'No summary available for this record.'}
            </p>
            <div className={styles.aiFooter}>
              <div className={styles.aiShieldWrapper}>
                <Icon icon="ri:shield-check-line" className={styles.iconShield} />
              </div>
              <span className={styles.aiFooterText}>Generated by VScan AI</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsGroup}>
          <button 
            className={`${styles.btnPrimary} ${isResending ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleResendEmail}
            disabled={isResending}
          >
            <div className={styles.actionIconWrapper}>
              <Icon 
                icon={isResending ? "ri:loader-4-line" : (resendSuccess ? "ri:check-line" : "ri:send-plane-line")} 
                className={`${styles.iconAction} ${isResending ? 'animate-spin' : ''}`} 
              />
            </div>
            {isResending ? 'Sending...' : (resendSuccess ? 'Email Sent!' : 'Resend Email')}
          </button>
          <button onClick={onClose} className={styles.btnCloseAction}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
