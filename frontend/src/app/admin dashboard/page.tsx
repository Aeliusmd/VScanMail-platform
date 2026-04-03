"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { Mail } from '@/types/mail';
import MailRow from '../dashboard/mails/components/MailRow';
import MailToolbar from '../dashboard/mails/components/MailToolbar';
import ClickedMail from '../dashboard/mails/clickedmail/clickedmail';
import styles from './page.module.css';

type TabType = 'All' | 'Processed' | 'Delivered' | 'Pending Delivery';

const TABS: { label: TabType; count: number }[] = [
  { label: 'All', count: 0 },
  { label: 'Processed', count: 0 },
  { label: 'Delivered', count: 0 },
  { label: 'Pending Delivery', count: 0 },
];

const PER_PAGE = 10;

export default function AdminMailsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openedMail, setOpenedMail] = useState<Mail | null>(null);
  const [mailList, setMailList] = useState<Mail[]>([]);

  const filtered = mailList.filter((m) => {
    const matchTab =
      activeTab === 'All' ||
      (activeTab === 'Processed' && m.tag === 'Inbox') ||
      (activeTab === 'Delivered' && m.tag === 'Delivered') ||
      (activeTab === 'Pending Delivery' && m.tag === 'Pending');
    const matchSearch =
      search === '' ||
      m.sender.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.company.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <h1 className={styles.pageTitle}>All Mails</h1>
        <div className={styles.topBarRight}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchIcon}>
              <Icon icon="ri:search-line" />
            </div>
            <input
              type="text"
              placeholder="Search mail..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <MailToolbar
        total={filtered.length}
        page={page}
        perPage={PER_PAGE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      {/* Tabs */}
      <div className={styles.tabsBar}>
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => { setActiveTab(tab.label); setPage(1); }}
            className={activeTab === tab.label ? styles.tabActive : styles.tab}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={activeTab === tab.label ? styles.badgeActive : styles.badge}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mail List */}
      <div className={styles.mailList}>
        {paginated.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon icon="ri:mail-open-line" />
            <p className={styles.emptyText}>No mails found</p>
          </div>
        ) : (
          paginated.map((mail) => (
            <MailRow
              key={mail.id}
              mail={mail}
              selected={selectedIds.includes(mail.id)}
              onSelect={handleSelect}
              onClick={() => setOpenedMail(mail)}
            />
          ))
        )}
      </div>

      {/* Clicked Mail Popup */}
      {openedMail && (
        <ClickedMail mail={openedMail} onClose={() => setOpenedMail(null)} />
      )}
    </div>
  );
}
