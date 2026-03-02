/**
 * Socket.io client singleton.
 * Auto-detects the server URL:
 *   - If VITE_SERVER_URL env var is set, use that.
 *   - Otherwise connect to the same origin (works when backend serves the frontend).
 *   - Falls back to localhost:4000 for local dev with separate servers.
 */
import { io } from 'socket.io-client';

const URL =
  import.meta.env.VITE_SERVER_URL ||
  (window.location.hostname === 'localhost' && window.location.port === '3000'
    ? 'http://localhost:4000'
    : window.location.origin);

const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

export default socket;
