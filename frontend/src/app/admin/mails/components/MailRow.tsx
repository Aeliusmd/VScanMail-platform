"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { Mail } from '../../../../mocks/mails';
import styles from './MailRow.module.css';

interface MailRowProps {
  mail: Mail;
  selected: boolean;
  onSelect: (id: number) => void;
  onClick?: () => void;
  showArchiveMeta?: boolean;
  showUnarchive?: boolean;
  onUnarchive?: () => void;
}

const tagStyles: Record<string, string> = {
  Inbox: 'bg-[#DBEAFE] text-[#1E40AF]',
  Delivered: 'bg-green-100 text-green-700',
  Pending: 'bg-orange-100 text-orange-600',
};

export default function MailRow({ mail, selected, onSelect, onClick, showArchiveMeta = false, showUnarchive = false, onUnarchive }: MailRowProps) {
  const [starred, setStarred] = useState(mail.starred);
  const [flagged, setFlagged] = useState(mail.flagged);

  return (
    <div
      className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(mail.id)}
          className={styles.checkbox}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => { e.stopPropagation(); setStarred(!starred); }}
          className={starred ? styles.starBtnActive : styles.starBtn}
        >
          <Icon icon={starred ? 'ri:star-fill' : 'ri:star-line'} className="text-sm" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setFlagged(!flagged); }}
          className={flagged ? styles.flagBtnActive : styles.flagBtn}
        >
          <Icon icon={flagged ? 'ri-bookmark-fill' : 'ri-bookmark-line'} className="text-sm" />
        </button>
      </div>

      {/* Avatar */}
      <div className={styles.avatarContainer}>
        <div className={`${styles.avatar} ${mail.senderColor}`}>
          {mail.senderInitial}
        </div>
      </div>

      {/* Sender */}
      <div className={styles.senderContainer}>
        <span className={styles.senderText}>{mail.sender}</span>
      </div>

      {/* Tag */}
      <div className={styles.tagContainer}>
        <span className={`${styles.tag} ${tagStyles[mail.tag]}`}>
          {mail.tag}
        </span>
      </div>

      {/* Subject + Preview */}
      <div className={styles.contentContainer}>
        <span className={styles.subjectText}>{mail.subject}</span>
        <span className={styles.previewText}>– {mail.preview}</span>
        {showArchiveMeta && (mail as Mail & { archiveBox?: string }).archiveBox && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">
            Box {(mail as Mail & { archiveBox?: string }).archiveBox}
          </span>
        )}
        {mail.hasAttachment && (
          <div className={styles.attachmentIcon}>
            <Icon icon="ri:attachment-2" className="text-sm" />
          </div>
        )}
      </div>

      {/* Company */}
      <div className={styles.companyContainer}>
        <span className={styles.companyText}>{mail.company}</span>
      </div>

      {/* Time */}
      <div className={styles.timeContainer}>
        <span className={styles.timeText}>{mail.time}</span>
      </div>

      {showUnarchive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnarchive?.();
          }}
          className="text-xs text-slate-500 hover:text-[#0A3D8F] px-2 py-1 rounded hover:bg-[#0A3D8F]/10 transition-colors cursor-pointer whitespace-nowrap ml-2"
        >
          Unarchive
        </button>
      )}
    </div>
  );
}
