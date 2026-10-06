'use client';

import { Search, X } from 'lucide-react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: SearchBarProps) {
  return (
    <div className={className}>
      <div className="relative group flex items-center bg-white rounded-full border border-stone-300 shadow-sm transition-all hover:border-stone-400 focus-within:border-brand-brown focus-within:ring-4 focus-within:ring-brand-gold/25 focus-within:shadow-md px-4 py-3">
        <Search
          size={18}
          aria-hidden
          className="text-stone-500 group-focus-within:text-brand-brown transition-colors shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full min-w-0 bg-transparent border-none text-brand-ink placeholder:text-stone-500 focus:outline-none ml-3 text-base sm:text-[15px]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
            className="-mr-1 p-1.5 rounded-full text-stone-500 hover:text-brand-ink hover:bg-stone-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
