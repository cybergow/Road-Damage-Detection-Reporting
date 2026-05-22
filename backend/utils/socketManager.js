const { Server } = require('socket.io');

/** @type {Server|null} */
let io = null;

/** Map of userId -> Set<socketId> */
const connectedUsers = new Map();

/** Set of admin socket IDs */
const adminSockets = new Set();

/**
 * Initialize Socket.IO on the given HTTP server.
 * @param {import('http').Server} server - HTTP server instance
 * @returns {Server} Configured Socket.IO server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client registers with their userId and role
    socket.on('register', ({ userId, role }) => {
      if (!userId) return;

      // Track user's sockets
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socket.id);

      // Join a room named after the userId for targeted messaging
      socket.join(`user:${userId}`);

      // Track admin sockets separately
      if (role === 'admin') {
        adminSockets.add(socket.id);
        socket.join('admins');
      }

      console.log(`👤 User registered: ${userId} (role: ${role}) – socket: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Clean up connected users map
      for (const [userId, sockets] of connectedUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedUsers.delete(userId);
          }
          break;
        }
      }

      // Clean up admin sockets
      adminSockets.delete(socket.id);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

/**
 * Get the Socket.IO server instance.
 * @returns {Server} The Socket.IO server
 * @throws {Error} If Socket.IO has not been initialized
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  }
  return io;
};

/**
 * Emit an event to a specific user (all their connected sockets).
 * @param {string} userId - Target user's ID
 * @param {string} event - Event name
 * @param {*} data - Event payload
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit an event to all connected admin users.
 * @param {string} event - Event name
 * @param {*} data - Event payload
 */
const emitToAdmins = (event, data) => {
  if (!io) return;
  io.to('admins').emit(event, data);
};

/**
 * Emit an event to all connected clients.
 * @param {string} event - Event name
 * @param {*} data - Event payload
 */
const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  emitToAll,
};
