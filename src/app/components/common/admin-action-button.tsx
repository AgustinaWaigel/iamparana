'use client';

import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { ArrowDown, ArrowUp, PencilLine, Plus, Save, Trash2, X } from 'lucide-react';

type AdminAction = 'add' | 'edit' | 'delete' | 'save' | 'move-up' | 'move-down' | 'close';
type AdminTone = 'neutral' | 'brand' | 'danger';

type AdminActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  action: AdminAction;
  label?: string;
  tone?: AdminTone;
  compact?: boolean;
  iconClassName?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  children?: ReactNode;
};

const ACTION_ICONS: Record<AdminAction, ComponentType<{ size?: number; className?: string }>> = {
  add: Plus,
  edit: PencilLine,
  delete: Trash2,
  save: Save,
  'move-up': ArrowUp,
  'move-down': ArrowDown,
  close: X,
};

const TONE_CLASSES: Record<AdminTone, string> = {
  neutral: 'border-stone-200 bg-white text-stone-700 hover:border-brand-brown/30 hover:bg-stone-50 hover:text-brand-brown',
  brand: 'border-brand-brown bg-brand-brown text-white hover:bg-amber-900 hover:border-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300',
};

export function AdminActionButton({
  action,
  label,
  tone,
  compact = false,
  className = '',
  iconClassName = '',
  type = 'button',
  icon,
  children,
  ...props
}: AdminActionButtonProps) {
  const Icon = icon ?? ACTION_ICONS[action];
  const resolvedTone = tone ?? (action === 'delete' ? 'danger' : action === 'save' || action === 'add' ? 'brand' : 'neutral');
  const isIconOnly = compact || !label;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 active:scale-95 ${TONE_CLASSES[resolvedTone]} ${isIconOnly ? 'p-2' : ''} ${className}`}
      aria-label={label || action}
      title={label || action}
      {...props}
    >
      <Icon size={isIconOnly ? 16 : 18} className={iconClassName} />
      {label && <span>{label}</span>}
      {children}
    </button>
  );
}