'use client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  error?: string | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  busyLabel?: string;
  zIndexClass?: string;
}

export function DeleteConfirmModal({
  isOpen,
  title = 'Eliminar recurso',
  itemName,
  error,
  busy = false,
  onCancel,
  onConfirm,
  confirmLabel = 'Si, eliminar',
  busyLabel = 'Eliminando...',
  zIndexClass = 'z-[9999]',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay-unified ${zIndexClass}`}>
      <div className="modal-panel-unified max-w-md">
        <div className="modal-header-unified border-red-100 bg-red-50">
          <h3 className="modal-title-unified text-red-700">{title}</h3>
        </div>
        <div className="modal-body-unified">
          <p className="text-stone-600 leading-relaxed">
            Estas seguro de que deseas eliminar <span className="font-bold text-stone-900">{itemName}</span>? Esta accion no se puede deshacer.
          </p>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <div className="modal-actions-unified">
            <button type="button" onClick={onCancel} disabled={busy} className="modal-btn-secondary-unified">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} disabled={busy} className="btn-danger">
              {busy ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
