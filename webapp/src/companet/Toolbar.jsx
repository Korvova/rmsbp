export default function Toolbar({ onAdd, onReset }) {
  return (
    <div style={{ position:'absolute', left:10, top:10, zIndex:10 }}>
      <button onClick={onAdd}>+ карточка</button>
      <button onClick={onReset} style={{ marginLeft:8 }}>🗑 очистить</button>
    </div>
  );
}