import { UseChatHelpers } from "@ai-sdk/react";
import { memo } from "react";
import Message from "./message";

interface MessagesProps {
  messages: UseChatHelpers["messages"];
}

const Messages = memo<MessagesProps>(({ messages }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
});

Messages.displayName = "Messages";

export default Messages;
