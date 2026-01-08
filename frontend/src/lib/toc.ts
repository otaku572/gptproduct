import { TOCItem } from '@/types';

export function parseTOC(content: string): TOCItem[] {
  const items: TOCItem[] = [];
  const lines = content.split('\n');
  let position = 0;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Check for markdown headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      items.push({
        id: `toc-${index}`,
        text: headingMatch[2],
        type: 'heading',
        level: headingMatch[1].length,
        position,
      });
    }
    
    // Check for User: marker
    if (trimmedLine.startsWith('User:') || trimmedLine.startsWith('USER:')) {
      const text = trimmedLine.slice(5).trim().slice(0, 60) || 'User message';
      items.push({
        id: `toc-${index}`,
        text: text + (trimmedLine.length > 65 ? '...' : ''),
        type: 'user',
        level: 1,
        position,
      });
    }
    
    // Check for Assistant: marker
    if (trimmedLine.startsWith('Assistant:') || trimmedLine.startsWith('ASSISTANT:')) {
      const text = trimmedLine.slice(10).trim().slice(0, 60) || 'Assistant response';
      items.push({
        id: `toc-${index}`,
        text: text + (trimmedLine.length > 70 ? '...' : ''),
        type: 'assistant',
        level: 1,
        position,
      });
    }
    
    // Check for custom separators like --- or ===
    if (trimmedLine.match(/^[-=]{3,}$/) && index > 0) {
      const prevLine = lines[index - 1]?.trim();
      if (prevLine && !prevLine.match(/^[-=]{3,}$/)) {
        items.push({
          id: `toc-${index}`,
          text: prevLine.slice(0, 50) + (prevLine.length > 50 ? '...' : ''),
          type: 'custom',
          level: 1,
          position: position - prevLine.length - 1,
        });
      }
    }
    
    position += line.length + 1;
  });
  
  return items;
}

export function scrollToPosition(position: number): void {
  const editor = document.querySelector('[data-content-editor]');
  if (!editor) return;
  
  // Create a temporary span to find the position
  const content = (editor as HTMLTextAreaElement).value || editor.textContent || '';
  const beforeText = content.slice(0, position);
  const lines = beforeText.split('\n').length;
  
  // Estimate line height and scroll
  const lineHeight = 24; // Approximate line height in pixels
  const scrollTop = (lines - 1) * lineHeight;
  
  editor.scrollTo({
    top: Math.max(0, scrollTop - 100),
    behavior: 'smooth',
  });
}
