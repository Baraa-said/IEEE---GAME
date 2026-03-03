import React, { useState } from 'react';
import { getAvatarForPlayer } from '../utils/avatars';
import MenuBackground from './MenuBackground';

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
  onFillBots,
  onRequestRole,
  onClearError,
}) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [chosenRole, setChosenRole] = useState(null);

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
        <div className="cyber-card max-w-lg w-full animate-slide-up">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-in">
            <img src="/logo.svg" alt="IEEE Code Wars" className="h-16 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Waiting Room</p>
          </div>

          {/* Room Code */}
          <div className="bg-cyber-darker rounded-lg p-4 mb-6 text-center animate-bounce-in">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Room Code</p>
            <p className="text-3xl font-bold text-cyber-green neon-text-green tracking-[0.3em] animate-glow-pulse">
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
              {gameState.players.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between bg-cyber-darker rounded px-3 py-2 animate-slide-right`}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                >
                  <span className="flex items-center text-white gap-2">
                    <img src={getAvatarForPlayer(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-black/40" />
                    {p.isHost && <span className="text-cyber-yellow" title="Host">👑</span>}
                    {p.isBot && <span className="text-blue-400 text-xs bg-blue-900/30 border border-blue-700/30 rounded px-1">BOT</span>}
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
          {gameState.players.length < (gameState.minPlayers || 6) && (
            <p className="text-center text-cyber-yellow text-xs mb-4">
              ⚠️ Need at least {gameState.minPlayers || 6} players to start ({(gameState.minPlayers || 6) - gameState.players.length} more)
            </p>
          )}

          {/* Fill with bots — host only, only when under minimum */}
          {isHost && (
            <div className="mb-4 p-3 rounded-lg border border-blue-700/30 bg-blue-900/10 space-y-3">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
                🤖 Test Mode
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onFillBots()}
                  className="text-xs px-3 py-1.5 rounded bg-blue-700/60 hover:bg-blue-600/80 text-white transition-colors flex-1"
                >
                  Fill to 6 with Bots
                </button>
                <button
                  onClick={() => onFillBots(8 - gameState.players.length)}
                  disabled={gameState.players.length >= 8}
                  className="text-xs px-3 py-1.5 rounded bg-blue-700/60 hover:bg-blue-600/80 text-white transition-colors flex-1 disabled:opacity-40"
                >
                  Fill to 8 with Bots
                </button>
              </div>

              {/* Role picker */}
              <div>
                <p className="text-blue-300/70 text-[11px] uppercase tracking-wider mb-2">Choose Your Role (optional)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: 'Developer', icon: '👨‍💻', color: 'blue' },
                    { role: 'Hacker',    icon: '🕷️',       color: 'red' },
                    { role: 'Admin',     icon: '🛠️',       color: 'green' },
                    { role: 'Security Lead', icon: '🔍', color: 'yellow' },
                  ].map(({ role, icon, color }) => {
                    const isSelected = chosenRole === role;
                    const styles = {
                      blue:   { sel: 'border-blue-400 bg-blue-800/50 text-blue-200',   def: 'border-blue-700/40 bg-blue-900/20 text-blue-400 hover:border-blue-500/60' },
                      red:    { sel: 'border-red-400 bg-red-800/50 text-red-200',       def: 'border-red-700/40 bg-red-900/20 text-red-400 hover:border-red-500/60' },
                      green:  { sel: 'border-green-400 bg-green-800/50 text-green-200', def: 'border-green-700/40 bg-green-900/20 text-green-400 hover:border-green-500/60' },
                      yellow: { sel: 'border-yellow-400 bg-yellow-800/50 text-yellow-200', def: 'border-yellow-700/40 bg-yellow-900/20 text-yellow-400 hover:border-yellow-500/60' },
                    };
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          const next = isSelected ? null : role;
                          setChosenRole(next);
                          if (next) onRequestRole(next);
                          else onRequestRole('Developer'); // reset to random by picking Developer
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected ? styles[color].sel : styles[color].def
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{role}</span>
                        {isSelected && <span className="ml-auto text-[10px] opacity-70">✓ picked</span>}
                      </button>
                    );
                  })}
                </div>
                {chosenRole && (
                  <p className="text-green-400/70 text-[10px] mt-1.5">✅ You'll be assigned <strong>{chosenRole}</strong> when the game starts.</p>
                )}
              </div>
            </div>
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
              disabled={gameState.players.length < (gameState.minPlayers || 6)}
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#050a10]">
      {/* Animated background */}
      <MenuBackground
        musicEnabled={musicEnabled}
        onMusicToggle={() => setMusicEnabled(m => !m)}
      />

      {/* Card sits above background */}
      <div className="relative z-10 cyber-card max-w-md w-full animate-fade-in backdrop-blur-sm bg-cyber-dark/80">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="IEEE Code Wars" className="h-20 mx-auto mb-4" />
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
