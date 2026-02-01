import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { StateManager } from './state-manager.js';
import { RoomManager } from './rooms.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const stateManager = new StateManager();
const roomManager = new RoomManager();

// Default room ID
const DEFAULT_ROOM = 'main';

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Assign unique userId
  const userId = socket.id;
  socket.emit('user_id', userId);

  // Join default room
  roomManager.joinRoom(socket.id, DEFAULT_ROOM);
  socket.join(DEFAULT_ROOM);

  // Send full stroke history to new user
  const strokes = stateManager.getStrokes(DEFAULT_ROOM);
  socket.emit('stroke_history', strokes);

  // Handle drawing events
  socket.on('draw', (stroke) => {
    if (!stroke || typeof stroke !== 'object') return;
    if (!stroke.strokeId || !stroke.userId || !stroke.points || !Array.isArray(stroke.points)) {
      return;
    }

    stateManager.addStroke(DEFAULT_ROOM, stroke);
    io.to(DEFAULT_ROOM).emit('stroke_added', stroke);
  });

  // Handle cursor movement
  socket.on('cursor_move', (data) => {
    // Broadcast cursor position to other users (include username for display)
    socket.to(DEFAULT_ROOM).emit('cursor_move', {
      userId: socket.id,
      x: data.x,
      y: data.y,
      color: data.color,
      username: (data.username && String(data.username).trim()) || 'Guest'
    });
  });


  // Handle undo
  socket.on('undo', () => {
    const updatedStrokes = stateManager.undoLastStroke(DEFAULT_ROOM, userId);
    // Broadcast updated history to all users
    io.to(DEFAULT_ROOM).emit('stroke_history', updatedStrokes);
  });

  // Handle redo
  socket.on('redo', () => {
    const updatedStrokes = stateManager.redoLastStroke(DEFAULT_ROOM, userId);
    // Broadcast updated history to all users
    io.to(DEFAULT_ROOM).emit('stroke_history', updatedStrokes);
  });

  // Handle clear canvas
  socket.on('clear', () => {
    const clearedStrokes = stateManager.clearRoom(DEFAULT_ROOM);
    
    // Broadcast cleared state to all users
    io.to(DEFAULT_ROOM).emit('stroke_history', clearedStrokes);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    roomManager.leaveRoom(socket.id);

    // Clear room on every disconnect so refresh = clear board for everyone
    stateManager.clearRoom(DEFAULT_ROOM);
    const remaining = roomManager.getRoomSockets(DEFAULT_ROOM);
    if (remaining.length > 0) {
      io.to(DEFAULT_ROOM).emit('stroke_history', []);
    }

    // Notify others that this user's cursor is gone
    socket.to(DEFAULT_ROOM).emit('cursor_leave', { userId: socket.id });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
