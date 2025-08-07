export default function Toolbar({ onAdd }) {
  return (
    <div style={{ position:'absolute', left:10, top:10, zIndex:10 }}>
      <button onClick={onAdd}>+ карточка</button>
    </div>
  );
}
