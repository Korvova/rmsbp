// src/service/storage.js
const GROUPS_KEY = 'rf-groups';
const flowKey = (groupId) => `rf-flow-${groupId}`;





function getDefaultStages() {
  return [
    { id: 'backlog', name: 'Бэклог' },
    { id: 'todo',    name: 'В работу' },
    { id: 'doing',   name: 'В процессе' },
    { id: 'done',    name: 'Готово' },
    { id: 'cancel',  name: 'Отменено' },
    { id: 'frozen',  name: 'Заморожено' },
  ];
}


// ==== группы ====
export function loadGroups() {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY)) || []; }
  catch { return []; }
}
export function saveGroups(groups) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

// ==== флоу для конкретной группы ====
export function loadFlow(groupId) {
  try {
    const json = localStorage.getItem(flowKey(groupId));
   


    const data = json ? JSON.parse(json) : { nodes: [], edges: [], stages: getDefaultStages() };
    if (!Array.isArray(data.stages) || data.stages.length === 0) data.stages = getDefaultStages();
    return data;

  } catch {
   return { nodes: [], edges: [], stages: getDefaultStages() };
  }
}
export function saveFlow(groupId, flow) {
  localStorage.setItem(flowKey(groupId), JSON.stringify(flow));
}
