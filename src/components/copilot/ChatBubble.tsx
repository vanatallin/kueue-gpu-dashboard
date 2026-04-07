interface ChatBubbleProps {
  role: 'user' | 'ai';
  message: string;
}

export function ChatBubble({ role, message }: ChatBubbleProps) {
  return (
    <div className={`max-w-[85%] px-3 py-2.5 rounded-lg text-[13px] leading-[18px] ${
      role === 'user'
        ? 'bg-border text-text-primary self-end ml-auto'
        : 'bg-surface-2 text-text-secondary self-start'
    }`}>
      {message}
    </div>
  );
}
