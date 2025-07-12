import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { WebContainer as WebContainerAPI } from "@webcontainer/api";
import { useTranslations } from "next-intl";
import Editor from "@monaco-editor/react";
import "@xterm/xterm/css/xterm.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu";
import {
  ImageIcon,
  Loader2,
  RefreshCw,
  Folder,
  ChevronDown,
  ChevronRight,
  FolderPlus as FolderPlusIcon,
  FileText as FileIcon,
  Trash2 as Trash2Icon,
  TerminalIcon,
  Github,
  Plus,
  X,
} from "lucide-react";
import GitHubIntegration from "@/components/GitHubIntegration";
import GitCloneDialog from "./GitCloneDialog";

// Add TypeScript interface for step status event data
export interface StepStatusEventDetail {
  stepId: string;
  status: "waiting" | "running" | "completed" | "failed";
  output?: string;
}

// Add terminal log entry interface
export interface TerminalLogEntry {
  text: string;
  className?: string;
  html?: boolean;
  isSpinner?: boolean;
}

// Add terminal tab interface
export interface TerminalTab {
  id: string;
  name: string;
  logs: TerminalLogEntry[];
  process?: any;
  isActive: boolean;
}

// Global WebContainer instance
let webcontainerInstance: WebContainerAPI | null = null;
let currentConversationId: string | null = null;

// Function to get or create WebContainer instance
export async function getWebContainerInstance(): Promise<WebContainerAPI> {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainerAPI.boot();
  }
  return webcontainerInstance;
}

// Function to reset WebContainer instance
export async function resetWebContainerInstance(): Promise<void> {
  if (webcontainerInstance) {
    try {
      // Attempt to teardown the instance
      await webcontainerInstance.teardown?.();
    } catch (error) {
      console.error("Error tearing down WebContainer:", error);
    }
    webcontainerInstance = null;
  }
}

// Function to set current conversation ID
export function setCurrentConversationId(id: string): void {
  currentConversationId = id;
}

// Function to get current conversation ID
export function getCurrentConversationId(): string | null {
  return currentConversationId;
}

// File tree interface
interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  path: string;
  isExpanded?: boolean;
}

// WebContainerUI Props interface
interface WebContainerUIProps {
  chatId: string;
  iframeUrl?: string;
  onServerReady?: (url: string) => void;
  onError?: (error: string) => void;
}

