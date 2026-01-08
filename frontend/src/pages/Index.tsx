import { useState, useEffect, useCallback } from 'react';
import { Project, Conversation, Snapshot } from '@/types';
import {
  getProjects,
  getConversations,
  getConversationSnapshots,
  createProject,
  createConversation,
  updateConversation,
  updateProject,
  deleteProject,
  deleteConversation,
  createSnapshot,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { ContentEditor } from '@/components/ContentEditor';
import { TOCSidebar } from '@/components/TOCSidebar';
import { SearchPanel } from '@/components/SearchPanel';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }));
  }, [toast]);

  // Load conversations when project changes
  useEffect(() => {
    if (selectedProjectId) {
      getConversations(selectedProjectId)
        .then(setConversations)
        .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }));
    } else {
      setConversations([]);
    }
  }, [selectedProjectId, toast]);

  // Load snapshots when conversation changes
  useEffect(() => {
    if (selectedProjectId && selectedConversationId) {
      getConversationSnapshots(selectedProjectId, selectedConversationId)
        .then(setSnapshots)
        .catch(() => setSnapshots([]));
    } else {
      setSnapshots([]);
    }
  }, [selectedProjectId, selectedConversationId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  // Project handlers
  const handleCreateProject = useCallback(async (name: string) => {
    try {
      const project = await createProject(name);
      setProjects(prev => [...prev, project]);
      setSelectedProjectId(project.id);
      toast({ title: "Project created", description: name });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this project and all its conversations?')) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setSelectedConversationId(null);
      }
      toast({ title: "Project deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedProjectId, toast]);

  const handleRenameProject = useCallback(async (id: string, name: string) => {
    try {
      const updated = await updateProject(id, { name });
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      toast({ title: "Project renamed", description: name });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  // Conversation handlers
  const handleCreateConversation = useCallback(async (projectId: string, title: string) => {
    try {
      const conversation = await createConversation(projectId, title);
      setConversations(prev => [...prev, conversation]);
      setSelectedConversationId(conversation.id);
      toast({ title: "Conversation created", description: title });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!selectedProjectId) return;
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await deleteConversation(selectedProjectId, id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
      toast({ title: "Conversation deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedProjectId, selectedConversationId, toast]);

  const handleRenameConversation = useCallback(async (id: string, title: string) => {
    if (!selectedProjectId) return;
    try {
      const updated = await updateConversation(selectedProjectId, id, { title });
      setConversations(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedProjectId, toast]);

  const handleSaveContent = useCallback(async (content: string) => {
    if (!selectedProjectId || !selectedConversationId) return;
    try {
      const updated = await updateConversation(selectedProjectId, selectedConversationId, { content });
      setConversations(prev => prev.map(c => c.id === selectedConversationId ? updated : c));
      toast({ title: "Saved", description: "Content updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedProjectId, selectedConversationId, toast]);

  const handleCreateSnapshot = useCallback(async () => {
    if (!selectedProjectId || !selectedConversationId) return;
    try {
      const version = `${snapshots.length + 1}`;
      const result = await createSnapshot(selectedProjectId, selectedConversationId, version);
      // Refresh snapshots
      const updatedSnapshots = await getConversationSnapshots(selectedProjectId, selectedConversationId);
      setSnapshots(updatedSnapshots);
      toast({
        title: "Snapshot created",
        description: `Version ${version} saved`
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedProjectId, selectedConversationId, snapshots.length, toast]);

  const handleRestoreSnapshot = useCallback(async (snapshot: Snapshot) => {
    if (!selectedProjectId || !selectedConversationId) return;
    try {
      const updated = await updateConversation(selectedProjectId, selectedConversationId, { content: snapshot.content });
      setConversations(prev => prev.map(c => c.id === selectedConversationId ? updated : c));
      toast({
        title: "Snapshot restored",
        description: `Restored version`
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [selectedProjectId, selectedConversationId, toast]);

  const handleSelectFromSearch = useCallback((conversationId: string, projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedConversationId(conversationId);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Header onOpenSearch={() => setSearchOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Projects */}
        <aside className="w-64 border-r border-border shrink-0 overflow-hidden">
          <ProjectSidebar
            projects={projects}
            conversations={conversations}
            selectedProjectId={selectedProjectId}
            selectedConversationId={selectedConversationId}
            onSelectProject={setSelectedProjectId}
            onSelectConversation={setSelectedConversationId}
            onCreateProject={handleCreateProject}
            onCreateConversation={handleCreateConversation}
            onDeleteProject={handleDeleteProject}
            onDeleteConversation={handleDeleteConversation}
            onRenameProject={handleRenameProject}
            onRenameConversation={handleRenameConversation}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <ContentEditor
            conversation={selectedConversation}
            snapshots={snapshots}
            onSave={handleSaveContent}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
          />
        </main>

        {/* Right Sidebar - TOC */}
        <aside className="w-56 border-l border-border shrink-0 overflow-hidden">
          <TOCSidebar content={selectedConversation?.content || ''} />
        </aside>
      </div>

      {/* Search Panel */}
      <SearchPanel
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={handleSelectFromSearch}
      />
    </div>
  );
};

export default Index;
