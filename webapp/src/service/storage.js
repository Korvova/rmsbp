// src/service/storage.js
const GROUPS_KEY = 'rf-groups';
const flowKey = (groupId) => `rf-flow-${groupId}`;

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
    return json ? JSON.parse(json) : { nodes: [], edges: [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}
export function saveFlow(groupId, flow) {
  localStorage.setItem(flowKey(groupId), JSON.stringify(flow));
}
