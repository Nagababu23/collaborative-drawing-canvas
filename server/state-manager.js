/**
 * Global State Manager
 * Maintains the single source of truth for all strokes in a room
 */

export class StateManager {
  constructor() {
    // roomId -> strokes[]
    this.rooms = new Map();
    // roomId -> redoStack[]
    this.redoStacks = new Map();
  }

  /**
   * Initialize a room with empty stroke history
   */
  initRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, []);
    }
    if (!this.redoStacks.has(roomId)) {
      this.redoStacks.set(roomId, []);
    }
  }

  /** Max strokes per room to prevent lag after long use */
  static MAX_STROKES = 500;

  /**
   * Add a new stroke to the room's history
   * Keeps only the last MAX_STROKES to avoid unbounded growth
   */
  addStroke(roomId, stroke) {
    this.initRoom(roomId);
    const strokes = this.rooms.get(roomId);
    strokes.push(stroke);
    // Clear redo stack on new stroke
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
