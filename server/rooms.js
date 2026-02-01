/**
 * Room Management
 * Tracks which users are in which rooms
 */

export class RoomManager {
  constructor() {
    // roomId -> Set<socketId>
    this.rooms = new Map();
    // socketId -> roomId
    this.socketToRoom = new Map();
  }

  /**
   * Add a socket to a room
   */
  joinRoom(socketId, roomId) {
    // Leave previous room if any
    this.leaveRoom(socketId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(socketId);
    this.socketToRoom.set(socketId, roomId);
  }

  /**
   * Remove a socket from its room
   */
  leaveRoom(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.delete(socketId);
        if (room.size === 0) {
          this.rooms.delete(roomId);
        }
      }
      this.socketToRoom.delete(socketId);
    }
  }

  /**
   * Get all socket IDs in a room
   */
  getRoomSockets(roomId) {
    return Array.from(this.rooms.get(roomId) || []);
  }

  /**
   * Get the room ID for a socket
   */
  getSocketRoom(socketId) {
    return this.socketToRoom.get(socketId);
  }
}
