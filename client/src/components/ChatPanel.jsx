import React, { useState, useRef, useEffect } from 'react';
import { getAvatarForPlayer } from '../utils/avatars';
import { MessageCircle, Bug } from 'lucide-react';

/**
 * ChatPanel – Public day chat + private hacker night chat.
 */
export default function ChatPanel({
  messages,
  hackerMessages,
  onSendChat,
  onSendHackerChat,
  isNight,
  isSunrise,
  isHacker,
  amAlive,
  myId,
}) {
  const [input, setInput] = useState('');
  const [showHackerChat, setShowHackerChat] = useState(false);
  const scrollRef = useRef(null);

  // Auto-switch to hacker channel during night for hackers
  useEffect(() => {
    if (isNight && isHacker) setShowHackerChat(true);
    if (!isNight) setShowHackerChat(false);
  }, [isNight, isHacker]);

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
  const canChat = amAlive && (showHackerChat ? (isHacker && isNight) : (!isNight && !isSunrise));

  // Determine placeholder text
  const getPlaceholder = () => {
    if (canChat) {
      return showHackerChat ? 'Message fellow hackers\u2026' : 'Type a message\u2026';
    }
    if (!amAlive) return 'You are eliminated\u2026';
    if (showHackerChat && !isNight) return 'Hacker channel active at night only\u2026';
    if (isNight) return 'Chat disabled during night\u2026';
    if (isSunrise) return 'Chat disabled during sunrise\u2026';
    return 'Chat unavailable…';
  };

  return (
<div className="cyber-card flex flex-col">      {/* Tab header */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowHackerChat(false)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            !showHackerChat
              ? 'bg-cyber-green/20 text-cyber-green'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <MessageCircle size={12} className="inline-block mr-0.5" /> Public Chat
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
            <Bug size={12} className="inline-block mr-0.5" /> Hacker Channel
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
className="flex-1 overflow-y-auto space-y-1 mb-2 min-h-0"      >
        {activeMessages.length === 0 && (
          <p className="text-gray-600 text-xs text-center py-4">No messages yet…</p>
        )}
        {activeMessages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs px-2 py-1 rounded flex gap-2 ${
              msg.isSystem
                ? 'bg-cyber-darker text-gray-400 italic items-center'
                : msg.senderId === myId
                ? 'bg-cyber-green/10 text-gray-300 items-start'
                : 'text-gray-300 items-start'
            }`}
          >
            {!msg.isSystem && (
              <img src={getAvatarForPlayer(msg.senderName)} alt={msg.senderName} className="w-5 h-5 rounded-full mt-0.5 bg-black/40 flex-shrink-0" />
            )}
            <div className="flex-1">
              {!msg.isSystem && (
                <span className={`font-semibold mr-1 ${
                  msg.senderId === myId ? 'text-cyber-green' : 'text-cyber-blue'
                }`}>
                  {msg.senderName}:
                </span>
              )}
              <span className="break-words align-middle">{msg.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
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
