// src/page/GroupsHomePage.jsx
import { useState } from 'react';
import SidebarTree from '../companet/SidebarTree.jsx';
import GroupsPanel from '../companet/GroupsPanel.jsx';

export default function GroupsHomePage() {
  const [menuId, setMenuId] = useState(null); // id выбранной папки/узла

  return (
    <div style={{ display:'flex', height:'100vh', width:'100%' }}>
      <SidebarTree onPick={setMenuId} />
      <div style={{ flex:1, minWidth:0 }}>
        <GroupsPanel menuId={menuId} />
      </div>
    </div>
  );
}
