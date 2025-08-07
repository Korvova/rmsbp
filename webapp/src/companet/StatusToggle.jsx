// src/companet/StatusToggle.jsx
export default function StatusToggle({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span style={{ fontSize: 13 }}>Готово</span>
    </label>
  );
}
