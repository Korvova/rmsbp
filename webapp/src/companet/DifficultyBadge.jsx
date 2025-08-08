export default function DifficultyBadge({ value, title = 'Сложность' }) {
  const text = Number.isFinite(+value) ? String(value) : '—';
  return (
    <span className="difficulty-badge" title={`${title}: ${text}`}>
      {text}
    </span>
  );
}
