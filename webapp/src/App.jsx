import { Routes, Route, Navigate } from 'react-router-dom';
import GroupsHomePage from './page/GroupsHomePage.jsx'; // ← здесь "page", не "pages"
import FlowPage from './page/FlowPage.jsx';
import MembersPage from './page/MembersPage.jsx'; 
import KanbanPage from './page/KanbanPage.jsx';
import CalendarPage from './page/CalendarPage.jsx';
import BudgetPage from './page/BudgetPage.jsx'; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="/groups" element={<GroupsHomePage />} />
      <Route path="/groups/:groupId" element={<FlowPage />} />
      <Route path="*" element={<Navigate to="/groups" replace />} />
       <Route path="/groups/:groupId/kanban" element={<KanbanPage />} />
       <Route path="/members" element={<MembersPage />} /> 
       <Route path="/groups/:groupId/calendar" element={<CalendarPage />} />
       <Route path="/groups/:groupId/budget" element={<BudgetPage />} /> 
    </Routes>
  );
}




