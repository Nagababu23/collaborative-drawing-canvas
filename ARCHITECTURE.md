# Architecture Documentation

## Overview

This document explains the technical architecture of the Collaborative Canvas application, focusing on the separation of concerns between React (orchestration) and Canvas (imperative drawing), as well as the real-time synchronization system.

## Core Principles

### 1. React = Orchestration, Canvas = Drawing

**React's Role:**
- Manages UI state (color, line width, user ID)
- Handles socket lifecycle (connect, disconnect, event listeners)
- Provides refs to canvas element
- Renders toolbar and ghost cursors

**Canvas's Role:**
- All drawing operations happen imperatively via `canvas.getContext("2d")`
- Drawing logic lives in `useCanvasDrawing.js` hook
- React never directly manipulates canvas - only passes refs

### 2. Server = Single Source of Truth

The server maintains the complete stroke history for each room. This ensures:
- Late joiners receive full history
- Undo operations are deterministic
- All clients stay synchronized

## Data Flow

### Client → Server Flow

```
User Draws → useCanvasDrawing Hook → Socket.emit('draw', stroke) → Server
```

**Stroke Object Structure:**
```javascript
{
  strokeId: "userId-timestamp-random",  // Unique identifier
  userId: "socket.id",                  // User who drew
  color: "#000000",                     // Stroke color
  width: 3,                             // Line width
  points: [{ x: 10, y: 20 }, ...]      // Array of coordinates
}
```

### Server → Client Flow

```
Server receives stroke → StateManager.addStroke() → Socket.broadcast('stroke_added') → All Clients
```

### History Synchronization Flow

```
Client emits 'undo' → Server removes last user stroke → Server broadcasts 'stroke_history' → All Clients clear & redraw
```

## Component Architecture

### CanvasBoard.jsx

**Responsibilities:**
- Initialize socket connection
- Manage React state (color, width, strokes, cursors)
- Handle toolbar button clicks (undo, clear)
- Listen to socket events and update state
- Render canvas and ghost cursors

**Key State:**
- `userId`: Assigned by server on connect
- `strokes`: Array of all strokes (for undo button logic)
- `cursors`: Map of other users' cursor positions

### useCanvasDrawing.js Hook

**Responsibilities:**
- Setup canvas with proper DPI scaling
- Handle mouse/touch events (start, move, end)
- Draw locally as user draws
- Emit strokes to server
- Provide functions to redraw strokes (for history sync)

**Key Functions:**
- `startDrawing()`: Begin a new stroke
- `draw()`: Continue drawing current stroke
- `stopDrawing()`: Finish stroke and emit to server
- `drawStroke()`: Draw a single stroke (for replay)
- `redrawAllStrokes()`: Clear canvas and replay all strokes

**Why in a Hook?**
- Encapsulates all canvas logic
- Keeps React component clean
- Reusable if needed elsewhere
- Follows React best practices for imperative APIs

## Stroke Lifecycle

### 1. User Starts Drawing

```
MouseDown/TouchStart
  → startDrawing()
  → Initialize currentPathRef = [firstPoint]
  → ctx.beginPath(), ctx.moveTo()
```

### 2. User Continues Drawing

```
MouseMove/TouchMove
  → draw()
  → Add point to currentPathRef
  → ctx.lineTo(), ctx.stroke()
```

### 3. User Stops Drawing

```
MouseUp/TouchEnd
  → stopDrawing()
  → Create stroke object with all points
  → socket.emit('draw', stroke)
  → Clear currentPathRef
```

### 4. Server Receives Stroke

```
Server receives 'draw' event
  → StateManager.addStroke(roomId, stroke)
  → Add to room's stroke array
  → io.to(room).emit('stroke_added', stroke)
```

### 5. Other Clients Receive Stroke

```
Client receives 'stroke_added'
  → Add stroke to local strokes state
  → drawStroke(stroke) - draw on canvas
```

## Undo Algorithm

### Client Side

1. User clicks "Undo" button
2. `handleUndo()` emits `socket.emit('undo')`
3. Client waits for server response

### Server Side

1. Server receives `'undo'` event
2. `StateManager.undoLastStroke(roomId, userId)`:
   - Iterate strokes array backwards
   - Find first stroke where `stroke.userId === userId`
   - Remove that stroke
   - Return updated strokes array
3. Server broadcasts `io.to(room).emit('stroke_history', updatedStrokes)`

### Client Receives Updated History

