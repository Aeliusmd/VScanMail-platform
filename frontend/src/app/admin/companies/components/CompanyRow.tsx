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
  const showActions = Boolean(onEdit || onDelete);
  const avatarSrc = company.avatar_url
    ? company.avatar_url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}${company.avatar_url}` : company.avatar_url
    : null;

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
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={company.name}
            className={`${styles.avatar} object-cover`}
          />
        ) : (
          <div className={`${styles.avatar} ${company.avatarColor}`}>{company.initial}</div>
        )}
      </div>

      <div className={styles.nameWrap}>
        <div className="flex flex-col">
          <span className={styles.name}>{company.name}</span>
          {company.clientType && (
            <div className="mt-1 flex">
              <span className={`${styles.typeBadge} ${company.clientType === 'manual' ? styles.typeManual : styles.typeSubscription}`}>
                {company.clientType}
              </span>
            </div>
          )}
        </div>
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

      {showActions && (
        <div className={styles.actions}>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(company);
              }}
              className={styles.actionBtnEdit}
              title="Edit Organization"
            >
              <Icon icon="ri:pencil-line" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(company.id);
              }}
              className={styles.actionBtnDelete}
              title="Delete Organization"
            >
              <Icon icon="ri:delete-bin-line" />
            </button>
          )}
        </div>
      )}

      <div className={styles.timeWrap}>
        <span className={styles.time}>{company.time}</span>
      </div>
    </div>
  );
}
