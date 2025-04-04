"use client";

import { memo } from "react";
import { modelDescriptions } from "@/lib/modelDescriptions";
import InputBox from "./InputBox";
import { ImagePreview } from "./ImagePreview";
import { ImageAddButton } from "./ImageAddButton";
import { SearchButton } from "./SearchButton";
import { AdvancedSearchButton } from "./AdvancedSearchButton";

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
  advancedSearch: boolean;
  modelDescriptions: Record<string, ModelDescription>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  advancedSearchToggle: () => void;
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
    advancedSearch,
    advancedSearchToggle,
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
    return (
      <div className="mt-4 border p-2 rounded-xl md:w-9/12 lg:w-7/12">
        <ImagePreview
          image={image}
          isUploading={isUploading}
          setImage={setImage}
        />
        <InputBox
          input={input}
          stop={stop}
          generating={generating}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          handleSendMessageKey={handleSendMessageKey}
          handleImagePaste={handleImagePaste}
        />
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <ImageAddButton
            modelSupportsVision={!!modelDescriptions[model]?.vision}
            onClick={() => fileInputRef.current?.click()}
          />
          <SearchButton
            disabled={modelDescriptions[model]?.toolDisabled || false}
            searchEnabled={searchEnabled}
            searchToggle={searchToggle}
          />
          <AdvancedSearchButton
            disabled={
              modelDescriptions[model]?.toolDisabled || !searchEnabled || false
            }
            advancedSearch={advancedSearch}
            advancedSearchToggle={advancedSearchToggle}
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
      prevProps.advancedSearch === nextProps.advancedSearch &&
      prevProps.isUploading === nextProps.isUploading &&
      prevProps.model === nextProps.model &&
      prevProps.generating === nextProps.generating &&
      JSON.stringify(prevProps.modelDescriptions) ===
        JSON.stringify(nextProps.modelDescriptions)
    );
  }
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