// Main WebContainerUI component
export const WebContainerUI: React.FC<WebContainerUIProps> = memo(({
  chatId,
  iframeUrl,
  onServerReady,
  onError,
}) => {
  const t = useTranslations();
  const [isBooted, setIsBooted] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [terminals, setTerminals] = useState<TerminalTab[]>([
    { id: "main", name: "Terminal", logs: [], isActive: true }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState("main");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);

  // Initialize WebContainer
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        setIsLoading(true);
        await getWebContainerInstance();
        setIsBooted(true);
        setCurrentConversationId(chatId);
        await refreshFileTree();
      } catch (error) {
        console.error("Failed to initialize WebContainer:", error);
        onError?.("Failed to initialize WebContainer");
      } finally {
        setIsLoading(false);
      }
    };

    initWebContainer();
  }, [chatId, onError]);

  // Refresh file tree
  const refreshFileTree = useCallback(async () => {
    try {
      const instance = await getWebContainerInstance();
      const buildTree = async (path: string = ""): Promise<FileNode[]> => {
        const items = await instance.fs.readdir(path, { withFileTypes: true });
        const nodes: FileNode[] = [];

        for (const item of items) {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          const node: FileNode = {
            name: item.name,
            type: item.isDirectory() ? "directory" : "file",
            path: fullPath,
            isExpanded: false,
          };

          if (item.isDirectory()) {
            node.children = [];
          }

          nodes.push(node);
        }

        return nodes.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      };

      const tree = await buildTree();
      setFileTree(tree);
    } catch (error) {
      console.error("Error refreshing file tree:", error);
    }
  }, []);

  // Handle file selection
  const handleFileClick = useCallback(async (node: FileNode) => {
    if (node.type === "file") {
      try {
        setIsLoading(true);
        const instance = await getWebContainerInstance();
        const content = await instance.fs.readFile(node.path, "utf-8");
        setSelectedFile(node.path);
        setFileContent(content);
      } catch (error) {
        console.error("Error reading file:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Toggle directory expansion
      const toggleNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(n => {
          if (n.path === node.path) {
            return { ...n, isExpanded: !n.isExpanded };
          }
          if (n.children) {
            return { ...n, children: toggleNode(n.children) };
          }
          return n;
        });
      };
      setFileTree(prev => toggleNode(prev));
    }
  }, []);

  // Save file content
  const saveFile = useCallback(async (path: string, content: string) => {
    try {
      const instance = await getWebContainerInstance();
      await instance.fs.writeFile(path, content);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  }, []);

  // Handle terminal command
  const executeCommand = useCallback(async (command: string, terminalId: string = "main") => {
    try {
      const instance = await getWebContainerInstance();
      const process = await instance.spawn("sh", ["-c", command]);

      // Add command to terminal logs
      setTerminals(prev => prev.map(terminal => 
        terminal.id === terminalId 
          ? {
              ...terminal,
              logs: [...terminal.logs, { text: `$ ${command}`, className: "text-blue-400" }]
            }
          : terminal
      ));

      // Handle process output
      process.output.pipeTo(new WritableStream({
        write(data) {
          const text = data.toString();
          setTerminals(prev => prev.map(terminal => 
            terminal.id === terminalId 
              ? {
                  ...terminal,
                  logs: [...terminal.logs, { text, className: "text-white" }]
                }
              : terminal
          ));
        }
      }));

      // Wait for process to exit
      const exitCode = await process.exit;
      
      if (exitCode === 0) {
        setTerminals(prev => prev.map(terminal => 
          terminal.id === terminalId 
            ? {
                ...terminal,
                logs: [...terminal.logs, { text: "✅ Command completed successfully", className: "text-green-400" }]
              }
            : terminal
        ));
      } else {
        setTerminals(prev => prev.map(terminal => 
          terminal.id === terminalId 
            ? {
                ...terminal,
                logs: [...terminal.logs, { text: `❌ Command failed with exit code ${exitCode}`, className: "text-red-400" }]
              }
            : terminal
        ));
      }

      // Refresh file tree after command execution
      await refreshFileTree();
    } catch (error) {
      console.error("Error executing command:", error);
      setTerminals(prev => prev.map(terminal => 
        terminal.id === terminalId 
          ? {
              ...terminal,
              logs: [...terminal.logs, { text: `❌ Error: ${error}`, className: "text-red-400" }]
            }
          : terminal
      ));
    }
  }, [refreshFileTree]);

  // Render file tree node
  const renderFileNode = (node: FileNode, depth: number = 0) => (
    <div key={node.path} style={{ marginLeft: depth * 16 }}>
      <div
        className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        onClick={() => handleFileClick(node)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, node });
        }}
      >
        {node.type === "directory" ? (
          <>
            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Folder size={16} className="ml-1 mr-2" />
          </>
        ) : (
          <>
            <div style={{ width: 16 }} />
            <FileIcon size={16} className="ml-1 mr-2" />
          </>
        )}
        <span className={selectedFile === node.path ? "font-bold" : ""}>{node.name}</span>
      </div>
      {node.type === "directory" && node.isExpanded && node.children?.map(child => 
        renderFileNode(child, depth + 1)
      )}
    </div>
  );

  if (!isBooted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Starting WebContainer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Explorer */}
      <div className="h-1/2 border-b border-gray-200 dark:border-gray-700">
        <div className="h-full flex">
          {/* File Tree */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Files</h3>
              <button
                onClick={refreshFileTree}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {fileTree.map(node => renderFileNode(node))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
            {selectedFile ? (
              <Editor
                height="100%"
                language="javascript"
                value={fileContent}
                onChange={(value) => {
                  setFileContent(value || "");
                  if (value && selectedFile) {
                    saveFile(selectedFile, value);
                  }
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a file to edit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="h-1/2 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 p-2">
          <h3 className="font-semibold">Terminal</h3>
        </div>
        <div className="flex-1 bg-black text-white p-4 overflow-y-auto font-mono text-sm">
          {terminals.find(t => t.id === activeTerminalId)?.logs.map((log, index) => (
            <div key={index} className={log.className || "text-white"}>
              {log.text}
            </div>
          ))}
          <div className="flex items-center">
            <span className="text-green-400">$ </span>
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none ml-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const command = e.currentTarget.value;
                  if (command.trim()) {
                    executeCommand(command);
                    e.currentTarget.value = "";
                  }
                }
              }}
              placeholder="Enter command..."
            />
          </div>
        </div>
      </div>
    </div>
  );
});

WebContainerUI.displayName = "WebContainerUI";

export default WebContainerUI;