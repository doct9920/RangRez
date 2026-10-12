'use client';

interface QuantityControlsProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

export default function QuantityControls({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 10,
}: QuantityControlsProps) {
  return (
    <div className="flex items-center rounded-lg border border-[#80663D] bg-[#242424]">
      <button
        onClick={onDecrement}
        disabled={quantity <= min}
        className={`
          px-3 py-2 text-[#D9B978] hover:text-[#F0D49A] transition-colors
          ${quantity <= min ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label="Decrease quantity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      <span className="min-w-[3rem] px-4 py-2 text-center font-semibold text-[#F4E9D5]">
        {quantity}
      </span>

      <button
        onClick={onIncrement}
        disabled={quantity >= max}
        className={`
          px-3 py-2 text-[#D9B978] hover:text-[#F0D49A] transition-colors
          ${quantity >= max ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label="Increase quantity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

