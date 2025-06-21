"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { X, Plus, Edit, Trash2, GripVertical, Hash, Type, Code2, List, Eye, Download, Maximize2, Minimize2 } from "lucide-react";
import { motion, Reorder } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { marked } from "marked";
import { CodeBlock, Pre } from "./chat/markdown-components";

interface Block {
  id: string;
  type: "paragraph" | "heading" | "code" | "list" | "quote";
  content: string;
  level?: number; // for headings (1-6)
}

interface CanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
}

type ViewMode = 'view' | 'edit';

// Parse markdown into blocks
function parseMarkdownToBlocks(markdown: string): Block[] {
  if (!markdown.trim()) {
    return [{ id: "1", type: "paragraph", content: "" }];
  }

  const tokens = marked.lexer(markdown);
  const blocks: Block[] = [];
  let id = 1;

  tokens.forEach((token) => {
    switch (token.type) {
      case "heading":
        blocks.push({
          id: (id++).toString(),
          type: "heading",
          content: token.text,
          level: token.depth
        });
        break;
      case "paragraph":
        blocks.push({
          id: (id++).toString(),
          type: "paragraph",
          content: token.text
        });
        break;
      case "code":
        blocks.push({
          id: (id++).toString(),
          type: "code",
          content: `\`\`\`${token.lang || ''}\n${token.text}\n\`\`\``
        });
        break;
      case "list":
        const listItems: string = token.items.map((item: { text: string }) => item.text).join('\n');
        blocks.push({
          id: (id++).toString(),
          type: "list",
          content: token.ordered ? listItems.split('\n').map((item, i) => `${i + 1}. ${item}`).join('\n') : listItems.split('\n').map(item => `- ${item}`).join('\n')
        });
        break;
      case "blockquote":
        blocks.push({
          id: (id++).toString(),
          type: "quote",
          content: token.text
        });
        break;
      default:
        if (token.raw && token.raw.trim()) {
          blocks.push({
            id: (id++).toString(),
            type: "paragraph",
            content: token.raw.trim()
          });
        }
    }
  });

  return blocks.length > 0 ? blocks : [{ id: "1", type: "paragraph", content: "" }];
}

// Convert blocks back to markdown
function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case "heading":
        return `${'#'.repeat(block.level || 1)} ${block.content}`;
      case "code":
        return block.content;
      case "quote":
        return `> ${block.content}`;
      case "list":
        return block.content;
      case "paragraph":
      default:
        return block.content;
    }
  }).join('\n\n');
}

// Detect block type from content
function detectBlockType(content: string): { type: Block['type'], level?: number } {
  const trimmed = content.trim();
  
  if (trimmed.startsWith('#')) {
    const level = trimmed.match(/^#+/)?.[0].length || 1;
    return { type: 'heading', level: Math.min(level, 6) };
  }
  if (trimmed.startsWith('```')) {
    return { type: 'code' };
  }
  if (trimmed.startsWith('>')) {
    return { type: 'quote' };
  }
  if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) {
    return { type: 'list' };
  }
  return { type: 'paragraph' };
}

