import {
  Search,
  Download,
  Upload,
  Terminal,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAllData, importData } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lpc-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exported successfully",
        description: "Your data has been downloaded as JSON",
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const success = importData(text);

      if (success) {
        toast({
          title: "Imported successfully",
          description: "Your data has been restored. Refresh to see changes.",
        });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          title: "Import failed",
          description: "Invalid backup file format",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-foreground">
            Local<span className="text-primary">PC</span>
          </h1>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Local Productivity Command Center
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={onOpenSearch}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleImport}
          title="Import backup"
        >
          <Upload className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleExport}
          title="Export backup"
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
