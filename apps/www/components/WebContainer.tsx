import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { WebContainer as WebContainerAPI } from "@webcontainer/api";
import { useTranslations } from "next-intl";
import Editor from "@monaco-editor/react";
import "xterm/css/xterm.css";
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
  isActive: boolean;
  process?: any;
  terminal?: any;
  jshProcess?: any;
  fitAddon?: any;
}

// Add this at the top of the file, after any imports but before the component definition
declare function atob(data: string): string;

// Define normalizePath as a top-level utility function (Restored)
const normalizePathUtil = (path: string): string => {
  const normalized = path.replace(/\/+/g, "/");
  if (normalized === "/") return normalized;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
};

// グローバルWebContainerインスタンスを保持
let globalWebContainerInstance: WebContainerAPI | null = null;
let isBooting = false; // 起動中フラグを追加
let currentConversationId: string | null = null; // Track current conversation ID
// Use a WeakMap to track if we've set up listeners for a WebContainer instance
const listenersSetupMap = new WeakMap<WebContainerAPI, boolean>();
// Track if we've shown the ready message
const readyMessageShown = false;

// Add this function to handle WebContainer instance acquisition
export const getOrCreateWebContainer = async (
  workdirName: string,
  conversationId?: string
): Promise<WebContainerAPI> => {
  // If conversation ID is provided and it's different from current, reset the instance
  if (
    conversationId &&
    currentConversationId &&
    conversationId !== currentConversationId
  ) {
    console.log(
      `Conversation changed from ${currentConversationId} to ${conversationId}, resetting WebContainer`
    );
    await resetWebContainerInstance();
  }

  // Update current conversation ID
  if (conversationId) {
    currentConversationId = conversationId;
  }

  // If there's already a global instance, return it immediately
  if (globalWebContainerInstance) {
    console.log("Reusing existing WebContainer instance");
    return globalWebContainerInstance;
  }

  // If we're already trying to boot a container, wait for it
  if (isBooting) {
    console.log("WebContainer boot in progress, waiting...");
    // Wait until boot completes or fails
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (globalWebContainerInstance) {
          clearInterval(checkInterval);
          resolve(globalWebContainerInstance);
        } else if (!isBooting) {
          clearInterval(checkInterval);
          reject(new Error("WebContainer boot failed"));
        }
      }, 100);
    });
  }

  // Start the boot process
  try {
    isBooting = true;
    console.log("Booting new WebContainer instance");
    const instance = await WebContainerAPI.boot({
      workdirName: workdirName,
    });
    globalWebContainerInstance = instance;
    return instance;
  } catch (error) {
    console.error("Error booting WebContainer:", error);
    throw error;
  } finally {
    isBooting = false;
  }
};

// Cleanup function when component unmounts
export const cleanupWebContainer = () => {
  if (globalWebContainerInstance) {
    // Here we would ideally have a dispose or teardown method
    // WebContainer API doesn't provide this currently,
    // but we can clear our reference
    console.log("Cleaning up WebContainer reference");
    // globalWebContainerInstance = null; We don't actually want to null this until page refresh
  }
};

// Reset WebContainer instance function for conversation switching
export const resetWebContainerInstance = async () => {
  if (globalWebContainerInstance) {
    try {
      console.log("Resetting WebContainer instance for conversation switch");

      globalWebContainerInstance.teardown(); // Ensure we clean up the instance properly

      // Clear the global instance and conversation tracking
      globalWebContainerInstance = null;
      currentConversationId = null;
      isBooting = false;

      console.log("WebContainer instance reset completed");
    } catch (error) {
      console.error("Error during WebContainer reset:", error);
      // Force clear the instance even if cleanup failed
      globalWebContainerInstance = null;
      currentConversationId = null;
      isBooting = false;
    }
  } else {
    console.log("No WebContainer instance to reset");
  }
};

// Get current conversation ID
export const getCurrentConversationId = () => {
  return currentConversationId;
};

// Get the global WebContainer instance
export const getWebContainerInstance = () => {
  if (!globalWebContainerInstance) {
    return null;
  }
  return globalWebContainerInstance;
};

// WebContainer file system operations
export const webContainerFS = {
  readFile: async (path: string) => {
    const instance = globalWebContainerInstance;
    if (!instance) {
      throw new Error("WebContainer instance is not available");
    }

    return instance.fs.readFile(path, "utf-8");
  },

  writeFile: async (path: string, content: string | Uint8Array) => {
    const instance = globalWebContainerInstance;
    if (!instance) {
      throw new Error("WebContainer instance is not available");
    }

    // Create directories if they don't exist
    const dirPath = path.substring(0, path.lastIndexOf("/"));
    if (dirPath) {
      try {
        await instance.fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore EEXIST errors
        if (!(error instanceof Error && error.message.includes("EEXIST"))) {
          throw error;
        }
      }
    }

    return instance.fs.writeFile(path, content);
  },

  readdir: async (path: string, options?: { withFileTypes?: boolean }) => {
    const instance = globalWebContainerInstance;
    if (!instance) {
      throw new Error("WebContainer instance is not available");
    }

    return instance.fs.readdir(path, { withFileTypes: true });
  },

  mkdir: async (path: string) => {
    const instance = globalWebContainerInstance;
    if (!instance) {
      throw new Error("WebContainer instance is not available");
    }

    return instance.fs.mkdir(path);
  },
};

// WebContainer process execution
export const webContainerProcess = {
  spawn: async (command: string, args: string[]) => {
    const instance = globalWebContainerInstance;
    if (!instance) {
      throw new Error("WebContainer instance is not available");
    }

    return instance.spawn(command, args);
  },

  execute: async (command: string) => {
    const instance = globalWebContainerInstance;
    if (!instance) {
      throw new Error("WebContainer instance is not available");
    }

    if (!command || command.trim() === "") {
      throw new Error("Invalid command: empty command");
    }

    // Use the overload that just takes a command string
    return instance.spawn(command);
  },
};