export function CanvasPanel({ isOpen, onClose, initialContent = "" }: CanvasPanelProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdownToBlocks(initialContent));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Update blocks when initialContent changes
  useEffect(() => {
    if (initialContent) {
      setBlocks(parseMarkdownToBlocks(initialContent));
    }
  }, [initialContent]);

  // Download markdown file
  const downloadMarkdown = () => {
    const markdown = blocksToMarkdown(blocks);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-content.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX);
      setPanelWidth(Math.max(300, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const addBlock = (afterId?: string, type: Block['type'] = 'paragraph') => {
    if (viewMode === 'view') return;
    
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: ""
    };
    
    if (afterId) {
      const index = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }
    
    setEditingId(newBlock.id);
  };

  const updateBlock = (id: string, content: string) => {
    if (viewMode === 'view') return;
    
    const detectedType = detectBlockType(content);
    setBlocks(blocks.map(block => 
      block.id === id ? { 
        ...block, 
        content, 
        type: detectedType.type,
        level: detectedType.level 
      } : block
    ));
  };

  const deleteBlock = (id: string) => {
    if (viewMode === 'view' || blocks.length <= 1) return;
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const getBlockIcon = (type: Block['type']) => {
    switch (type) {
      case 'heading': return <Hash className="h-4 w-4" />;
      case 'code': return <Code2 className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      case 'quote': return <Type className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const BlockComponent = ({ block }: { block: Block }) => {
    const [isHovered, setIsHovered] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (editingId === block.id && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, [editingId, block.id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (viewMode === 'view') return;
      
      if (e.key === "Enter" && !e.shiftKey && block.type !== 'code') {
        e.preventDefault();
        setEditingId(null);
        addBlock(block.id);
      }
      if (e.key === "Escape") {
        setEditingId(null);
      }
    };

    const renderPreview = () => {
      if (!block.content.trim()) {
        return (
          <div className="text-muted-foreground text-sm">
            {getBlockIcon(block.type)}
            <span className="ml-2">Click to edit...</span>
          </div>
        );
      }

      return (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              code: CodeBlock as Components["code"],
              pre: Pre as Components["pre"],
            }}
            remarkPlugins={[remarkGfm]}
          >
            {block.type === 'heading' && block.level ? 
              `${'#'.repeat(block.level)} ${block.content}` : 
              block.content
            }
          </ReactMarkdown>
        </div>
      );
    };

    return (
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-2 flex items-center gap-1">
            <div className="text-muted-foreground">
              {getBlockIcon(block.type)}
            </div>
            {viewMode === 'edit' && (
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {editingId === block.id && viewMode === 'edit' ? (
              <textarea
                ref={textareaRef}
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent resize-none outline-none border-none text-sm leading-relaxed font-mono"
                rows={Math.max(1, block.content.split('\n').length)}
                placeholder="Type something..."
              />
            ) : (
              <div
                onClick={() => viewMode === 'edit' && setEditingId(block.id)}
                className={`leading-relaxed min-h-[1.5rem] p-1 -m-1 rounded transition-colors ${
                  viewMode === 'edit' ? 'cursor-text hover:bg-muted/50' : 'cursor-default'
                }`}
              >
                {renderPreview()}
              </div>
            )}
          </div>

          {isHovered && viewMode === 'edit' && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => addBlock(block.id)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(block.id)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {blocks.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteBlock(block.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: panelWidth, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full bg-background border-l border-border flex flex-col overflow-hidden relative"
      style={{ width: panelWidth }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors z-10"
        onMouseDown={handleMouseDown}
      />
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Canvas</h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={viewMode === 'view' ? 'default' : 'ghost'}
              onClick={() => setViewMode('view')}
              className="h-7 px-2"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              onClick={() => setViewMode('edit')}
              className="h-7 px-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadMarkdown}
            className="h-8 w-8 p-0"
            title="Download as Markdown"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {viewMode === 'edit' ? (
            <Reorder.Group
              axis="y"
              values={blocks}
              onReorder={setBlocks}
              className="space-y-4"
            >
              {blocks.map((block) => (
                <Reorder.Item key={block.id} value={block}>
                  <BlockComponent block={block} />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <BlockComponent key={block.id} block={block} />
              ))}
            </div>
          )}
        </div>
      </div>

      {viewMode === 'edit' && (
        <div className="p-4 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => addBlock(undefined, 'paragraph')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Type className="h-3 w-3" />
              Text
            </Button>
            <Button
              onClick={() => addBlock(undefined, 'heading')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Hash className="h-3 w-3" />
              Heading
            </Button>
            <Button
              onClick={() => addBlock(undefined, 'code')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Code2 className="h-3 w-3" />
              Code
            </Button>
            <Button
              onClick={() => addBlock(undefined, 'list')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <List className="h-3 w-3" />
              List
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Export: {blocksToMarkdown(blocks).length} characters
          </div>
        </div>
      )}
      
      {viewMode === 'view' && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {blocksToMarkdown(blocks).length} characters • {blocks.length} blocks
          </div>
        </div>
      )}
    </motion.div>
  );
}