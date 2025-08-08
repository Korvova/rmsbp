export default function StatusToggle({ avatarUrl, initials, size = 22, title = 'Исполнитель' }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: '#e9ecef',
    border: '1px solid #cfd4da',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.max(10, Math.round(size * 0.5)),
    color: '#6c757d',
    overflow: 'hidden',
    flex: `0 0 ${size}px`,
    backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <span className="status-row" title={initials || title} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="assignee-dot" style={style}>
        {!avatarUrl && initials ? (initials[0] || '').toUpperCase() : null}
      </span>
    </span>
  );
}
