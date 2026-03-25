import { Icon } from '@iconify/react';
import styles from './CompanyToolbar.module.css';

interface CompanyToolbarProps {
  total: number;
  page: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function CompanyToolbar({ total, page, perPage, onPrev, onNext }: CompanyToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className={styles.toolbar}>
      <div className={styles.leftGroup}>
        <div className={styles.checkboxGroup}>
          <input type="checkbox" className={styles.checkbox} />
          <button className={styles.iconBtnSmall}>
            <Icon icon="ri:arrow-down-s-line" className="text-sm" />
          </button>
        </div>
        <button className={styles.iconBtnMedium}>
          <Icon icon="ri:refresh-line" className="text-base" />
        </button>
        <button className={styles.iconBtnMedium}>
          <Icon icon="ri:more-2-fill" className="text-base" />
        </button>
      </div>

      <div className={styles.rightGroup}>
        <span>{start}-{end} of {total}</span>
        <button onClick={onPrev} disabled={page === 1} className={styles.navBtn}>
          <Icon icon="ri:arrow-left-s-line" className="text-base" />
        </button>
        <button onClick={onNext} disabled={end >= total} className={styles.navBtn}>
          <Icon icon="ri:arrow-right-s-line" className="text-base" />
        </button>
      </div>
    </div>
  );
}
