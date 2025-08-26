import { loadTree } from '../service/groupsStorage';

// --- helpers ---
const safeSlug = (s) => String(s || '')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-')
  .replace(/^-|-$/g, '').toLowerCase().slice(0, 64);

// + добавили onBudget
export default function Toolbar({ onAdd, onReset, onKanban, onCalendar, onCheckers, onBudget, onDocs }) {

  const openGroupStorage = () => {
    // берем groupId из URL /groups/:groupId
    const m = window.location.pathname.match(/\/groups\/([^/?#]+)/);
    const groupId = m && m[1];
    if (!groupId) {
      alert('Не удалось определить группу (нет /groups/:groupId в URL)');
      return;
    }

    // находим узел группы (для slug)
    const tree = loadTree();
    let node = null;
    (function walk(nodes = []) {
      for (const n of nodes) {
        if (n.type === 'group' && (n.groupId === groupId || n.id === groupId)) { node = n; return; }
        if (n.children) walk(n.children);
        if (node) return;
      }
    })(Array.isArray(tree) ? tree : [tree]);

    const slug = (node && node.slug) ? node.slug : safeSlug(node?.name || groupId);
    const absPath = `/var/www/rmsbp/storage/Groups/${groupId}-${slug}`;

    // открываем Filestash с предзаполненным Path
    const fsUrl = `http://217.114.10.226:8334/login#type=fs&path=${encodeURIComponent(absPath)}`;
    window.open(fsUrl, '_blank', 'noopener');

    // на всякий случай скопируем путь в буфер
    navigator.clipboard?.writeText(absPath).catch(() => {});
  };

  return (
    <div style={{ position:'absolute', left:10, top:10, zIndex:10 }}>
      <button onClick={onAdd}>+🪪 Задача</button>
      <button onClick={onReset} style={{ marginLeft:8 }}>🗑 очистить</button>

      <button style={{ marginLeft:8 }} onClick={onKanban}> 🧮 Канбан </button>
      <button style={{ marginLeft:8 }} onClick={onCheckers}> +🤖 Чекеры </button>
      <button style={{ marginLeft:8 }} onClick={openGroupStorage}> +🗂️ Хранилище </button>
      <button style={{ marginLeft:8 }} onClick={onDocs}> + 🗐 Документария </button>
      <button style={{ marginLeft:8 }} onClick={onCalendar}> + 📅 Календарь</button>
      <button style={{ marginLeft:8 }} onClick={onBudget}> + 💶 Бюджет</button>
      <button style={{ marginLeft:8 }} onClick={onBudget}> + 📢 Уведомления</button>
    </div>
  );
}
