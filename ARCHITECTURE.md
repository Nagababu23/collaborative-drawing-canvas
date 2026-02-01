# Collaborative Canvas App - How It Works

Hey there! This is a simple explanation of how our drawing app works. It's basically a shared canvas where people can draw together in real-time. I'll try to keep it straightforward and not too technical.

## The Main Idea

Imagine a whiteboard that everyone can draw on at the same time. When you draw a line, it shows up on everyone's screen instantly. That's what this app does.

The app has two parts:
- **Frontend**: The part you see in your browser (React app)
- **Backend**: The server that keeps everything synced

## How Drawing Happens

### What You See (Frontend)

The main thing is the `CanvasBoard.jsx` component. It shows:
- A toolbar with color picker, brush size, and buttons like undo
- The actual canvas for drawing
- Little dots showing where other people's cursors are

When you draw, your browser sends the info to the server, and the server tells everyone else to draw the same thing. That way, everyone's canvas stays the same.

### The Drawing Code

The real drawing logic is in `useCanvasDrawing.js`. This hook:
- Sets up the canvas
- Watches your mouse or finger movements
- Draws lines as you go
- Sends the drawing data to the server

React handles the buttons and stuff, but the actual drawing on the canvas is done with plain JavaScript. React just gives it a reference to the canvas.

## Keeping Everyone in Sync

### Real-Time Updates

1. You draw something → Your browser tells the server
2. Server gets it → Saves it and tells everyone else
3. Others see it → Their browsers draw the same line

The server remembers all the drawings. If someone joins late, they get the whole picture right away.

### Undo, Redo, and Clear

- **Undo**: Erases your last drawing and updates everyone's screen
- **Redo**: Brings back what you undid
- **Clear**: Wipes everything for everyone

### Cursors

When you move your mouse over the canvas, a colored dot appears on other screens showing where you are. These are just HTML elements on top of the canvas, not part of the drawing.

## The Server

The server uses Socket.io to talk to browsers in real-time. It:
- Gives each user a unique ID
- Keeps track of all drawings
- Sends updates to everyone
- Handles undo and clear actions
