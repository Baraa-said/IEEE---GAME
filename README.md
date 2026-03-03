# ⚔️ Code Wars – Hackers vs Developers

A multiplayer web game inspired by Mafia/Werewolf, redesigned around a **software development / cybersecurity** theme.

Built with **React + Tailwind CSS** (frontend) and **Node.js + Express + Socket.io** (backend).

---

## 🎮 Roles

| Role | Icon | Ability |
|------|------|---------|
| **Developer** | 👨‍💻 | No special night ability. Vote wisely! |
| **Hacker** | 🕷️ | Conspire at night to inject a critical bug. |
| **Security Lead** | 🔍 | Investigate one player each night. |
| **Admin** | 🛠️ | Protect (debug) one player each night. |

## 🏆 Win Conditions

- **Developers** win if all Hackers are eliminated.
- **Hackers** win if their numbers equal or exceed non-Hackers.
- *(Advanced Mode)* Hackers also win if System Stability reaches 0.

## 🔄 Game Flow

Each round (Sprint) consists of:

1. **☀️ Day – Standup Meeting**: Open discussion (60s).
2. **🗳️ Voting**: Vote to suspend a player. Two consecutive highest votes → elimination.
3. **🛡️ Defense** *(if tied)*: Accused players defend.
4. **🌙 Night**: Role actions execute (Hacker attack, investigation, protection).

## 📦 Project Structure

```
IEEE---GAME/
├── server/                 # Node.js backend
│   ├── package.json
│   └── src/
│       ├── index.js        # Express + Socket.io entry point
│       ├── game/
│       │   ├── Player.js       # Player class
│       │   ├── Room.js         # Room + GameState + Phase controller
│       │   ├── RoomManager.js  # Room store (singleton)
│       │   ├── RoleEngine.js   # Role assignment + night resolution
│       │   └── VoteTracker.js  # Voting with streak logic
│       ├── sockets/
│       │   └── handlers.js     # All socket event handlers
│       └── shared/
│           ├── events.js       # Socket event name constants
│           ├── phases.js       # Phase constants
│           └── roles.js        # Role constants
│
├── client/                 # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Root component + state management
│       ├── socket.js           # Socket.io client singleton
│       ├── shared/
│       │   └── constants.js    # Shared event/phase/role constants
│       └── components/
│           ├── LobbyScreen.jsx     # Room create/join + waiting room
│           ├── GameScreen.jsx      # Main game layout
│           ├── GameOverScreen.jsx  # Final results screen
│           ├── RoleRevealModal.jsx # Role assignment modal
│           ├── PhaseIndicator.jsx  # Current phase header
│           ├── PlayerList.jsx      # Alive/dead player list
│           ├── ChatPanel.jsx       # Public + hacker private chat
│           ├── VotingPanel.jsx     # Day voting UI
│           └── NightPanel.jsx      # Night action selection
│
└── README.md
```

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** 18+ and **npm**

### 1. Install & Start Backend

```bash
cd server
npm install
npm run dev     # starts on http://localhost:4000
```

### 2. Install & Start Frontend

```bash
cd client
npm install
npm run dev     # starts on http://localhost:3000
```

### 3. Play!

1. Open **http://localhost:3000** in your browser.
2. Enter a name and click **Create New Room**.
3. Share the room code with other players (open more browser tabs to test).
4. When 6+ players have joined, the host clicks **Start Game**.

> **Tip**: For local testing, open 6 browser tabs and join the same room with different names.

---

## 🔌 Socket Event Design

### Lobby Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `create_room` | Client → Server | `{ playerName }` |
| `join_room` | Client → Server | `{ roomId, playerName }` |
| `room_created` | Server → Client | `{ roomId }` |
| `room_joined` | Server → Client | `{ roomId }` |
| `room_update` | Server → Room | Full public state |
| `start_game` | Client → Server | `{ advancedMode }` |

### Game Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `role_assigned` | Server → Client | `{ role, description }` |
| `hacker_reveal` | Server → Hackers | `{ hackers: [{id, name}] }` |
| `phase_change` | Server → Room | `{ phase, message, duration }` |
| `cast_vote` | Client → Server | `{ targetId }` |
| `vote_update` | Server → Room | `{ tally, votesCast, totalVoters }` |
| `vote_result` | Server → Room | `{ tally, eliminatedId, defenders }` |
| `night_action` | Client → Server | `{ targetId }` |
| `night_result` | Server → Room | `{ eliminated, protectionSaved, message }` |
| `investigation_result` | Server → Security Lead | `{ targetName, isHacker }` |
| `chat_message` | Bidirectional | `{ message }` / `{ senderName, message }` |
| `hacker_chat` | Bidirectional | Same as chat, Hackers only |
| `game_over` | Server → Room | `{ winner, reason, players }` |

---

## 🗳️ Voting Streak Logic

The two-consecutive-votes elimination mechanic works as follows:

1. Every alive player votes for someone.
2. After tallying, the player(s) with the highest votes get their `voteStreak` incremented.
3. All other players' streaks reset to 0.
4. If any player reaches `voteStreak >= 2` → **eliminated** (role revealed).
5. If no elimination, the highest-voted players must **defend** themselves, then a new vote round begins.

---

## 🔮 Future Scaling Suggestions

- **Database**: Add MongoDB/PostgreSQL for persistent game history, player stats, leaderboards.
- **Authentication**: Add JWT-based auth or OAuth (Google/GitHub login).
- **Deployment**: Dockerize both services. Deploy backend to Railway/Render, frontend to Vercel/Netlify.
- **Redis**: Use Redis pub/sub for horizontal Socket.io scaling across multiple server instances.
- **Spectator Mode**: Allow eliminated players or observers to watch without interacting.
- **Custom Roles**: Add more roles (e.g., Intern who swaps roles, Pentester who can kill once).
- **Voice Chat**: Integrate WebRTC for in-game voice during discussion phases.
- **Mobile**: Port to React Native or build a responsive PWA.
- **Matchmaking**: Add a queue system for random matchmaking without room codes.
- **Anti-cheat**: Move all game logic server-side (already done) and add rate limiting.

---

## 📝 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Node.js, Express 4, Socket.io 4 |
| State | In-memory (classes) |
| Fonts | Fira Code (monospace) |
| Theme | Dark cyberpunk with neon accents |

---

**Built for IEEE Game Development Workshop** 🎓
to run the code :
cloudflared tunnel --url http://localhost:4000 2>/tmp/cf-tunnel.log & sleep 8 && grep -oE 'https://[a-z0-9\-]+\.trycloudflare\.com' /tmp/cf-tunnel.log | head -1
to kill anythin 
lsof -ti:4000 | xargs kill -9 2>/dev/null; sleep 1; cd /Users/mac/Documents/IEEE---GAME/server && node src/index.js &

to verify the srver 
curl -s http://localhost:4000/api/health
