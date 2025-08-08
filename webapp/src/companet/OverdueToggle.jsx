export default function OverdueToggle({ checked, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={e => onChange?.(e.target.checked)}
      />
      Просрочено
    </label>
  );
}
