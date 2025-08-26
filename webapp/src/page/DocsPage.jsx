// src/page/DocsPage.jsx
import { useEffect, useState } from 'react';
import DocsSidebar from '../companet/DocsSidebar';
import DocsEditor from '../companet/DocsEditor';
import ProfileMenu from '../companet/ProfileMenu';

export default function DocsPage() {
  const [current, setCurrent] = useState({ id:'root', type:'folder', name:'Документы' });
  const [docId, setDocId] = useState('');

  useEffect(() => {
    if (current?.type === 'doc' && current.docId) setDocId(current.docId);
    else setDocId('');
  }, [current]);

  return (
    <div style={{ display:'grid', gridTemplateRows:'auto 1fr', height:'100vh' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center',
                    gap:12, padding:'8px 12px', borderBottom:'1px solid #e5e7eb', background:'#fff' }}>
        <div style={{ fontWeight:600 }}>Документария</div>
        <ProfileMenu />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', minHeight:0 }}>
        <DocsSidebar onPick={setCurrent} />
        <div style={{ minWidth:0 }}>
          <DocsEditor docId={docId} />
        </div>
      </div>
    </div>
  );
}
