import { Icon } from '@iconify/react';

interface ChequeToolbarProps {
  total: number;
  totalAmount: number;
  page: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  allChecked: boolean;
  onToggleAll: () => void;
}

export default function ChequeToolbar({ total, totalAmount, page, perPage, onPrev, onNext, allChecked, onToggleAll }: ChequeToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          <input type="checkbox" checked={allChecked} onChange={onToggleAll} className="w-4 h-4 rounded border-gray-300 cursor-pointer" />
          <button className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <Icon icon="ri:arrow-down-s-line" className="text-sm" />
          </button>
        </div>
        <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition">
          <Icon icon="ri:refresh-line" className="text-base" />
        </button>
        <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition">
          <Icon icon="ri:more-2-fill" className="text-base" />
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Total: <span className="text-gray-900">{formattedTotal}</span></span>
        <span className="text-gray-300">|</span>
        <span>{start}–{end} of {total}</span>
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer transition"
        >
          <Icon icon="ri:arrow-left-s-line" className="text-base" />
        </button>
        <button
          onClick={onNext}
          disabled={end >= total}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer transition"
        >
          <Icon icon="ri:arrow-right-s-line" className="text-base" />
        </button>
      </div>
    </div>
  );
}
