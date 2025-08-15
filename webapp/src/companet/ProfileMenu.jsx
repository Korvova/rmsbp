import { useEffect, useRef, useState } from "react";
import avatar from '../assets/icon.jpg'; // есть в твоём проекте
import { useNavigate } from 'react-router-dom';


export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
    const nav = useNavigate();   

  // закрытие по клику вне и по Esc
  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

const items = [
  { key: 'members', label: '👥Участники', action: () => nav('/members') },
  { key: 'my-tasks', label: '🔲Мои задачи' },
  { key: 'settings', label: '⚙️Настройки' },
  { key: 'rights',   label: '🔐Права' },
  { key: 'logout',   label: '🚪Выйти' },
];

  return (
    <div ref={boxRef} style={{ position:'relative' }}>



      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        title="Профиль"
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'4px 8px', border:'1px solid #e5e7eb', borderRadius:9999,
          background:'#fff', cursor:'pointer'
        }}
      >



        <img
          src={avatar}
          alt="avatar"
          width={24}
          height={24}
          style={{ borderRadius:'9999px', objectFit:'cover' }}
          onError={(e) => { e.currentTarget.style.display='none'; }}
        />
        <span style={{
          width:24, height:24, borderRadius:'9999px', background:'#f3f4f6',
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:12, color:'#374151'
        }}>Я</span>
        <span style={{ fontSize:12, color:'#6b7280' }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position:'absolute', right:0, top:'calc(100% + 6px)',
            background:'#fff', border:'1px solid #e5e7eb', borderRadius:8,
            boxShadow:'0 8px 24px rgba(0,0,0,.12)', minWidth:200, padding:6, zIndex:1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
         
         
          {items.map(it => (
            <button
              key={it.key}
    onClick={() => { (it.action ? it.action() : console.log('[profile menu]', it.key)); setOpen(false); }}
              style={{
                width:'100%', textAlign:'left', padding:'8px 10px',
                background:'none', border:'none', borderRadius:6, cursor:'pointer'
              }}
              onMouseEnter={(e)=> e.currentTarget.style.background='#f9fafb'}
              onMouseLeave={(e)=> e.currentTarget.style.background='transparent'}
            >
              {it.label}
            </button>




          ))}
        </div>
      )}
    </div>
  );
}
