import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function DescriptionModal({
  open,
  value,
  onChange,
  onSave,
  onClose,
  title = 'Описание задачи',
}) {
  if (!open) return null;

  // Закрытие по ESC
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Полное описание задачи…"
          />
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Отмена</button>
          <button className="primary" onClick={onSave}>Сохранить</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