// Build file structure function from page.tsx
export const buildFileStructure = async (
  dir = "/",
  autoExpandRoot = false,
  expandedDirs = new Set<string>(["/"])
) => {
  console.log(
    "[buildFileStructure] Starting for dir:",
    dir,
    "with expandedDirs:",
    new Set(expandedDirs)
  );

  const localExpandedDirs = new Set(expandedDirs);
  const instance = getWebContainerInstance();
  if (!instance) {
    console.error(
      "[buildFileStructure] WebContainer instance is not available"
    );
    return {};
  }

  let structure: { [key: string]: any } = {};

  const processingDirs = new Set<string>();

  const processDirectory = async (directoryPath: string) => {
    const normalizedPath = normalizePathUtil(directoryPath);
    console.log(`[processDirectory] Processing: ${normalizedPath}`);

    if (processingDirs.has(normalizedPath)) {
      console.warn(
        `[processDirectory] Circular reference detected: ${normalizedPath}`
      );
      return {};
    }
    processingDirs.add(normalizedPath);

    try {
      const entries = await instance.fs.readdir(normalizedPath, {
        withFileTypes: true,
      });
      const dirInfo: { [key: string]: any } = {};

      if (entries.length === 0) {
        console.log(`[processDirectory] Directory is empty: ${normalizedPath}`);
        processingDirs.delete(normalizedPath);
        return dirInfo;
      }

      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const entryPath = normalizePathUtil(
          `${normalizedPath === "/" ? "" : normalizedPath}/${entry.name}`
        );

        if (entry.isDirectory()) {
          const dirEntry = { type: "directory", path: entryPath, children: {} };

          const shouldProcessChildren =
            (normalizedPath === "/" && autoExpandRoot) ||
            localExpandedDirs.has(entryPath);
          console.log(
            `[processDirectory] Checking children for ${entryPath}: Should process? ${shouldProcessChildren} (localExpandedDirs has it: ${localExpandedDirs.has(entryPath)})`
          );

          if (shouldProcessChildren) {
            console.log(
              `[processDirectory] Recursively processing children for: ${entryPath}`
            );
            try {
              const childrenObj = await processDirectory(entryPath);
              dirEntry.children = childrenObj;
            } catch (e) {
              console.error(
                `[processDirectory] Error processing directory ${entryPath}:`,
                e
              );
              dirEntry.children = {};
            }
          } else {
            console.log(
              `[processDirectory] Skipping children processing for: ${entryPath}`
            );
          }
          dirInfo[entry.name] = dirEntry;
        } else {
          const isImage = /\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i.test(
            entry.name
          );
          const fileEntry = { type: "file", path: entryPath, isImage };
          dirInfo[entry.name] = fileEntry;
        }
      }

      processingDirs.delete(normalizedPath);
      return dirInfo;
    } catch (error) {
      console.error(
        `[processDirectory] Error reading directory ${normalizedPath}:`,
        error
      );
      processingDirs.delete(normalizedPath);
      return {};
    }
  };

  structure = await processDirectory("/");
  console.log("[buildFileStructure] Finished. Result:", structure);
  return structure;
};

// Function to refresh file structure
export const refreshFileStructure = async (
  expandedDirs = new Set<string>(["/"])
) => {
  const instance = getWebContainerInstance();
  if (!instance) {
    return null;
  }

  try {
    // タイムアウト処理
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<null>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("ファイル構造の更新がタイムアウトしました"));
      }, 10000);
    });

    // Promise.raceを使わず、単純なtry-catchでタイムアウトさせる
    let structure: { [key: string]: any } | null = null;
    try {
      // 非同期で構造を構築
      const result = await Promise.race([
        buildFileStructure("/", false, expandedDirs),
        timeoutPromise,
      ]);
      structure = result as { [key: string]: any };

      // タイムアウトをクリア
      if (timeoutId) clearTimeout(timeoutId);
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err; // 外側のcatchに伝播させる
    }

    if (!structure) {
      throw new Error("ファイル構造を構築できませんでした");
    }

    console.log("File structure refreshed:", structure);

    return structure;
  } catch (error) {
    console.error("Error refreshing file structure:", error);
    return null;
  }
};

// Function to update file list
export const updateFileList = async () => {
  const instance = getWebContainerInstance();
  if (!instance) {
    return [];
  }

  try {
    const files = await instance.fs.readdir("/", {
      withFileTypes: true,
    });

    // ファイル一覧を返す
    return files.map((file: any) => file.name);
  } catch (err) {
    console.error("Error listing files:", err);
    return [];
  }
};

