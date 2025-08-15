// Простое локальное хранилище для участников и подрядчиков

const MEMBERS_KEY = 'rf-members';
const CONTRACTORS_KEY = 'rf-contractors';

const uid = (p='m') => `${p}_${Math.random().toString(36).slice(2,10)}`;

// ==== helpers ====
function safeRead(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function safeWrite(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ==== Members (участники) ====
export function listMembers() { return safeRead(MEMBERS_KEY, []); }
export function getMember(id) { return listMembers().find(m => m.id === id) || null; }

export function createMember(partial = {}) {
  const all = listMembers();
  const obj = {
    id: uid('mem'),
    fullName: '',
    email: '',
    phone: '',
    status: 'invited', // invited | pending | authorized
    uniqueId: uid('uid'),
    duties: [],        // массив строк
    groupIds: [],      // массив id групп
    ...partial,
  };
  all.push(obj);
  safeWrite(MEMBERS_KEY, all);
  return obj;
}

export function updateMember(id, patch) {
  const all = listMembers();
  const i = all.findIndex(x => x.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...patch };
  safeWrite(MEMBERS_KEY, all);
  return all[i];
}

export function deleteMember(id) {
  const all = listMembers().filter(x => x.id !== id);
  safeWrite(MEMBERS_KEY, all);
}

// ==== Contractors (подрядчики) ====
export function listContractors() { return safeRead(CONTRACTORS_KEY, []); }
export function getContractor(id) { return listContractors().find(m => m.id === id) || null; }

export function createContractor(partial = {}) {
  const all = listContractors();
  const obj = {
    id: uid('ctr'),
    name: '',
    email: '',
    phone: '',
    groupIds: [],
    notes: '',
    ...partial,
  };
  all.push(obj);
  safeWrite(CONTRACTORS_KEY, all);
  return obj;
}

export function updateContractor(id, patch) {
  const all = listContractors();
  const i = all.findIndex(x => x.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...patch };
  safeWrite(CONTRACTORS_KEY, all);
  return all[i];
}

export function deleteContractor(id) {
  const all = listContractors().filter(x => x.id !== id);
  safeWrite(CONTRACTORS_KEY, all);
}
