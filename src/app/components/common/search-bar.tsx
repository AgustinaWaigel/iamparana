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
      <div className="relative group flex items-center bg-white rounded-full border border-stone-200 shadow-sm transition-all focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-400/20 focus-within:shadow-md px-4 py-3">
        <Search
          size={18}
          className="text-stone-400 group-focus-within:text-amber-700 transition-colors shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-stone-700 placeholder:text-stone-400 focus:outline-none ml-3 text-[15px]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
