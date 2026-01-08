import { useState } from 'react';
import { Project, Conversation } from '@/types';
import { 
  FolderOpen, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  FileText,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  projects: Project[];
  conversations: Conversation[];
  selectedProjectId: string | null;
  selectedConversationId: string | null;
  onSelectProject: (id: string) => void;
  onSelectConversation: (id: string) => void;
  onCreateProject: (name: string) => void;
  onCreateConversation: (projectId: string, title: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}

export function ProjectSidebar({
  projects,
  conversations,
  selectedProjectId,
  selectedConversationId,
  onSelectProject,
  onSelectConversation,
  onCreateProject,
  onCreateConversation,
  onDeleteProject,
  onDeleteConversation,
  onRenameProject,
  onRenameConversation,
}: ProjectSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newConversationProjectId, setNewConversationProjectId] = useState<string | null>(null);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleProject = (id: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedProjects(newExpanded);
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProject(false);
    }
  };

  const handleCreateConversation = (projectId: string) => {
    if (newConversationTitle.trim()) {
      onCreateConversation(projectId, newConversationTitle.trim());
      setNewConversationTitle('');
      setNewConversationProjectId(null);
    }
  };

  const startEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditValue(project.name);
  };

  const startEditConversation = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(conversation.id);
    setEditValue(conversation.title);
  };

  const saveEdit = (type: 'project' | 'conversation') => {
    if (editValue.trim()) {
      if (type === 'project' && editingProjectId) {
        onRenameProject(editingProjectId, editValue.trim());
      } else if (type === 'conversation' && editingConversationId) {
        onRenameConversation(editingConversationId, editValue.trim());
      }
    }
    setEditingProjectId(null);
    setEditingConversationId(null);
    setEditValue('');
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Projects
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent"
            onClick={() => setShowNewProject(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {showNewProject && (
          <div className="flex gap-1 animate-fade-in">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              className="h-7 text-xs bg-sidebar-accent border-sidebar-border"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setShowNewProject(false);
              }}
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-success hover:bg-sidebar-accent"
              onClick={handleCreateProject}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:bg-sidebar-accent"
              onClick={() => setShowNewProject(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {projects.map((project) => {
          const projectConversations = conversations.filter(c => c.projectId === project.id);
          const isExpanded = expandedProjects.has(project.id);
          const isSelected = selectedProjectId === project.id;

          return (
            <div key={project.id} className="animate-fade-in">
              <div
                className={cn(
                  "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                  isSelected ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
                )}
                onClick={() => {
                  onSelectProject(project.id);
                  toggleProject(project.id);
                }}
              >
                <button
                  className="p-0.5 hover:bg-sidebar-accent rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProject(project.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
                
                <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                
                {editingProjectId === project.id ? (
                  <div className="flex-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-5 text-xs bg-sidebar-accent border-sidebar-border flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit('project');
                        if (e.key === 'Escape') setEditingProjectId(null);
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <span className="text-sm truncate flex-1">{project.name}</span>
                )}
                
                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                  <button
                    className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewConversationProjectId(project.id);
                      setExpandedProjects(prev => new Set([...prev, project.id]));
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-foreground"
                    onClick={(e) => startEditProject(project, e)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
                  {newConversationProjectId === project.id && (
                    <div className="flex gap-1 py-1 animate-fade-in">
                      <Input
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        placeholder="Conversation title..."
                        className="h-6 text-xs bg-sidebar-accent border-sidebar-border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateConversation(project.id);
                          if (e.key === 'Escape') setNewConversationProjectId(null);
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-success hover:bg-sidebar-accent"
                        onClick={() => handleCreateConversation(project.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {projectConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors",
                        selectedConversationId === conv.id
                          ? "bg-primary/20 text-primary"
                          : "hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      
                      {editingConversationId === conv.id ? (
                        <div className="flex-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-5 text-xs bg-sidebar-accent border-sidebar-border flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit('conversation');
                              if (e.key === 'Escape') setEditingConversationId(null);
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="text-xs truncate flex-1">{conv.title}</span>
                      )}
                      
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                        <button
                          className="p-0.5 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-foreground"
                          onClick={(e) => startEditConversation(conv, e)}
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                        <button
                          className="p-0.5 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {projectConversations.length === 0 && !newConversationProjectId && (
                    <p className="text-xs text-muted-foreground px-2 py-1 italic">
                      No conversations
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No projects yet</p>
            <p className="text-xs">Create one to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