// Hook to use WebContainer
export const useWebContainer = (
  chatId: string,
  onServerReady?: (url: string) => void,
  onError?: (message: string) => void
) => {
  const [instance, setInstance] = React.useState<WebContainerAPI | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fileStructure, setFileStructure] = React.useState<{
    [key: string]: any;
  }>({});
  const [expandedDirs, setExpandedDirs] = React.useState<Set<string>>(
    new Set(["/"])
  );
  const [lastWebContainerAction, setLastWebContainerAction] =
    useState<any>(null);
  const [editorTab, setEditorTab] = useState<"code" | "preview">("code");
  const [fileContent, setFileContent] = useState<{
    content: string;
    path: string;
  } | null>(null);

  // Function to toggle directory expansion - This will now be the single source of truth
  const toggleDir = React.useCallback(
    async (path: string) => {
      console.log(
        `[toggleDir] Attempting to toggle: ${path}. Current expanded:`,
        new Set(expandedDirs)
      );
      const newExpandedDirs = new Set(expandedDirs);
      let structureNeedsUpdate = false;

      if (newExpandedDirs.has(path)) {
        newExpandedDirs.delete(path);
        console.log(
          `[toggleDir] Collapsing ${path}. New expanded:`,
          new Set(newExpandedDirs)
        );
      } else {
        newExpandedDirs.add(path);
        console.log(
          `[toggleDir] Expanding ${path}. New expanded:`,
          new Set(newExpandedDirs)
        );
        structureNeedsUpdate = true;
      }

      setExpandedDirs(newExpandedDirs); // Update state immediately

      if (structureNeedsUpdate) {
        console.log(`[toggleDir] Calling buildFileStructure for ${path}`);
        const instance = getWebContainerInstance();
        if (!instance) {
          console.error("[toggleDir] WebContainer instance not available");
          return;
        }
        try {
          // Pass the *updated* set to buildFileStructure
          const structure = await buildFileStructure(
            "/",
            false,
            newExpandedDirs
          );
          if (structure) {
            console.log(
              `[toggleDir] buildFileStructure successful for ${path}. Updating state.`
            );
            setFileStructure(structure);
          } else {
            console.error(
              `[toggleDir] buildFileStructure returned null/empty for ${path}.`
            );
            throw new Error("ファイル構造の構築に失敗しました");
          }
        } catch (error) {
          console.error(
            `[toggleDir] Error during buildFileStructure for ${path}:`,
            error
          );
          // Revert expansion on error - crucial!
          console.log(`[toggleDir] Reverting expansion for ${path}`);
          setExpandedDirs((prevDirs) => {
            const revertedDirs = new Set(prevDirs);
            revertedDirs.delete(path);
            return revertedDirs;
          });
        }
      }
    },
    [expandedDirs, setFileStructure]
  );
  // Initialize WebContainer
  React.useEffect(() => {
    const initWebContainer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const container = await getOrCreateWebContainer(
          "web-container-" + chatId,
          chatId // Pass conversation ID for reset detection
        );
        if (!listenersSetupMap.has(container)) {
          listenersSetupMap.set(container, true);
          container.on("server-ready", (port, url) => {
            onServerReady?.(url);
          });
          container.on("error", ({ message }) => {
            onError?.(message);
          });
        }
        setInstance(container);
        const initialStructure = await buildFileStructure(
          "/",
          true,
          expandedDirs
        );
        setFileStructure(initialStructure || {});
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    };
    initWebContainer();
    return () => {
      /* Cleanup logic if needed */
    };
  }, [chatId, onServerReady, onError]); // Removed expandedDirs from deps to avoid loop

  // リフレッシュファイル構造関数をメモ化
  const memoizedRefreshFileStructure = React.useCallback(async () => {
    try {
      const localExpandedDirs = new Set(expandedDirs); // Use current expandedDirs
      const structure = await buildFileStructure("/", false, localExpandedDirs);
      if (structure) {
        setFileStructure(structure);
      }
      return structure;
    } catch (error) {
      console.error("Error refreshing file structure:", error);
      return null;
    }
  }, [setFileStructure, expandedDirs]); // Keep expandedDirs dependency  // WebContainerアクションが更新されたときの副作用
  useEffect(() => {
    const processAction = async () => {
      if (!instance || !lastWebContainerAction) return;
      const { action, path, content, isImage, tab } = lastWebContainerAction;
      console.log(
        `[processAction] Processing action: ${action}`,
        lastWebContainerAction
      );
      
      // Clear the action *before* processing to prevent infinite loops
      setLastWebContainerAction(null);
      
      try {
        if (action === "read" && path) {
          console.log(`[processAction] Reading file: ${path}`);
          if (isImage) {
            console.log(
              `[processAction] It's an image. Setting tab to preview.`
            );
            setEditorTab("preview");
          } else {
            try {
              const fileContentData = await instance.fs.readFile(path, "utf-8");
              console.log(
                `[processAction] File read success. Content length: ${fileContentData.length}. Setting content and tab.`
              );
              setFileContent({ content: fileContentData, path });
              setEditorTab("code");
            } catch (readError) {
              console.error(
                `[processAction] Error reading file ${path}:`,
                readError
              );
            }
          }        } else if (action === "write" && path && content !== undefined) {
          console.log(`[processAction] Writing file: ${path}`);
          const dirPath = path.substring(0, path.lastIndexOf("/"));
          if (dirPath) {
            await instance.fs.mkdir(dirPath, { recursive: true }).catch(() => {});
          }
          await instance.fs.writeFile(path, content);
          console.log(`[processAction] File write success.`);
          await memoizedRefreshFileStructure();
        } else if (action === "refreshFileStructure") {
          console.log(`[processAction] Refreshing file structure...`);
          await memoizedRefreshFileStructure();
          console.log(`[processAction] File structure refresh completed.`);
        } else if (action === "setTab" && (tab === "code" || tab === "preview")) {
          console.log(`[processAction] Setting editor tab to: ${tab}`);
          setEditorTab(tab);
        } else {
          console.warn(
            "[processAction] Unhandled or invalid action:",
            { action, path, content, isImage, tab }
          );
        }
      } catch (error) {
        console.error(
          `[processAction] Error processing action ${action}:`,
          error
        );
      }
      console.log(`[processAction] Action processing finished.`);
    };

    if (lastWebContainerAction) {
      processAction();
    }
  }, [lastWebContainerAction, instance, memoizedRefreshFileStructure, setEditorTab, setFileContent]);

  // Removed the problematic useEffect syncing fileStructure to expandedUIMap

  return {
    instance,
    isLoading,
    error,
    fs: webContainerFS,
    process: webContainerProcess,
    fileStructure,
    setFileStructure,
    expandedDirs,
    setExpandedDirs,
    toggleDir,
    refreshFileStructure: memoizedRefreshFileStructure,
    setLastWebContainerAction,
    fileContent,
    editorTab,
    refreshAllFiles: async () => {
      const structure = await memoizedRefreshFileStructure();
      const files = await updateFileList();
      return { structure: structure || {}, files };
    },
    updateFileList: async () => {
      return updateFileList();
    },
  };
};

