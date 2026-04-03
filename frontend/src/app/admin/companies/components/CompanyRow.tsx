"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { Company } from '../../../../mocks/companies';
import styles from './CompanyRow.module.css';

interface CompanyRowProps {
  company: Company;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit?: (company: Company) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

export default function CompanyRow({ company, selected, onSelect, onEdit, onDelete, onClick }: CompanyRowProps) {
  const [starred, setStarred] = useState(company.starred);
  const [flagged, setFlagged] = useState(company.flagged);

  return (
    <div className={`${styles.row} ${selected ? styles.rowSelected : ''}`} onClick={onClick}>
      <div className={styles.controls}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(company.id)}
          className={styles.checkbox}
          onClick={(e) => e.stopPropagation()}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setStarred(!starred);
          }}
          className={`${styles.iconBtn} ${starred ? styles.starActive : ''}`}
        >
          <Icon icon={starred ? 'ri:star-fill' : 'ri:star-line'} className="text-sm" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setFlagged(!flagged);
          }}
          className={`${styles.iconBtn} ${flagged ? styles.flagActive : ''}`}
        >
          <Icon icon={flagged ? 'ri:bookmark-fill' : 'ri:bookmark-line'} className="text-sm" />
        </button>
      </div>

      <div className={styles.avatarWrap}>
        <div className={`${styles.avatar} ${company.avatarColor}`}>{company.initial}</div>
      </div>

      <div className={styles.nameWrap}>
        <span className={styles.name}>{company.name}</span>
      </div>

      <div className={styles.infoWrap}>
        <span className={`${styles.industry} ${company.industryBadge}`}>{company.industry}</span>
        <span className={styles.contact}>{company.contact}</span>
        <span className={styles.email}>- {company.email}</span>
      </div>

      <div className={styles.metrics}>
        <span className={styles.metric}>
          <Icon icon="ri:mail-line" className="text-[11px]" /> {company.mails}
        </span>
        <span className={styles.metric}>
          <Icon icon="ri:bank-card-line" className="text-[11px]" /> {company.cheques}
        </span>
      </div>

      <div className={styles.statusWrap}>
        {company.status === 'Active' && <span className={styles.statusActive}>Active</span>}
        {company.status === 'Pending' && <span className={styles.statusPending}>Pending</span>}
        {company.status === 'Inactive' && <span className={styles.statusInactive}>Inactive</span>}
      </div>

      <div className={styles.actions}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(company);
          }}
          className={styles.actionBtnEdit}
          title="Edit Company"
        >
          <Icon icon="ri:pencil-line" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(company.id);
          }}
          className={styles.actionBtnDelete}
          title="Delete Company"
        >
          <Icon icon="ri:delete-bin-line" />
        </button>
      </div>

      <div className={styles.timeWrap}>
        <span className={styles.time}>{company.time}</span>
      </div>
    </div>
  );
}
