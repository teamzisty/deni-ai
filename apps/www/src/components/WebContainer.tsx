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
import { ChildProcess } from "child_process";

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
  isInitializing?: boolean;
  initializationFailed?: boolean;
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
  conversationId?: string,
): Promise<WebContainerAPI> => {
  // If conversation ID is provided and it's different from current, reset the instance
  if (
    conversationId &&
    currentConversationId &&
    conversationId !== currentConversationId
  ) {
    console.log(
      `Conversation changed from ${currentConversationId} to ${conversationId}, resetting WebContainer`,
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

      globalWebContainerInstance.teardown(); // Call teardown if available

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
  expandedDirs = new Set<string>(["/"]),
) => {
  console.log(
    "[buildFileStructure] Starting for dir:",
    dir,
    "with expandedDirs:",
    new Set(expandedDirs),
  );

  const localExpandedDirs = new Set(expandedDirs);
  const instance = getWebContainerInstance();
  if (!instance) {
    console.error(
      "[buildFileStructure] WebContainer instance is not available",
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
        `[processDirectory] Circular reference detected: ${normalizedPath}`,
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
          `${normalizedPath === "/" ? "" : normalizedPath}/${entry.name}`,
        );

        if (entry.isDirectory()) {
          const dirEntry = { type: "directory", path: entryPath, children: {} };

          const shouldProcessChildren =
            (normalizedPath === "/" && autoExpandRoot) ||
            localExpandedDirs.has(entryPath);
          console.log(
            `[processDirectory] Checking children for ${entryPath}: Should process? ${shouldProcessChildren} (localExpandedDirs has it: ${localExpandedDirs.has(entryPath)})`,
          );

          if (shouldProcessChildren) {
            console.log(
              `[processDirectory] Recursively processing children for: ${entryPath}`,
            );
            try {
              const childrenObj = await processDirectory(entryPath);
              dirEntry.children = childrenObj;
            } catch (e) {
              console.error(
                `[processDirectory] Error processing directory ${entryPath}:`,
                e,
              );
              dirEntry.children = {};
            }
          } else {
            console.log(
              `[processDirectory] Skipping children processing for: ${entryPath}`,
            );
          }
          dirInfo[entry.name] = dirEntry;
        } else {
          const isImage = /\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i.test(
            entry.name,
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
        error,
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
  expandedDirs = new Set<string>(["/"]),
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
  onError?: (message: string) => void,
) => {
  const [instance, setInstance] = React.useState<WebContainerAPI | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fileStructure, setFileStructure] = React.useState<{
    [key: string]: any;
  }>({});
  const [expandedDirs, setExpandedDirs] = React.useState<Set<string>>(
    new Set(["/"]),
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
        new Set(expandedDirs),
      );
      const newExpandedDirs = new Set(expandedDirs);
      let structureNeedsUpdate = false;

      if (newExpandedDirs.has(path)) {
        newExpandedDirs.delete(path);
        console.log(
          `[toggleDir] Collapsing ${path}. New expanded:`,
          new Set(newExpandedDirs),
        );
      } else {
        newExpandedDirs.add(path);
        console.log(
          `[toggleDir] Expanding ${path}. New expanded:`,
          new Set(newExpandedDirs),
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
            newExpandedDirs,
          );
          if (structure) {
            console.log(
              `[toggleDir] buildFileStructure successful for ${path}. Updating state.`,
            );
            setFileStructure(structure);
          } else {
            console.error(
              `[toggleDir] buildFileStructure returned null/empty for ${path}.`,
            );
            throw new Error("ファイル構造の構築に失敗しました");
          }
        } catch (error) {
          console.error(
            `[toggleDir] Error during buildFileStructure for ${path}:`,
            error,
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
    [expandedDirs, setFileStructure],
  );
  // Initialize WebContainer
  React.useEffect(() => {
    const initWebContainer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const container = await getOrCreateWebContainer(
          "web-container-" + chatId,
          chatId, // Pass conversation ID for reset detection
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
          expandedDirs,
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
        lastWebContainerAction,
      );

      // Clear the action *before* processing to prevent infinite loops
      setLastWebContainerAction(null);

      try {
        if (action === "read" && path) {
          console.log(`[processAction] Reading file: ${path}`);
          if (isImage) {
            console.log(
              `[processAction] It's an image. Setting tab to preview.`,
            );
            setEditorTab("preview");
          } else {
            try {
              const fileContentData = await instance.fs.readFile(path, "utf-8");
              console.log(
                `[processAction] File read success. Content length: ${fileContentData.length}. Setting content and tab.`,
              );
              setFileContent({ content: fileContentData, path });
              setEditorTab("code");
            } catch (readError) {
              console.error(
                `[processAction] Error reading file ${path}:`,
                readError,
              );
            }
          }
        } else if (action === "write" && path && content !== undefined) {
          console.log(`[processAction] Writing file: ${path}`);
          const dirPath = path.substring(0, path.lastIndexOf("/"));
          if (dirPath) {
            await instance.fs
              .mkdir(dirPath, { recursive: true })
              .catch(() => {});
          }
          await instance.fs.writeFile(path, content);
          console.log(`[processAction] File write success.`);
          await memoizedRefreshFileStructure();
        } else if (action === "refreshFileStructure") {
          console.log(`[processAction] Refreshing file structure...`);
          await memoizedRefreshFileStructure();
          console.log(`[processAction] File structure refresh completed.`);
        } else if (
          action === "setTab" &&
          (tab === "code" || tab === "preview")
        ) {
          console.log(`[processAction] Setting editor tab to: ${tab}`);
          setEditorTab(tab);
        } else {
          console.warn("[processAction] Unhandled or invalid action:", {
            action,
            path,
            content,
            isImage,
            tab,
          });
        }
      } catch (error) {
        console.error(
          `[processAction] Error processing action ${action}:`,
          error,
        );
      }
      console.log(`[processAction] Action processing finished.`);
    };

    if (lastWebContainerAction) {
      processAction();
    }
  }, [
    lastWebContainerAction,
    instance,
    memoizedRefreshFileStructure,
    setEditorTab,
    setFileContent,
  ]);

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
    const initializeTerminal = useCallback(
      async (tab: TerminalTab) => {
        if (!realWebContainerProcess || tab.terminal || tab.isInitializing)
          return;

        // Mark tab as initializing to prevent duplicate initialization
        setTerminalTabs((prev) =>
          prev.map((t) =>
            t.id === tab.id ? { ...t, isInitializing: true } : t,
          ),
        );

        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        const { WebLinksAddon } = await import("@xterm/addon-web-links");

        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: "#000000",
            foreground: "#ffffff",
            cursor: "#ffffff",
          },
          convertEol: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        try {
          // For Intellipulse tab, don't start jsh automatically
          let jshProcess;
          if (tab.name !== "Intellipulse") {
            // Start jsh process for regular terminals only
            jshProcess = await realWebContainerProcess.spawn("jsh", [], {
              terminal: {
                cols: terminal.cols,
                rows: terminal.rows,
              },
            });
          } else {
            // For Intellipulse, don't create a persistent shell process
            // Commands will be executed on-demand
            jshProcess = null;
          }

          // Connect terminal to process with error handling (only for regular terminals)
          if (jshProcess) {
            const outputReader = jshProcess.output.getReader();
            const readOutput = async () => {
              try {
                while (true) {
                  const { done, value } = await outputReader.read();
                  if (done) break;
                  terminal.write(value);
                }
              } catch (error) {
                console.error("Terminal output read error:", error);
              } finally {
                outputReader.releaseLock();
              }
            };
            readOutput();

            // Handle input with proper writer management
            let inputWriter: WritableStreamDefaultWriter<string> | null = null;
            terminal.onData(async (data) => {
              try {
                if (!inputWriter) {
                  inputWriter = jshProcess.input.getWriter();
                }
                await inputWriter.write(data);
              } catch (error) {
                console.error("Terminal input write error:", error);
                // Reset writer on error
                if (inputWriter) {
                  try {
                    inputWriter.releaseLock();
                  } catch (e) {
                    // Ignore release errors
                  }
                  inputWriter = null;
                }
              }
            });
          }

          // Add command execution handler for Intellipulse tab
          if (tab.name === "Intellipulse") {
            const handleIntellipulseCommand = async (event: CustomEvent) => {
              const { command, stepId } = event.detail;
              if (!command) return;

              // Show command in terminal
              terminal.writeln(`\r\n\x1b[32m$ ${command}\x1b[0m`);

              try {
                // Parse command and arguments
                const parts = command.trim().split(/\s+/);
                const cmd = parts[0];
                const args = parts.slice(1);

                // Execute command
                const process = await realWebContainerProcess.spawn(cmd, args);

                // Stream output to terminal
                const outputReader = process.output.getReader();
                let outputData = "";

                const readOutput = async () => {
                  try {
                    while (true) {
                      const { done, value } = await outputReader.read();
                      if (done) break;
                      terminal.write(value);
                      outputData += value;
                    }
                  } catch (error) {
                    console.error("Command output read error:", error);
                    terminal.writeln(`\r\n\x1b[31mError reading output: ${error}\x1b[0m`);
                  } finally {
                    outputReader.releaseLock();
                  }
                };

                // Start reading output
                readOutput();

                // Wait for process to complete
                const exitCode = await process.exit;

                // Show completion status
                if (exitCode === 0) {
                  terminal.writeln(`\r\n\x1b[32mCommand completed successfully\x1b[0m`);
                } else {
                  terminal.writeln(`\r\n\x1b[33mCommand exited with code ${exitCode}\x1b[0m`);
                }

                // Notify completion
                const completionEvent = new CustomEvent("intellipulse-command-completed", {
                  detail: {
                    stepId,
                    success: exitCode === 0,
                    output: outputData,
                  },
                });
                window.dispatchEvent(completionEvent);

              } catch (error) {
                console.error("Command execution error:", error);
                terminal.writeln(`\r\n\x1b[31mError: ${error}\x1b[0m`);

                // Notify failure
                const completionEvent = new CustomEvent("intellipulse-command-completed", {
                  detail: {
                    stepId,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                  },
                });
                window.dispatchEvent(completionEvent);
              }
            };

            // Add event listener for command execution
            const listener = (event: Event) => {
              handleIntellipulseCommand(event as CustomEvent);
            };
            window.addEventListener("intellipulse-execute-command", listener);

            // Store cleanup function for later use
            (terminal as any)._intellipulseCleanup = () => {
              window.removeEventListener("intellipulse-execute-command", listener);
            };
          }

          // Update tab with terminal and process
          setTerminalTabs((prev) =>
            prev.map((t) =>
              t.id === tab.id
                ? {
                    ...t,
                    terminal,
                    jshProcess,
                    process: jshProcess,
                    fitAddon,
                    isInitializing: false,
                  }
                : t,
            ),
          );

          // Mount terminal if this is the active tab
          if (tab.id === activeTabId && terminalContainerRef.current) {
            const terminalElement = terminalContainerRef.current.querySelector(
              `[data-terminal-id="${tab.id}"]`,
            );
            if (terminalElement) {
              terminal.open(terminalElement as HTMLElement);
              fitAddon.fit();
            }
          }

          // Show welcome message for Intellipulse tab only once
          if (tab.name === "Intellipulse") {
            setTimeout(() => {
              terminal.writeln("\x1b[36mIntellipulse Terminal\x1b[0m");
              terminal.writeln(
                "\x1b[2mCommands will be executed here during AI assistance...\x1b[0m",
              );
              terminal.writeln("");
            }, 100);
          }
        } catch (error) {
          console.error(
            `Failed to initialize terminal for tab ${tab.id}:`,
            error,
          );
          if (terminal) {
            terminal.write(
              "\r\n\x1b[31mFailed to start jsh process\x1b[0m\r\n",
            );
          }

          // Clear initialization flag on error and mark as failed
          setTerminalTabs((prev) =>
            prev.map((t) =>
              t.id === tab.id
                ? { ...t, isInitializing: false, initializationFailed: true }
                : t,
            ),
          );
        }
      },
      [realWebContainerProcess, activeTabId, setTerminalTabs],
    );

    // Auto-initialize terminals when they become active
    useEffect(() => {
      const activeTab = terminalTabs.find((tab) => tab.id === activeTabId);
      if (activeTab && !activeTab.terminal && !activeTab.isInitializing) {
        initializeTerminal(activeTab);
      }
    }, [activeTabId, terminalTabs, initializeTerminal]);

    // Cleanup event listeners when component unmounts
    useEffect(() => {
      return () => {
        terminalTabs.forEach((tab) => {
          if (tab.terminal && (tab.terminal as any)._intellipulseCleanup) {
            (tab.terminal as any)._intellipulseCleanup();
          }
        });
      };
    }, [terminalTabs]);

    return (
      <div className="h-full flex flex-col">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Terminal</h3>
        </div>
        <div className="flex-1" ref={terminalContainerRef}>
          {terminalTabs.map((tab) => (
            <div
              key={tab.id}
              data-terminal-id={tab.id}
              className={`w-full h-full ${tab.id === activeTabId ? "" : "hidden"}`}
            />
          ))}
        </div>
      </div>
    );
  },
);

TerminalDisplay.displayName = "TerminalDisplay";

// Main WebContainerUI component with proper terminal implementation
export const WebContainerUI: React.FC<WebContainerUIProps> = memo(({
  chatId,
  iframeUrl,
  onServerReady,
  onError,
}) => {
  const webContainer = useWebContainer(chatId, onServerReady, onError);
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
    { id: "intellipulse", name: "Intellipulse", logs: [], isActive: true }
  ]);
  const [activeTabId, setActiveTabId] = useState("intellipulse");
  const [showTerminal, setShowTerminal] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  if (webContainer.isLoading) {
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
      {/* Terminal */}
      <div className="flex-1">
        <TerminalDisplay
          showTerminal={showTerminal}
          setShowTerminal={setShowTerminal}
          terminalTabs={terminalTabs}
          setTerminalTabs={setTerminalTabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          terminalRef={terminalRef}
          webContainerProcess={webContainer.instance}
        />
      </div>
    </div>
  );
});

WebContainerUI.displayName = "WebContainerUI";