import React, { useState } from 'react';
import { ROLES } from '../shared/constants';
import { getAvatarForPlayer } from '../utils/avatars';
import MenuBackground from './MenuBackground';
import { AlertTriangle, Bot, Code2, Bug, Wrench, Search, CheckCircle, Rocket, Crown } from 'lucide-react';

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
    if (name.trim()) {
      onCreateRoom(name.trim());
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (name.trim() && joinCode.trim()) {
      onJoinRoom(joinCode.trim(), name.trim());
    }
  };

  // Once we've successfully created/joined a room, if user selected a preferred role,
  // send the role request to the server (server requires being in a room to accept it).
  React.useEffect(() => {
    if (roomId && chosenRole) {
      onRequestRole?.(chosenRole);
      // clear chosenRole locally to avoid re-sending
      setChosenRole(null);
    }
  }, [roomId]);

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
                    {p.isHost && <span className="text-cyber-yellow" title="Host"><Crown size={14} /></span>}
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
              <AlertTriangle size={14} className="inline-block mr-1" /> Need at least {gameState.minPlayers || 6} players to start ({(gameState.minPlayers || 6) - gameState.players.length} more)
            </p>
          )}

          {/* Max-player warning */}
          {gameState.players.length >= (gameState.maxPlayers || 10) && (
            <p className="text-center text-cyber-red text-xs mb-4">
              <AlertTriangle size={14} className="inline-block mr-1" /> Room is full ({gameState.maxPlayers || 10}/{gameState.maxPlayers || 10})
            </p>
          )}

          {/* Start button (host only) */}
          {isHost && (
            <>
              <button
                onClick={() => onStartGame(advancedMode)}
                disabled={gameState.players.length < (gameState.minPlayers || 6)}
                className="cyber-btn-green w-full text-center"
              >
                <Rocket size={16} className="inline-block mr-1" /> Start Game
              </button>
            </>
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
<div
  className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
  style={{
    backgroundColor: "#0b1a22",
    backgroundImage: "url('/cs-logo.png')",
    backgroundRepeat: "repeat",
    backgroundSize: "120px",
    opacity: 1
  }}
>      {/* Animated background */}
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

        {/* Preferred Role – removed */}

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
