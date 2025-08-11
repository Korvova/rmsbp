import { Routes, Route, Navigate } from 'react-router-dom';
import GroupsPage from './page/GroupsPage.jsx';
import FlowPage from './page/FlowPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:groupId" element={<FlowPage />} />
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}
