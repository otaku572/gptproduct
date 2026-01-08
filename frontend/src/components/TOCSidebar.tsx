import { useMemo } from 'react';
import { TOCItem } from '@/types';
import { parseTOC, scrollToPosition } from '@/lib/toc';
import { 
  List, 
  User, 
  Bot, 
  Hash, 
  Minus 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TOCSidebarProps {
  content: string;
}

export function TOCSidebar({ content }: TOCSidebarProps) {
  const tocItems = useMemo(() => parseTOC(content), [content]);

  const getIcon = (type: TOCItem['type']) => {
    switch (type) {
      case 'heading':
        return <Hash className="h-3 w-3" />;
      case 'user':
        return <User className="h-3 w-3" />;
      case 'assistant':
        return <Bot className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: TOCItem['type']) => {
    switch (type) {
      case 'heading':
        return 'text-primary';
      case 'user':
        return 'text-tag-idea';
      case 'assistant':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!content) {
    return (
      <div className="h-full bg-sidebar p-3">
        <div className="flex items-center gap-2 mb-3">
          <List className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Contents
          </h3>
        </div>
        <p className="text-xs text-muted-foreground italic">
          No content to analyze
        </p>
      </div>
    );
  }

  if (tocItems.length === 0) {
    return (
      <div className="h-full bg-sidebar p-3">
        <div className="flex items-center gap-2 mb-3">
          <List className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Contents
          </h3>
        </div>
        <div className="text-xs text-muted-foreground space-y-2">
          <p className="italic">No sections detected</p>
          <div className="p-2 bg-sidebar-accent rounded text-left">
            <p className="font-medium mb-1">Tip: Use markers like:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li># Heading</li>
              <li>User:</li>
              <li>Assistant:</li>
              <li>---</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-sidebar flex flex-col">
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">
            Contents
          </h3>
          <span className="text-xs text-muted-foreground">
            ({tocItems.length})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {tocItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              "w-full flex items-start gap-2 px-2 py-1.5 rounded text-left transition-colors",
              "hover:bg-sidebar-accent group"
            )}
            style={{ paddingLeft: `${(item.level - 1) * 8 + 8}px` }}
            onClick={() => scrollToPosition(item.position)}
          >
            <span className={cn("shrink-0 mt-0.5", getTypeColor(item.type))}>
              {getIcon(item.type)}
            </span>
            <span className="text-xs text-sidebar-foreground group-hover:text-primary truncate">
              {item.text}
            </span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-primary">
            <Hash className="h-2.5 w-2.5" />
            <span>Heading</span>
          </div>
          <div className="flex items-center gap-1 text-tag-idea">
            <User className="h-2.5 w-2.5" />
            <span>User</span>
          </div>
          <div className="flex items-center gap-1 text-success">
            <Bot className="h-2.5 w-2.5" />
            <span>Assistant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
