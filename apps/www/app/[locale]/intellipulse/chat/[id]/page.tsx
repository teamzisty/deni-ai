"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import IntellipulseChat from "@/components/IntellipulseChat";
import type { ChatSession } from "@/hooks/use-chat-sessions";
import HeaderArea from "@/components/HeaderArea";
import { useAuth } from "@/context/AuthContext";
import { reasoningEffortType } from "@/lib/modelDescriptions";
import {
  useIntellipulseSessions,
  IntellipulseSession,
} from "@/hooks/use-intellipulse-sessions";
import { CreateMessage, Message, useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";
import { useUploadThing, uploadResponse } from "@/utils/uploadthing";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

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

// Add this after imports, before the component
const MemoizedWebContainerUI = memo(WebContainerUI);

export default function IntellipulseChatPage() {
  const { id } = useParams() as { locale: string; id: string };
  const { user, isLoading: authLoading, supabase } = useAuth();
  const t = useTranslations();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [lastWebContainerAction, setLastWebContainerAction] =
    useState<any>(null);

  // Get session data
  const { getSession, updateSession } = useIntellipulseSessions();
  const [session, setSession] = useState<
    IntellipulseSession | null | undefined
  >(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Model selection state
  const [model, setModel] = useState("anthropic/claude-sonnet-4-20250514");

  // Additional state for session settings
  const [reasoningEffort, setReasoningEffort] =
    useState<reasoningEffortType>("low");

  // Chat hook - use session messages as initial messages
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
    headers: {
      Authorization: supabase && authToken ? authToken : "",
    },
    initialMessages: session?.messages || [],
    api: "/api/intellipulse/chat",
    body: {
      model,
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Load session and its data
  useEffect(() => {
    const currentSession = getSession(id);
    setSession(currentSession);

    // Load messages from session if available
    if (currentSession) {
      // Load messages from session
      if (currentSession.messages && currentSession.messages.length > 0) {
        setMessages(currentSession.messages);
      }
      setIsSessionLoaded(true);
    }
  }, [id, getSession, setMessages]);
  // Load messages from session when session is loaded
  useEffect(() => {
    if (session?.messages && session.messages.length > 0) {
      console.log("Loading messages from session:", session.messages.length);
      setMessages(session.messages);
    }
  }, [session, setMessages]);

  // Move useUploadThing hook here
  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: supabase && authToken ? authToken : "",
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
  // Remove rerenderKey state as it causes unnecessary re-renders - already removed

  // Image state
  const [image, setImage] = useState<string | null>(null);

  // Force rerender function - no longer needed
  // const forceRerender = useCallback(() => {
  //   setRerenderKey((prev) => prev + 1);
  // }, []);
  // For Supabase, we don't need to manually handle auth tokens
  // The session is managed by the AuthContext and passed through headers
  useEffect(() => {
    if (user && supabase) {
      // We can use the user ID directly if needed
      const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setAuthToken(session.access_token);
        } else {
          setAuthToken(null);
        }
      }
      getToken();
    } else {
      setAuthToken(null);
    }
  }, [user]);

  // Terminal log message handler
  const handleLogMessage = useCallback((log: TerminalLogEntry) => {
    setTerminalLogs((prev) => [...prev, log]);
  }, []);

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

  // Terminal command handler ref

  // Modified Command execution handler
  const executeCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      // Get WebContainer instance
      const instance = getWebContainerInstance();
      if (!instance) {
        handleLogMessage({
          text: "WebContainer not available",
          className: "text-red-500",
        });
        return;
      }

      // Normal command execution
      handleLogMessage({
        text: `$ ${command}`,
        className: "text-green-500 font-mono",
      });

      try {
        // Special handling for common file operations
        if (command.startsWith("touch ")) {
          // Handle file creation
          const filePath = command.substring(6).trim();
          if (filePath) {
            await instance.fs.writeFile(filePath, "");
            handleLogMessage({
              text: `File created: ${filePath}`,
              className: "text-green-500",
            });
            return 0;
          }
        } else if (command.startsWith("mkdir ")) {
          // Handle directory creation
          const dirPath = command.substring(6).trim();
          if (dirPath) {
            // Check if parent directory exists and create if needed
            const parts = dirPath.split("/").filter((p) => p);
            let currentPath = "";
            for (const part of parts) {
              currentPath = currentPath ? `${currentPath}/${part}` : part;
              try {
                await instance.fs.mkdir(currentPath);
              } catch (e) {
                // Directory might already exist, which is fine
              }
            }
            handleLogMessage({
              text: `Directory created: ${dirPath}`,
              className: "text-green-500",
            });
            return 0;
          }
        } else if (command.startsWith("echo ") && command.includes(" > ")) {
          // Handle echo with file redirection
          const match = command.match(/echo\s+["']?(.+?)["']?\s+>\s+(.+)/);
          if (match) {
            const content = match[1];
            const filePath = match[2]?.trim();

            if (!filePath) {
              handleLogMessage({
                text: "Error: No file path specified",
                className: "text-red-500",
              });
              return 1;
            }

            // Ensure parent directory exists
            const dir = filePath.substring(0, filePath.lastIndexOf("/"));
            if (dir) {
              try {
                await instance.fs.mkdir(dir);
              } catch (e) {
                // Directory might already exist
              }
            }

            await instance.fs.writeFile(filePath, content + "\n");
            handleLogMessage({
              text: `File written: ${filePath}`,
              className: "text-green-500",
            });
            return 0;
          }
        }

        // Parse command and arguments for regular commands
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);

        if (!cmd) {
          handleLogMessage({
            text: "Error: No command specified",
            className: "text-red-500",
          });
          return 1;
        }

        console.log("Executing command:", cmd, "with args:", args);

        // Use spawn from WebContainer instance
        const process = await instance.spawn(cmd, args);

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
            text: `Process completed successfully`,
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

        return exitCode;
      } catch (error) {
        console.error("Error executing command:", error);
        handleLogMessage({
          text: `Error: ${error}`,
          className: "text-red-500",
        });
        setActiveProcess(null);
        setIsWaitingForInput(false);
        throw error;
      }
    },
    [handleLogMessage]
  );

  // Handle command input from terminal

  // Add executeSteps event listener
  useEffect(() => {
    const handleExecuteSteps = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { steps } = customEvent.detail;
      if (!steps || !Array.isArray(steps)) return;

      console.log("Page: Received executeSteps event with steps:", steps);

      // Open WebContainer if not already open
      if (!isWebContainerOpen) {
        setIsWebContainerOpen(true);
        // Wait for WebContainer to initialize
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Execute each step sequentially
      for (const step of steps) {
        if (step.command) {
          // Update step status via custom event
          const statusEvent = new CustomEvent("stepStatusUpdate", {
            detail: {
              stepId: step.id,
              status: "running",
            },
          });
          window.dispatchEvent(statusEvent);

          try {
            // Execute the command directly
            console.log("Executing step command:", step.command);
            await executeCommand(step.command);

            // Wait for command to complete
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Update step status to completed
            const completeEvent = new CustomEvent("stepStatusUpdate", {
              detail: {
                stepId: step.id,
                status: "completed",
                output: "Command executed successfully",
              },
            });
            window.dispatchEvent(completeEvent);
          } catch (error) {
            console.error("Error executing step:", error);
            // Update step status to failed
            const failEvent = new CustomEvent("stepStatusUpdate", {
              detail: {
                stepId: step.id,
                status: "failed",
                output:
                  error instanceof Error ? error.message : "Unknown error",
              },
            });
            window.dispatchEvent(failEvent);
          }
        }
      }
    };

    window.addEventListener("executeSteps", handleExecuteSteps);

    return () => {
      window.removeEventListener("executeSteps", handleExecuteSteps);
    };
  }, [executeCommand, isWebContainerOpen, handleLogMessage]);

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
  // Debounced session save function
  const debouncedSaveSession = useDebouncedCallback(
    useCallback(() => {
      if (!session || !id || !isSessionLoaded) return;

      try {
        const currentSession = getSession(id);
        if (!currentSession) return;

        // Create updated session with only valid properties
        const updatedSession: IntellipulseSession = {
          ...currentSession,
          messages: messages.length > 0 ? messages : currentSession.messages,
          title:
            messages.length > 0
              ? messages[0]?.content?.substring(0, 50) || currentSession.title
              : currentSession.title,
        };

        updateSession(id, updatedSession);
        console.log("Session saved successfully:", id);
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }, [id, session, messages, getSession, updateSession, isSessionLoaded]),
    2000 // 2秒のデバウンス
  );

  // Save session when messages change (only after session is loaded)
  useEffect(() => {
    if (messages.length > 0 && session && isSessionLoaded) {
      debouncedSaveSession();
    }
  }, [messages, session, isSessionLoaded, debouncedSaveSession]);
  // Save session when settings change
  useEffect(() => {
    if (session && isSessionLoaded) {
      debouncedSaveSession();
    }
  }, [session, debouncedSaveSession, isSessionLoaded]);

  // Save session immediately before component unmount
  useEffect(() => {
    return () => {
      debouncedSaveSession.flush();
    };
  }, [debouncedSaveSession]);

  // Handle session updates from IntellipulseChat component
  const handleSessionUpdate = useCallback(
    (sessionId: string, updates: Partial<IntellipulseSession>) => {
      const currentSession = getSession(sessionId);
      if (!currentSession) return;

      // Merge updates with current session
      const updatedSession: IntellipulseSession = {
        ...currentSession,
        ...updates,
      };

      updateSession(sessionId, updatedSession);
    },
    [getSession, updateSession]
  );

  // Memoize callbacks for WebContainerUI to prevent re-renders
  const handleServerReady = useCallback(
    (url: string) => {
      console.log("Server ready:", url);
      handleLogMessage({
        text: `Server ready at: ${url}`,
        className: "text-green-500",
      });
    },
    [handleLogMessage]
  );

  const handleWebContainerError = useCallback(
    (error: string) => {
      console.error("WebContainer error:", error);
      handleLogMessage({
        text: `WebContainer error: ${error}`,
        className: "text-red-500",
      });
    },
    [handleLogMessage]
  );

  // Terminal command handler registration

  // Add custom event for WebContainer command execution
  useEffect(() => {
    const handleWebContainerCommand = (event: CustomEvent) => {
      const { command } = event.detail;
      if (command) {
        executeCommand(command);
      }
    };

    window.addEventListener(
      "webcontainer-execute-command",
      handleWebContainerCommand as EventListener
    );

    return () => {
      window.removeEventListener(
        "webcontainer-execute-command",
        handleWebContainerCommand as EventListener
      );
    };
  }, [executeCommand]);

  // Handle annotation for WebContainer actions (file operations)
  const handleAnnotation = useCallback(
    (annotation: any) => {
      if (annotation.webcontainerAction) {
        const action = annotation.webcontainerAction;

        // Handle file write action
        if (
          action.action === "write" &&
          action.path &&
          action.content !== undefined
        ) {
          const instance = getWebContainerInstance();
          if (instance) {
            instance.fs
              .writeFile(action.path, action.content)
              .then(() => {
                handleLogMessage({
                  text: `File written: ${action.path}`,
                  className: "text-green-500",
                });
              })
              .catch((error) => {
                handleLogMessage({
                  text: `Error writing file ${action.path}: ${error}`,
                  className: "text-red-500",
                });
              });
          }
        }
      }
    },
    [handleLogMessage]
  );

  // Early returns MUST come after all hooks
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{t("common.loading") || "Loading..."}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">
          {t("chat.sessionNotFound") || "Session not found"}
        </div>
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
          handleModelChange={(model) => {
            setModel(model);
            debouncedSaveSession();
          }}
          messages={messages}
        />{" "}
        <IntellipulseChat
          sessionId={id}
          authToken={authToken}
          onAnnotation={handleAnnotation}
          updateSession={handleSessionUpdate}
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
          reasoningEffort={reasoningEffort}
          handleModelChange={(model: string) => {
            setModel(model);
            debouncedSaveSession();
          }}
          handleReasoningEffortChange={(value: reasoningEffortType) => {
            setReasoningEffort(value);
            debouncedSaveSession();
          }}
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
            <MemoizedWebContainerUI
              chatId={id}
              onServerReady={handleServerReady}
              onError={handleWebContainerError}
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
