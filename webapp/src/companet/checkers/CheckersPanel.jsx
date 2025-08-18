import './checkers.css';

export default function CheckersPanel({ open, onClose }) {
  if (!open) return null;

  const onDragStart = (e, payload) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="chk-panel" onClick={(e) => e.stopPropagation()}>
      <div className="chk-head">
        <strong>Чекеры</strong>
        <button className="chk-close" onClick={onClose}>✖</button>
      </div>

      <div className="chk-list">
        <div
          className="chk-item"
          draggable
          onDragStart={(e) => onDragStart(e, { kind:'checker', type:'http-get' })}
          title="Перетащи на поле"
        >
          <div className="chk-emoji">🌐</div>
          <div className="chk-body">
            <div className="chk-title">HTTP GET</div>
            <div className="chk-desc">Отправляет GET при запуске → Done</div>
          </div>
        </div>






<div
  className="chk-item"
  draggable
  onDragStart={(e) => onDragStart(e, { kind:'checker', type:'at-datetime' })}
  title="Перетащи на поле"
>
  <div className="chk-emoji">⏰</div>
  <div className="chk-body">
    <div className="chk-title">Готово в дату/время</div>
    <div className="chk-desc">Станет «Готово» в указанное время</div>
  </div>
</div>




        {/* тут позже добавятся POST, Webhook, At date/time, Email и т.д. */}
      </div>
    </aside>
  );
}
