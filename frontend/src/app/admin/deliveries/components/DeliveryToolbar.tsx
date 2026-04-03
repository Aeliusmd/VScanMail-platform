import { Icon } from '@iconify/react';

interface DeliveryToolbarProps {
  total: number;
  selectedCount: number;
  allChecked: boolean;
  page: number;
  perPage: number;
  onToggleAll: () => void;
  onMarkReadSelected: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function DeliveryToolbar({
  total,
  selectedCount,
  allChecked,
  page,
  perPage,
  onToggleAll,
  onMarkReadSelected,
  onPrev,
  onNext,
}: DeliveryToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={onToggleAll}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-[#0A3D8F]"
          />
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

      <div className="flex items-center gap-3 text-sm text-gray-500 w-full sm:w-auto justify-between sm:justify-end">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer transition">
              <Icon icon="ri:archive-line" className="text-base text-gray-500" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer transition">
              <Icon icon="ri:delete-bin-line" className="text-base text-gray-500" />
            </button>
            <button
              onClick={onMarkReadSelected}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer transition"
            >
              <Icon icon="ri:mail-open-line" className="text-base text-gray-500" />
            </button>
            <span className="text-xs text-gray-500 ml-1">{selectedCount} selected</span>
          </div>
        )}

        {selectedCount === 0 && (
          <span className="font-medium text-gray-700">
            {start}–{end} of {total}
          </span>
        )}

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

