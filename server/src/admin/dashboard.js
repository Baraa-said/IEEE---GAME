/**
 * Admin Dashboard – Server-rendered HTML page showing full game state.
 * Accessible at /admin — auto-refreshes every 2 seconds.
 */

/**
 * Extract all rooms data as plain JSON.
 */
function getRoomsData(roomManager) {
  const rooms = [];
  for (const [code, room] of roomManager.rooms.entries()) {
    const players = [];
    for (const p of room.players.values()) {
      players.push({
        id: p.id.substring(0, 8) + '…',
        name: p.name,
        role: p.role || '—',
        alive: p.alive,
        isHost: p.isHost,
        voteStreak: p.voteStreak,
        currentVote: p.currentVote,
        nightTarget: p.nightTarget,
        disconnected: p.disconnected,
        protected: p.protected,
      });
    }

    rooms.push({
      code,
      phase: room.phase,
      sprint: room.sprint,
      systemStability: room.systemStability,
      advancedMode: room.advancedMode,
      playerCount: room.players.size,
      aliveCount: room.getAlivePlayers().length,
      hackerCount: room.getAliveHackers().length,
      nonHackerCount: room.getAliveNonHackers().length,
      voteRoundInSprint: room.voteRoundInSprint,
      nightActions: {
        hackerTarget: room.nightActions?.hackerTarget || null,
        adminTarget: room.nightActions?.adminTarget || null,
        securityTargets: room.nightActions?.securityTargets || [],
        hackerVotes: Object.fromEntries(room.hackerVotes || new Map()),
      },
      skipVotes: room.skipVotes?.size || 0,
      log: room.log || [],
      players,
    });
  }
  return { rooms, timestamp: new Date().toISOString() };
}

/**
 * Render a full server-side HTML page for the admin dashboard.
 */
