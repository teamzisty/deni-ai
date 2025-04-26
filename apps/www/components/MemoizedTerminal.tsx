import { memo } from "react";
import ansiToHTML from "ansi-to-html";

export interface TerminalLogEntry {
  text: string;
  className?: string;
  html?: boolean;
  isSpinner?: boolean;
}

export const MemoizedTerminal = memo(
  ({
    logs,
    showTerminal,
    terminalRef,
  }: {
    logs: TerminalLogEntry[]; 
    showTerminal: boolean;
    terminalRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    if (!showTerminal) return null;
    const ansiConverter = new ansiToHTML();
    
    return (
      <div
        ref={terminalRef}
        className="h-[calc(100%-28px)] overflow-auto p-2 text-white"
      >
        {logs.map((log, index) => {
          // Fix for spinner animation class
          const hasSpinner =
            log.text.includes("コマンドを実行中") ||
                             log.text.includes("npm install") || 
                             log.text.includes("実行中") ||
                             log.text.toLowerCase().includes("executing") ||
                             log.text.includes("Progress:");
          
          // Check if it's a progress update
          const isProgress = log.text.includes("Progress:");
          
          return (
            <div 
              key={index} 
              className={`${log.className || ""} ${isProgress ? "h-6 overflow-hidden" : ""}`}
            >
              {log.html ? (
                <p 
                  className="mb-1" 
                  dangerouslySetInnerHTML={{ 
                    __html:
                      hasSpinner && !log.text.includes("custom-spin")
                        ? `<span class="inline-block custom-spin mr-1">⟳</span> ${log.text}`
                        : log.text,
                  }} 
                />
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap mb-1">
                  {/* {hasSpinner && (
                    <span className="inline-block custom-spin mr-1">⟳</span>
                  )} */}
                  <span dangerouslySetInnerHTML={{ __html: ansiConverter.toHtml(log.text) }}></span>
                </pre>
              )}
            </div>
          );
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if terminalLogs length changes or if the last log is different
    if (prevProps.logs.length !== nextProps.logs.length) {
      return false; // Different length, need to re-render
    }
    
    // Compare the last log if logs exist
    if (prevProps.logs.length > 0 && nextProps.logs.length > 0) {
      const prevLastLog = prevProps.logs[prevProps.logs.length - 1];
      const nextLastLog = nextProps.logs[nextProps.logs.length - 1];
      
      // If the last log text or className changed, re-render
      if (
        prevLastLog?.text !== nextLastLog?.text ||
        prevLastLog?.className !== nextLastLog?.className
      ) {
        return false;
      }
    }
    
    // No significant changes, no need to re-render
    return true;
  }
);
MemoizedTerminal.displayName = "MemoizedTerminal";