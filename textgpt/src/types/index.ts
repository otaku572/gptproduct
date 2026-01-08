export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  conversationId: string;
  version: string;
  content: string;
  createdAt: string;
}

export interface TOCItem {
  id: string;
  text: string;
  type: 'heading' | 'user' | 'assistant' | 'custom';
  level: number;
  position: number;
}

export interface SearchResult {
  projectId: string;
  projectName: string;
  conversationId: string;
  conversationTitle: string;
  snippet: string;
  matchPosition: number;
}

export interface TagReference {
  tag: string;
  projectId: string;
  projectName: string;
  conversationId: string;
  conversationTitle: string;
  context: string;
}
