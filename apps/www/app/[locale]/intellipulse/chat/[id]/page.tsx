"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import IntellipulseChat from "@/components/IntellipulseChat";
import HeaderArea from "@/components/HeaderArea";
import { useAuth } from "@/context/AuthContext";
import { reasoningEffortType } from "@/lib/modelDescriptions";
import {
  useIntellipulseSessions,
  IntellipulseSession,
} from "@/hooks/use-intellipulse-sessions";
import { useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";
import { useUploadThing } from "@/utils/uploadthing";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

// Import WebContainerUI component
import {
  WebContainerUI,
  getWebContainerInstance,
  resetWebContainerInstance,
  getCurrentConversationId,
  TerminalLogEntry,
} from "@/components/WebContainer";

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
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

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
    async onToolCall({ toolCall }) {
        if (toolCall.toolName === "read_file") {
          const { path } = toolCall.args as { path: string };
          const instance = getWebContainerInstance();
          if (!instance) {
            throw new Error("WebContainer instance is not available");
          }

          try {
            const content = await instance.fs.readFile(path, "utf-8");
            return {
              type: "text",
              text: content,
            };
          } catch (error) {
            console.error("Error reading file:", error);
            throw new Error(`Failed to read file at ${path}`);
          }
        }
    },    onError: (error) => {
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
  }, [id, getSession, setMessages]);  // Reset WebContainer instance when conversation ID changes
  useEffect(() => {
    const resetWebContainer = async () => {
      try {
        const currentConversationId = getCurrentConversationId();
        if (currentConversationId && currentConversationId !== id) {
          console.log(`Conversation switching detected: ${currentConversationId} -> ${id}`);
          
          // Clear terminal logs when switching conversations
          setTerminalLogs([]);
          setActiveProcess(null);
          setIsWaitingForInput(false);
          
          await resetWebContainerInstance();
          console.log(`WebContainer reset completed for conversation: ${id}`);
        } else if (!currentConversationId) {
          console.log(`First conversation load: ${id}`);
        } else {
          console.log(`Same conversation reloaded: ${id}`);
        }
      } catch (error) {
        console.error("Failed to reset WebContainer:", error);
      }
    };

    // Reset WebContainer when switching to a different conversation
    resetWebContainer();
  }, [id]); // This effect runs whenever the conversation ID changes

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

        if (args.includes("dev")) {
          // if dev server, continue
          handleLogMessage({
            text: `Starting development server with command: ${command}`,
            className: "text-blue-500",
          });

          setActiveProcess(process);
          setIsWaitingForInput(false);

          return 0;
        }

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
      }      // Execute each step sequentially
      for (const step of steps) {
        // Update step status to running
        const statusEvent = new CustomEvent("stepStatusUpdate", {
          detail: {
            stepId: step.id,
            status: "running",
          },
        });
        window.dispatchEvent(statusEvent);

        try {          // Handle different step actions
          if (step.action === "write" && step.path && step.content !== undefined) {
            // Handle file write operations
            console.log("Executing step file write:", step.path);
            
            // Get WebContainer instance directly for immediate file write
            const instance = getWebContainerInstance();
            if (instance) {
              try {
                // Create directory if it doesn't exist
                const dirPath = step.path.substring(0, step.path.lastIndexOf("/"));
                if (dirPath) {
                  await instance.fs.mkdir(dirPath, { recursive: true }).catch(() => {});
                }
                
                // Write file directly
                await instance.fs.writeFile(step.path, step.content);
                
                handleLogMessage({
                  text: `File written successfully: ${step.path}`,
                  className: "text-green-500",
                });
                
                // Trigger file structure refresh through WebContainer action
                setLastWebContainerAction({
                  action: "refreshFileStructure",
                  timestamp: Date.now(),
                });
              } catch (error) {
                console.error("Error writing file:", error);
                handleLogMessage({
                  text: `Error writing file ${step.path}: ${error}`,
                  className: "text-red-500",
                });
                throw error;
              }
            } else {
              console.error("WebContainer instance not available");
              handleLogMessage({
                text: "WebContainer instance not available",
                className: "text-red-500",
              });
              throw new Error("WebContainer instance not available");
            }
          } else if (step.action === "run" && step.command) {
            // Handle command execution
            console.log("Executing step command:", step.command);
            await executeCommand(step.command);

            // Wait for command to complete
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else if (step.command) {
            // Backward compatibility for steps with only command (no action field)
            console.log("Executing step command (legacy):", step.command);
            await executeCommand(step.command);

            // Wait for command to complete
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            console.warn("Step has no valid action or command:", step);
          }

          // Update step status to completed
          const completeEvent = new CustomEvent("stepStatusUpdate", {
            detail: {
              stepId: step.id,
              status: "completed",
              output: step.action === "write" 
                ? `File written successfully: ${step.path}`
                : "Command executed successfully",
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
        console.log("Session saved successfully:", id);      } catch (error) {
        console.error("Error saving session:", error);
      }
    }, [id, session, messages, getSession, updateSession, isSessionLoaded]),
    2000 // 2-second debounce
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
      setIframeUrl(url);
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
      <div className="flex-1 flex flex-col pb-2 pt-2 h-full">
        <HeaderArea
          model={model}
          user={user!}
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
              iframeUrl={iframeUrl!}
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