export interface WebContainerProps {
  chatId: string;
  onServerReady?: (url: string) => void;
  onError?: (message: string) => void;
  children: (containerInstance: {
    instance: WebContainerAPI | null;
    isLoading: boolean;
    error: string | null;
    fs: typeof webContainerFS;
    process: typeof webContainerProcess;
    fileStructure: { [key: string]: any };
    setFileStructure: React.Dispatch<
      React.SetStateAction<{ [key: string]: any }>
    >;
    expandedDirs: Set<string>;
    setExpandedDirs: React.Dispatch<React.SetStateAction<Set<string>>>;
    toggleDir: (path: string) => Promise<void>;
    refreshFileStructure: () => Promise<{ [key: string]: any } | null>;
    refreshAllFiles: () => Promise<{
      structure: { [key: string]: any };
      files: string[];
    }>;
    updateFileList: () => Promise<string[]>;
    setLastWebContainerAction: React.Dispatch<React.SetStateAction<any>>;
    fileContent: { content: string; path: string } | null;
    editorTab: "code" | "preview";
  }) => React.ReactNode;
}

// WebContainer component that provides the WebContainer instance to its children
export const WebContainer: React.FC<WebContainerProps> = ({
  chatId,
  onServerReady,
  onError,
  children,
}) => {
  const webContainer = useWebContainer(chatId, onServerReady, onError);

  return <>{children(webContainer)}</>;
};

export default WebContainer;

// Add WebContainerUI component
export interface WebContainerUIProps {
  chatId: string;
  onServerReady?: (url: string) => void;
  onError?: (message: string) => void;
  iframeUrl?: string;
  logs?: TerminalLogEntry[];
}

// Define the TerminalDisplay component
export interface TerminalDisplayProps {
  showTerminal: boolean;
  setShowTerminal: React.Dispatch<React.SetStateAction<boolean>>;
  terminalTabs: TerminalTab[];
  setTerminalTabs: React.Dispatch<React.SetStateAction<TerminalTab[]>>;
  activeTabId: string;
  setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
  terminalRef: React.RefObject<HTMLDivElement | null>;
  webContainerProcess: WebContainerAPI | null;
}

