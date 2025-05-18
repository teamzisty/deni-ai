"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";
import InputBox from "./InputBox";
import { ImagePreview } from "./ImagePreview";
import { ImageAddButton } from "./ImageAddButton";
import { SearchButton } from "./SearchButton";
import { DeepResearchButton, ResearchDepth } from "./DeepResearchButton";
import CanvasButton from "./CanvasButton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { Bot } from "@/types/bot";

type ModelDescription =
  (typeof modelDescriptions)[keyof typeof modelDescriptions];

interface ChatInputProps {
  input: string;
  image: string | null;
  model: string;
  isUploading: boolean;
  stop: () => void;
  generating: boolean;
  searchEnabled: boolean;
  deepResearch: boolean;
  researchDepth?: ResearchDepth;
  canvasEnabled: boolean;
  className?: string;
  bot?: Bot;
  sendButtonRef?: React.RefObject<HTMLButtonElement | null>;
  modelDescriptions: Record<string, ModelDescription>;
  devMode?: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  deepResearchToggle: () => void;
  onResearchDepthChange?: (depth: ResearchDepth) => void;
  canvasToggle: () => void;
  handleSendMessage: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleSendMessageKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleImagePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  searchToggle: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setImage: (image: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const ChatInput = memo(
  ({
    input,
    image,
    model,
    stop,
    generating,
    isUploading,
    searchEnabled,
    sendButtonRef,
    deepResearch,
    researchDepth,
    canvasEnabled,
    className,
    bot,
    deepResearchToggle,
    onResearchDepthChange,
    canvasToggle,
    searchToggle,
    modelDescriptions,
    handleInputChange,
    handleSendMessage,
    handleSendMessageKey,
    handleImagePaste,
    handleImageUpload,
    setImage,
    fileInputRef,
    devMode,
  }: ChatInputProps) => {
    const isMobile = useIsMobile();
    const isBot = !!bot;

    // Callback for ImageAddButton click
    const handleImageAddClick = useCallback(() => {
      fileInputRef.current?.click();
    }, []); // fileInputRef is stable

    return (
      <div className={cn("mt-4 border rounded-xl w-full p-2", className)}>
        <ImagePreview
          image={image}
          isUploading={isUploading}
          setImage={setImage}
        />
        <InputBox
          input={input}
          stop={stop}
          generating={generating}
          sendButtonRef={sendButtonRef}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          handleSendMessageKey={handleSendMessageKey}
          handleImagePaste={handleImagePaste}
        />
        <div className={cn("flex items-center", "gap-1 md:gap-2")}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <ImageAddButton
            modelSupportsVision={!!modelDescriptions[model]?.vision}
            onClick={handleImageAddClick}
          />
          <CanvasButton
            disabled={modelDescriptions[model]?.toolDisabled || isBot || false}
            canvasEnabled={canvasEnabled}
            devMode={devMode}
            canvasToggle={canvasToggle}
          />
          <SearchButton
            disabled={modelDescriptions[model]?.toolDisabled || isBot || false}
            searchEnabled={searchEnabled}
            searchToggle={searchToggle}
          />
          {researchDepth && onResearchDepthChange && (
            <DeepResearchButton
              disabled={
                modelDescriptions[model]?.toolDisabled ||
                isBot ||
                !searchEnabled ||
                false
              }
              devMode={devMode}
              deepResearch={deepResearch}
              researchDepth={researchDepth}
              deepResearchToggle={deepResearchToggle}
              onResearchDepthChange={onResearchDepthChange}
            />
          )}
        </div>
        {!isMobile && bot && <span className="text-muted-foreground text-xs">You are in the bot "{bot.name}". To leave, Create a new conversations.</span>}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.input === nextProps.input &&
      prevProps.image === nextProps.image &&
      prevProps.searchEnabled === nextProps.searchEnabled &&
      prevProps.deepResearch === nextProps.deepResearch &&
      prevProps.researchDepth === nextProps.researchDepth &&
      prevProps.isUploading === nextProps.isUploading &&
      prevProps.model === nextProps.model &&
      prevProps.canvasEnabled === nextProps.canvasEnabled &&
      prevProps.generating === nextProps.generating &&
      JSON.stringify(prevProps.modelDescriptions) ===
        JSON.stringify(nextProps.modelDescriptions)
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
