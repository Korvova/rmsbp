// src/companet/StatusToggle.jsx
export default function StatusToggle({ checked, onChange, avatarUrl, initials }) {
  return (
    <label className="status-row">
      <span
        className="assignee-dot"
        title={initials || 'Исполнитель'}
        style={
          avatarUrl
            ? {
                backgroundImage: `url(${avatarUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!avatarUrl && initials ? (initials[0] || '').toUpperCase() : null}
      </span>

  
    </label>
  );
}