import { useState, useCallback, useEffect } from 'react';
import { searchConversations, getAllTags } from '@/lib/storage';
import {
  Search,
  X,
  FileText,
  FolderOpen,
  Hash,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string, projectId: string) => void;
}

export function SearchPanel({ isOpen, onClose, onSelectConversation }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'tags'>('search');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Search logic
  useEffect(() => {
    if (activeTab !== 'search' || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchConversations(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  // Tags logic
  useEffect(() => {
    if (activeTab === 'tags' && isOpen) {
      getAllTags().then(setAllTags);
    }
  }, [activeTab, isOpen]);

  const tagReferences = searchResults.filter(r => activeTab === 'tags'); // Placeholder, we can improve tag search later

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-primary rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-x-4 top-[10vh] mx-auto max-w-2xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeTab === 'search' ? "Search conversations..." : "Filter tags..."}
            className="border-0 bg-transparent focus-visible:ring-0 text-lg"
            autoFocus
          />
          {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Searching...</span>}
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === 'search'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('search')}
          >
            <Search className="h-4 w-4 inline-block mr-1.5" />
            Full-Text Search
          </button>
          <button
            className={cn(
              "flex-1 py-2 text-sm font-medium transition-colors",
              activeTab === 'tags'
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('tags')}
          >
            <Hash className="h-4 w-4 inline-block mr-1.5" />
            Tags Index
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {activeTab === 'search' && (
            <>
              {query.trim() && !isLoading && searchResults.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No results found for "{query}"</p>
                </div>
              )}

              {searchResults.map((result, index) => (
                <button
                  key={`${result.conversationId}-${index}`}
                  className="w-full p-3 border-b border-border hover:bg-secondary/50 text-left transition-colors group"
                  onClick={() => {
                    onSelectConversation(result.conversationId, result.projectId);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FolderOpen className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">{result.projectName}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {highlightMatch(result.conversationTitle, query)}
                    </span>
                  </div>
                  <div className="space-y-1 pl-5">
                    <p className="text-xs text-muted-foreground font-mono">
                      {highlightMatch(result.snippet, query)}
                    </p>
                  </div>
                </button>
              ))}

              {!query.trim() && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Type to search across all conversations</p>
                  <p className="text-xs mt-1">Searches content and titles</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'tags' && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                All Tags ({Object.keys(allTags).length})
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(allTags).map(([tag, count]) => (
                  <button
                    key={tag}
                    className="group"
                    onClick={() => { setQuery(tag); setActiveTab('search'); }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                        tag === '#decision' && "border-tag-decision text-tag-decision",
                        tag === '#idea' && "border-tag-idea text-tag-idea",
                        tag === '#todo' && "border-tag-todo text-tag-todo"
                      )}
                    >
                      {tag}
                      <span className="ml-1 text-muted-foreground group-hover:text-primary-foreground/70">
                        ({count})
                      </span>
                    </Badge>
                  </button>
                ))}
              </div>
              {Object.keys(allTags).length === 0 && (
                <p className="text-muted-foreground text-sm italic">
                  No tags found. Use #tag in your content.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">↵</kbd> to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">Esc</kbd> to close
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">Ctrl</kbd>+
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">K</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}
