import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  WebContainer as WebContainerAPI,
  WebContainerProcess,
} from "@webcontainer/api";
import { useTranslations } from "next-intl";
import Editor from "@monaco-editor/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Circle,
  ImageIcon,
  Loader2,
  RefreshCw,
  TerminalIcon,
  XCircle,
  CheckCircle,
  FolderOpen,
  Folder,
  FileText,
  File,
  FolderPlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus as PlusIcon,
  FolderPlus as FolderPlusIcon,
  FileText as FileIcon,
  Trash2 as Trash2Icon,
} from "lucide-react";

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
// Use a WeakMap to track if we've set up listeners for a WebContainer instance
const listenersSetupMap = new WeakMap<WebContainerAPI, boolean>();
// Track if we've shown the ready message
let readyMessageShown = false;

// Add this function to handle WebContainer instance acquisition
export const getOrCreateWebContainer = async (
  workdirName: string
): Promise<WebContainerAPI> => {
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

// Get the global WebContainer instance
export const getWebContainerInstance = () => {
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
  addTerminalLog?: (
    text: string,
    className?: string,
    html?: boolean,
    isSpinner?: boolean
  ) => void,
  expandedDirs = new Set<string>(["/"])
) => {
  const instance = getWebContainerInstance();
  if (!instance) {
    addTerminalLog?.("WebContainerが準備できていません", "text-warning");
    return null;
  }

  try {
    addTerminalLog?.("ファイル構造を更新中...", "text-muted-foreground");

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

    addTerminalLog?.("ファイル構造を更新しました", "text-success");
    console.log("File structure refreshed:", structure);

    return structure;
  } catch (error) {
    console.error("Error refreshing file structure:", error);
    addTerminalLog?.(
      `ファイル構造の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      "text-red-400"
    );

    return null;
  }
};

// Function to update file list
export const updateFileList = async (
  addTerminalLog?: (
    text: string,
    className?: string,
    html?: boolean,
    isSpinner?: boolean
  ) => void
) => {
  const instance = getWebContainerInstance();
  if (!instance) {
    addTerminalLog?.("WebContainer instance is not available", "text-red-500");
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
    addTerminalLog?.(
      `Error refreshing file list: ${(err as Error).message}`,
      "text-red-500"
    );
    return [];
  }
};

// Hook to use WebContainer
export const useWebContainer = (
  chatId: string,
  onServerReady?: (url: string) => void,
  onError?: (message: string) => void,
  onLogMessage?: (log: TerminalLogEntry) => void
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
            onLogMessage?.({
              text: `ディレクトリ内容を読み込みました: ${path}`,
              className: "text-green-500",
            });
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
          onLogMessage?.({
            text: `ディレクトリの読み込みに失敗しました: ${path}`,
            className: "text-red-400",
          });
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
    [expandedDirs, onLogMessage, setFileStructure]
  );

  // Initialize WebContainer
  React.useEffect(() => {
    const initWebContainer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const container = await getOrCreateWebContainer(
          "web-container-" + chatId
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
    if (onLogMessage) {
      onLogMessage({
        text: "ファイル構造を更新中...",
        className: "text-muted-foreground",
      });
    }
    try {
      const localExpandedDirs = new Set(expandedDirs); // Use current expandedDirs
      const structure = await buildFileStructure("/", false, localExpandedDirs);
      if (structure) {
        setFileStructure(structure);
        if (onLogMessage) {
          onLogMessage({
            text: "ファイル構造を更新しました",
            className: "text-success",
          });
        }
      }
      return structure;
    } catch (error) {
      console.error("Error refreshing file structure:", error);
      if (onLogMessage) {
        onLogMessage({
          text: `ファイル構造の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          className: "text-red-400",
        });
      }
      return null;
    }
  }, [onLogMessage, setFileStructure, expandedDirs]); // Keep expandedDirs dependency

  // WebContainerアクションを処理する関数をメモ化
  const handleWebContainerAction = React.useCallback(async () => {
    if (!instance || !lastWebContainerAction) return;
    const { action, path, content, isImage, tab } = lastWebContainerAction;
    console.log(
      `[handleWebContainerAction] Processing action: ${action}`,
      lastWebContainerAction
    );
    try {
      if (action === "read" && path) {
        console.log(`[handleWebContainerAction] Reading file: ${path}`);
        if (isImage) {
          console.log(
            `[handleWebContainerAction] It's an image. Setting tab to preview.`
          );
          setEditorTab("preview");
          // setFileContent(null); // Clear content for image preview?
          onLogMessage?.({
            text: `Displaying image: ${path}`,
            className: "text-blue-400",
          });
        } else {
          try {
            const fileContentData = await instance.fs.readFile(path, "utf-8");
            console.log(
              `[handleWebContainerAction] File read success. Content length: ${fileContentData.length}. Setting content and tab.`
            );
            setFileContent({ content: fileContentData, path });
            setEditorTab("code");
          } catch (readError) {
            console.error(
              `[handleWebContainerAction] Error reading file ${path}:`,
              readError
            );
            onLogMessage?.({
              text: `Error reading file ${path}: ${readError}`,
              className: "text-red-500",
            });
          }
        }
      } else if (action === "write" && path && content !== undefined) {
        console.log(`[handleWebContainerAction] Writing file: ${path}`);
        const dirPath = path.substring(0, path.lastIndexOf("/"));
        if (dirPath) {
          await instance.fs.mkdir(dirPath, { recursive: true }).catch(() => {});
        }
        await instance.fs.writeFile(path, content);
        console.log(`[handleWebContainerAction] File write success.`);
        onLogMessage?.({
          text: `File ${path} written successfully`,
          className: "text-green-500",
        });
        await memoizedRefreshFileStructure();
      } else if (action === "setTab" && (tab === "code" || tab === "preview")) {
        console.log(`[handleWebContainerAction] Setting editor tab to: ${tab}`);
        setEditorTab(tab);
      } else {
        console.warn(
          "[handleWebContainerAction] Unhandled or invalid action:",
          lastWebContainerAction
        );
      }
    } catch (error) {
      console.error(
        `[handleWebContainerAction] Error processing action ${action}:`,
        error
      );
      onLogMessage?.({
        text: `Error handling action ${action}: ${error instanceof Error ? error.message : "Unknown error"}`,
        className: "text-red-500",
      });
    }
    // Clear the action *after* processing
    console.log(
      `[handleWebContainerAction] Action processing finished. Clearing action.`
    );
    setLastWebContainerAction(null);
  }, [
    instance,
    lastWebContainerAction,
    onLogMessage,
    memoizedRefreshFileStructure,
    setEditorTab,
    setFileContent,
  ]); // Added setFileContent dependency

  // WebContainerアクションが更新されたときの副作用
  useEffect(() => {
    if (lastWebContainerAction) {
      handleWebContainerAction();
    }
  }, [lastWebContainerAction, handleWebContainerAction]);

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
      const files = await updateFileList((text, className, html, isSpinner) => {
        if (onLogMessage) {
          onLogMessage({ text, className, html, isSpinner });
        }
      });
      return { structure: structure || {}, files };
    },
    updateFileList: async () => {
      return updateFileList((text, className, html, isSpinner) => {
        if (onLogMessage) {
          onLogMessage({ text, className, html, isSpinner });
        }
      });
    },
  };
};