function renderPage(roomManager) {
  const data = getRoomsData(roomManager);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IEEE Code Wars — Admin Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0e17;
      color: #c0c0c0;
      padding: 20px;
      min-height: 100vh;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      color: #00ff88;
      font-size: 1.5rem;
      text-shadow: 0 0 10px rgba(0,255,136,0.3);
    }
    .header .meta {
      font-size: 0.75rem;
      color: #666;
    }
    .refresh-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .refresh-bar button {
      background: #1a2332;
      color: #00ff88;
      border: 1px solid #00ff8844;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.8rem;
    }
    .refresh-bar button:hover { background: #00ff8822; }
    .auto-label {
      font-size: 0.75rem;
      color: #666;
    }
    .auto-label input { margin-right: 4px; }
    .no-rooms {
      text-align: center;
      padding: 60px 20px;
      color: #444;
      font-size: 1.1rem;
    }
    .room-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .room-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .room-code {
      font-size: 1.3rem;
      font-weight: bold;
      color: #00aaff;
      letter-spacing: 2px;
    }
    .phase-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .phase-lobby { background: #334155; color: #94a3b8; }
    .phase-night { background: #3b0764; color: #c084fc; }
    .phase-day_discussion { background: #854d0e; color: #fbbf24; }
    .phase-day_voting { background: #7f1d1d; color: #f87171; }
    .phase-day_defense { background: #1e3a5f; color: #60a5fa; }
    .phase-game_over { background: #065f46; color: #34d399; }
    .stats-row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .stat {
      font-size: 0.8rem;
    }
    .stat .label { color: #666; }
    .stat .value { color: #e2e8f0; font-weight: bold; }
    .stat .value.hacker { color: #f87171; }
    .stat .value.dev { color: #00ff88; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    th {
      text-align: left;
      padding: 8px 10px;
      background: #0f172a;
      color: #64748b;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #1e293b;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #1a2332;
      vertical-align: middle;
    }
    tr:hover td { background: #1a233266; }
    .role-hacker { color: #f87171; font-weight: bold; }
    .role-developer { color: #60a5fa; }
    .role-admin { color: #00ff88; font-weight: bold; }
    .role-security { color: #fbbf24; font-weight: bold; }
    .alive { color: #00ff88; }
    .dead { color: #ef4444; text-decoration: line-through; }
    .host-badge {
      background: #fbbf24;
      color: #000;
      font-size: 0.6rem;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 6px;
      font-weight: bold;
    }
    .disconnected { opacity: 0.4; }
    .night-section, .log-section {
      margin-top: 12px;
      padding: 12px;
      background: #0f172a;
      border-radius: 6px;
      border: 1px solid #1e293b;
    }
    .night-section h4, .log-section h4 {
      color: #c084fc;
      font-size: 0.75rem;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .log-section h4 { color: #f87171; }
    .night-item {
      font-size: 0.75rem;
      padding: 3px 0;
      color: #94a3b8;
    }
    .log-item {
      font-size: 0.75rem;
      padding: 3px 0;
      color: #94a3b8;
    }
    .skip-btn {
      background: #7f1d1d;
      color: #fca5a5;
      border: 1px solid #f8717144;
      padding: 5px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: bold;
    }
    .skip-btn:hover { background: #991b1b; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #333;
      font-size: 0.7rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚔️ IEEE CODE WARS — Admin Dashboard</h1>
    <div class="meta">
      Updated: <span id="timestamp">${data.timestamp}</span>
    </div>
  </div>

  <div class="refresh-bar">
    <button onclick="location.reload()">🔄 Refresh Now</button>
    <label class="auto-label">
      <input type="checkbox" id="autoRefresh" checked> Auto-refresh (2s)
    </label>
    <span class="auto-label">Active rooms: <strong>${data.rooms.length}</strong></span>
  </div>

  <div id="content">
    ${data.rooms.length === 0
      ? '<div class="no-rooms">No active rooms. Waiting for players to create a game…</div>'
      : data.rooms.map(room => renderRoomCard(room, roomManager)).join('')
    }
  </div>

  <div class="footer">
    IEEE Code Wars Admin Dashboard — For game monitoring only. Do not share this URL with players.
  </div>

  <script>
    let autoRefreshEnabled = true;
    const checkbox = document.getElementById('autoRefresh');
    checkbox.addEventListener('change', () => { autoRefreshEnabled = checkbox.checked; });

    async function refresh() {
      if (!autoRefreshEnabled) return;
      try {
        const res = await fetch('/api/admin/rooms');
        const data = await res.json();
        // Update timestamp
        document.getElementById('timestamp').textContent = data.timestamp;
        // Full page reload for simplicity (DOM diff would be complex)
        if (data.rooms.length === 0 && document.getElementById('content').innerHTML.includes('no-rooms')) return;
        location.reload();
      } catch (e) {
        // Ignore fetch errors
      }
    }

    setInterval(refresh, 2000);

    async function skipPhase(code) {
      if (!confirm('Force-skip current phase for room ' + code + '?')) return;
      try {
        const r = await fetch('/api/admin/skip/' + code, { method: 'POST' });
        const d = await r.json();
        if (d.ok) { alert('Phase skipped! New phase: ' + d.newPhase); location.reload(); }
        else alert('Error: ' + d.error);
      } catch(e) { alert('Request failed: ' + e.message); }
    }
  </script>
</body>
</html>`;
}

/**
 * Render a single room card.
 */
function renderRoomCard(room, roomManager) {
  const phaseClass = room.phase.replace(/ /g, '_').toLowerCase();

  // Look up player names for night targets
  const roomObj = roomManager.getRoom(room.code);
  const getPlayerName = (id) => {
    if (!id || !roomObj) return '—';
    const p = roomObj.getPlayer(id);
    return p ? p.name : id.substring(0, 8);
  };

  return `
    <div class="room-card">
      <div class="room-header">
        <div>
          <span class="room-code">${room.code}</span>
          <span class="phase-badge phase-${phaseClass}">${room.phase.replace(/_/g, ' ')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:0.8rem;color:#666">Sprint ${room.sprint} ${room.advancedMode ? '⚡ Advanced' : ''}</span>
          <button class="skip-btn" onclick="skipPhase('${room.code}')">&#9197; Skip Phase</button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat"><span class="label">Players:</span> <span class="value">${room.playerCount}</span></div>
        <div class="stat"><span class="label">Alive:</span> <span class="value dev">${room.aliveCount}</span></div>
        <div class="stat"><span class="label">Hackers alive:</span> <span class="value hacker">${room.hackerCount}</span></div>
        <div class="stat"><span class="label">Non-Hackers alive:</span> <span class="value dev">${room.nonHackerCount}</span></div>
        <div class="stat"><span class="label">Stability:</span> <span class="value">${room.systemStability}</span></div>
        <div class="stat"><span class="label">Vote Round:</span> <span class="value">${room.voteRoundInSprint}</span></div>
        <div class="stat"><span class="label">Skip Votes:</span> <span class="value">${room.skipVotes}/${room.aliveCount}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Role</th>
            <th>Status</th>
            <th>Vote Streak</th>
            <th>Night Target</th>
            <th>Socket ID</th>
          </tr>
        </thead>
        <tbody>
          ${room.players.map(p => {
            const roleClass = p.role === 'Hacker' ? 'role-hacker'
              : p.role === 'Admin' ? 'role-admin'
              : p.role === 'Security Lead' ? 'role-security'
              : 'role-developer';
            const statusClass = p.alive ? 'alive' : 'dead';
            const rowClass = p.disconnected ? 'disconnected' : '';
            const nightTargetName = p.nightTarget ? getPlayerName(p.nightTarget) : '—';

            return `<tr class="${rowClass}">
              <td>
                ${p.name}
                ${p.isHost ? '<span class="host-badge">HOST</span>' : ''}
                ${p.disconnected ? ' ⚠️' : ''}
              </td>
              <td class="${roleClass}">${p.role === 'Hacker' ? '🕷️ ' : p.role === 'Admin' ? '🛠️ ' : p.role === 'Security Lead' ? '🔍 ' : '👨‍💻 '}${p.role}</td>
              <td class="${statusClass}">${p.alive ? '✅ Alive' : '☠️ Dead'}</td>
              <td>${p.voteStreak}</td>
              <td>${nightTargetName}</td>
              <td style="color:#444;font-size:0.7rem">${p.id}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      ${room.phase === 'night' ? `
        <div class="night-section">
          <h4>🌙 Night Actions Status</h4>
          <div class="night-item">
            <strong>Hacker Target:</strong> ${room.nightActions.hackerTarget ? getPlayerName(room.nightActions.hackerTarget) : 'Not decided yet'}
          </div>
          <div class="night-item">
            <strong>Admin Protecting:</strong> ${room.nightActions.adminTarget ? getPlayerName(room.nightActions.adminTarget) : 'Not yet'}
          </div>
          <div class="night-item">
            <strong>Security Investigating:</strong> ${room.nightActions.securityTargets.length > 0
              ? room.nightActions.securityTargets.map(id => getPlayerName(id)).join(', ')
              : 'Not yet'}
          </div>
          <div class="night-item">
            <strong>Hacker Votes:</strong>
            ${Object.keys(room.nightActions.hackerVotes).length > 0
              ? Object.entries(room.nightActions.hackerVotes).map(([hId, tId]) =>
                  `${getPlayerName(hId)} → ${getPlayerName(tId)}`
                ).join(', ')
              : 'None'}
          </div>
        </div>
      ` : ''}

      ${room.log.length > 0 ? `
        <div class="log-section">
          <h4>☠️ Elimination Log</h4>
          ${room.log.map(entry => `
            <div class="log-item">
              Sprint ${entry.sprint} (${entry.phase}) — ${entry.role === 'Hacker' ? '🕷️' : '👨‍💻'} 
              <strong>${entry.eliminated}</strong> (${entry.role})
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

module.exports = { getRoomsData, renderPage };
