"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";
import InputBox from "./InputBox";
import { ImagePreview } from "./ImagePreview";
import { ImageAddButton } from "./ImageAddButton";
import { SearchButton } from "./SearchButton";
import { DeepResearchButton } from "./DeepResearchButton";
import CanvasButton from "./CanvasButton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";

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
  canvasEnabled: boolean;
  className?: string;
  sendButtonRef?: React.RefObject<HTMLButtonElement | null>;
  modelDescriptions: Record<string, ModelDescription>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  deepResearchToggle: () => void;
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
    canvasEnabled,
    className,
    deepResearchToggle,
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
  }: ChatInputProps) => {
    const isMobile = useIsMobile();
    
    // Callback for ImageAddButton click
    const handleImageAddClick = useCallback(() => {
      fileInputRef.current?.click();
    }, []); // fileInputRef is stable

    return (
      <div
        className={cn(
          "mt-4 border rounded-xl w-full p-2",
          className
        )}
      >
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
        <div className={cn(
          "flex items-center",
          "gap-1 md:gap-2"
        )}>
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
            disabled={modelDescriptions[model]?.toolDisabled || false}
            canvasEnabled={canvasEnabled}
            canvasToggle={canvasToggle}
          />
          <SearchButton
            disabled={modelDescriptions[model]?.toolDisabled || false}
            searchEnabled={searchEnabled}
            searchToggle={searchToggle}
          />
          <DeepResearchButton
            disabled={
              modelDescriptions[model]?.toolDisabled || !searchEnabled || false
            }
            deepResearch={deepResearch}
            deepResearchToggle={deepResearchToggle}
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.input === nextProps.input &&
      prevProps.image === nextProps.image &&
      prevProps.searchEnabled === nextProps.searchEnabled &&
      prevProps.deepResearch === nextProps.deepResearch &&
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
