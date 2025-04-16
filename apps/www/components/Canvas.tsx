"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Paintbrush, Download, Copy, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Pre } from "@/components/markdown";
import { cn } from "@workspace/ui/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CanvasProps {
  content: string;
  title: string;
  onClose: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  content,
  title = "Untitled Document",
  onClose,
}) => {
  const t = useTranslations();
  const [editMode, setEditMode] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  useEffect(() => {
    // コンポーネントがマウントされたら表示状態にする
    setIsVisible(true);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent);
    toast.success(t("canvas.copied") || "Content copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([editableContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 背景のクリックでのみ閉じる（コンテンツクリック時は閉じない）
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="w-full max-w-2xl h-full bg-background shadow-lg flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Paintbrush size={18} className="text-primary" />
                <span className="font-medium text-lg">{title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleEditMode}>
                  {editMode
                    ? t("canvas.view") || "View"
                    : t("canvas.edit") || "Edit"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X size={16} />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 overflow-y-scroll">
              {editMode ? (
                <textarea
                  className="w-full h-full min-h-[300px] p-3 font-mono text-sm bg-secondary/20 border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                />
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ pre: Pre }}
                  >
                    {editableContent}
                  </ReactMarkdown>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Canvas;
