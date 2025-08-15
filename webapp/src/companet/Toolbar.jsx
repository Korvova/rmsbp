export default function Toolbar({ onAdd, onReset, onKanban }) {
  return (
    <div style={{ position:'absolute', left:10, top:10, zIndex:10 }}>
      <button onClick={onAdd}>+🪪 Задача</button>
      <button onClick={onReset} style={{ marginLeft:8 }}>🗑 очистить</button>

   <button style={{ marginLeft:8 }} onClick={onKanban}> 🧮 Канбан </button>
  <button style={{ marginLeft:8 }}> +👥 Участники  </button>
  <button style={{ marginLeft:8 }}> +🤖 Чекеры  </button>
  <button style={{ marginLeft:8 }}> +🗂️ Хранилище  </button>
  <button style={{ marginLeft:8 }}> + 🗐 Документария </button>
  <button style={{ marginLeft:8 }}> + 📅 Календарь</button>
  <button style={{ marginLeft:8 }}> + 💶 Бюджет</button>
  



    </div>
  );
}