"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import type { WebContainer as WebContainerAPI } from "@webcontainer/api";

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
    webContainerProcess,
    onInput,
  }: {
    logs: TerminalLogEntry[];
    showTerminal: boolean;
    terminalRef: React.RefObject<HTMLDivElement | null>;
    webContainerProcess: WebContainerAPI | null;
    onInput?: (data: string) => void;
  }) => {
    const xtermRef = useRef<Terminal | null>(null);
    const [terminal, setTerminal] = useState<Terminal | null>(null);
    const fitAddon = useRef<any | null>(null);
    const [isTerminalInitialized, setIsTerminalInitialized] = useState(false);

    // Initialize XTerm.js
    useEffect(() => {
      const initTerminal = async () => {
        if (!showTerminal || !terminalRef.current) return;

        // Clean up any existing terminal
        if (xtermRef.current) {
          xtermRef.current.dispose();
        }

        const { FitAddon } = await import("@xterm/addon-fit");

        const fitAddon = new FitAddon();

        // Create terminal instance
        const terminal = new Terminal({
          convertEol: true,
          fontSize: 12,
          theme: {
            background: "#000000",
            foreground: "#f8f8f8",
          },
          cursorBlink: true,
        });

        terminal.loadAddon(fitAddon);

        // Open terminal in the container
        terminal.open(terminalRef.current);

        fitAddon.fit();

        // Store references
        xtermRef.current = terminal;
        setTerminal(terminal);
      };
      initTerminal();
    }, [showTerminal, terminalRef, onInput, webContainerProcess]);

    // Auto-scroll terminal viewport to the bottom when logs change or terminal becomes visible
    useEffect(() => {
      // Check if the terminal instance exists and is currently shown
      if (terminal && showTerminal) {
        // Use setTimeout to ensure scrolling happens after potential DOM updates
        // or rendering related to logs/visibility change.
        // This allows xterm.js to process any pending writes before scrolling.
        fitAddon.current?.fit();
        xtermRef.current?.scrollToBottom();
      }
    }, [logs, showTerminal, terminal]); // Dependencies: logs array, visibility state, and terminal instance

    useEffect(() => {
      const initTerminal = async () => {
        if (isTerminalInitialized) return;
        if (!webContainerProcess || !terminal) {
          return;
        }

        const shellProcess = await webContainerProcess?.spawn("sh");
        shellProcess?.output.pipeTo(
          new WritableStream({
            write(chunk) {
              terminal.write(chunk);
            },
          }),
        );

        const input = shellProcess?.input.getWriter();
        terminal.onData((data) => {
          input?.write(data);
        });

        setIsTerminalInitialized(true);
      };
      initTerminal();
    }, [webContainerProcess, terminal]);
    // Handle log entries
    useEffect(() => {
      if (!xtermRef.current || !showTerminal || logs.length === 0) return;

      // Get the last log entry
      const lastLog = logs[logs.length - 1];

      // Check if lastLog exists
      if (!lastLog) return;

      // Process and display the log
      if (lastLog.html) {
        // For HTML logs, strip HTML and write plain text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = lastLog.text;
        xtermRef.current.write(tempDiv.textContent || "");
        xtermRef.current.write("\r\n");
      } else {
        // For regular logs, write directly
        xtermRef.current.write(lastLog.text);

        // Add newline if the text doesn't end with one
        if (!lastLog.text.endsWith("\n") && !lastLog.text.endsWith("\r\n")) {
          xtermRef.current.write("\r\n");
        }
      }
    }, [logs, showTerminal]);

    if (!showTerminal) return null;

    return (
      <div
        ref={terminalRef}
        className="h-[calc(100%-28px)] overflow-hidden relative"
      />
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
  },
);
MemoizedTerminal.displayName = "MemoizedTerminal";
