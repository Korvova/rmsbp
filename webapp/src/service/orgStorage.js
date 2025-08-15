// /webapp/src/service/orgStorage.js
const KEY = 'org-store';
export const ORG_CHANGED_EVENT = 'org:changed';

function loadRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { departments: [], members: [], contractors: [] };
    const data = JSON.parse(raw);
    // страховка на случай старых версий
    return {
      departments: Array.isArray(data.departments) ? data.departments : [],
      members: Array.isArray(data.members) ? data.members : [],
      contractors: Array.isArray(data.contractors) ? data.contractors : [],
    };
  } catch {
    return { departments: [], members: [], contractors: [] };
  }
}
function saveRaw(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(ORG_CHANGED_EVENT));
  return data;
}
const genId = (p='id') => `${p}_${Math.random().toString(36).slice(2,8)}`;

// ===== Departments (подразделения) =====
export function listDepartments() { return loadRaw().departments; }
export function createDepartment(name = 'Новое подразделение') {
  const db = loadRaw();
  const dep = { id: genId('dep'), name };
  db.departments.push(dep);
  return saveRaw(db);
}
export function renameDepartment(id, name) {
  const db = loadRaw();
  const d = db.departments.find(x => x.id === id);
  if (d) d.name = name;
  return saveRaw(db);
}
export function deleteDepartment(id) {
  const db = loadRaw();
  db.departments = db.departments.filter(d => d.id !== id);
  // удалим привязку у участников/подрядчиков
  db.members = db.members.map(m => (m.departmentId === id ? { ...m, departmentId: null } : m));
  db.contractors = db.contractors.map(c => (c.departmentId === id ? { ...c, departmentId: null } : c));
  return saveRaw(db);
}

// ===== Members (сотрудники/участники) =====
/*
  member = {
    id, fullName, email, phone, status: 'none'|'invited'|'pending'|'authorized',
    uniqueId, responsibilities: string[], departmentId
  }
*/
export function listMembers() { return loadRaw().members; }
export function createMember(m = {}) {
  const db = loadRaw();
  const member = {
    id: genId('mem'),
    fullName: m.fullName || '',
    email: m.email || '',
    phone: m.phone || '',
    status: m.status || 'none', // none|invited|pending|authorized
    uniqueId: m.uniqueId || genId('uid'),
    responsibilities: Array.isArray(m.responsibilities) ? m.responsibilities : [],
    departmentId: m.departmentId ?? null,
  };
  db.members.push(member);
  return saveRaw(db);
}
export function updateMember(id, patch = {}) {
  const db = loadRaw();
  const i = db.members.findIndex(x => x.id === id);
  if (i !== -1) db.members[i] = { ...db.members[i], ...patch };
  return saveRaw(db);
}
export function deleteMember(id) {
  const db = loadRaw();
  db.members = db.members.filter(m => m.id !== id);
  return saveRaw(db);
}

// ===== Contractors (подрядчики) =====
/*
  contractor = { id, name, email, phone, note, departmentId }
*/
export function listContractors() { return loadRaw().contractors; }
export function createContractor(c = {}) {
  const db = loadRaw();
  const item = {
    id: genId('ctr'),
    name: c.name || '',
    email: c.email || '',
    phone: c.phone || '',
    note: c.note || '',
    departmentId: c.departmentId ?? null,
  };
  db.contractors.push(item);
  return saveRaw(db);
}
export function updateContractor(id, patch = {}) {
  const db = loadRaw();
  const i = db.contractors.findIndex(x => x.id === id);
  if (i !== -1) db.contractors[i] = { ...db.contractors[i], ...patch };
  return saveRaw(db);
}
export function deleteContractor(id) {
  const db = loadRaw();
  db.contractors = db.contractors.filter(c => c.id !== id);
  return saveRaw(db);
}
