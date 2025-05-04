import { FC, memo, useEffect, useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Loader,
  Loader2,
  XCircle,
  Terminal,
  User,
  Play,
  Check,
  X,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { EasyTip } from "@/components/easytip";
import { Pre } from "@/components/markdown";
import { UIMessage } from "ai";
import React from "react";
import { marked } from "marked";
import { Link as MarkdownLink } from "@/components/markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  modelDescriptions,
  modelDescriptionType,
} from "@/lib/modelDescriptions";
import { ModelSelector } from "./ModelSelector";
import { cn } from "@workspace/ui/lib/utils";
import { ClockIcon, Loader2Icon, CheckIcon, XIcon } from "lucide-react";
import AnsiToHtml from "ansi-to-html";

// Step status type definition
type StepStatus = "pending" | "completed" | "error";

// Step status update event interface
interface StepStatusEventDetail {
  stepId: string;
  status: "waiting" | "running" | "completed" | "failed";
  output?: string;
}

interface DevMessageLogProps {
  message: UIMessage;
  onRegenerate?: (model: string) => void;
  isExecuting?: boolean;
  allowExecution: boolean;
  /** メッセージ内の step 配列を親に渡す */
  onExecuteSteps: (steps: any[]) => void;
}

export const MemoMarkdown = memo(
  ({ content }: { content: string }) => {
    return (
      <div className="text-sm md:text-base prose dark:prose-invert w-full">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ a: MarkdownLink }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MemoMarkdown.displayName = "MemoMarkdown";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  // marked.lexerを使用してマークダウンをトークンに分割
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    // 軽量化のためマークダウンをより効率的にブロックに分割
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    // マーキングのために遅延レンダリングを使用
    const [visibleBlocks, setVisibleBlocks] = useState(
      Math.min(5, blocks.length)
    );

    // コンテンツが長い場合、スクロールするとより多くのブロックを表示
    useEffect(() => {
      if (blocks.length <= 5) return;

      const handleScroll = () => {
        setVisibleBlocks((prevVisible) =>
          Math.min(prevVisible + 5, blocks.length)
        );
      };

      // スクロールイベントリスナーの設定
      window.addEventListener("scroll", handleScroll, { passive: true });

      // クリーンアップ
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, [blocks.length]);

    // コードブロックレンダリングを最適化
    return (
      <>
        {blocks.map((block, index) => (
          <MemoMarkdown content={block} key={`${id}-block_${index}`} />
        ))}
      </>
    );
  }
);
MemoizedMarkdown.displayName = "MemoizedMarkdown";

interface MessageState {
  model: string;
  generationTime?: number;
  webcontainerActions?: any[];
}

interface messageAnnotation {
  model?: string;
  title?: string;
  generationTime?: number;
  webcontainerAction?: {
    action: string;
    steps?: any[];
    command?: string;
    path?: string;
    [key: string]: any;
  };
}

// コマンド実行結果を表示するコンポーネント
const CommandExecution = memo(({ action }: { action: any }) => {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations();

  if (!action) return null;

  const getActionIcon = () => {
    if (action.action === "run") {
      return <Terminal size={16} className="mr-2 text-primary" />;
    }
    return <Terminal size={16} className="mr-2 text-primary" />;
  };

  const getActionTitle = () => {
    if (action.action === "run") {
      return `$ ${action.command}`;
    } else if (action.action === "write") {
      return t("devMessageLog.writeAction", { path: action.path });
    } else if (action.action === "read") {
      return t("devMessageLog.readAction", { path: action.path });
    } else if (action.action === "list") {
      return t("devMessageLog.listAction", { path: action.path || "/" });
    }
    return t("devMessageLog.genericAction", { action: action.action });
  };

  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden">
      <div
        className="flex items-center bg-muted/30 p-2 cursor-pointer hover:bg-muted"
        onClick={() => setExpanded(!expanded)}
      >
        {getActionIcon()}
        <span className="font-mono text-sm">{getActionTitle()}</span>
        <div className="ml-auto">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="p-2 bg-background border-t border-border">
          <div className="text-sm text-muted-foreground">
            {t("devMessageLog.actionLabel")}:{" "}
            <span className="font-semibold">{action.action}</span>
            {action.command && (
              <div>
                {t("devMessageLog.commandLabel")}:{" "}
                <span className="font-mono">{action.command}</span>
              </div>
            )}
            {action.path && (
              <div>
                {t("devMessageLog.pathLabel")}:{" "}
                <span className="font-mono">{action.path}</span>
              </div>
            )}
            {action.dependsOn && (
              <div>
                {t("devMessageLog.dependsOnLabel")}:{" "}
                <span className="font-mono">{action.dependsOn}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
CommandExecution.displayName = "CommandExecution";

// ステップ実行計画を表示するコンポーネント
const StepsExecution = memo(
  ({ steps: initialSteps }: { steps: any[] }) => {
    const [expanded, setExpanded] = useState(true); // デフォルトで開いた状態にする
    const [isExecuting, setIsExecuting] = useState(false);
    const [steps, setSteps] = useState<any[]>(initialSteps);
    const t = useTranslations();
    const ansiConverter = new AnsiToHtml()

    // 親コンポーネントからのsteps更新時の同期
    useEffect(() => {
      // 実行中でない場合のみ初期値を設定
      if (!isExecuting) {
        // 初回表示または新しいデータが来た場合に初期化
        const newStepIds = new Set(initialSteps.map(step => step.id));
        const currentStepIds = new Set(steps.map(step => step.id));
        
        // IDセットが同じでない場合に更新
        const shouldUpdate = initialSteps.length !== steps.length || 
          ![...newStepIds].every(id => currentStepIds.has(id));
        
        if (shouldUpdate) {
          console.log("StepsExecution: Updating steps from props");
          
          // 既存のステップのIDとステータスをマップ
          const existingStatuses = steps.reduce((acc, step) => {
            if (step.id && (step.status === "completed" || step.status === "failed")) {
              acc[step.id] = step.status;
            }
            return acc;
          }, {} as Record<string, string>);
          
          // 新しいステップリストを作成し、完了したステップのステータスを保持
          const updatedSteps = initialSteps.map(step => {
            const existingStatus = step.id && existingStatuses[step.id];
            return {
              ...step,
              status: existingStatus || step.status || "waiting"
            };
          });
          
          setSteps(updatedSteps);
        }
      }
    }, [initialSteps, isExecuting]);

    // デバッグ用にステップの状態変化をログ出力
    useEffect(() => {
      console.log("StepsExecution: Steps updated", 
        steps.map(s => ({ id: s.id, status: s.status }))
      );
      
      // 実行中かどうかを判定
      const executing = steps.some((step) => step.status === "running");
      console.log("StepsExecution: Execution status", { executing, stepsCount: steps.length });
      
      // 実行状態が変わった場合のみ更新（全てのステップが完了/失敗した場合も実行中フラグは更新）
      setIsExecuting(executing);
    }, [steps]);

    // 実行ボタンクリック時のハンドラー（メモ化して不要な再生成を防止）
    const handleExecuteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // 既に実行中の場合は何もしない
        if (isExecuting) {
          console.log("Already executing, ignoring click");
          return;
        }
        
        console.log(
          "DevMessageLog: Execute button clicked, initializing steps"
        );

        // すべてのステップのステータスを初期化
        const initializedSteps = steps.map((step, index) => ({
          ...step,
          id: step.id || `step-${index+1}`, // IDがない場合は生成（1から始まる）
          title: step.title || `Step ${index+1}`, // タイトルがない場合は生成
          status: index === 0 ? "running" : "waiting", // 最初のステップは実行中、他は待機中
          output: ""
        }));

        // ステップのステータスを更新
        setSteps(initializedSteps);
        
        // 実行中状態に設定
        setIsExecuting(true);
        console.log("DevMessageLog: Set executing state to true");
        
        // カスタムイベントを発生させて実行を開始
        const event = new CustomEvent("executeSteps", { 
          detail: { 
            steps: initializedSteps 
          } 
        });
        window.dispatchEvent(event);
        console.log("DevMessageLog: Dispatched executeSteps event");
        
        // 実行ボタンクリック時にステップリストを展開
        setExpanded(true);
      },
      [steps, isExecuting]
    );

    // ステップのステータス更新イベントリスナー
    useEffect(() => {
      const handleStepStatusUpdate = (event: CustomEvent<StepStatusEventDetail>) => {
        const { stepId, status, output } = event.detail;
        if (!stepId) return;
        
        console.log(`StepsExecution: Received status update for step ${stepId}: ${status}`);
        
        setSteps(currentSteps => {
          // IDで該当するステップを探す
          const stepIndex = currentSteps.findIndex(step => step.id === stepId);
          if (stepIndex === -1) {
            console.warn(`StepsExecution: Could not find step with ID ${stepId}`);
            return currentSteps;
          }
          
          // ステップの状態を更新した新しい配列を作成
          const updatedSteps = [...currentSteps];
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            status,
            ...(output !== undefined ? { output } : {})
          };
          
          // 次のステップを自動実行
          if ((status === "completed" || status === "failed") && stepIndex < updatedSteps.length - 1) {
            const nextStep = updatedSteps[stepIndex + 1];
            if (nextStep.status === "waiting" && status === "completed") {
              updatedSteps[stepIndex + 1] = {
                ...nextStep,
                status: "running"
              };
              console.log(`StepsExecution: Automatically advancing to next step ${nextStep.id}`);
            }
          }
          
          // すべてのステップが完了または失敗したかチェック
          const allDone = updatedSteps.every(step => 
            step.status === "completed" || step.status === "failed"
          );
          
          if (allDone) {
            console.log("StepsExecution: All steps have completed or failed");
          }
          
          return updatedSteps;
        });
      };
      
      // イベントリスナーの登録
      window.addEventListener("stepStatusUpdate", handleStepStatusUpdate as EventListener);
      
      // クリーンアップ
      return () => {
        window.removeEventListener("stepStatusUpdate", handleStepStatusUpdate as EventListener);
      };
    }, []);

    // 展開/折りたたみの切り替え
    const toggleExpanded = useCallback(() => {
      setExpanded((prev) => !prev);
    }, []);

    if (!steps || !steps.length) return null;

    return (
      <div className="mt-2 border border-border rounded-md overflow-hidden">
        <div
          className="flex items-center bg-muted/30 p-2 cursor-pointer hover:bg-muted"
          onClick={toggleExpanded}
        >
          {isExecuting ? (
            <Loader2 size={16} className="mr-2 text-primary animate-spin" />
          ) : (
            steps.some(step => step.status === "failed") ? 
              <XCircle size={16} className="mr-2 text-destructive" /> :
              steps.every(step => step.status === "completed") ?
                <CheckCircle size={16} className="mr-2 text-success" /> :
                <Terminal size={16} className="mr-2 text-primary" />
          )}
          <span className="font-medium">
            {t("devMessageLog.executionPlan")}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {t("devMessageLog.stepsCount", { count: steps.length })}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 py-1"
              disabled={isExecuting}
              onClick={handleExecuteClick}
            >
              {isExecuting ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  {t("devMessageLog.executing")}
                </>
              ) : (
                <>
                  <Play size={14} className="mr-1" />
                  {t("devMessageLog.executeSequence")}
                </>
              )}
            </Button>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>

        {expanded && (
          <div className="p-2 bg-background border-t border-border">
            <ol className="list-none space-y-1">
              {steps.map((step, index) => {
                // ステップの状態に応じたアイコン
                let StepIcon = Circle;
                let iconClass = "text-muted-foreground";

                switch (step.status) {
                  case "running":
                    StepIcon = Loader2;
                    iconClass = "text-primary animate-spin";
                    break;
                  case "completed":
                    StepIcon = CheckCircle;
                    iconClass = "text-success";
                    break;
                  case "failed":
                    StepIcon = XCircle;
                    iconClass = "text-destructive";
                    break;
                  default:
                    StepIcon = Circle;
                    iconClass = "text-muted-foreground";
                }

                return (
                  <li key={step.id} className="flex items-start text-sm">
                    <StepIcon size={14} className={`mr-2 mt-1 ${iconClass}`} />
                    <div className="flex-1">
                      <span
                        className={`${step.status === "running" ? "font-bold" : "font-medium"}`}
                      >
                        {index + 1}. {step.title}
                        {step.status === "running" && (
                          <span className="ml-2 text-primary">
                            {" "}
                            {t("devMessageLog.statusRunning")}
                          </span>
                        )}
                        {step.status === "completed" && (
                          <span className="ml-2 text-success">
                            {" "}
                            {t("devMessageLog.statusCompleted")}
                          </span>
                        )}
                        {step.status === "failed" && (
                          <span className="ml-2 text-destructive">
                            {" "}
                            {t("devMessageLog.statusFailed")}
                          </span>
                        )}
                      </span>
                      {step.command && (
                        <pre className="mt-1 text-xs font-mono bg-muted p-1 rounded whitespace-pre-wrap overflow-x-auto">
                          $ {step.command}
                        </pre>
                      )}

                      {/* 出力が大きい場合は折りたたむ */}
                      {step.output && step.output.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground">
                            {t("devMessageLog.toggleOutput")}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div
                              className="mt-1 text-xs font-mono bg-muted/50 p-1 rounded whitespace-pre-wrap max-h-40 overflow-y-auto"
                              // dangerously render ANSI-colored HTML
                              dangerouslySetInnerHTML={{
                                __html: ansiConverter.toHtml(step.output),
                              }}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-2 text-xs text-muted-foreground">
              {t("devMessageLog.executionNote")}
            </div>
          </div>
        )}
      </div>
    );
  },
  // メモ化の条件を強化して必要最小限の再レンダリングだけを行う
  (prevProps, nextProps) => {
    // ステップの数が異なる場合は再レンダリング
    if (prevProps.steps.length !== nextProps.steps.length) {
      return false;
    }

    // ステップのIDが異なる場合は再レンダリング
    if (
      JSON.stringify(prevProps.steps.map((s) => s.id)) !==
      JSON.stringify(nextProps.steps.map((s) => s.id))
    ) {
      return false;
    }

    // ステップのステータスが異なる場合は再レンダリング
    if (haveStepStatusesChanged(prevProps.steps, nextProps.steps)) {
      return false;
    }

    // それ以外の場合は再レンダリング不要
    return true;
  }
);
StepsExecution.displayName = "StepsExecution";

// Helper function to detect step statuses changed
function haveStepStatusesChanged(prevSteps: any[], nextSteps: any[]): boolean {
  if (prevSteps.length !== nextSteps.length) return true;

  for (let i = 0; i < prevSteps.length; i++) {
    if (prevSteps[i].status !== nextSteps[i].status) {
      return true;
    }
  }

  return false;
}

// メッセージのコントロール部分（コピーボタンと生成時間）を別コンポーネントとして抽出
const MessageControls = memo(
  ({
    messageContent,
    onRegenerate,
    model,
    modelDescriptions,
    generationTime,
  }: {
    messageContent: string;
    onRegenerate?: (model: string) => void;
    model: string;
    modelDescriptions: modelDescriptionType;
    generationTime?: number;
  }) => {
    const t = useTranslations();

    const handleCopy = () => {
      navigator.clipboard.writeText(messageContent);
      toast.success(t("messageLog.copied"));
    };

    const handleModelChange = (selectedModel: string) => {
      if (onRegenerate) {
        onRegenerate(selectedModel);
      }
    };

    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;

      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}${t("messageLog.second")}`;

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) {
        return `${minutes}${t("messageLog.minute")} ${remainingSeconds}${t(
          "messageLog.second"
        )}`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}${t("messageLog.hour")} ${remainingMinutes}${t(
        "messageLog.minute"
      )} ${remainingSeconds}${t("messageLog.second")}`;
    };

    return (
      <div className="flex items-center justify-between rounded mt-3 bg-secondary">
        <div className="flex items-center">
          <div className="p-1 text-gray-400 hover:text-foreground">
            <EasyTip content={t("messageLog.copy")}>
              <Button
                className="p-0 mx-1 rounded-full"
                variant={"ghost"}
                onClick={handleCopy}
              >
                <Copy size="16" />
              </Button>
            </EasyTip>
          </div>
          {generationTime && (
            <div className="flex items-center p-2 text-sm cursor-default text-muted-foreground">
              <Clock size={16} className="mr-1" />
              <span>
                {t("messageLog.generationTime")} {formatTime(generationTime)}
              </span>
            </div>
          )}
          {onRegenerate && (
            <div className="flex items-center">
              <div className="p-1 text-gray-400 hover:text-foreground">
                <EasyTip content={t("messageLog.regenerate")}>
                  <ModelSelector
                    modelDescriptions={modelDescriptions}
                    model={model}
                    handleModelChange={handleModelChange}
                    refreshIcon={true}
                  />
                </EasyTip>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messageContent === nextProps.messageContent &&
      prevProps.model === nextProps.model &&
      prevProps.modelDescriptions === nextProps.modelDescriptions &&
      prevProps.generationTime === nextProps.generationTime
    );
  }
);
MessageControls.displayName = "MessageControls";

export const DevMessageLog: FC<DevMessageLogProps> = memo(
  ({ message, onRegenerate, isExecuting, allowExecution, onExecuteSteps }) => {
    // 初期状態を一度だけセットアップ
    const [model, setModel] = useState<string>(
      "openai/gpt-4.1-mini-2025-04-14"
    );
    const [generationTime, setGenerationTime] = useState<number | undefined>(
      undefined
    );
    const [webcontainerActions, setWebcontainerActions] = useState<any[]>([]);
    const [steps, setSteps] = useState<any[]>([]);

    const t = useTranslations();

    // annotationsKeyの計算
    // const annotationsKey = useMemo(() => {
    //   return message.annotations ? message.annotations.length : 0;
    // }, [message.annotations]);

    // メッセージIDまたはアノテーションが変更された場合のみ再評価
    const annotationsKey = useMemo(
      () => JSON.stringify(message.annotations || []),
      [message.annotations]
    );

    // 型アサーションを追加してアノテーション処理を修正
    useEffect(() => {
      const annotations = message.annotations;
      if (!annotations || annotations.length === 0) return;

      // コンポーネントのアンマウント時にキャンセルできるようにする
      let isMounted = true;

      // 非同期処理を1回のみ実行し、処理中に他の再レンダリングの影響を受けないようにする
      const processAnnotations = async () => {
        console.log("Processing message annotations:", message.id, annotations);

        // モデル情報とタイトル情報の処理
        const newWebcontainerActions: any[] = [];
        let newSteps: any[] | null = null;
        let newModel = model;
        let newGenerationTime = generationTime;

        for (const annotation of annotations) {
          // 型チェックを強化
          if (typeof annotation === "object" && annotation !== null) {
            const typedAnnotation = annotation as messageAnnotation;

            // モデル情報
            if (typedAnnotation.model) {
              newModel = typedAnnotation.model;
            }

            // 生成時間
            if (typedAnnotation.generationTime !== undefined) {
              newGenerationTime = typedAnnotation.generationTime;
            }

            // WebContainerアクション
            if (typedAnnotation.webcontainerAction) {
              const action = typedAnnotation.webcontainerAction;

              // stepsアクション
              if (
                action.action === "steps" &&
                action.steps &&
                Array.isArray(action.steps)
              ) {
                newSteps = action.steps;
              }
              // その他のアクション
              else {
                newWebcontainerActions.push(action);
              }
            }
          }
        }

        // コンポーネントがまだマウントされていることを確認してから状態を更新
        if (!isMounted) return;

        // バッチ更新を使用して状態更新を一度にまとめることで再レンダリングを最小化
        if (newModel !== model) {
          setModel(newModel);
        }

        if (newGenerationTime !== generationTime) {
          setGenerationTime(newGenerationTime);
        }

        if (newWebcontainerActions.length > 0) {
          setWebcontainerActions(newWebcontainerActions);
        }

        if (newSteps) {
          setSteps(newSteps);
        }
      };

      // 非同期処理を開始
      processAnnotations();

      // クリーンアップ関数
      return () => {
        isMounted = false;
      };
    }, [message.id, annotationsKey, model, generationTime]);

    // メモ化されたレンダリング要素
    const messageIcon = useMemo(() => {
      return message.role === "assistant" ? (
        <div className="w-6 h-6 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground">
          <Terminal size={16} />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
          <User size={16} />
        </div>
      );
    }, [message.role]);

    // メッセージのコンテンツ部分
    const messageContent = useMemo(() => {
      return message.content || "";
    }, [message.content]);

    // メッセージスタイル
    const messageStyle = useMemo(() => {
      return message.role === "user"
        ? "bg-muted/50 border border-border"
        : "bg-background border border-border";
    }, [message.role]);

    return (
      <div
        className={`w-full message-log rounded-lg relative p-3 ${messageStyle}`}
      >
        <div className="flex items-start mb-2">
          <div className="mr-2 mt-1">{messageIcon}</div>
          <div className="flex-1">
            <MemoizedMarkdown content={messageContent} id={message.id} />

            {/* ステップとアクションの表示 */}
            {(steps.length > 0 || webcontainerActions.length > 0) && (
              <div className="mt-2 bg-primary/10 p-2 rounded-md">
                <span className="text-sm font-medium">
                  {t("devMessageLog.executionPlan")}
                </span>
                {webcontainerActions.length > 0 && (
                  <>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("devMessageLog.webContainerActions", {
                        count: webcontainerActions.length,
                      })}
                    </div>
                    {webcontainerActions.map((action, index) => (
                      <CommandExecution key={`cmd-${index}`} action={action} />
                    ))}
                  </>
                )}

                {steps && steps.length > 0 && (
                  <>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("devMessageLog.commandSteps", { count: steps.length })}
                    </div>
                    <StepsExecution steps={steps} />
                  </>
                )}
              </div>
            )}

            {/* メッセージコントロール */}
            {message.role === "assistant" && (
              <MessageControls
                messageContent={messageContent}
                onRegenerate={onRegenerate}
                model={model}
                modelDescriptions={modelDescriptions}
                generationTime={generationTime}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // メモ化条件を明示的に定義し、不要な再レンダリングを防止
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.role === nextProps.message.role &&
      ((!prevProps.message.annotations && !nextProps.message.annotations) ||
        JSON.stringify(prevProps.message.annotations) ===
          JSON.stringify(nextProps.message.annotations)) &&
      prevProps.isExecuting === nextProps.isExecuting &&
      prevProps.allowExecution === nextProps.allowExecution
    );
  }
);
DevMessageLog.displayName = "DevMessageLog";

export default DevMessageLog;
