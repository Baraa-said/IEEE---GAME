import React, { useState, useRef, useEffect } from 'react';

/**
 * ChatPanel – Public day chat + private hacker night chat.
 */
export default function ChatPanel({
  messages,
  hackerMessages,
  onSendChat,
  onSendHackerChat,
  isNight,
  isHacker,
  amAlive,
  myId,
}) {
  const [input, setInput] = useState('');
  const [showHackerChat, setShowHackerChat] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll on new messages
  const activeMessages = showHackerChat ? hackerMessages : messages;
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (showHackerChat) {
      onSendHackerChat(input.trim());
    } else {
      onSendChat(input.trim());
    }
    setInput('');
  };

  // Can this player chat right now?
  const canChat = amAlive && (!isNight || (isNight && isHacker));

  return (
    <div className="cyber-card flex flex-col h-full">
      {/* Tab header */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowHackerChat(false)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            !showHackerChat
              ? 'bg-cyber-green/20 text-cyber-green'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          💬 Public Chat
        </button>
        {isHacker && (
          <button
            onClick={() => setShowHackerChat(true)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showHackerChat
                ? 'bg-cyber-red/20 text-cyber-red'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            🕷️ Hacker Channel
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 mb-2 min-h-0 max-h-60"
      >
        {activeMessages.length === 0 && (
          <p className="text-gray-600 text-xs text-center py-4">No messages yet…</p>
        )}
        {activeMessages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs px-2 py-1 rounded ${
              msg.isSystem
                ? 'bg-cyber-darker text-gray-400 italic'
                : msg.senderId === myId
                ? 'bg-cyber-green/10 text-gray-300'
                : 'text-gray-300'
            }`}
          >
            {!msg.isSystem && (
              <span className={`font-semibold mr-1 ${
                msg.senderId === myId ? 'text-cyber-green' : 'text-cyber-blue'
              }`}>
                {msg.senderName}:
              </span>
            )}
            {msg.message}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            !canChat
              ? (isNight ? 'Chat disabled during night…' : 'You are eliminated…')
              : showHackerChat
              ? 'Message fellow hackers…'
              : 'Type a message…'
          }
          disabled={!canChat}
          className="cyber-input flex-1 text-xs"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!canChat || !input.trim()}
          className={`cyber-btn text-xs ${showHackerChat ? 'cyber-btn-red' : 'cyber-btn-green'}`}
        >
          Send
        </button>
      </form>
    </div>
  );
}
