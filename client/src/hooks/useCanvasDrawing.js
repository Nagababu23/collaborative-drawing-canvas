import { useRef, useEffect, useCallback } from 'react';
import { getSocket } from '../socket/socket.js';

export const useCanvasDrawing = ({
  color,
  lineWidth,
  userId,
  onStrokeStart,
  onStrokeUpdate,
  onStrokeEnd,
  onCanvasResize
}) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);
  const onCanvasResizeRef = useRef(onCanvasResize);
  onCanvasResizeRef.current = onCanvasResize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const dpr = window.devicePixelRatio || 1;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;

      const backingWidth = Math.round(w * dpr);
      const backingHeight = Math.round(h * dpr);

      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    const resizeObserver = new ResizeObserver(() => {
      const prevWidth = canvas.width;
      const prevHeight = canvas.height;
      setupCanvas();
      if (onCanvasResizeRef.current && (canvas.width !== prevWidth || canvas.height !== prevHeight)) {
        onCanvasResizeRef.current();
      }
    });
    resizeObserver.observe(canvas);

    socketRef.current = getSocket();

    return () => {
      window.removeEventListener('resize', setupCanvas);
      resizeObserver.disconnect();
    };
  }, []);

  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    isDrawingRef.current = true;
    currentPathRef.current = [coords];

    const ctx = ctxRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [color, lineWidth, getCoordinates]);

  const draw = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = ctxRef.current;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    currentPathRef.current.push(coords);
  }, [getCoordinates]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    isDrawingRef.current = false;

    if (currentPathRef.current.length > 0 && userId) {
      const strokeId = `${userId}-${Date.now()}-${Math.random()}`;
      const stroke = {
        strokeId,
        userId,
        color,
        width: lineWidth,
        points: [...currentPathRef.current]
      };

      if (onStrokeEnd) {
        onStrokeEnd(stroke);
      }

      const socket = getSocket();
      if (socket) {
        socket.emit('draw', stroke);
      }
    }

    currentPathRef.current = [];
  }, [userId, color, lineWidth, onStrokeEnd]);

  const drawStroke = useCallback((stroke) => {
    const ctx = ctxRef.current;
    if (!ctx || !stroke.points || stroke.points.length === 0) return;

    ctx.save();
    ctx.strokeStyle = stroke.color || '#000000';
    ctx.lineWidth = stroke.width || 2;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, []);

  const redrawAllStrokes = useCallback((strokes) => {
    clearCanvas();
    strokes.forEach(stroke => {
      drawStroke(stroke);
    });
  }, [clearCanvas, drawStroke]);

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    drawStroke,
    clearCanvas,
    redrawAllStrokes
  };
};
