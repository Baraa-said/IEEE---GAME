/**
 * index.js – Code Wars server entry point.
 *
 * Sets up Express + Socket.io, serves the built React frontend,
 * and supports public tunneling so friends can join via a link.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const registerHandlers = require('./sockets/handlers');
const roomManager = require('./game/RoomManager');
const adminDashboard = require('./admin/dashboard');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve the built React frontend ──
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Health-check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Code Wars – Hackers vs Developers' });
});

// Admin dashboard — JSON API
app.get('/api/admin/rooms', (_req, res) => {
  res.json(adminDashboard.getRoomsData(roomManager));
});

// Admin dashboard — HTML page
app.get('/admin', (_req, res) => {
  res.send(adminDashboard.renderPage(roomManager));
});

// SPA fallback – serve index.html for any non-API, non-admin route
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',          // allow all origins (tunnel URLs, local, etc.)
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  registerHandlers(io, socket);
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n⚔️  Code Wars server running on http://localhost:${PORT}`);
  console.log(`   Local network: http://${getLocalIP()}:${PORT}\n`);

  // ── Auto-start Cloudflare Tunnel (free, no password gate) ──
  try {
    const { exec } = require('child_process');
    const tunnel = exec(`cloudflared tunnel --url http://localhost:${PORT} 2>&1`);
    tunnel.stderr.on('data', (data) => {
      const match = data.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        console.log(`🌐 PUBLIC URL (share with friends!): ${match[0]}\n`);
      }
    });
    tunnel.on('error', () => {
      console.log('💡 Install cloudflared for a public link: brew install cloudflared\n');
    });
  } catch (_) {
    console.log('💡 Install cloudflared for a public link: brew install cloudflared\n');
  }
});

/** Get the machine's local network IP */
function getLocalIP() {
  const { networkInterfaces } = require('os');
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}
