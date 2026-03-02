import React, { useState } from 'react';

/**
 * LobbyScreen – Handles room creation, joining, and pre-game lobby.
 */
export default function LobbyScreen({
  connected,
  roomId,
  gameState,
  isHost,
  errorMsg,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onClearError,
}) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (name.trim()) onCreateRoom(name.trim());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (name.trim() && joinCode.trim()) onJoinRoom(joinCode.trim(), name.trim());
  };

  // If we're in a room, show the lobby waiting room
  if (roomId && gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="cyber-card max-w-lg w-full animate-fade-in">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-cyber-green neon-text-green mb-1">
              ⚔️ CODE WARS
            </h1>
            <p className="text-gray-400 text-sm">Waiting Room</p>
          </div>

          {/* Room Code */}
          <div className="bg-cyber-darker rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Room Code</p>
            <p className="text-3xl font-bold text-cyber-green neon-text-green tracking-[0.3em]">
              {roomId}
            </p>
            <p className="text-gray-500 text-xs mt-2">Share this code with other players</p>
          </div>

          {/* Player List */}
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
              Players ({gameState.players.length})
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-cyber-darker rounded px-3 py-2"
                >
                  <span className="text-white">
                    {p.isHost && <span className="text-cyber-yellow mr-2">👑</span>}
                    {p.name}
                  </span>
                  {p.disconnected && (
                    <span className="text-xs text-cyber-red">disconnected</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Min-player warning */}
          {gameState.players.length < 6 && (
            <p className="text-center text-cyber-yellow text-xs mb-4">
              ⚠️ Need at least 6 players to start ({6 - gameState.players.length} more)
            </p>
          )}

          {/* Advanced mode toggle */}
          {isHost && (
            <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm text-gray-300">
              <input
                type="checkbox"
                checked={advancedMode}
                onChange={(e) => setAdvancedMode(e.target.checked)}
                className="accent-cyber-green"
              />
              Advanced Mode (System Stability mechanic)
            </label>
          )}

          {/* Start button (host only) */}
          {isHost && (
            <button
              onClick={() => onStartGame(advancedMode)}
              disabled={gameState.players.length < 6}
              className="cyber-btn-green w-full text-center"
            >
              🚀 Start Game
            </button>
          )}

          {!isHost && (
            <p className="text-center text-gray-500 text-sm">
              Waiting for host to start the game…
            </p>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="mt-4 bg-cyber-red/10 border border-cyber-red/30 rounded p-3 text-cyber-red text-sm">
              {errorMsg}
              <button onClick={onClearError} className="ml-2 underline text-xs">dismiss</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not in a room yet → create / join form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="cyber-card max-w-md w-full animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyber-green neon-text-green mb-2">
            ⚔️ CODE WARS
          </h1>
          <p className="text-gray-400 text-sm">Hackers vs Developers</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-cyber-green' : 'bg-cyber-red'}`} />
            <span className="text-xs text-gray-500">
              {connected ? 'Connected' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your handle…"
            maxLength={20}
            className="cyber-input w-full"
          />
        </div>

        {/* Create Room */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !connected}
          className="cyber-btn-green w-full mb-4"
        >
          Create New Room
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-cyber-border" />
          <span className="text-xs text-gray-500 uppercase">or join</span>
          <div className="flex-1 h-px bg-cyber-border" />
        </div>

        {/* Join Room */}
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={6}
            className="cyber-input flex-1 uppercase tracking-wider text-center"
          />
          <button
            type="submit"
            disabled={!name.trim() || !joinCode.trim() || !connected}
            className="cyber-btn-blue"
          >
            Join
          </button>
        </form>

        {/* Error */}
        {errorMsg && (
          <div className="mt-4 bg-cyber-red/10 border border-cyber-red/30 rounded p-3 text-cyber-red text-sm">
            {errorMsg}
            <button onClick={onClearError} className="ml-2 underline text-xs">dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}
