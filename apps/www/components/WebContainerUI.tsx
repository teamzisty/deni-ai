"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import IntellipulseChat from "@/components/IntellipulseChat";
import type { ChatSession } from "@/hooks/use-chat-sessions";
import HeaderArea from "@/components/HeaderArea";
import { useAuth } from "@/context/AuthContext";
import { reasoningEffortType } from "@/lib/modelDescriptions";
import { useIntellipulseSessions, IntellipulseSession } from "@/hooks/use-intellipulse-sessions";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";
import { useUploadThing, uploadResponse } from "@/utils/uploadthing";
import { toast } from "sonner";

// Import WebContainerUI component
import {
  WebContainerUI,
  webContainerProcess,
  webContainerFS,
  getWebContainerInstance,
  TerminalLogEntry,
} from "@/components/WebContainer";
import { WebContainer } from "@webcontainer/api";
import { UIMessage, ChatRequestOptions } from "ai";

// Add a custom animation style
const spinnerStyle = `
  @keyframes custom-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .custom-spin {
    animation: custom-spin 1s linear infinite;
  }
`;

// Add this at the top of the file, after any imports but before the component definition
declare function atob(data: string): string;

// Add this at the top of the file after imports
const isDevelopment = process.env.NODE_ENV === 'development';

export default function IntellipulseChatPage() {
  const { locale, id } = useParams() as { locale: string; id: string };
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [lastWebContainerAction, setLastWebContainerAction] =
    useState<any>(null);

  // Get session data
  const { getSession, updateSession } = useIntellipulseSessions();
  const [session, setSession] = useState<IntellipulseSession | null | undefined>(null);

  useEffect(() => {
    const currentSession = getSession(id);
    setSession(currentSession);
  }, [id, getSession]);

  // Model selection state
  const [model, setModel] = useState("anthropic/claude-sonnet-4-20250514");

  // Chat hook
  const {
    messages,
    input,
    setInput,
    setMessages,
    status,
    reload,
    stop,
    error,
    handleSubmit,
    append,
  } = useChat({
    id: id,
    initialMessages: [],
    api: "/api/intellipulse/chat",
    body: {
      model,
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Move useUploadThing hook here
  const { isUploading, startUpload } = useUploadThing("imageUploader", {    headers: {
      Authorization: user && authToken ? authToken : "",
    },
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        setImage(res[0]?.ufsUrl || null);
        toast.success(
          t("chat.imageUploadSuccess") || "Image uploaded successfully!"
        );
      }
    },
    onUploadError: (error: Error) => {
      console.error("Upload error:", error);
      toast.error(t("chat.imageUploadError") || "Failed to upload image.");
    },
  });

  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([]);
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isWebContainerOpen, setIsWebContainerOpen] = useState(true); // Changed from false to true for debugging
  const [rerenderKey, setRerenderKey] = useState(0);

  // Image state
  const [image, setImage] = useState<string | null>(null);

  // Force rerender function
  const forceRerender = useCallback(() => {
    setRerenderKey((prev) => prev + 1);
  }, []);
  // Get auth token
  useEffect(() => {
    const getToken = async () => {
      if (user) {
        try {
          // Supabaseではユーザーオブジェクトから直接アクセストークンを取得
          setAuthToken(user.id);
        } catch (error) {
          console.error("Error getting auth token:", error);
          setAuthToken(null);
        }
      }
    };

    getToken();
  }, [user]);

  // Terminal log message handler
  const handleLogMessage = useCallback(
    (log: TerminalLogEntry) => {
      setTerminalLogs((prev) => [...prev, log]);
    },
    []
  );

  // WebContainer effect to handle file system actions
  useEffect(() => {
    if (!lastWebContainerAction) return;

    const executeAction = async () => {
      const instance = getWebContainerInstance();
      if (!instance) {
        handleLogMessage({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
        return;
      }

      try {
        const { action, path, content, isImage } = lastWebContainerAction;

        if (action === "write" && path && content !== undefined) {
          handleLogMessage({
            text: `Writing to file: ${path}`,
            className: "text-blue-500",
          });
          await instance.fs.writeFile(path, content);
          handleLogMessage({
            text: `File written successfully: ${path}`,
            className: "text-green-500",
          });
        } else if (action === "read" && path) {
          if (isImage) {
            handleLogMessage({
              text: `Viewing image: ${path}`,
              className: "text-blue-500",
            });
          } else {
            handleLogMessage({
              text: `Reading file: ${path}`,
              className: "text-blue-500",
            });
            const fileContent = await instance.fs.readFile(path, "utf-8");
            handleLogMessage({
              text: `File content for ${path}:\n${fileContent}`,
              className: "text-gray-600",
            });
          }
        }
      } catch (error) {
        console.error("Error executing WebContainer action:", error);
        handleLogMessage({
          text: `Error: ${error}`,
          className: "text-red-500",
        });
      }
    };

    executeAction();
  }, [lastWebContainerAction, handleLogMessage]);

  // Refresh file structure handler
  const handleRefreshFileStructure = useCallback(async () => {
    try {
      const instance = getWebContainerInstance();
      if (instance) {
        handleLogMessage({
          text: "Refreshing file structure...",
          className: "text-blue-500",
        });
      } else {
        handleLogMessage({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
      }
    } catch (error) {
      console.error("Error refreshing file structure:", error);
      handleLogMessage({
        text: `Error refreshing file structure: ${error}`,
        className: "text-red-500",
      });
    }

    // UIを強制的に再レンダリング
    forceRerender();
  }, [handleLogMessage, forceRerender]);

  // Modified Command execution handler
  const executeCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      // If we have an active process waiting for input, send the input to it
      if (activeProcess && isWaitingForInput) {
        try {
          // Send input to the active process without showing command prefix
          handleLogMessage({
            text: command,
            className: "text-gray-400",
          });

          const writer = activeProcess.input.getWriter();
          await writer.write(command + "\n");
          writer.releaseLock();

          setIsWaitingForInput(false);
          return;
        } catch (error) {
          console.error("Error sending input to process:", error);
          handleLogMessage({
            text: `Error sending input: ${error}`,
            className: "text-red-500",
          });
          setActiveProcess(null);
          setIsWaitingForInput(false);
          return;
        }
      }

      // Normal command execution
      handleLogMessage({
        text: `$ ${command}`,
        className: "text-green-500 font-mono",
      });

      const instance = getWebContainerInstance();
      if (!instance) {
        handleLogMessage({
          text: "WebContainer not available",
          className: "text-red-500",
        });
        return;
      }

      try {
        const process = await webContainerProcess.spawn(command, []);

        setActiveProcess(process);

        // Handle process output
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              if (data.trim()) {
                handleLogMessage({
                  text: data,
                  className: "text-gray-300 font-mono whitespace-pre-wrap",
                });
              }
            },
          })
        );

        // Wait for process to exit
        const exitCode = await process.exit;

        if (exitCode === 0) {
          handleLogMessage({
            text: `Process completed with exit code ${exitCode}`,
            className: "text-green-500",
          });
        } else {
          handleLogMessage({
            text: `Process exited with code ${exitCode}`,
            className: "text-yellow-500",
          });
        }

        setActiveProcess(null);
        setIsWaitingForInput(false);
      } catch (error) {
        console.error("Error executing command:", error);
        handleLogMessage({
          text: `Error: ${error}`,
          className: "text-red-500",
        });
        setActiveProcess(null);
        setIsWaitingForInput(false);
      }
    },
    [activeProcess, isWaitingForInput, handleLogMessage]
  );

  // Handle command input from terminal
  const handleTerminalInput = useCallback(
    (input: string) => {
      executeCommand(input);
    },
    [executeCommand]
  );

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+` (backtick) to toggle WebContainer
      if (event.ctrlKey && event.key === "`") {
        event.preventDefault();
        setIsWebContainerOpen((prev) => !prev);
        console.log("WebContainer toggled:", !isWebContainerOpen); // Debug log
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWebContainerOpen]); // Added isWebContainerOpen to dependency array

  // Update session when messages change
  useEffect(() => {
    // Only update session if we have messages and they have actually changed
    if (messages.length > 0) {
      const newTitle = messages[0]?.content?.substring(0, 50) || "New Chat";
      
      // Get current session without triggering re-render
      const currentSession = getSession(id);
      
      // Only update if title has changed or messages count has changed
      if (currentSession && (
        currentSession.title !== newTitle || 
        currentSession.messages?.length !== messages.length
      )) {
        updateSession(id, {
          ...currentSession,
          messages,
          title: newTitle,
        });
      }
    }
  }, [messages, id, updateSession, getSession]); // Removed session from dependencies

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Session not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen relative">
      <style>{spinnerStyle}</style>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <HeaderArea
        model={model}
        user={user!!}
          handleModelChange={model => setModel(model)}
          messages={messages}
        />        <IntellipulseChat
          sessionId={id}
          authToken={authToken}
          updateSession={(sessionId: string, updatedSession: ChatSession) => {
            updateSession(sessionId, updatedSession);
          }}
          reload={reload}
          stop={stop}
          error={error}
          handleSubmit={handleSubmit}
          append={append}
          setMessages={setMessages}
          setInput={setInput}
          input={input}
          messages={messages}
          status={status}
          model={model}
          reasoningEffort={"low"}
          handleModelChange={(model: string) => setModel(model)}
          handleReasoningEffortChange={() => {}}
          startUpload={startUpload}
          isUploading={isUploading}
        />
      </div>

      {/* WebContainer Panel */}
      {isWebContainerOpen && (
        <div className="w-1/2 border-l border-border flex flex-col">
          <div className="p-2 border-b border-border bg-muted/50 flex items-center justify-between">
            <h2 className="font-semibold text-sm">WebContainer</h2>
            <button
              onClick={() => setIsWebContainerOpen(false)}
              className="text-sm hover:bg-muted p-1 rounded"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <WebContainerUI
              key={rerenderKey} // Add key for force rerender
              chatId={id}
              onServerReady={(url) => {
                console.log("Server ready:", url); // Debug log
                handleLogMessage({
                  text: `Server ready at: ${url}`,
                  className: "text-green-500",
                });
              }}
              onError={(error) => {
                console.error("WebContainer error:", error); // Debug log
                handleLogMessage({
                  text: `WebContainer error: ${error}`,
                  className: "text-red-500",
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Loading overlay for active processes */}
      {activeProcess && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full custom-spin"></div>
          <span className="text-sm">Process running...</span>
        </div>
      )}

      {/* Input waiting indicator */}
      {isWaitingForInput && (
        <div className="absolute bottom-12 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Waiting for input...
        </div>
      )}
    </div>
  );
}