export interface WebContainerProps {
  chatId: string;
  onServerReady?: (url: string) => void;
  onError?: (message: string) => void;
  onLogMessage?: (log: TerminalLogEntry) => void;
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
  onLogMessage,
  children,
}) => {
  const webContainer = useWebContainer(
    chatId,
    onServerReady,
    onError,
    onLogMessage
  );

  return <>{children(webContainer)}</>;
};

export default WebContainer;

// Add WebContainerUI component
export interface WebContainerUIProps {
  chatId: string;
  onServerReady?: (url: string) => void;
  onError?: (message: string) => void;
  iframeUrl?: string;
  onLogMessage?: (log: TerminalLogEntry) => void;
  showTerminal?: boolean;
  terminalRef?: React.RefObject<HTMLDivElement>;
}

export const WebContainerUI: React.FC<WebContainerUIProps> = ({
  chatId,
  onServerReady,
  onError,
  iframeUrl,
  onLogMessage,
  showTerminal = true,
  terminalRef,
}) => {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeEditorRef = useRef<HTMLDivElement>(null);
  const appFrameRef = useRef<HTMLIFrameElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // State to control which context menu is open
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
  } = useWebContainer(chatId, onServerReady, onError, onLogMessage);

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
  const handleContextMenu = useCallback((e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenuPath(path);
    // console.log(`[handleContextMenu] Opening menu for: ${path}`);
  }, []);

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
        onLogMessage?.({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
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
        onLogMessage?.({
          text: `Deleted ${isDir ? "directory" : "file"}: ${path}`,
          className: "text-green-400",
        });
        if (selectedFile === path) {
          setSelectedFile(null);
        }
        await refreshFileStructure();
      } catch (error) {
        onLogMessage?.({
          text: `Error deleting ${isDir ? "directory" : "file"}: ${error instanceof Error ? error.message : String(error)}`,
          className: "text-red-400",
        });
      }
    },
    [instance, onLogMessage, refreshFileStructure, selectedFile, t]
  ); // Removed setFileContent, setSelectedFile deps for now

  // handleCreateNewFile - uses setLastWebContainerAction, refreshFileStructure
  const handleCreateNewFile = useCallback(
    async (dirPath: string) => {
      if (!instance) {
        onLogMessage?.({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
        return;
      }
      const fileName = prompt(
        t("webContainer.enterFileName") || "Enter file name:"
      );
      if (!fileName) return;
      const fullPath = `${dirPath === "/" ? "" : dirPath}/${fileName}`;
      try {
        await instance.fs.writeFile(fullPath, "");
        onLogMessage?.({
          text: `Created file: ${fullPath}`,
          className: "text-green-400",
        });
        await refreshFileStructure();
        setLastWebContainerAction({ action: "read", path: fullPath }); // Use original name
        setSelectedFile(fullPath);
      } catch (error) {
        onLogMessage?.({
          text: `Error creating file: ${error instanceof Error ? error.message : String(error)}`,
          className: "text-red-400",
        });
      }
    },
    [instance, onLogMessage, refreshFileStructure, t, setLastWebContainerAction]
  ); // Use original name

  // handleCreateNewDirectory - uses refreshFileStructure, toggleDir from hook
  const handleCreateNewDirectory = useCallback(
    async (parentPath: string) => {
      if (!instance) {
        onLogMessage?.({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
        return;
      }
      const dirName = prompt(
        t("webContainer.enterDirectoryName") || "Enter directory name:"
      );
      if (!dirName) return;
      const fullPath = `${parentPath === "/" ? "" : parentPath}/${dirName}`;
      try {
        await instance.fs.mkdir(fullPath);
        onLogMessage?.({
          text: `Created directory: ${fullPath}`,
          className: "text-green-400",
        });
        await refreshFileStructure();
        // Use toggleDir from hook if not already expanded
        if (!expandedDirs.has(fullPath)) {
          toggleDir(fullPath);
        }
      } catch (error) {
        onLogMessage?.({
          text: `Error creating directory: ${error instanceof Error ? error.message : String(error)}`,
          className: "text-red-400",
        });
      }
    },
    [instance, onLogMessage, refreshFileStructure, t, toggleDir, expandedDirs]
  ); // Add toggleDir, expandedDirs deps

  // Add handleRenameFile function
  const handleRenameFile = useCallback(
    async (oldPath: string) => {
      if (!instance) {
        onLogMessage?.({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
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

      const parentPath = oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";
      // Use normalizePath defined in the component scope
      const newPath = normalizePath(`${parentPath}/${newName}`);

      try {
        onLogMessage?.({
          text: `Renaming ${oldPath} to ${newPath}...`,
          className: "text-muted-foreground",
        });

        // Removed check using instance.fs.stat as it's unavailable
        // We'll rely on writeFile behavior for existing paths

        // Simulate rename: read old, write new, delete old
        const content = await instance.fs.readFile(oldPath); // Read as Uint8Array for binary safety
        await instance.fs.writeFile(newPath, content);
        await instance.fs.rm(oldPath);

        onLogMessage?.({
          text: `Renamed ${oldPath} to ${newPath}`,
          className: "text-green-400",
        });

        // Update selected file if it was the one renamed
        if (selectedFile === oldPath) {
          setSelectedFile(newPath);
          // Trigger a read for the new path if it was selected
          const isImage =
            newPath.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) !== null;
          setLastWebContainerAction({ action: "read", path: newPath, isImage });
        }

        await refreshFileStructure();
      } catch (error) {
        console.error(`Error renaming ${oldPath} to ${newPath}:`, error);
        // Provide more specific error if possible (e.g., if write failed because file exists?)
        onLogMessage?.({
          text: `Error renaming file: ${error instanceof Error ? error.message : String(error)}`,
          className: "text-red-400",
        });
        // Consider if reverting is needed (e.g., if rm failed after write succeeded)
      }
    },
    [
      instance,
      onLogMessage,
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
        onLogMessage?.({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
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
          if (!event.target || typeof event.target.result !== "string") return;

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

            onLogMessage?.({
              text: `Uploaded image: ${fullPath}`,
              className: "text-green-400",
            });

            // ファイル構造を更新
            await refreshFileStructure();
          } catch (error) {
            onLogMessage?.({
              text: `Error uploading image: ${error instanceof Error ? error.message : String(error)}`,
              className: "text-red-400",
            });
          }
        };

        reader.readAsDataURL(file);
      };

      input.click();
    },
    [instance, onLogMessage, refreshFileStructure]
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
    if (appFrameRef.current) {
      console.log("[handleReloadPreview] Reloading iframe...");
      appFrameRef.current.contentWindow?.location.reload();
    } else {
      console.warn("[handleReloadPreview] Iframe ref not found.");
    }
  }, [appFrameRef]); // Dependency is the ref itself

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
                  onOpenChange={(isOpen) => !isOpen && setContextMenuPath(null)}
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
                    <DropdownMenuItem onClick={() => handleCreateNewFile(path)}>
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
                  onOpenChange={(isOpen) => !isOpen && setContextMenuPath(null)}
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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
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
          </div>
          <div className="overflow-auto flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            ) : (
              <div>{renderFileTree(fileStructure)}</div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
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
      </div>
    </div>
  );
};
