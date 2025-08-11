import { Routes, Route, Navigate } from 'react-router-dom';
import GroupsHomePage from './page/GroupsHomePage.jsx'; // ← здесь "page", не "pages"
import FlowPage from './page/FlowPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="/groups" element={<GroupsHomePage />} />
      <Route path="/groups/:groupId" element={<FlowPage />} />
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}




