// src/page/GroupsHomePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarTree from '../companet/SidebarTree.jsx';
import GroupsPanel from '../companet/GroupsPanel.jsx';

export default function GroupsHomePage() {
  const navigate = useNavigate();
  const [currentNode, setCurrentNode] = useState({ id: 'root', type: 'folder', name: 'Все группы' });

  return (
    <div style={{ display:'flex', height:'100vh', width:'100%' }}>
      <SidebarTree
        onPick={(node) => {
          setCurrentNode(node);
          if (node?.type === 'group' && node.groupId) {
            navigate(`/groups/${node.groupId}`);
          }
        }}
      />
      <div style={{ flex:1, minWidth:0 }}>
        {currentNode?.type === 'folder' ? (
          <GroupsPanel folderId={currentNode.id} />
        ) : (
          <div style={{ padding: 16, opacity: .7 }}>Выберите папку слева</div>
        )}
      </div>
    </div>
  );
}
