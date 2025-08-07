const KEY = 'rf-demo';

export function loadFlow() {
  try {
    const json = localStorage.getItem(KEY);
    return json ? JSON.parse(json) : { nodes: [], edges: [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}

export function saveFlow(flow) {
  localStorage.setItem(KEY, JSON.stringify(flow));
}
