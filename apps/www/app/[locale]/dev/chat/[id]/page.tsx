"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import DevChat from "@/components/DevChat";
import type { ChatSession } from "@/hooks/use-chat-sessions";
import HeaderArea from "@/components/HeaderArea";
import { useAuth } from "@/context/AuthContext";
import { reasoningEffortType } from "@/lib/modelDescriptions";
import { useDevSessions, DevSession } from "@/hooks/use-dev-sessions";
import { useChat } from "@ai-sdk/react";
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

export default function DevChatPage() {
  const { locale, id } = useParams() as { locale: string; id: string };
  const { user, auth, isLoading: authLoading } = useAuth();
  const t = useTranslations();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [lastWebContainerAction, setLastWebContainerAction] =
    useState<any>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [model, setModel] = useState<string>("openai/gpt-4.1-mini-2025-04-14");
  const [reasoningEffort, setReasoningEffort] =
    useState<reasoningEffortType>("medium");
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([]);
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState<boolean>(false);

  // WebContainerを手動でリフレッシュするための状態
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const {
    getSession: getDevSession,
    createSession: createDevSession,
    updateSession: updateDevSession,
    isLoading: sessionsLoading,
  } = useDevSessions();

  const [activeSessionData, setActiveSessionData] = useState<DevSession | null>(
    null
  );

  // Initialize useChat hook
  const {
    messages,
    setMessages,
    input,
    setInput,
    status,
    reload,
    stop,
    error,
    handleSubmit,
    append,
  } = useChat({
    id: id,
    initialMessages: [],
    api: "/api/dev/chat",
    body: {
      model,
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Move useUploadThing hook here
  const { isUploading, startUpload } = useUploadThing("imageUploader", {
    headers: {
      Authorization: auth && authToken ? authToken : "",
    },
    // onClientUploadComplete/onUploadError likely handled within DevChat via toast.promise?
    // If direct feedback needed here, add handlers.
    onUploadError: (error: Error) => {
      // Example: Log error at page level if needed
      console.error("DevChatPage: Upload Error:", error);
      toast.error(t("chat.error.imageUpload"), {
        description: t("chat.error.errorOccurred", { message: error.message }),
      });
    },
  });
  // WebContainerのログ表示関数をメモ化
  const handleLogMessage = useCallback((log: TerminalLogEntry) => {
    // Check if this message is identical to the last one in terminalLogs
    setTerminalLogs((prevLogs) => {
      // Get the last log entry
      const lastLog =
        prevLogs.length > 0 ? prevLogs[prevLogs.length - 1] : null;

      // If this is a duplicate of the last message, don't add it
      if (
        lastLog &&
        lastLog.text === log.text &&
        lastLog.className === log.className &&
        lastLog.html === log.html
      ) {
        return prevLogs; // Return unchanged logs
      }

      // Otherwise add the new log
      return [...prevLogs, log];
    });
  }, []);

  // WebContainerエラー処理関数をメモ化
  const handleWebContainerError = useCallback(
    (message: string) => {
      handleLogMessage({ text: message, className: "text-red-500" });
    },
    [handleLogMessage]
  );

  // WebContainerサーバー準備完了時の処理をメモ化
  const handleServerReady = useCallback((url: string) => {
    setIframeUrl(url);
  }, []);

  // WebContainerUI自体を更新するための状態
  const forceRerender = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // ファイル構造を更新する関数
  const updateFileStructure = useCallback(async () => {
    // WebContainerのグローバルインスタンスのrefreshAllFilesを使う
    // 直接refreshFileStructureを呼ぶ方法よりも確実
    try {
      const instance = getWebContainerInstance();
      if (instance) {
        handleLogMessage({
          text: "Refreshing file structure...",
          className: "text-blue-400",
        });
        await instance.fs.readdir("/", { withFileTypes: true });
        handleLogMessage({
          text: "File structure refreshed",
          className: "text-green-400",
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
          handleLogMessage({ text: `${command}`, className: "text-blue-400" });

          try {
            // Try the WebContainer provided stdin API if it exists
            if (
              activeProcess.stdin &&
              typeof activeProcess.stdin.write === "function"
            ) {
              // Create text encoder for input
              const encoder = new TextEncoder();
              const input = encoder.encode(command + "\n");

              // Write to stdin of active process
              await activeProcess.stdin.write(input);
            } else {
              // Fallback - if stdin API doesn't exist
              handleLogMessage({
                text: "This command doesn't support interactive input",
                className: "text-yellow-500",
              });
            }
          } catch (inputError) {
            handleLogMessage({
              text: "Interactive input not supported",
              className: "text-yellow-500",
            });
            console.error("Stdin write error:", inputError);
          }

          // Reset the waiting state but keep process active
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

      handleLogMessage({ text: command, className: "text-green-400" });

      try {
        const instance = getWebContainerInstance();
        if (!instance) {
          handleLogMessage({
            text: "WebContainer instance is not available",
            className: "text-red-500",
          });
          return;
        }

        // Parse command (handle quoted arguments)
        const cmdParts =
          command
            .match(/(?:[^\s"]+|"[^"]*")+/g)
            ?.map((part: string) =>
              part.startsWith('"') && part.endsWith('"')
                ? part.slice(1, -1)
                : part
            ) || [];

        if (cmdParts.length === 0) {
          handleLogMessage({
            text: "Invalid command format",
            className: "text-red-500",
          });
          return;
        }

        // Execute command
        const cmd = cmdParts[0];
        if (!cmd) {
          handleLogMessage({
            text: "Invalid command",
            className: "text-red-500",
          });
          return;
        }

        // Get terminal dimensions
        const getDimensions = () => {
          const terminalContainer =
            document.getElementById("terminal-container");
          if (!terminalContainer) return { cols: 80, rows: 24 };

          // Estimate dimensions based on container size
          const cols = Math.floor(terminalContainer.clientWidth / 9); // Approximate character width
          const rows = Math.floor((terminalContainer.clientHeight - 28) / 16); // Approximate line height

          return {
            cols: Math.max(cols, 80),
            rows: Math.max(rows, 24),
          };
        };

        // Check if this is an interactive command
        const isLikelyInteractive =
          /^(npm init|yarn create|create-|npx create-|init |pnpm create|pnpm init|ng new)/i.test(
            command
          );

        // Execute command (with terminal dimensions)
        const dimensions = getDimensions();
        const process = await instance.spawn(cmd, cmdParts.slice(1), {
          terminal: {
            cols: dimensions.cols,
            rows: dimensions.rows,
          },
        });

        // Store the process if it might be interactive
        if (isLikelyInteractive) {
          setActiveProcess(process);
        }

        // Handle window resize
        const handleResize = () => {
          if (process) {
            try {
              const newDimensions = getDimensions();
              process.resize(newDimensions);
            } catch (error) {
              console.error("Error resizing process:", error);
            }
          }
        };

        window.addEventListener("resize", handleResize);

        // Add a way to detect prompts in output
        const promptPatterns = [
          /\?\s[^?]+\s›\s*$/, // ? What is your project named? ›
          /\[?[y/n]\]?:?\s*$/, // (y/n): or [y/n]:
          /\(\S+\)\s*$/, // (default):
          /name:\s*$/, // name:
          /password:?\s*$/, // password:
          /continue\?.*$/i, // continue?
          /proceed\?.*$/i, // proceed?
        ];

        // Process output
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              handleLogMessage({
                text: data,
                className: "text-muted-foreground",
              });

              // Check if this output seems to be waiting for user input
              const isPrompt = promptPatterns.some((pattern) =>
                pattern.test(data.trim())
              );
              if (isPrompt) {
                setIsWaitingForInput(true);
              }
            },
          })
        );

        // Wait for exit
        const exitCode = await process.exit;

        // Cleanup
        window.removeEventListener("resize", handleResize);

        // Clear active process state
        setActiveProcess(null);
        setIsWaitingForInput(false);

        if (exitCode !== 0) {
          handleLogMessage({
            text: `Command failed with exit code ${exitCode}`,
            className: "text-red-500",
          });
        }

        // Update file structure if needed
        await updateFileStructure();
      } catch (error) {
        console.error("Error executing command:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        handleLogMessage({
          text: `Error: ${errorMessage}`,
          className: "text-red-500",
        });

        // Clear active process state on error
        setActiveProcess(null);
        setIsWaitingForInput(false);
      }
    },
    [handleLogMessage, updateFileStructure, activeProcess, isWaitingForInput]
  );

  // executeStepsイベントハンドラー - WebContainerでステップを実行する関数
  const executeSteps = useCallback(
    async (steps: any[]) => {
      if (!steps || !steps.length) {
        console.warn("DevChatPage: No steps to execute");
        return;
      }

      const instance = getWebContainerInstance();
      if (!instance) {
        handleLogMessage({
          text: "WebContainer instance is not available",
          className: "text-red-500",
        });
        return;
      }

      let lastStepStatus = true; // 最後のステップが成功したかどうか

      // ステップステータス更新関数
      const updateStepStatus = (
        stepId: string,
        status: "waiting" | "running" | "completed" | "failed",
        output?: string
      ) => {
        const event = new CustomEvent("stepStatusUpdate", {
          detail: {
            stepId,
            status,
            output,
          },
        });
        window.dispatchEvent(event);
      };

      // ステップを順番に実行
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // ステップIDが必ず存在することを確認
        const stepId = step.id || `step-${i + 1}`;
        if (!step.id) {
          console.warn(
            `DevChatPage: Step at index ${i} has no ID, using generated ID: ${stepId}`
          );
          step.id = stepId;
        }

        // 現在のステップが既に失敗または実行中でない場合はステータスを更新
        if (step.status !== "failed" && step.status !== "running") {
          updateStepStatus(step.id, "running", "Starting execution...");
        }

        if (!lastStepStatus) {
          // 前のステップが失敗した場合は実行しない
          updateStepStatus(
            step.id,
            "failed",
            "Previous step failed, skipping this step"
          );
          continue;
        }

        try {
          handleLogMessage({
            text: `Executing step ${i + 1}/${steps.length}: ${step.title || "Untitled step"}`,
            className: "text-blue-400",
          });

          switch (step.action) {
            case "run":
              if (!step.command) {
                throw new Error("No command provided for run action");
              }

              handleLogMessage({
                text: `$ ${step.command}`,
                className: "text-green-400",
              });

              // コマンドを実行（空白で分割）
              const cmdParts =
                step.command
                  .match(/(?:[^\s"]+|"[^"]*")+/g)
                  ?.map((part: string) =>
                    part.startsWith('"') && part.endsWith('"')
                      ? part.slice(1, -1)
                      : part
                  ) || [];

              if (cmdParts.length === 0) {
                throw new Error("Invalid command format");
              }

              // 開発サーバー起動コマンドの検出
              const isDevServerCommand =
                step.command.match(/p?npm( run)? dev/i) ||
                step.command.match(/p?npm( run)? start/i) ||
                step.command.match(/yarn( run)? dev/i) ||
                step.command.match(/yarn( run)? start/i) ||
                step.command.match(/node server/i) ||
                step.command.match(/vite dev/i) ||
                step.command.match(/vite serve/i) ||
                step.command.match(/next dev/i) ||
                step.command.match(/next start/i) ||
                step.command.match(/astro dev/i) ||
                step.command.match(/nuxt dev/i);

              if (isDevServerCommand) {
                handleLogMessage({
                  text: "Detected development server start command",
                  className: "text-blue-400",
                });
                handleLogMessage({
                  text: "Development server is starting in background...",
                  className: "text-green-400",
                });

                // 非同期でサーバーを起動（メイン処理はブロックせず）
                const startServerPromise = (async () => {
                  try {
                    // 実際にサーバーを起動（出力キャプチャ用）
                    const serverProcess = await instance.spawn(
                      cmdParts[0],
                      cmdParts.slice(1)
                    );

                    // 出力をキャプチャして表示（別ストリームで）
                    let serverStartDetected = false;
                    serverProcess.output.pipeTo(
                      new WritableStream({
                        write(data) {
                          // サーバー出力を特別な色で表示
                          handleLogMessage({
                            text: data,
                            className: "text-indigo-400",
                          });

                          // サーバー起動検出のためのポート番号とURL情報を抽出
                          if (!serverStartDetected) {
                            // URLの検出パターン
                            const urlPattern = /(https?:\/\/[^:\s]+:)(\d+)/;
                            const portPattern = /localhost:(\d+)/;

                            if (
                              urlPattern.test(data) ||
                              portPattern.test(data)
                            ) {
                              serverStartDetected = true;
                              handleLogMessage({
                                text: "Server startup detected",
                                className: "text-green-500",
                              });

                              // WebContainerのserver-readyイベントはそのうち発火するはず
                              // ここでは特に何もしなくてよい
                            }
                          }
                        },
                      })
                    );
                  } catch (err) {
                    // エラーは表示するが次のステップには進む
                    console.error("Error starting development server:", err);
                    handleLogMessage({
                      text: "Warning: Development server may not have started correctly:",
                      className: "text-yellow-500",
                    });
                  }
                })();

                // 開発サーバーを実行中として状態更新してすぐに次のステップへ
                updateStepStatus(
                  step.id,
                  "completed",
                  `Development server started successfully. 
The server will continue running in the background.

You can view the application in the browser when server is ready.`
                );

                // 開発サーバーコマンドはスキップして成功したことにする
                handleLogMessage({
                  text: "Proceeding to next step automatically",
                  className: "text-blue-400",
                });
                continue;
              }

              const process = await instance.spawn(
                cmdParts[0],
                cmdParts.slice(1)
              );

              // 標準出力と標準エラー出力のリダイレクト
              let output = "";
              process.output.pipeTo(
                new WritableStream({
                  write(data) {
                    output += data;
                    handleLogMessage({
                      text: data,
                      className: "text-muted-foreground",
                    });
                  },
                })
              );

              // プロセスの終了を待つ
              const exitCode = await process.exit;

              if (exitCode !== 0) {
                lastStepStatus = false;
                const errorMsg = `Command failed with exit code ${exitCode}`;
                handleLogMessage({ text: errorMsg, className: "text-red-500" });
                updateStepStatus(
                  step.id,
                  "failed",
                  `${errorMsg}\n\nOutput:\n${output}`
                );
              } else {
                updateStepStatus(
                  step.id,
                  "completed",
                  `Command completed with exit code ${exitCode}\n\nOutput:\n${output}`
                );
              }
              break;

            case "write":
              if (!step.path) {
                throw new Error("No path provided for write action");
              }

              if (step.content === undefined) {
                throw new Error("No content provided for write action");
              }

              // ディレクトリ構造を作成（必要な場合）
              const dirPath = step.path.substring(
                0,
                step.path.lastIndexOf("/")
              );
              if (dirPath) {
                try {
                  await instance.fs.mkdir(dirPath, { recursive: true });
                } catch (err) {
                  // ディレクトリが既に存在する場合は無視
                  console.log(`Directory creation warning: ${err}`);
                }
              }

              // ファイルの書き込み
              await instance.fs.writeFile(step.path, step.content);
              handleLogMessage({
                text: `File written: ${step.path}`,
                className: "text-green-400",
              });
              updateStepStatus(
                step.id,
                "completed",
                `File ${step.path} written successfully`
              );
              break;

            case "read":
              if (!step.path) {
                throw new Error("No path provided for read action");
              }

              try {
                const content = await instance.fs.readFile(step.path, "utf-8");
                handleLogMessage({
                  text: `File read: ${step.path}`,
                  className: "text-green-400",
                });

                // 内容が長すぎる場合は省略
                const previewContent =
                  content.length > 500
                    ? `${content.substring(0, 500)}... (truncated, total length: ${content.length} chars)`
                    : content;

                updateStepStatus(
                  step.id,
                  "completed",
                  `File ${step.path} read successfully.\n\nContent:\n${previewContent}`
                );
              } catch (error) {
                lastStepStatus = false;
                const errorMsg = `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
                handleLogMessage({ text: errorMsg, className: "text-red-500" });
                updateStepStatus(step.id, "failed", errorMsg);
              }
              break;

            default:
              throw new Error(`Unknown action: ${step.action}`);
          }
        } catch (error) {
          lastStepStatus = false;
          console.error(`Error executing step ${i}:`, error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          handleLogMessage({
            text: `Error executing step: ${errorMessage}`,
            className: "text-red-500",
          });
          updateStepStatus(step.id, "failed", errorMessage);
        }

        // ファイル操作の後にファイル構造を更新
        if (step.action === "write" || step.action === "run") {
          await updateFileStructure();
        }
      }

      // 全てのステップが完了したらメッセージを表示
      if (lastStepStatus) {
        handleLogMessage({
          text: "All steps completed successfully",
          className: "text-green-400",
        });
      } else {
        handleLogMessage({
          text: "Some steps failed - check the logs for details",
          className: "text-yellow-400",
        });
      }

      // 最後にファイル構造を更新（ステップ実行中に変更があった場合のため）
      await updateFileStructure();
    },
    [handleLogMessage, updateFileStructure]
  );

  // executeStepsイベントリスナーの設定
  useEffect(() => {
    const handleExecuteStepsEvent = (event: any) => {
      if (event.detail && event.detail.steps) {
        executeSteps(event.detail.steps);
      }
    };

    // イベントリスナーを追加
    window.addEventListener("executeSteps", handleExecuteStepsEvent);

    // クリーンアップ時にイベントリスナーを削除
    return () => {
      window.removeEventListener("executeSteps", handleExecuteStepsEvent);
    };
  }, [executeSteps]);

  // WebContainer操作後のファイル構造更新
  useEffect(() => {
    // lastWebContainerActionが更新されたらファイル構造を更新
    if (lastWebContainerAction) {
      updateFileStructure();
    }
  }, [lastWebContainerAction, updateFileStructure]);

  // Add a function to initialize shell when WebContainer is ready
  const initializeShell = useCallback(async () => {
    try {
      const instance = getWebContainerInstance();
      if (!instance) {
        console.error("WebContainer not available, cannot initialize shell");
        return;
      }

      handleLogMessage({
        text: "Starting interactive shell...",
        className: "text-blue-400",
      });

      // Get terminal dimensions if we have an xterm instance
      const getDimensions = () => {
        const terminalContainer = document.getElementById("terminal-container");
        if (!terminalContainer) return { cols: 80, rows: 24 };

        // Estimate dimensions based on container size
        const cols = Math.floor(terminalContainer.clientWidth / 9); // Approximate character width
        const rows = Math.floor((terminalContainer.clientHeight - 28) / 16); // Approximate line height

        return {
          cols: Math.max(cols, 80),
          rows: Math.max(rows, 24),
        };
      };

      // Try running jsh or other shells
      try {
        // First try jsh with dimensions
        const dimensions = getDimensions();
        const shellProcess = await instance.spawn("jsh", [], {
          terminal: {
            cols: dimensions.cols,
            rows: dimensions.rows,
          },
        });

        // Store as active process
        setActiveProcess(shellProcess);

        // Process output
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              handleLogMessage({
                text: data,
                className: "text-muted-foreground",
              });

              // Check if this output seems to be waiting for user input
              const isPrompt =
                data.includes("$ ") || /\w+@\w+:.*[$#] *$/.test(data);
              if (isPrompt) {
                setIsWaitingForInput(true);
              }
            },
          })
        );

        // Handle window resize to update terminal dimensions
        const handleResize = () => {
          if (shellProcess) {
            try {
              const newDimensions = getDimensions();
              shellProcess.resize(newDimensions);
            } catch (error) {
              console.error("Error resizing shell:", error);
            }
          }
        };

        window.addEventListener("resize", handleResize);

        // Handle process exit
        shellProcess.exit.then((exitCode) => {
          setActiveProcess(null);
          setIsWaitingForInput(false);
          handleLogMessage({
            text: "Shell session ended. Starting a new one...",
            className: "text-yellow-400",
          });
          window.removeEventListener("resize", handleResize);
          // Restart shell
          setTimeout(initializeShell, 1000);
        });
      } catch (error) {
        // jsh failed, try bash
        try {
          handleLogMessage({
            text: "jsh not available, trying bash...",
            className: "text-yellow-400",
          });
          const dimensions = getDimensions();
          const shellProcess = await instance.spawn("bash", [], {
            terminal: {
              cols: dimensions.cols,
              rows: dimensions.rows,
            },
          });

          // Rest of the code is the same as above
          setActiveProcess(shellProcess);

          // Process output
          shellProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                handleLogMessage({
                  text: data,
                  className: "text-muted-foreground",
                });

                // Check if this output seems to be waiting for user input
                const isPrompt =
                  data.includes("$ ") || /\w+@\w+:.*[$#] *$/.test(data);
                if (isPrompt) {
                  setIsWaitingForInput(true);
                }
              },
            })
          );

          // Handle window resize
          const handleResize = () => {
            if (shellProcess) {
              try {
                const newDimensions = getDimensions();
                shellProcess.resize(newDimensions);
              } catch (error) {
                console.error("Error resizing shell:", error);
              }
            }
          };

          window.addEventListener("resize", handleResize);

          // Handle process exit
          shellProcess.exit.then((exitCode) => {
            setActiveProcess(null);
            setIsWaitingForInput(false);
            handleLogMessage({
              text: "Shell session ended. Starting a new one...",
              className: "text-yellow-400",
            });
            window.removeEventListener("resize", handleResize);
            // Restart shell
            setTimeout(initializeShell, 1000);
          });
        } catch (error) {
          // Both shells failed
          handleLogMessage({
            text: "Cannot start shell. Enter commands directly.",
            className: "text-red-500",
          });
          console.error("Failed to start any shell:", error);
        }
      }
    } catch (error) {
      console.error("Failed to initialize shell:", error);
      handleLogMessage({
        text: `Failed to start shell: ${error}`,
        className: "text-red-500",
      });
    }
  }, [handleLogMessage]);

  // Add WebContainer ready handler to the existing listener effect
  useEffect(() => {
    const instance = getWebContainerInstance();
    if (!instance) return;

    // server-readyイベントのリスナーを設定
    const handleServerReady = (port: number, url: string) => {
      handleLogMessage({
        text: `Server ready on port ${port}`,
        className: "text-green-500",
      });
      setIframeUrl(url);
      handleLogMessage({
        text: "Preview updated with server URL",
        className: "text-blue-400",
      });
    };

    // WebContainerが準備完了したときのイベント (onBoot)
    instance.on("port", () => {
      // Start shell when WebContainer is ready
      initializeShell();
    });

    // イベントリスナーを追加（WebContainerデフォルトのレガシーAPIを使用）
    instance.on("server-ready", handleServerReady);

    // クリーンアップ関数は必要なし（WebContainerでは自動管理される）
    return () => {
      // WebContainerAPIはoffメソッドを提供していない
    };
  }, [handleLogMessage, initializeShell]);

  // stepStatusイベントハンドラー - DevMessageLogコンポーネントと連携するためのイベント
  useEffect(() => {
    const handleStepStatusEvent = (event: CustomEvent<any>) => {
      const { stepId, status, output } = event.detail;

      // 完了または失敗時にはファイル構造を更新
      if (status === "completed" || status === "failed") {
        updateFileStructure();
      }
    };

    // イベントリスナーをCustomEventとして正しく型付け
    window.addEventListener(
      "stepStatusUpdate",
      handleStepStatusEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "stepStatusUpdate",
        handleStepStatusEvent as EventListener
      );
    };
  }, [updateFileStructure]);

  // Effect to save messages when they change
  useEffect(() => {
    // Only save if session data is loaded and messages exist
    if (activeSessionData && messages && messages.length >= 0) {
      // Allow saving even if messages array becomes empty
      if (status === "submitted" || status == "streaming") return; // if Generating, skip saving
      // Compare current messages with stored messages before saving
      const currentMessagesString = JSON.stringify(messages);
      const storedMessagesString = JSON.stringify(
        activeSessionData.messages || []
      );

      if (currentMessagesString !== storedMessagesString) {
        updateDevSession(activeSessionData.id, {
          ...activeSessionData,
          messages: messages, // Save the current messages from useChat
        });
      }
    }
    // Depend on the JSON string of messages to ensure the effect runs when content changes
  }, [JSON.stringify(messages), activeSessionData, updateDevSession]);

  // ダミーのセッションデータ
  const initialSessionData: ChatSession = {
    id,
    title: `Dev Chat ${id}`,
    createdAt: new Date(),
    messages: [],
  };

  const handleUpdate = (_id: string, _session: ChatSession) => {
    if (_id === id) {
      setMessages(_session.messages || []);
    }
  };

  // Effect to load session data when ID changes or sessions finish loading
  useEffect(() => {
    if (!id || sessionsLoading) return;

    const loadSession = async () => {
      let session = getDevSession(id);
      if (session) {
        const messagesToLoad = session.messages || [];
        setMessages(messagesToLoad);
      }
    };

    loadSession();
  }, [id, getDevSession, createDevSession, setMessages, sessionsLoading]);

  // Get auth token when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (auth && auth.currentUser) {
      auth.currentUser.getIdToken().then(setAuthToken);
    } else if (user) {
      user.getIdToken().then(setAuthToken);
    } else {
      setAuthToken(null);
    }
  }, [user, auth, authLoading]);

  // メッセージアノテーション処理
  const handleAnnotation = (annotation: any) => {
    if (annotation?.webcontainerAction) {
      setLastWebContainerAction(annotation.webcontainerAction);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Add custom spinner style */}
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />

      {/* 左ペイン: シンプル化したAIチャット表示 */}
      <div className="w-1/2 border-r border-border overflow-hidden mt-4 flex flex-col">
        <HeaderArea
          model={model}
          reasoningEffort={reasoningEffort}
          handleReasoningEffortChange={setReasoningEffort}
          generating={status === "submitted"}
          stop={stop}
          handleModelChange={setModel}
          currentSession={undefined}
          user={user!!}
          messages={messages}
          chatId={""}
        />
        <div className="h-full overflow-auto p-4">
          {/* チャット機能を復活 */}
          <DevChat
            sessionId={id}
            onAnnotation={handleAnnotation}
            authToken={authToken}
            auth={auth}
            updateSession={handleUpdate}
            messages={messages}
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            status={status}
            reload={reload}
            stop={stop}
            error={error}
            handleSubmit={handleSubmit}
            append={append}
            model={model}
            reasoningEffort={reasoningEffort}
            handleModelChange={setModel}
            handleReasoningEffortChange={setReasoningEffort}
            startUpload={startUpload}
            isUploading={isUploading}
          />
        </div>
      </div>

      {/* 右ペイン: WebContainer関連 */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        {/* WebContainerUI コンポーネント */}
        <div className="flex-1 overflow-hidden">
          <WebContainerUI
            chatId={id}
            iframeUrl={iframeUrl || undefined}
            onServerReady={handleServerReady}
            onError={handleWebContainerError}
            logs={terminalLogs}
            key={`webcontainer-${refreshTrigger}`}
          />
        </div>

        {/* Visual indicator when waiting for input */}
        {isWaitingForInput && (
          <div className="absolute bottom-12 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            Waiting for input...
          </div>
        )}
      </div>
    </div>
  );
}
