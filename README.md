# Collaborative Canvas

This is a fun drawing app where multiple people can draw on the same canvas at the same time. It's like a shared whiteboard that updates in real-time.

## What It Does

- **Draw Together**: Everyone sees what others are drawing instantly
- **Undo Your Own Stuff**: You can undo just your drawings
- **See Where Others Are**: Little dots show other people's cursors
- **New People Catch Up**: Late joiners get the full drawing history
- **Server Keeps It Fair**: One central server makes sure everything stays synced

## Tech Stuff

### Frontend (What You See)
- React for the interface
- Vite for fast development
- Plain HTML5 Canvas for drawing (no fancy libraries)
- Socket.io for real-time chat with the server

### Backend (The Server)
- Node.js
- Express for the web server
- Socket.io for real-time updates

## Project Layout

```
collaborative-canvas/
├── client/          # The React app
│   ├── src/
│   │   ├── components/
│   │   │   └── CanvasBoard.jsx    # Main drawing component
│   │   ├── hooks/
│   │   │   └── useCanvasDrawing.js # Handles the actual drawing
│   │   ├── socket/
│   │   │   └── socket.js          # Connects to the server
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── style.css
│   └── package.json
├── server/          # The backend
│   ├── server.js                  # Main server file
│   ├── rooms.js                   # Manages drawing rooms
│   ├── state-manager.js           # Keeps track of all drawings
│   └── package.json
├── package.json     # Root scripts
├── README.md        # This file
└── ARCHITECTURE.md  # How it all works
```

### Run It

1. **Start the server**:
   ```bash
   npm run dev:server
   ```
   (Or `cd server && npm start`)
   It runs on `http://localhost:3000`

2. **Start the client** (new terminal):
   ```bash
   npm run dev:client
   ```
   (Or `cd client && npm run dev`)
   It runs on `http://localhost:3001`

3. **Test it**: Open a few browser tabs to `http://localhost:3001` and start drawing!

## How to Use

- **Draw**: Click and drag (or touch on mobile)
- **Pick Color**: Use the color picker
- **Brush Size**: Slide the width control
- **Undo**: Removes your last drawing
- **Redo**: Get your previous drawing
- **Clear**: Wipes everything (for everyone)

## Cool Bits About How It Works

- React handles the buttons and stuff, but drawing is pure JavaScript on the canvas
- The server remembers everything and tells everyone what to draw
- When you undo, it replays all the drawings to keep it fair
- Cursors are separate from the actual drawing

Check out [ARCHITECTURE.md](./ARCHITECTURE.md) for more details.

