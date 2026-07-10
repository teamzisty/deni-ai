import {
  StreamdownCode,
  StreamdownInlineCode,
  StreamdownParagraph,
} from "@/components/chat/streamdown-components";

export const streamdownOverrideComponents = {
  code: StreamdownCode,
  inlineCode: StreamdownInlineCode,
  p: StreamdownParagraph,
};
