# IEEE Code Wars — Hackers vs Developers

A real-time multiplayer social deduction game inspired by Mafia/Werewolf, set in a **cybersecurity / software development** universe. Players take on secret roles — developers trying to ship clean code, or hackers trying to sabotage the project from the inside.

Built with **React 18 + Tailwind CSS + Vite** (client) and **Node.js + Express + Socket.io** (server).

---

## Table of Contents

- [Game Overview](#game-overview)
- [Roles](#roles)
- [Game Phases](#game-phases)
- [Code System](#code-system)
- [Win Conditions](#win-conditions)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Admin Dashboard](#admin-dashboard)
- [Bot Support](#bot-support)

---

## Game Overview

IEEE Code Wars is a browser-based party game for **6+ players**. Each player is secretly assigned a role at the start. The **Developers** (town) must identify and vote out the **Hackers** (mafia) before they sabotage enough code to crash the project. The game alternates between Day phases (discussion & voting) and Night phases (secret actions).

Every player has a personal folder of C source code files. Hackers inject bugs into other players' code at night, while the Security Lead and Admin use their abilities to investigate and protect the team.

---

## Roles

| Role | Description |
|---|---|
| **Developer** | The core team. No special night ability — survive, discuss, and vote wisely to find the hackers. |
| **Hacker** | The saboteurs. Hackers know each other and coordinate at night to inject bugs into a target's code. They have a private chat channel. |
| **Security Lead** | Can investigate one player per night by scanning their code files for suspicious function names. Identifies whether a player is a hacker. |
| **Admin** | Can scan a player's files for corruption. If corrupted files are found, the Admin must guess which specific file contains the bug — guess correctly and the player is protected; guess wrong and the player is eliminated. |

### Role Distribution

| Player Count | Hackers |
|---|---|
| 6–7 | 2 |
| 8–10 | 3 |
| 11+ | ⌊players × ⅓⌋ |

One **Security Lead** and one **Admin** are always assigned. Remaining non-hacker slots are filled with Developers.

---

## Game Phases

The game cycles through the following phases each sprint (round):

### 1. Night Phase (5 min)
- **Hackers** privately discuss and vote on a target to inject a bug into.
- **Security Lead** scans one player's code for hacker signatures.
- **Admin** scans one player's files for corruption, then attempts to guess the bugged file.
- **Developers** wait.

### 2. Sunrise Phase (3 min)
- Night results are revealed — who was targeted, whether protections succeeded.
- Admin and Security Lead can perform additional sunrise actions.

### 3. Day Discussion (60 sec)
- All living players discuss openly via chat.
- Share suspicions, evidence from investigations, and defense arguments.

### 4. Day Voting (45 sec)
- Players vote to suspend (eliminate) a suspect.
- The player with the most votes enters the defense phase.

### 5. Day Defense (20 sec)
- The accused player makes their case.
- After defense, a final decision is made on elimination.

### Skip Mechanic
- Any player can vote to skip a phase. If enough players agree, the phase ends early.

---

## Code System

Every player receives a personal folder of **2–3 randomly generated C source files** (e.g., `math_utils.c`, `string_ops.c`, `linked_list.c`).

- **Clean files** contain normal, student-level C functions.
- **Hacker files** contain suspicious function names (e.g., `exploit_buffer`, `rootkit_load`) that the Security Lead can detect during scans.
- **Corrupted files** are created when hackers inject bugs at night — subtle malicious lines inserted into a target's code.

### Night Actions on Code

| Role | Action |
|---|---|
| Hacker | Pick a target player → inject a bug into one of their files |
| Security Lead | Scan a player's file list → detect hacker-signature function names |
| Admin | Check a player for corruption → if found, guess which file has the bug |

---

## Win Conditions

| Team | Condition |
|---|---|
| **Developers Win** | All hackers have been eliminated through voting. |
| **Hackers Win** | Hackers equal or outnumber the remaining developers. |

---

## Tech Stack

### Client
- **React 18** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Utility-first styling with a custom cyberpunk theme
- **Socket.io Client** — Real-time WebSocket communication
- **Lucide React** — Icon library

### Server
- **Node.js + Express** — HTTP server & API
- **Socket.io** — Real-time bidirectional event-based communication
- **UUID** — Room code and identifier generation
- **Cloudflare Tunnel** — Auto-starts a free public tunnel on launch

---

## Project Structure

```
IEEE---GAME/
├── package.json                 # Root scripts (install:all, dev:server, etc.)
├── README.md
├── client/                      # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── App.jsx              # Main app — state management & socket events
│       ├── main.jsx             # React entry point
│       ├── index.css            # Tailwind imports & custom styles
│       ├── socket.js            # Socket.io client instance
│       ├── components/
│       │   ├── LobbyScreen.jsx      # Room creation, joining, pre-game lobby
│       │   ├── GameScreen.jsx       # Main game view — orchestrates all panels
│       │   ├── PlayerList.jsx       # Left sidebar — alive/dead players with roles
│       │   ├── PhaseIndicator.jsx   # Phase label + countdown timer
│       │   ├── ChatPanel.jsx        # Public chat + hacker private channel
│       │   ├── VotingPanel.jsx      # Day voting interface
│       │   ├── NightPanel.jsx       # Night action UI per role
│       │   ├── CodeBrowser.jsx      # Interactive C code file viewer
│       │   ├── GameOverScreen.jsx   # Win/loss screen with role reveals
│       │   ├── RoleRevealModal.jsx  # Role assignment animation
│       │   ├── MenuBackground.jsx   # Animated lobby background
│       │   ├── SkyBackground.jsx    # Day/night sky transitions
│       │   └── Toast.jsx            # Notification toasts
│       ├── shared/
│       │   └── constants.js     # Events, phases, roles (mirrors server)
│       └── utils/
│           ├── avatars.js       # Avatar generation per player/role
│           ├── sounds.js        # Sound effects
│           └── themes.js        # Role-based visual themes (colors, icons)
└── server/                      # Node.js backend
    ├── package.json
    └── src/
        ├── index.js             # Express + Socket.io entry point
        ├── admin/
        │   └── dashboard.js     # Admin dashboard (HTML + JSON API)
        ├── game/
        │   ├── Room.js          # Core game logic — phases, actions, win checks
        │   ├── RoomManager.js   # Room registry — create, join, find
        │   ├── Player.js        # Player model (id, name, role, alive)
        │   ├── RoleEngine.js    # Role assignment algorithm
        │   ├── CodeEngine.js    # C code generation & corruption system
        │   ├── VoteTracker.js   # Vote tallying & resolution
        │   └── BotManager.js    # AI bot behavior for testing
        ├── shared/
        │   ├── events.js        # Socket event name constants
        │   ├── gameConfig.js    # All tunable game parameters
        │   ├── phases.js        # Phase name constants
        │   └── roles.js         # Role name constants
        └── sockets/
            └── handlers.js      # Socket.io event handlers
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **cloudflared** (optional — for public tunnel access)

### Install Dependencies

```bash
# From the project root:
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
```

### Development Mode

Run the client dev server (hot reload) and the backend separately:

```bash
# Terminal 1 — Server
cd server
npm run dev          # uses nodemon for auto-restart

# Terminal 2 — Client
cd client
npm run dev          # Vite dev server on http://localhost:5173
```

### Production Build & Run

```bash
# Build the client
cd client
npm run build        # outputs to client/dist/

# Start the server (serves built client + API)
cd ../server
npm start            # http://localhost:4000
```

The server automatically:
1. Serves the React build from `client/dist/`
2. Attempts to start a **Cloudflare tunnel** for public access
3. Prints the public URL to the console

### Quick Start (Build + Run)

```bash
cd server
npm run build-and-run
```

---

## Configuration

All game parameters are centralized in `server/src/shared/gameConfig.js`:

| Parameter | Default | Description |
|---|---|---|
| `TIMERS.DISCUSSION` | 60s | Day discussion duration |
| `TIMERS.VOTING` | 45s | Voting phase duration |
| `TIMERS.DEFENSE` | 20s | Accused player's defense time |
| `TIMERS.NIGHT` | 5 min | Night phase duration |
| `TIMERS.SUNRISE` | 3 min | Sunrise phase duration |
| `DELAYS.ROLE_REVEAL` | 5s | Pause after role reveal |
| `DELAYS.NIGHT_TO_DAY` | 3s | Pause between night and day |
| `MIN_PLAYERS` | 6 | Minimum players to start |
| `INITIAL_STABILITY` | 3 | System stability (advanced mode) |
| `MAX_INVESTIGATIONS_PER_NIGHT` | 1 | Security Lead scans per night |
| `ADMIN_CHECKS_PER_NIGHT` | 1 | Admin corruption checks per night |
| `RECONNECT_WINDOW_MS` | 15 min | Time window for player reconnection |
| `CODE_FILES.MIN_CLEAN` | 2 | Min clean code files per player |
| `CODE_FILES.MAX_CLEAN` | 3 | Max clean code files per player |

---

## Admin Dashboard

Access the admin panel at `/admin` while the server is running. It provides:

- **Room overview** — active rooms, player counts, current phases
- **JSON API** — `GET /api/admin/rooms` for programmatic access
- **Phase skip** — `POST /api/admin/skip/:roomCode` to force-skip the current phase
- **Health check** — `GET /api/health`

---

## Bot Support

For testing, you can fill empty player slots with AI bots from the lobby. Bots:

- Have human-like action delays
- Perform role-appropriate night actions
- Vote during day phases
- Chat contextually

Use the **"Fill with Bots"** button in the lobby to add bots up to the minimum player count.

---

## License

This project was built for the **IEEE** community as an educational and entertainment tool.
