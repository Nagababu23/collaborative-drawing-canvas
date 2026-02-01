import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { StateManager } from './state-manager.js';
import { RoomManager } from './rooms.js';

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
app.use(cors({
  origin: corsOrigin,
  credentials: false
}));

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: false
  }
});

const stateManager = new StateManager();
const roomManager = new RoomManager();

const DEFAULT_ROOM = 'main';

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  const userId = socket.id;
  socket.emit('user_id', userId);

  roomManager.joinRoom(socket.id, DEFAULT_ROOM);
  socket.join(DEFAULT_ROOM);

  const strokes = stateManager.getStrokes(DEFAULT_ROOM);
  socket.emit('stroke_history', strokes);

  socket.on('draw', (stroke) => {
    if (!stroke || typeof stroke !== 'object') return;
    if (!stroke.strokeId || !stroke.userId || !stroke.points || !Array.isArray(stroke.points)) {
      return;
    }

    stateManager.addStroke(DEFAULT_ROOM, stroke);
    io.to(DEFAULT_ROOM).emit('stroke_added', stroke);
  });

  socket.on('cursor_move', (data) => {
    socket.to(DEFAULT_ROOM).emit('cursor_move', {
      userId: socket.id,
      x: data.x,
      y: data.y,
      color: data.color,
      username: (data.username && String(data.username).trim()) || 'Guest'
    });
  });


  socket.on('undo', () => {
    const updatedStrokes = stateManager.undoLastStroke(DEFAULT_ROOM, userId);
    io.to(DEFAULT_ROOM).emit('stroke_history', updatedStrokes);
  });

  socket.on('redo', () => {
    const updatedStrokes = stateManager.redoLastStroke(DEFAULT_ROOM, userId);
    io.to(DEFAULT_ROOM).emit('stroke_history', updatedStrokes);
  });

  // Handle clear canvas
  socket.on('clear', () => {
    const clearedStrokes = stateManager.clearRoom(DEFAULT_ROOM);
    io.to(DEFAULT_ROOM).emit('stroke_history', clearedStrokes);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    roomManager.leaveRoom(socket.id);

    stateManager.clearRoom(DEFAULT_ROOM);
    const remaining = roomManager.getRoomSockets(DEFAULT_ROOM);
    if (remaining.length > 0) {
      io.to(DEFAULT_ROOM).emit('stroke_history', []);
    }

    socket.to(DEFAULT_ROOM).emit('cursor_leave', { userId: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
