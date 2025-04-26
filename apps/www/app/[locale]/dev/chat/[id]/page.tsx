"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import DevChat from "@/components/DevChat";
import type { ChatSession } from "@/hooks/use-chat-sessions";
import { TerminalIcon } from "lucide-react";
import { MemoizedTerminal, TerminalLogEntry } from "@/components/MemoizedTerminal";
import HeaderArea from "@/components/HeaderArea";
import { useAuth } from "@/context/AuthContext";
import { reasoningEffortType } from "@/lib/modelDescriptions";
import { useDevSessions, DevSession } from "@/hooks/use-dev-sessions";
import { useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";

// Import WebContainerUI component
import { WebContainerUI, webContainerProcess, webContainerFS, getWebContainerInstance } from "@/components/WebContainer";

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
  const [lastWebContainerAction, setLastWebContainerAction] = useState<any>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [model, setModel] = useState<string>("openai/gpt-4.1-mini-2025-04-14");
  const [reasoningEffort, setReasoningEffort] = useState<reasoningEffortType>("medium");
  const terminalRef = useRef<HTMLDivElement>(null);
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([]);

  // WebContainerを手動でリフレッシュするための状態
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Function to add logs to the terminal output state
  const addTerminalLog = useCallback(
    (text: string, className?: string, html = false, isSpinner = false) => {
      // Check if this message is identical to the last one
      setTerminalLogs((prevLogs) => {
        // Get the last log entry
        const lastLog =
          prevLogs.length > 0 ? prevLogs[prevLogs.length - 1] : null;

        // If this is a duplicate of the last message, don't add it
        if (
          lastLog &&
          lastLog.text === text &&
          lastLog.className === className &&
          lastLog.html === html
        ) {
          console.log("Preventing duplicate terminal message:", text);
          return prevLogs; // Return unchanged logs
        }

        // Otherwise add the new log
        const newLogs = [...prevLogs, { text, className, html, isSpinner }];

        // Auto-scroll terminal
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
          }
        }, 10);

        return newLogs;
      });
    },
    [setTerminalLogs]
  );

  const {
    getSession: getDevSession,
    createSession: createDevSession,
    updateSession: updateDevSession,
    selectSession: selectDevSession,
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
  } = useChat({
    id: id,
    initialMessages: [],
    body: {
      model,
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Effect to load session data when ID changes or sessions finish loading
  useEffect(() => {
    if (!id || sessionsLoading) {
      console.log("DevChatPage: Waiting for ID or sessions to load...", {
        id,
        sessionsLoading,
      });
      return;
    }
    console.log(
      "DevChatPage: ID and sessions loaded, attempting to load session.",
      { id }
    );

    const loadSession = async () => {
      let session = getDevSession(id);
      console.log("DevChatPage: getDevSession result:", session);
      if (session) {
        console.log(`DevChatPage: Loading existing session: ${id}`, session);
        setActiveSessionData(session);
        const messagesToLoad = session.messages || [];
        console.log(
          "DevChatPage: Setting messages for existing session:",
          messagesToLoad
        );
        setMessages(messagesToLoad);
        selectDevSession(id);
      } else {
        console.log(
          `DevChatPage: No existing session found for ID: ${id}. Creating new one.`
        );
        session = createDevSession();
        console.log("DevChatPage: Created new session:", session);
        setActiveSessionData(session);
        console.log("DevChatPage: Setting empty messages for new session.");
        setMessages([]);
        selectDevSession(id);
      }
    };

    loadSession();
  }, [
    id,
    getDevSession,
    createDevSession,
    setMessages,
    selectDevSession,
    sessionsLoading,
  ]);

  // Get auth token when user changes
  useEffect(() => {
    if (authLoading) {
      console.log("DevChatPage: Auth Loading...");
      return;
    }
    if (auth && auth.currentUser) {
      console.log("DevChatPage: Authenticated with Firebase Auth");
      auth.currentUser.getIdToken().then(setAuthToken);
    } else if (user) {
      console.log("DevChatPage: Authenticated with NextAuth");
      user.getIdToken().then(setAuthToken);
    } else {
      console.log("DevChatPage: Not authenticated");
      setAuthToken(null);
    }
  }, [user, auth, authLoading]);

  // メッセージアノテーション処理
  const handleAnnotation = (annotation: any) => {
    if (annotation?.webcontainerAction) {
      console.log(
        "WebContainer action received:",
        annotation.webcontainerAction
      );
      setLastWebContainerAction(annotation.webcontainerAction);
    }
  };

  // WebContainerのログ表示関数をメモ化
  const handleLogMessage = useCallback((log: TerminalLogEntry) => {
    addTerminalLog(log.text, log.className, log.html, log.isSpinner);
  }, [addTerminalLog]);

  // WebContainerエラー処理関数をメモ化
  const handleWebContainerError = useCallback((message: string) => {
    addTerminalLog(message, "text-red-500");
  }, [addTerminalLog]);

  // WebContainerサーバー準備完了時の処理をメモ化
  const handleServerReady = useCallback((url: string) => {
    setIframeUrl(url);
  }, []);

  // WebContainerUI自体を更新するための状態
  const forceRerender = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // ファイル構造を更新する関数
  const updateFileStructure = useCallback(async () => {
    // WebContainerのグローバルインスタンスのrefreshAllFilesを使う
    // 直接refreshFileStructureを呼ぶ方法よりも確実
    try {
      const instance = getWebContainerInstance();
      if (instance) {
        addTerminalLog("Refreshing file structure...", "text-blue-400");
        await instance.fs.readdir("/", { withFileTypes: true });
        addTerminalLog("File structure refreshed", "text-green-400");
          } else {
        addTerminalLog("WebContainer instance is not available", "text-red-500");
      }
    } catch (error) {
      console.error("Error refreshing file structure:", error);
      addTerminalLog(`Error refreshing file structure: ${error}`, "text-red-500");
    }
    
    // UIを強制的に再レンダリング
    forceRerender();
  }, [addTerminalLog, forceRerender]);

  // executeStepsイベントハンドラー - WebContainerでステップを実行する関数
  const executeSteps = useCallback(async (steps: any[]) => {
    console.log("DevChatPage: executeSteps handler triggered", { 
      steps: steps.map(s => ({ id: s.id, title: s.title, status: s.status }))
    });
    
    if (!steps || !steps.length) {
      console.warn("DevChatPage: No steps to execute");
      return;
    }

    const instance = getWebContainerInstance();
        if (!instance) {
      addTerminalLog("WebContainer instance is not available", "text-red-500");
          return;
        }

    let lastStepStatus = true; // 最後のステップが成功したかどうか

    // ステップステータス更新関数
    const updateStepStatus = (stepId: string, status: "waiting" | "running" | "completed" | "failed", output?: string) => {
      const event = new CustomEvent("stepStatusUpdate", {
        detail: {
          stepId,
          status,
          output
        }
      });
      window.dispatchEvent(event);
      console.log(`DevChatPage: Step ${stepId} status updated to ${status}`);
    };

    // ステップを順番に実行
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // ステップIDが必ず存在することを確認
      const stepId = step.id || `step-${i+1}`;
      if (!step.id) {
        console.warn(`DevChatPage: Step at index ${i} has no ID, using generated ID: ${stepId}`);
        step.id = stepId;
      }
      
      // 現在のステップが既に失敗または実行中でない場合はステータスを更新
      if (step.status !== "failed" && step.status !== "running") {
        updateStepStatus(step.id, "running", "Starting execution...");
      }
      
      if (!lastStepStatus) {
        // 前のステップが失敗した場合は実行しない
        updateStepStatus(step.id, "failed", "Previous step failed, skipping this step");
        continue;
        }

        try {
        addTerminalLog(`Executing step ${i+1}/${steps.length}: ${step.title || 'Untitled step'}`, "text-blue-400");
        
        switch (step.action) {
          case "run":
            if (!step.command) {
              throw new Error("No command provided for run action");
            }
            
            addTerminalLog(`$ ${step.command}`, "text-green-400");
            
            // コマンドを実行（空白で分割）
            const cmdParts = step.command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part: string) => 
              part.startsWith('"') && part.endsWith('"') ? part.slice(1, -1) : part
            ) || [];
            
            if (cmdParts.length === 0) {
              throw new Error("Invalid command format");
            }
            
            // 開発サーバー起動コマンドの検出
            const isDevServerCommand = 
              (step.command.match(/p?npm( run)? dev/i) || 
               step.command.match(/p?npm( run)? start/i) ||
               step.command.match(/yarn( run)? dev/i) ||
               step.command.match(/yarn( run)? start/i) ||
               step.command.match(/node server/i) ||
               step.command.match(/vite dev/i) ||
               step.command.match(/vite serve/i) ||
               step.command.match(/next dev/i) ||
               step.command.match(/next start/i) ||
               step.command.match(/astro dev/i) ||
               step.command.match(/nuxt dev/i));
            
            if (isDevServerCommand) {
              addTerminalLog("Detected development server start command", "text-blue-400");
              addTerminalLog("Development server is starting in background...", "text-green-400");
              
              // 非同期でサーバーを起動（メイン処理はブロックせず）
              const startServerPromise = (async () => {
                try {
                  // 実際にサーバーを起動（出力キャプチャ用）
                  const serverProcess = await instance.spawn(cmdParts[0], cmdParts.slice(1));
                  
                  // 出力をキャプチャして表示（別ストリームで）
                  let serverStartDetected = false;
                  serverProcess.output.pipeTo(
                    new WritableStream({
                      write(data) {
                        // サーバー出力を特別な色で表示
                        addTerminalLog(data, "text-indigo-400");
                        
                        // サーバー起動検出のためのポート番号とURL情報を抽出
                        if (!serverStartDetected) {
                          // URLの検出パターン
                          const urlPattern = /(https?:\/\/[^:\s]+:)(\d+)/;
                          const portPattern = /localhost:(\d+)/;
                          
                          if (urlPattern.test(data) || portPattern.test(data)) {
                            serverStartDetected = true;
                            addTerminalLog("Server startup detected", "text-green-500");
                            
                            // WebContainerのserver-readyイベントはそのうち発火するはず
                            // ここでは特に何もしなくてよい
                          }
                        }
                      }
                    })
                  );
                  
                  // プロセスはバックグラウンドで継続実行
                  console.log("Development server started in background");
                } catch (err) {
                  // エラーは表示するが次のステップには進む
                  console.error("Error starting development server:", err);
                  addTerminalLog(`Warning: Development server may not have started correctly: ${err}`, "text-yellow-500");
                }
              })();
              
              // 開発サーバーを実行中として状態更新してすぐに次のステップへ
              updateStepStatus(step.id, "completed", `Development server started successfully. 
The server will continue running in the background.

You can view the application in the browser when server is ready.`);
              
              // 開発サーバーコマンドはスキップして成功したことにする
              addTerminalLog("Proceeding to next step automatically", "text-blue-400");
              continue;
            }
            
            const process = await instance.spawn(cmdParts[0], cmdParts.slice(1));
            
            // 標準出力と標準エラー出力のリダイレクト
            let output = '';
            process.output.pipeTo(
              new WritableStream({
                write(data) {
                  output += data;
                  addTerminalLog(data, "text-muted-foreground");
                }
              })
            );
            
            // プロセスの終了を待つ
            const exitCode = await process.exit;
            
            if (exitCode !== 0) {
              lastStepStatus = false;
              const errorMsg = `Command failed with exit code ${exitCode}`;
              addTerminalLog(errorMsg, "text-red-500");
              updateStepStatus(step.id, "failed", `${errorMsg}\n\nOutput:\n${output}`);
                } else {
              updateStepStatus(step.id, "completed", `Command completed with exit code ${exitCode}\n\nOutput:\n${output}`);
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
            const dirPath = step.path.substring(0, step.path.lastIndexOf("/"));
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
            addTerminalLog(`File written: ${step.path}`, "text-green-400");
            updateStepStatus(step.id, "completed", `File ${step.path} written successfully`);
            break;
            
          case "read":
            if (!step.path) {
              throw new Error("No path provided for read action");
            }
            
            try {
              const content = await instance.fs.readFile(step.path, "utf-8");
              addTerminalLog(`File read: ${step.path}`, "text-green-400");
              
              // 内容が長すぎる場合は省略
              const previewContent = content.length > 500 
                ? `${content.substring(0, 500)}... (truncated, total length: ${content.length} chars)`
                : content;
                
              updateStepStatus(step.id, "completed", `File ${step.path} read successfully.\n\nContent:\n${previewContent}`);
            } catch (error) {
              lastStepStatus = false;
              const errorMsg = `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
              addTerminalLog(errorMsg, "text-red-500");
              updateStepStatus(step.id, "failed", errorMsg);
            }
            break;
            
          default:
            throw new Error(`Unknown action: ${step.action}`);
        }
      } catch (error) {
        lastStepStatus = false;
        console.error(`Error executing step ${i}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        addTerminalLog(`Error executing step: ${errorMessage}`, "text-red-500");
        updateStepStatus(step.id, "failed", errorMessage);
      }
      
      // ファイル操作の後にファイル構造を更新
      if (step.action === "write" || step.action === "run") {
        await updateFileStructure();
      }
    }
    
    // 全てのステップが完了したらメッセージを表示
    if (lastStepStatus) {
      addTerminalLog("All steps completed successfully", "text-green-400");
    } else {
      addTerminalLog("Some steps failed - check the logs for details", "text-yellow-400");
    }
    
    // 最後にファイル構造を更新（ステップ実行中に変更があった場合のため）
    await updateFileStructure();
  }, [addTerminalLog, updateFileStructure]);
  
  // executeStepsイベントリスナーの設定
  useEffect(() => {
    const handleExecuteStepsEvent = (event: any) => {
      console.log("DevChatPage: executeSteps event received", event.detail);
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

  // WebContainerのサーバー起動を監視
  useEffect(() => {
    const instance = getWebContainerInstance();
    if (!instance) return;

    // server-readyイベントのリスナーを設定
    const handleServerReady = (port: number, url: string) => {
      console.log(`WebContainer server ready on port ${port}, URL: ${url}`);
      addTerminalLog(`Server ready on port ${port}`, "text-green-500");
      setIframeUrl(url);
      addTerminalLog("Preview updated with server URL", "text-blue-400");
    };

    // イベントリスナーを追加（WebContainerデフォルトのレガシーAPIを使用）
    instance.on('server-ready', handleServerReady);

    // クリーンアップ関数は必要なし（WebContainerでは自動管理される）
    return () => {
      // WebContainerAPIはoffメソッドを提供していない
    };
  }, [addTerminalLog]);

  // stepStatusイベントハンドラー - DevMessageLogコンポーネントと連携するためのイベント
  useEffect(() => {
    const handleStepStatusEvent = (event: CustomEvent<any>) => {
      const { stepId, status, output } = event.detail;
      console.log(`Step ${stepId} status changed to ${status}`, { output });
      
      // 完了または失敗時にはファイル構造を更新
      if (status === "completed" || status === "failed") {
        updateFileStructure();
      }
    };
    
    // イベントリスナーをCustomEventとして正しく型付け
    window.addEventListener("stepStatusUpdate", handleStepStatusEvent as EventListener);
    
    return () => {
      window.removeEventListener("stepStatusUpdate", handleStepStatusEvent as EventListener);
    };
  }, [updateFileStructure]);

  // ダミーのセッションデータ
  const initialSessionData: ChatSession = {
    id,
    title: `Dev Chat ${id}`,
    createdAt: new Date(),
    messages: [],
  };

  // セッション更新ハンドラ（Devではnoop）
  const handleUpdate = (_id: string, _session: ChatSession) => {
    console.log("Dev session update:", _id, _session);
  };

  // Handle model change
  const handleModelChange = (newModel: string) => {
    setModel(newModel);
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
          handleModelChange={handleModelChange}
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
            initialSessionData={initialSessionData}
            authToken={authToken}
            auth={auth}
            updateSession={handleUpdate}
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
            onLogMessage={handleLogMessage}
            key={`webcontainer-${refreshTrigger}`}
          />
        </div>

        {/* ターミナル */}
        <div
          className={`border-t border-border bg-black relative ${showTerminal ? "h-48" : "h-6"}`}
          style={{
            resize: showTerminal ? "vertical" : "none",
            overflow: "auto",
          }}
          id="terminal-container"
        >
          <div
            className="flex items-center px-2 py-1 bg-muted hover:bg-accent cursor-pointer border-b border-border"
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <TerminalIcon size={14} className="mr-2" />
            <span className="text-sm">Terminal</span>
          </div>

          <MemoizedTerminal
            logs={terminalLogs}
            showTerminal={showTerminal}
            terminalRef={terminalRef}
          />

          {showTerminal && (
            <div
              className="absolute top-0 left-0 w-full h-1 cursor-ns-resize hover:bg-primary/50"
              onMouseDown={(e) => {
                // Store a reference to the parent element
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
          )}
        </div>
      </div>
    </div>
  );
}