// The TerminalDisplay component
export const TerminalDisplay = memo(
  ({
    showTerminal,
    setShowTerminal,
    terminalTabs,
    setTerminalTabs,
    activeTabId,
    setActiveTabId,
    terminalRef,
    webContainerProcess,
  }: TerminalDisplayProps) => {
    const terminalContainerRef = useRef<HTMLDivElement>(null);
    const [realWebContainerProcess, setRealWebContainerProcess] =
      useState<WebContainerAPI | null>(null);

    useEffect(() => {
      const initWebContainer = async () => {
        const instance = getWebContainerInstance();
        setRealWebContainerProcess(instance);
      };
      initWebContainer();
    }, [webContainerProcess]);

    // Get active tab
    const activeTab = terminalTabs.find((tab) => tab.id === activeTabId);

    // Initialize terminal for a tab
    const initializeTerminal = useCallback(async (tab: TerminalTab) => {
      if (!realWebContainerProcess || tab.terminal) return;

      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");
      const { WebLinksAddon } = await import("xterm-addon-web-links");

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#ffffff',
        },
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      try {
        // Start jsh process for this terminal
        const jshProcess = await realWebContainerProcess.spawn('jsh', [], {
          terminal: {
            cols: terminal.cols,
            rows: terminal.rows,
          },
        });

        // Connect terminal to process
        jshProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data);
            },
          })
        );

        const input = jshProcess.input.getWriter();
        terminal.onData((data) => {
          input.write(data);
        });        // Update tab with terminal and process
        setTerminalTabs(prev =>
          prev.map(t =>
            t.id === tab.id
              ? { ...t, terminal, jshProcess, process: jshProcess, fitAddon }
              : t
          )
        );

        // Mount terminal if this is the active tab
        if (tab.id === activeTabId && terminalContainerRef.current) {
          const terminalElement = terminalContainerRef.current.querySelector(`[data-terminal-id="${tab.id}"]`);
          if (terminalElement) {
            terminal.open(terminalElement as HTMLElement);
            fitAddon.fit();
          }
        }

      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        terminal.write('\r\n\x1b[31mFailed to start jsh process\x1b[0m\r\n');
      }
    }, [realWebContainerProcess, activeTabId, setTerminalTabs]);

    // Initialize terminals for all tabs
    useEffect(() => {
      if (!realWebContainerProcess) return;

      terminalTabs.forEach(tab => {
        if (!tab.terminal) {
          initializeTerminal(tab);
        }
      });
    }, [terminalTabs, realWebContainerProcess, initializeTerminal]);

    // Handle terminal mounting/unmounting when switching tabs
    useEffect(() => {
      if (!activeTab?.terminal || !terminalContainerRef.current) return;

      const terminalElement = terminalContainerRef.current.querySelector(`[data-terminal-id="${activeTabId}"]`);
      if (terminalElement && !terminalElement.hasChildNodes()) {
        activeTab.terminal.open(terminalElement as HTMLElement);
        // Fit the terminal to its container
      if (activeTab.fitAddon) {
        setTimeout(() => activeTab.fitAddon?.fit(), 0);
      }
      }
    }, [activeTabId, activeTab, showTerminal]);

    // Create new terminal tab
    const createNewTab = useCallback(() => {
      const newTabId = `terminal-${Date.now()}`;
      const newTab: TerminalTab = {
        id: newTabId,
        name: `Terminal ${terminalTabs.length + 1}`,
        logs: [],
        isActive: true,
      };
      
      setTerminalTabs(prev => [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ]);
      setActiveTabId(newTabId);
    }, [terminalTabs.length, setTerminalTabs, setActiveTabId]);

    // Close terminal tab
    const closeTab = useCallback((tabId: string) => {
      if (terminalTabs.length === 1) return; // Don't close last tab
      
      setTerminalTabs(prev => {
        const tabToClose = prev.find(tab => tab.id === tabId);
        
        // Clean up terminal and process
        if (tabToClose?.terminal) {
          tabToClose.terminal.dispose();
        }
        if (tabToClose?.jshProcess) {
          tabToClose.jshProcess.kill();
        }
        
        const filtered = prev.filter(tab => tab.id !== tabId);
        if (activeTabId === tabId && filtered.length > 0) {
          setActiveTabId(filtered[0]?.id || "");
        }
        return filtered;
      });
    }, [terminalTabs.length, activeTabId, setTerminalTabs, setActiveTabId]);

    // Switch to tab
    const switchToTab = useCallback((tabId: string) => {
      setActiveTabId(tabId);
      setTerminalTabs(prev => 
        prev.map(tab => ({ 
          ...tab, 
          isActive: tab.id === tabId 
        }))
      );
    }, [setActiveTabId, setTerminalTabs]);

    if (!realWebContainerProcess) {
      return null;
    }

    return (
      <div
        className={`border-t border-border relative w-full bg-background ${showTerminal ? "h-48" : "h-6"}`}
        style={{
          resize: showTerminal ? "vertical" : "none",
          overflow: "auto",
        }}
        id="terminal-container"
      >
        {/* Terminal Header with Tabs */}
        <div className="flex items-center bg-muted w-full border-b border-border">
          {/* Terminal Title and Toggle */}
          <div
            className="flex items-center px-3 py-2 hover:bg-accent cursor-pointer"
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <TerminalIcon size={14} className="mr-2" />
            <span className="text-sm font-medium">Terminal</span>
          </div>

          {showTerminal && (
            <>
              {/* Terminal Tabs */}
              <div className="flex-1 flex w-full items-center overflow-x-auto">
                {terminalTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`flex items-center px-3 py-2 cursor-pointer border-r border-border group ${
                      tab.id === activeTabId
                        ? "bg-background text-foreground"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => switchToTab(tab.id)}
                  >
                    <span className="text-sm truncate max-w-24">
                      {tab.name}
                    </span>
                    {terminalTabs.length > 1 && (
                      <button
                        className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Tab Button */}
              <button
                className="px-3 py-2 hover:bg-accent text-muted-foreground"
                onClick={createNewTab}
                title="New Terminal"
              >
                <Plus size={14} />
              </button>
            </>
          )}
        </div>

        {showTerminal && (
          <>
            {/* Terminal Content */}
            <div className="flex-1 relative h-full w-full" ref={terminalContainerRef}>
              {terminalTabs.map((tab) => (
                <div
                  key={tab.id}
                  data-terminal-id={tab.id}
                  className={`absolute inset-0 h-full w-full ${
                    tab.id === activeTabId ? "block" : "hidden"
                  }`}
                  style={{
                    height: "calc(100% - 1px)", // Account for border
                  }}
                />
              ))}
            </div>

            {/* Resize Handle */}
            <div
              className="absolute top-0 left-0 h-1 cursor-ns-resize hover:bg-primary/50 w-full"
              onMouseDown={(e) => {
                const terminalContainer =
                  document.getElementById("terminal-container");
                if (!terminalContainer) return;

                const startY = e.clientY;
                const startHeight = terminalContainer.offsetHeight;

                const onMouseMove = (moveEvent: MouseEvent) => {
                  if (terminalContainer) {
                    const newHeight =
                      startHeight - (moveEvent.clientY - startY);
                    if (newHeight > 30) {
                      terminalContainer.style.height = `${newHeight}px`;
                        // Resize active terminal
                      const activeTab = terminalTabs.find(t => t.id === activeTabId);
                      if (activeTab?.fitAddon) {
                        setTimeout(() => activeTab.fitAddon?.fit(), 0);
                      }
                    }
                  }
                };

                const onMouseUp = () => {
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", onMouseUp);
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
              }}
            />
          </>
        )}
      </div>
    );
  }
);
TerminalDisplay.displayName = "TerminalDisplay";

// Wrap component definition with React.memo
export const WebContainerUI: React.FC<WebContainerUIProps> = memo(
  function WebContainerUI({
    chatId,
    onServerReady,
    onError,
    iframeUrl,
    logs = [],
  }) {
    const t = useTranslations();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const codeEditorRef = useRef<HTMLDivElement>(null);
    const appFrameRef = useRef<HTMLIFrameElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const [editor, setEditor] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [showTerminal, setShowTerminal] = useState<boolean>(true);
    const [showGitCloneDialog, setShowGitCloneDialog] =
      useState<boolean>(false);

    // Terminal tabs state
    const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
      {
        id: "terminal-1",
        name: "Terminal 1",
        logs: [],
        isActive: true,
      },
    ]);
    const [activeTabId, setActiveTabId] = useState<string>("terminal-1");

    // Context menu state
    const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);

    // Get everything needed from the hook, including fileContent and editorTab
    const {
      instance,
      isLoading,
      error,
      fileStructure,
      refreshFileStructure,
      expandedDirs,
      toggleDir,
      setLastWebContainerAction,
      // Get state from hook
      fileContent,
      editorTab,
    } = useWebContainer(chatId, onServerReady, onError);

    // Define normalizePath within the component scope
    const normalizePath = (path: string): string => {
      const normalized = path.replace(/\/+/g, "/");
      if (normalized === "/") return normalized;
      return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
    };

    // Helper function to find item type in fileStructure by path
    const getItemTypeFromStructure = (
      structure: { [key: string]: any },
      targetPath: string
    ): "file" | "directory" | null => {
      const pathSegments = targetPath.split("/").filter(Boolean);
      let currentLevel = structure;

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        // Ensure segment exists and currentLevel is valid before indexing
        if (segment && currentLevel) {
          const entry = currentLevel[segment];

          if (!entry) return null;

          if (i === pathSegments.length - 1) {
            return entry.type === "directory"
              ? "directory"
              : entry.type === "file"
                ? "file"
                : null;
          }

          if (entry.type !== "directory" || !entry.children) {
            return null;
          }
          currentLevel = entry.children;
        } else {
          // If segment or currentLevel is invalid, the path is broken
          console.warn(
            `[getItemTypeFromStructure] Invalid segment or level encountered for path ${targetPath}`
          );
          return null;
        }
      }

      if (targetPath === "/" && structure) return "directory";
      return null;
    };

    // Context Menu Handler
    const handleContextMenu = useCallback(
      (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        setContextMenuPath(path);
        // console.log(`[handleContextMenu] Opening menu for: ${path}`);
      },
      []
    );

    // handleFileClick - Add check for item type
    const handleFileClick = useCallback(
      async (path: string) => {
        const itemType = getItemTypeFromStructure(fileStructure, path);
        if (itemType !== "file") {
          return;
        }

        if (!instance) return;
        console.log(`[handleFileClick] Setting selected file to: ${path}`); // Log before setting state
        setSelectedFile(path);
        // Log *after* potential state update (though state updates are async)
        // Note: This log might show the *previous* state due to closure
        // console.log(`[handleFileClick] selectedFile state should be updated (check next render): ${selectedFile}`);
        const isImage = path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) !== null;
        setLastWebContainerAction({ action: "read", path, isImage });
      },
      [instance, setLastWebContainerAction, fileStructure]
    );

    const getLanguageFromPath = useCallback((path: string) => {
      const ext = path.split(".").pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        js: "javascript",
        ts: "typescript",
        jsx: "javascript", // Monaco uses 'javascript' for JSX
        tsx: "typescript", // Monaco uses 'typescript' for TSX
        html: "html",
        css: "css",
        json: "json",
        md: "markdown",
        py: "python",
        go: "go",
        rs: "rust",
        java: "java",
        c: "c",
        cpp: "cpp",
        h: "cpp",
      };

      return langMap[ext || ""] || "plaintext";
    }, []);

    useEffect(() => {
      if (editorTab === "preview" && iframeUrl) {
        const iframe = appFrameRef.current;
        if (iframe && iframe.src !== iframeUrl) {
          iframe.src = iframeUrl;
        }
      }
    }, [editorTab, iframeUrl]); // editorTab is now from hook

    // handleDeleteFile - uses refreshFileStructure from hook
    const handleDeleteFile = useCallback(
      async (path: string, isDir: boolean) => {
        if (!instance) {
          return;
        }
        const confirmMessage = isDir
          ? t("webContainer.confirmDeleteDir") ||
            "Are you sure you want to delete this directory and all its contents?"
          : t("webContainer.confirmDeleteFile") ||
            "Are you sure you want to delete this file?";
        if (!confirm(confirmMessage)) return;
        try {
          await instance.fs.rm(path, { recursive: isDir });
          if (selectedFile === path) {
            setSelectedFile(null);
          }
          await refreshFileStructure();
        } catch (error) {
          console.error(
            `Error deleting ${isDir ? "directory" : "file"}:`,
            error
          );
        }
      },
      [instance, refreshFileStructure, selectedFile, t]
    ); // Removed setFileContent, setSelectedFile deps for now

    // handleCreateNewFile - uses setLastWebContainerAction, refreshFileStructure
    const handleCreateNewFile = useCallback(
      async (dirPath: string) => {
        if (!instance) {
          return;
        }
        const fileName = prompt(
          t("webContainer.enterFileName") || "Enter file name:"
        );
        if (!fileName) return;
        const fullPath = `${dirPath === "/" ? "" : dirPath}/${fileName}`;
        try {
          await instance.fs.writeFile(fullPath, "");
          await refreshFileStructure();
          setLastWebContainerAction({ action: "read", path: fullPath }); // Use original name
          setSelectedFile(fullPath);
        } catch (error) {
          console.error(`Error creating file:`, error);
        }
      },
      [instance, refreshFileStructure, t, setLastWebContainerAction]
    ); // Use original name

    // handleCreateNewDirectory - uses refreshFileStructure, toggleDir from hook
    const handleCreateNewDirectory = useCallback(
      async (parentPath: string) => {
        if (!instance) {
          return;
        }
        const dirName = prompt(
          t("webContainer.enterDirectoryName") || "Enter directory name:"
        );
        if (!dirName) return;
        const fullPath = `${parentPath === "/" ? "" : parentPath}/${dirName}`;
        try {
          await instance.fs.mkdir(fullPath);
          await refreshFileStructure();
          // Use toggleDir from hook if not already expanded
          if (!expandedDirs.has(fullPath)) {
            toggleDir(fullPath);
          }
        } catch (error) {
          console.error(`Error creating directory:`, error);
        }
      },
      [instance, refreshFileStructure, t, toggleDir, expandedDirs]
    ); // Add toggleDir, expandedDirs deps

    // Add handleRenameFile function
    const handleRenameFile = useCallback(
      async (oldPath: string) => {
        if (!instance) {
          return;
        }

        const oldName = oldPath.split("/").pop();
        const newName = prompt(
          t("webContainer.enterNewName") || `Enter new name for ${oldName}:`,
          oldName
        );

        if (!newName || newName === oldName) {
          return; // Abort if no name entered or name is unchanged
        }

        const parentPath =
          oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";
        // Use normalizePath defined in the component scope
        const newPath = normalizePath(`${parentPath}/${newName}`);

        try {
          // Removed check using instance.fs.stat as it's unavailable
          // We'll rely on writeFile behavior for existing paths

          // Simulate rename: read old, write new, delete old
          const content = await instance.fs.readFile(oldPath); // Read as Uint8Array for binary safety
          await instance.fs.writeFile(newPath, content);
          await instance.fs.rm(oldPath);

          // Update selected file if it was the one renamed
          if (selectedFile === oldPath) {
            setSelectedFile(newPath);
            // Trigger a read for the new path if it was selected
            const isImage =
              newPath.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) !== null;
            setLastWebContainerAction({
              action: "read",
              path: newPath,
              isImage,
            });
          }

          await refreshFileStructure();
        } catch (error) {
          console.error(`Error renaming ${oldPath} to ${newPath}:`, error);
          // Consider if reverting is needed (e.g., if rm failed after write succeeded)
        }
      },
      [
        instance,
        refreshFileStructure,
        t,
        selectedFile,
        setLastWebContainerAction,
      ]
    ); // No need for normalizePath in dependency array now

    // handleSave - uses setLastWebContainerAction
    const handleSave = useCallback(() => {
      if (editor && fileContent) {
        const content = editor.getValue();
        setLastWebContainerAction({
          action: "write",
          path: fileContent.path,
          content,
        });
      }
    }, [editor, fileContent, setLastWebContainerAction]);

    // handleImageUpload - uses refreshFileStructure
    const handleImageUpload = useCallback(
      async (dirPath: string = "/") => {
        if (!instance) {
          return;
        }
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
          const target = e.target as HTMLInputElement;
          if (!target.files || target.files.length === 0) return;

          const file = target.files[0];
          if (!file) return;

          const reader = new FileReader();

          reader.onload = async (event) => {
            if (!event.target || typeof event.target.result !== "string")
              return;

            const base64Data = event.target.result.split(",")[1];
            if (!base64Data) return;

            const binaryData = atob(base64Data);
            const uint8Array = new Uint8Array(binaryData.length);

            for (let i = 0; i < binaryData.length; i++) {
              uint8Array[i] = binaryData.charCodeAt(i);
            }

            try {
              const fullPath = `${dirPath === "/" ? "" : dirPath}/${file.name}`;
              await instance.fs.writeFile(fullPath, uint8Array);

              await refreshFileStructure();
            } catch (error) {
              console.error(`Error uploading image:`, error);
            }
          };

          reader.readAsDataURL(file);
        };

        input.click();
      },
      [instance, refreshFileStructure]
    );

    const handleRefreshClick = useCallback(() => {
      refreshFileStructure();
    }, [refreshFileStructure]);

    const handleCodeTabClick = useCallback(() => {
      setLastWebContainerAction({ action: "setTab", tab: "code" });
    }, [setLastWebContainerAction]);

    const handlePreviewTabClick = useCallback(() => {
      setLastWebContainerAction({ action: "setTab", tab: "preview" });
    }, [setLastWebContainerAction]);

    // Add handler for reloading the preview iframe
    const handleReloadPreview = useCallback(() => {
      if (appFrameRef.current && iframeUrl) {
        console.log(
          "[handleReloadPreview] Reloading iframe using src manipulation..."
        );
        const currentSrc = iframeUrl; // Store the current URL
        // Temporarily set src to about:blank
        appFrameRef.current.src = "about:blank";
        // Immediately set it back to the original URL to force reload
        setTimeout(() => {
          if (appFrameRef.current) {
            appFrameRef.current.src = currentSrc;
            console.log(
              "[handleReloadPreview] Iframe src set back to:",
              currentSrc
            );
          }
        }, 0); // Use setTimeout to ensure the change is processed
      } else {
        console.warn(
          "[handleReloadPreview] Iframe ref or iframeUrl not found."
        );
      }
    }, [appFrameRef, iframeUrl]); // Add iframeUrl as dependency

    // renderFileTree - uses expandedDirs and toggleDir from hook
    const renderFileTree = useCallback(
      (
        structure: { [key: string]: any },
        parentPath: string = "",
        level: number = 0
      ) => {
        if (!structure || Object.keys(structure).length === 0) return null;
        const sortedEntries = Object.entries(structure).sort((a, b) => {
          const [, aValue] = a as [string, { type: string }];
          const [, bValue] = b as [string, { type: string }];

          if (aValue.type === "directory" && bValue.type !== "directory")
            return -1;
          if (aValue.type !== "directory" && bValue.type === "directory")
            return 1;
          return a[0].localeCompare(b[0]);
        });

        return (
          <ul className={level === 0 ? "pl-0 pt-1" : "pl-3"}>
            {sortedEntries.map(([name, value]: [string, any]) => {
              const path = value.path || normalizePath(`${parentPath}/${name}`);
              if (!value || !value.type) {
                console.warn(
                  `[renderFileTree] Invalid entry for name ${name} at path ${path}:`,
                  value
                );
                return null;
              }

              if (value.type === "directory") {
                const isExpanded = expandedDirs.has(path);
                return (
                  <DropdownMenu
                    key={path}
                    open={contextMenuPath === path}
                    onOpenChange={(isOpen) =>
                      !isOpen && setContextMenuPath(null)
                    }
                  >
                    {/* Keep basic li structure, remove context menu handler */}
                    <li
                      className="py-1 rounded group relative"
                      aria-selected={isExpanded}
                    >
                      {/* Move onContextMenu to the inner div */}
                      <div
                        className="flex items-center py-1 -ml-1 px-1 cursor-pointer  hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDir(path);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, path)} // Add handler here
                      >
                        <span className="mr-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                        <Folder className="h-4 w-4 mr-1 text-amber-500" />
                        <span className="text-sm">{name}</span>
                      </div>
                      {/* Children rendering */}
                      {isExpanded &&
                        value.children &&
                        Object.keys(value.children).length > 0 && (
                          <div style={{ paddingLeft: "1rem" }}>
                            {renderFileTree(value.children, path, level + 1)}
                          </div>
                        )}
                      {isExpanded &&
                        (!value.children ||
                          Object.keys(value.children).length === 0) && (
                          <div className="pl-7 text-xs text-muted-foreground">
                            (empty)
                          </div>
                        )}
                    </li>
                    <DropdownMenuContent
                      onClick={(e) => e.stopPropagation()}
                      className="w-48"
                    >
                      <DropdownMenuItem
                        onClick={() => handleCreateNewFile(path)}
                      >
                        <FileIcon className="mr-2 h-4 w-4" />
                        <span>New File</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCreateNewDirectory(path)}
                      >
                        <FolderPlusIcon className="mr-2 h-4 w-4" />
                        <span>New Folder</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImageUpload(path)}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        <span>Upload Image</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              } else {
                // File entry (onContextMenu remains on li, onClick on inner div)
                const isSelected = selectedFile === path;
                return (
                  <DropdownMenu
                    key={path}
                    open={contextMenuPath === path}
                    onOpenChange={(isOpen) =>
                      !isOpen && setContextMenuPath(null)
                    }
                  >
                    <li
                      className={`py-1 rounded px-1 group relative hover:bg-accent ${isSelected ? "bg-accent/80" : ""}`}
                      onContextMenu={(e) => handleContextMenu(e, path)}
                      aria-selected={isSelected}
                    >
                      <div
                        className="flex items-center pl-5 cursor-pointer"
                        onClick={() => handleFileClick(path)}
                      >
                        {value.isImage ? (
                          <ImageIcon className="h-4 w-4 mr-1 text-purple-500" />
                        ) : (
                          <FileIcon className="h-4 w-4 mr-1 text-blue-500" />
                        )}
                        <span className="text-sm">{name}</span>
                      </div>
                    </li>
                    <DropdownMenuContent
                      onClick={(e) => e.stopPropagation()}
                      className="w-40"
                    >
                      <DropdownMenuItem onClick={() => handleRenameFile(path)}>
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteFile(path, false)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
            })}
          </ul>
        );
      },
      [
        expandedDirs,
        selectedFile,
        toggleDir,
        handleFileClick,
        handleDeleteFile,
        handleCreateNewFile,
        handleCreateNewDirectory,
        handleImageUpload,
        handleRenameFile,
        handleContextMenu,
        contextMenuPath,
      ]
    );

    return (
      <div className="h-full flex flex-col bg-background w-full text-foreground">
        {/* Main file explorer + code editor container */}
        <div className="flex h-full w-full">
          <div className="w-64 border-r border-border flex flex-col h-full overflow-hidden">
            <div className="px-2 py-1 border-b border-border bg-muted">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Files</h3>
                <div className="flex space-x-1">
                  <button
                    className="p-1 hover:bg-accent rounded cursor-pointer"
                    onClick={() => handleImageUpload("/")}
                    title="画像アップロード"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <button
                    className="p-1 hover:bg-accent rounded"
                    onClick={handleRefreshClick}
                    title="更新"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>{" "}
            <div className="overflow-auto flex-1 min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
              ) : (
                <div>{renderFileTree(fileStructure)}</div>
              )}
            </div>
            {/* Clone Repository Button at the bottom */}
            <div className="p-2 border-t border-border">
              <GitCloneDialog
                open={showGitCloneDialog}
                onOpenChange={setShowGitCloneDialog}
                onCloneComplete={async (repoUrl) => {
                  console.log("[GitCloneDialog] Cloning repository:", repoUrl);
                  setLastWebContainerAction({
                    action: "gitClone",
                    repoUrl,
                  });
                  setShowGitCloneDialog(false);
                  // Optionally refresh file structure after cloning
                  await refreshFileStructure();
                }}
                triggerButton={
                  <button
                    className="w-full flex items-center justify-center px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/20 transition-colors"
                    title="Clone Repository"
                  >
                    <Github size={14} className="mr-2" />
                    {t("gitClone.button") || "Clone Repository"}
                  </button>
                }
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {" "}
            <div className="px-2 py-1 bg-muted border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    className={`px-3 py-1 text-sm rounded-t ${editorTab === "code" ? "bg-background" : "bg-muted text-muted-foreground"}`}
                    onClick={handleCodeTabClick}
                  >
                    Code
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-t ${editorTab === "preview" ? "bg-background" : "bg-muted text-muted-foreground"}`}
                    onClick={handlePreviewTabClick}
                  >
                    Preview
                  </button>
                  {editorTab === "preview" && (
                    <button
                      className="ml-2 p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                      onClick={handleReloadPreview}
                      title="Reload Preview"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  {fileContent && (
                    <div className="ml-4 flex items-center">
                      <span className="text-xs text-muted-foreground">
                        {fileContent.path}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {/* GitHub Integration Button */}
                  <GitHubIntegration
                    chatId={chatId}
                    onActionComplete={(success, pullRequestUrl, error) => {
                      if (success && pullRequestUrl) {
                        console.log("Pull request created:", pullRequestUrl);
                        // Show success message to user
                        alert(
                          `Pull request created successfully!\n${pullRequestUrl}`
                        );
                      } else if (error) {
                        console.error("Failed to create pull request:", error);
                        // Show detailed error to user
                        const errorMessage = error?.message || "Unknown error";
                        const errorDetails =
                          error?.response?.data?.message || "";
                        alert(
                          `Failed to create pull request:\n${errorMessage}\n${errorDetails}`
                        );
                      }
                    }}
                    triggerButton={
                      <button
                        className="flex items-center px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/20"
                        title="Create GitHub Pull Request"
                      >
                        <Github size={12} className="mr-1" />
                        GitHub PR
                      </button>
                    }
                  />
                  {editorTab === "code" && fileContent && (
                    <button
                      className="text-sm text-primary hover:text-primary/90"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              {editorTab === "code" && (
                <div className="h-full w-full" ref={codeEditorRef}>
                  {fileContent ? (
                    <Editor
                      height="100%"
                      value={fileContent.content}
                      language={getLanguageFromPath(fileContent.path)} // This correctly handles .jsx and .tsx for React support
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        tabSize: 2,
                      }}
                      onMount={(editor) => setEditor(editor)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select a file to edit
                    </div>
                  )}
                </div>
              )}

              {editorTab === "preview" && (
                <iframe
                  src={iframeUrl || "about:blank"}
                  className="w-full h-full border-0"
                  ref={appFrameRef}
                />
              )}
            </div>
          </div>
        </div>{" "}
        {/* Terminal Component */}
        <TerminalDisplay
          showTerminal={showTerminal}
          setShowTerminal={setShowTerminal}
          webContainerProcess={instance}
          terminalTabs={terminalTabs}
          setTerminalTabs={setTerminalTabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          terminalRef={terminalRef}
        />
      </div>
    );
  }
);

// Add display name for better debugging
WebContainerUI.displayName = "WebContainerUI";
