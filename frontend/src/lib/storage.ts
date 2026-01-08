import { Project, Conversation, Snapshot } from '@/types';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// Projects
export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE}/projects`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

export async function createProject(name: string): Promise<Project> {
  const response = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete project');
}

// Conversations
export async function getConversations(projectId: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/conversations`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
}

export async function createConversation(projectId: string, title: string, content: string = ''): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: title, content }),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
}

export async function updateConversation(projectId: string, conversationId: string, updates: Partial<Conversation>): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/conversations/${conversationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update conversation');
  return response.json();
}

export async function deleteConversation(projectId: string, conversationId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete conversation');
}

// Snapshots
export async function getConversationSnapshots(projectId: string, conversationId: string): Promise<Snapshot[]> {
  // Assuming we add a GET endpoint for snapshots in server.js
  const response = await fetch(`${API_BASE}/projects/${projectId}/conversations/${conversationId}/snapshots`);
  if (!response.ok) return [];
  return response.json();
}

export async function createSnapshot(projectId: string, conversationId: string, version: string): Promise<any> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/conversations/${conversationId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  });
  if (!response.ok) throw new Error('Failed to create snapshot');
  return response.json();
}

export async function getAllTags(): Promise<Record<string, number>> {
  const response = await fetch(`${API_BASE}/tags`);
  if (!response.ok) return {};
  return response.json();
}

// Search
export async function searchConversations(query: string, projectId?: string): Promise<any[]> {
  if (!query.trim()) return [];
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.append('q', query);
  if (projectId) url.searchParams.append('projectId', projectId);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}
// Backup/Restore
export async function exportAllData(): Promise<string> {
  const projects = await getProjects();
  const allData = {
    projects,
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(allData, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!data.projects) return false;
    // Note: Complex import logic would require backend support. 
    // For now, we return false or just log a warning as a placeholder.
    console.warn("Import logic requires backend integration for folder-based storage.");
    return false;
  } catch {
    return false;
  }
}
