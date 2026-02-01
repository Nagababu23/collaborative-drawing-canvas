# Collaborative Canvas

A real-time multi-user collaborative drawing application built with React, HTML5 Canvas, and Socket.io.

## Features

- ✅ **Real-time Collaboration**: Multiple users can draw simultaneously
- ✅ **Live Updates**: See other users' drawings as they happen
- ✅ **Per-User Undo**: Each user can undo only their own strokes
- ✅ **Ghost Cursors**: See where other users' cursors are positioned
- ✅ **Late Joiner Support**: New users receive full drawing history
- ✅ **Touch Support**: Works on mobile devices with touch input
- ✅ **High DPI Support**: Properly handles retina displays
- ✅ **Server Authority**: Server maintains single source of truth

## Tech Stack

### Frontend
- React 18
- Vite
- HTML5 Canvas API (no abstraction libraries)
- Socket.io Client

### Backend
- Node.js 18+
- Express
- Socket.io

## Project Structure

```
collaborative-canvas/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── CanvasBoard.jsx      # Main canvas component
│   │   ├── hooks/
│   │   │   └── useCanvasDrawing.js  # Canvas drawing logic (imperative)
│   │   ├── socket/
│   │   │   └── socket.js            # Socket.io client setup
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── style.css
│   └── package.json
├── server/
│   ├── server.js                    # Express + Socket.io server
│   ├── rooms.js                     # Room management
│   ├── state-manager.js             # Global stroke history
│   └── package.json
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. **Install root dependencies** (optional, for convenience scripts):
   ```bash
   npm install
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**:
   ```bash
   cd ../client
   npm install
   ```

   Or use the convenience script:
   ```bash
   npm run install:all
   ```

### Running the Application

1. **Start the server** (from project root):
   ```bash
   npm run dev:server
   ```
   Or from server directory:
   ```bash
   cd server
   npm start
   ```
   Server runs on `http://localhost:3001`

2. **Start the client** (in a new terminal, from project root):
   ```bash
   npm run dev:client
   ```
   Or from client directory:
   ```bash
   cd client
   npm run dev
   ```
   Client runs on `http://localhost:3000`

3. **Open multiple browser tabs** to `http://localhost:3000` to test collaboration

## Usage

1. **Drawing**: Click and drag (or touch and drag on mobile) to draw
2. **Change Color**: Use the color picker in the toolbar
3. **Change Width**: Adjust the slider to change brush width
4. **Undo**: Click "Undo" to remove your last stroke (only affects your strokes)
5. **Clear**: Click "Clear" to remove all strokes (affects everyone)

## Architecture Highlights

- **React = Orchestration**: React manages UI state and socket lifecycle
- **Canvas = Imperative Drawing**: All drawing happens via direct canvas API calls
- **Server = Single Source of Truth**: Server maintains global stroke history
- **Deterministic Redraw**: On undo/history sync, canvas clears and replays all strokes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Development Notes

- Canvas drawing logic is isolated in `useCanvasDrawing.js` hook
- No canvas abstraction libraries (Fabric.js, Konva, etc.) - pure Canvas API
- Socket events use stroke objects with point arrays, not pixel-by-pixel updates
- Ghost cursors are rendered separately from canvas (not part of stroke history)

## License

MIT
