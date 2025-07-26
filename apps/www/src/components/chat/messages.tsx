import { UseChatHelpers } from "@ai-sdk/react";
import { memo } from "react";
import Message from "./message";

interface MessagesProps {
  messages: UseChatHelpers["messages"];
  conversationId?: string;
}

const Messages = memo<MessagesProps>(({ messages, conversationId }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          conversationId={conversationId}
        />
      ))}
    </div>
  );
});

Messages.displayName = "Messages";

export default Messages;