1. All clients receive `'stroke_history'` event
2. Update local `strokes` state
3. Call `redrawAllStrokes(strokes)`:
   - `clearCanvas()` - wipe canvas
   - `drawStroke()` for each stroke in order
   - Deterministic replay ensures sync

**Why Full Redraw?**
- Ensures all clients have identical canvas state
- Handles edge cases (network delays, out-of-order events)
- Simple and reliable

## Ghost Cursors

### Implementation

Ghost cursors are **NOT** part of canvas drawing. They're rendered as separate DOM elements:

```jsx
<div className="cursor-overlay">
  {cursors.map((cursor) => (
    <div className="ghost-cursor" style={{ left, top, color }} />
  ))}
</div>
```

### Cursor Tracking

1. User moves mouse/touch → `handleMouseMove()`
2. Calculate canvas-relative coordinates
3. `socket.emit('cursor_move', { x, y, color })`
4. Server broadcasts to other users
5. Other clients update `cursors` state Map
6. React re-renders ghost cursor elements

### Why Separate from Canvas?

- Cursors are ephemeral (not part of drawing history)
- DOM rendering is simpler for animated elements
- Doesn't pollute stroke history
- Easy to add/remove without redrawing canvas

## Late Joiner Support

### Flow

1. New user connects → `socket.on('connection')`
2. Server assigns `userId` → `socket.emit('user_id', userId)`
3. Server sends full history → `socket.emit('stroke_history', strokes)`
4. Client receives history → `redrawAllStrokes(strokes)`
5. New user sees complete drawing

### State Manager

```javascript
getStrokes(roomId) {
  return this.rooms.get(roomId) || [];
}
```

Server maintains complete stroke array, ready to send to any new joiner.

## Touch Support

The `getCoordinates()` function in `useCanvasDrawing.js` handles both:

```javascript
const clientX = e.touches ? e.touches[0].clientX : e.clientX;
const clientY = e.touches ? e.touches[0].clientY : e.clientY;
```

Canvas event handlers support both:
- `onMouseDown/onMouseMove/onMouseUp` (desktop)
- `onTouchStart/onTouchMove/onTouchEnd` (mobile)

## DPI Scaling

Canvas setup handles high-DPI displays:

```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

This ensures crisp rendering on retina displays.

## Why React Doesn't Draw

### The Problem with React + Canvas

React is declarative: you describe what the UI should look like, React figures out how to update the DOM.

Canvas is imperative: you must call specific methods (`beginPath()`, `lineTo()`, `stroke()`) in sequence.

### The Solution

1. **React manages state** (what color? what width? what strokes exist?)
2. **Hook handles canvas** (how to draw? when to draw? how to get coordinates?)
3. **Clear separation** (React never calls `ctx.stroke()`, hook never calls `setState()`)

### Benefits

- Canvas operations are fast (no React reconciliation overhead)
- Drawing logic is testable in isolation
- Follows React best practices for imperative APIs
- Easy to optimize (can use `requestAnimationFrame`, etc.)

## Socket Event Summary

### Client → Server

- `draw`: Emit new stroke
- `cursor_move`: Emit cursor position
- `undo`: Request undo of last user stroke
- `clear`: Request clear all strokes

### Server → Client

- `user_id`: Assign unique user ID
- `stroke_history`: Send complete stroke array (on connect/undo/clear)
- `stroke_added`: Broadcast new stroke to all users
- `cursor_move`: Broadcast cursor position from other user
- `cursor_leave`: Notify when user disconnects

## Room Management

Currently uses a single default room (`'main'`). The `RoomManager` class is structured to support multiple rooms in the future:

- `joinRoom(socketId, roomId)`: Add socket to room
- `leaveRoom(socketId)`: Remove socket from room
- `getRoomSockets(roomId)`: Get all sockets in room

## Error Handling

- Stroke validation on server (checks for required fields)
- Socket reconnection handled by Socket.io client
- Canvas resize handles window resize events
- Graceful degradation if socket disconnects (drawing still works locally)

## Performance Considerations

- Strokes use point arrays, not pixel-by-pixel updates (efficient)
- Canvas redraw only happens on undo/clear (not on every stroke)
- Ghost cursors use CSS transforms (GPU accelerated)
- Socket.io uses WebSocket when available (low latency)

## Future Enhancements

Potential improvements:
- Multiple rooms/channels
- Stroke compression for large drawings
- Drawing tools (shapes, text, etc.)
- User names/avatars
- Drawing permissions
- Export/import functionality
