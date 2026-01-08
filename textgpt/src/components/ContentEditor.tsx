import { useRef, useCallback, useState } from 'react';
import { Conversation, Snapshot } from '@/types';
import { 
  Save, 
  Camera, 
  History, 
  RotateCcw,
  Hash,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContentEditorProps {
  conversation: Conversation | null;
  snapshots: Snapshot[];
  onSave: (content: string) => void;
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshot: Snapshot) => void;
}

export function ContentEditor({
  conversation,
  snapshots,
  onSave,
  onCreateSnapshot,
  onRestoreSnapshot,
}: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(conversation?.content || '');
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update content when conversation changes
  const prevConversationId = useRef(conversation?.id);
  if (conversation?.id !== prevConversationId.current) {
    setContent(conversation?.content || '');
    setHasChanges(false);
    prevConversationId.current = conversation?.id;
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave(content);
    setHasChanges(false);
  }, [content, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  // Highlight tags in content
  const highlightedContent = content.replace(
    /#(\w+)/g,
    '<span class="text-primary">#$1</span>'
  );

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <FileTextIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No conversation selected</p>
          <p className="text-sm mt-1">Select or create a conversation to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-foreground">{conversation.title}</h2>
          {hasChanges && (
            <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
              Unsaved
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tags display */}
          {conversation.tags.length > 0 && (
            <div className="flex items-center gap-1 mr-2">
              {conversation.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    tag === '#decision' && "border-tag-decision text-tag-decision",
                    tag === '#idea' && "border-tag-idea text-tag-idea",
                    tag === '#todo' && "border-tag-todo text-tag-todo",
                    !['#decision', '#idea', '#todo'].includes(tag) && "border-primary/50 text-primary"
                  )}
                >
                  {tag}
                </Badge>
              ))}
              {conversation.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{conversation.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => setShowSnapshots(!showSnapshots)}
          >
            <History className="h-3 w-3" />
            <span className="hidden sm:inline">Snapshots ({snapshots.length})</span>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={onCreateSnapshot}
          >
            <Camera className="h-3 w-3" />
            <span className="hidden sm:inline">Save Snapshot</span>
          </Button>
          
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
        </div>
      </div>

      {/* Snapshots panel */}
      {showSnapshots && (
        <div className="border-b border-border bg-card px-4 py-2 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Version History
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => setShowSnapshots(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {snapshots.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No snapshots yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {snapshots.map((snapshot) => (
                <button
                  key={snapshot.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary hover:bg-secondary/80 transition-colors group"
                  onClick={() => onRestoreSnapshot(snapshot)}
                >
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-mono">{snapshot.version}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(snapshot.createdAt).toLocaleDateString()}
                  </span>
                  <RotateCcw className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          data-content-editor
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 bg-background text-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none scrollbar-thin"
          placeholder="Paste or type your conversation here...

Use markers like:
User: to mark user messages
Assistant: to mark assistant responses
# Heading to create sections

Use tags like #decision #idea #todo to organize content."
          spellCheck={false}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-card text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{content.length.toLocaleString()} characters</span>
          <span>{content.split('\n').length.toLocaleString()} lines</span>
          <span>{content.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3" />
          <span>{conversation.tags.length} tags</span>
        </div>
      </div>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
