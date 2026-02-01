export class StateManager {
  constructor() {
    this.rooms = new Map();
    this.redoStacks = new Map();
  }

  initRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, []);
    }
    if (!this.redoStacks.has(roomId)) {
      this.redoStacks.set(roomId, []);
    }
  }

  static MAX_STROKES = 500;

  addStroke(roomId, stroke) {
    this.initRoom(roomId);
    const strokes = this.rooms.get(roomId);
    strokes.push(stroke);
    this.redoStacks.set(roomId, []);
    while (strokes.length > StateManager.MAX_STROKES) {
      strokes.shift();
    }
    return strokes;
  }

  /**
   * Remove the last stroke by a specific user
   * Returns the updated strokes array
   */
  undoLastStroke(roomId, userId) {
    this.initRoom(roomId);
    const strokes = this.rooms.get(roomId);
    const redoStack = this.redoStacks.get(roomId);
    // Find the last stroke by this user (iterate backwards)
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId === userId) {
        const [removed] = strokes.splice(i, 1);
        if (removed) {
          redoStack.push(removed);
        }
        return strokes;
      }
    }
    // No stroke found to undo
    return strokes;
  }

  /**
   * Redo the last undone stroke for a user
   * Returns the updated strokes array
   */
  redoLastStroke(roomId, userId) {
    this.initRoom(roomId);
    const strokes = this.rooms.get(roomId);
    const redoStack = this.redoStacks.get(roomId);
    // Find the last redo stroke by this user (iterate backwards)
    for (let i = redoStack.length - 1; i >= 0; i--) {
      if (redoStack[i].userId === userId) {
        const [restored] = redoStack.splice(i, 1);
        if (restored) {
          strokes.push(restored);
        }
        break;
      }
    }
    return strokes;
  }

  /**
   * Get all strokes for a room (for late joiners)
   */
  getStrokes(roomId) {
    this.initRoom(roomId);
    return this.rooms.get(roomId);
  }

  /**
   * Clear all strokes in a room
   */
  clearRoom(roomId) {
    this.initRoom(roomId);
    this.rooms.set(roomId, []);
    return this.rooms.get(roomId);
  }

  /**
   * Remove a room (cleanup)
   */
  removeRoom(roomId) {
    this.rooms.delete(roomId);
  }
}
