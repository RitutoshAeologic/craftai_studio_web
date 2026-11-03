'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Undo,
  Redo,
  Trash2,
  Zap,
  Download,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  Eye,
  Layers,
  Upload,
  Move,
  Scissors,
  Split,
  Image as ImageIcon,
} from 'lucide-react';
import { toolsApi, MagicGrabResponse } from '@/lib/api/toolsApi';
import { theme } from '@/lib/theme/themeGuard';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  size: number;
}

interface MagicGrabToolProps {
  initialImageUrl?: string;
  onSavedToLibrary?: (cutoutUrl: string, bgUrl: string) => void;
  onImageChange?: (url: string | null) => void;
}

export function MagicGrabTool({
  initialImageUrl,
  onSavedToLibrary,
  onImageChange,
}: MagicGrabToolProps) {
  const S = theme.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600');
  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  const [brushSize, setBrushSize] = useState<number>(40);
  const [isGrabbing, setIsGrabbing] = useState<boolean>(false);
  const [grabResult, setGrabResult] = useState<MagicGrabResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Result view mode: interactive (moveable sprite) | cutout | background | slider
  const [activeView, setActiveView] = useState<'interactive' | 'cutout' | 'background' | 'slider'>('interactive');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Interactive repositioning state
  const [spritePos, setSpritePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingSprite, setIsDraggingSprite] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number }>({ x: 0, y: 0, initialX: 0, initialY: 0 });

  // Drawing canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([]);

  // Load image onto canvas
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageObjRef.current = img;
      redrawCanvas();
    };
  }, [imageUrl]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObjRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageObjRef.current;
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 800;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      // Glowing cyan-violet mask for Magic Grab
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.65)';
      ctx.lineWidth = stroke.size;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (grabResult) return;
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    const newStroke: Stroke = { points: [pt], size: brushSize };
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStrokes([]);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || grabResult) return;
    const pt = getCanvasCoords(e);
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedLast: Stroke = { ...last, points: [...last.points, pt] };
      return [...prev.slice(0, -1), updatedLast];
    });
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStrokes((prev) => [...prev, last]);
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStrokes.length === 0) return;
    const last = redoStrokes[redoStrokes.length - 1];
    setStrokes((prev) => [...prev, last]);
    setRedoStrokes((prev) => prev.slice(0, -1));
  };

  const handleClearMask = () => {
    setStrokes([]);
    setRedoStrokes([]);
  };

  const handleReset = () => {
    setGrabResult(null);
    setStrokes([]);
    setRedoStrokes([]);
    setSpritePos({ x: 0, y: 0 });
    setErrorMsg(null);
    setLatency(null);
    setIsSaved(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      handleReset();
      if (onImageChange) onImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Export black & white binary mask (white = object, black = background)
  const exportBinaryMask = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObjRef.current) return null;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return null;

    // Solid black backdrop
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // If no strokes, select center 60% box as default grab subject
    if (strokes.length === 0) {
      ctx.fillStyle = '#FFFFFF';
      const w = maskCanvas.width * 0.6;
      const h = maskCanvas.height * 0.6;
      ctx.fillRect((maskCanvas.width - w) / 2, (maskCanvas.height - h) / 2, w, h);
      return maskCanvas.toDataURL('image/png');
    }

    // Pure white strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.lineWidth = stroke.size;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    return maskCanvas.toDataURL('image/png');
  };

  // Execute Magic Grab
  const handleExecuteGrab = async () => {
    if (!imageUrl || isGrabbing) return;
    setIsGrabbing(true);
    setErrorMsg(null);
    const startT = performance.now();

    try {
      const maskData = exportBinaryMask();
      if (!maskData) throw new Error("Could not extract selection mask");

      const res = await toolsApi.magicGrab({
        imageUrl,
        maskBase64: maskData,
      });

      if (!res.cutout_url || !res.clean_background_url) {
        throw new Error("Missing cutout or background result from service");
      }

      setGrabResult(res);
      setLatency(Math.round(performance.now() - startT));
      setActiveView('interactive');
      setSpritePos({ x: 0, y: 0 });

      if (onSavedToLibrary) {
        onSavedToLibrary(res.cutout_url, res.clean_background_url);
      }
    } catch (err: any) {
      console.error("Magic Grab error:", err);
      setErrorMsg(err?.message || "Failed to lift object. Please try brushing again.");
    } finally {
      setIsGrabbing(false);
    }
  };

  // Interactive sprite dragging handlers
  const handleSpritePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSprite(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: spritePos.x,
      initialY: spritePos.y,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleSpritePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSprite) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setSpritePos({
      x: dragStartRef.current.initialX + deltaX,
      y: dragStartRef.current.initialY + deltaY,
    });
  };

  const handleSpritePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSprite(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1040px', margin: '0 auto' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />

      {/* Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.25)',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
            }}
          >
            <Scissors size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Canva Magic Grab &amp; Pixel Editor
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 212, 255, 0.2)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                }}
              >
                100% Free / 0 Cr
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: S.textSecondary }}>
              Brush any object to lift it into a moveable PNG sprite while neural LaMa cleanly infills the background.
            </p>
          </div>
        </div>

        {latency && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00d4ff', background: 'rgba(0, 212, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.25)' }}>
            <Zap size={13} />
            <span>Grabbed in {latency}ms</span>
          </div>
        )}
      </div>

      {/* Main Workspace Canvas */}
      <div
        style={{
          background: S.card,
          border: `1px solid ${S.borderLight}`,
          borderRadius: '18px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Top Control Bar when Result is Ready */}
        {grabResult ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* View Mode Pills */}
            <div style={{ display: 'flex', gap: '6px', background: S.surface, padding: '4px', borderRadius: '10px', border: `1px solid ${S.borderLight}` }}>
              {[
                { id: 'interactive', label: 'Moveable Sprite', icon: Move },
                { id: 'cutout', label: 'Cutout Only', icon: Scissors },
                { id: 'background', label: 'Clean Plate', icon: ImageIcon },
                { id: 'slider', label: 'Before / After', icon: Split },
              ].map((m) => {
                const Icon = m.icon;
                const isActive = activeView === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveView(m.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)' : 'transparent',
                      color: isActive ? '#ffffff' : S.textSecondary,
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={13} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${S.borderLight}`,
                  color: S.textPrimary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Mask</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${S.borderLight}`,
                  color: S.textPrimary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Upload size={13} />
                <span>New Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff', textTransform: 'uppercase' }}>
                Brush Subject to Grab
              </span>
              <span style={{ fontSize: '11.5px', color: S.textMuted }}>
                {strokes.length === 0 ? "Brush over what you want to extract, or click Grab for auto-selection" : `${strokes.length} stroke(s) marked`}
              </span>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${S.borderLight}`,
                color: S.textPrimary,
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              <Upload size={12} style={{ color: '#00d4ff' }} />
              <span>Upload Different Photo</span>
            </button>
          </div>
        )}

        {/* Canvas Display Viewport */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '720px',
            aspectRatio: '1 / 1',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#080c14',
            border: `1px solid ${S.borderLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {grabResult ? (
            <>
              {/* Mode 1: Interactive Moveable Sprite */}
              {activeView === 'interactive' && (
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none' }}>
                  {/* Clean Infilled Background */}
                  <img
                    src={grabResult.clean_background_url}
                    alt="Clean Infilled Plate"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                  />

                  {/* Moveable Extracted Cutout Sprite */}
                  <div
                    onPointerDown={handleSpritePointerDown}
                    onPointerMove={handleSpritePointerMove}
                    onPointerUp={handleSpritePointerUp}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${spritePos.x}px), calc(-50% + ${spritePos.y}px))`,
                      cursor: isDraggingSprite ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.6))',
                    }}
                    title="Click and drag to reposition subject anywhere on the plate!"
                  >
                    <div
                      style={{
                        position: 'relative',
                        border: '2px dashed rgba(0, 212, 255, 0.8)',
                        borderRadius: '8px',
                        padding: '4px',
                      }}
                    >
                      <img
                        src={grabResult.cutout_url}
                        alt="Extracted Cutout"
                        style={{ maxWidth: '320px', maxHeight: '320px', display: 'block', pointerEvents: 'none' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          background: '#00d4ff',
                          color: '#000000',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 10px #00d4ff',
                        }}
                      >
                        <Move size={12} />
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(8px)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: '#00d4ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      pointerEvents: 'none',
                    }}
                  >
                    <Move size={12} />
                    <span>Drag subject to reposition anywhere on the canvas</span>
                  </div>
                </div>
              )}

              {/* Mode 2: Cutout Only */}
              {activeView === 'cutout' && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: 'linear-gradient(45deg, #161d2b 25%, transparent 25%), linear-gradient(-45deg, #161d2b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161d2b 75%), linear-gradient(-45deg, transparent 75%, #161d2b 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                >
                  <img
                    src={grabResult.cutout_url}
                    alt="Isolated Cutout"
                    style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                  />
                </div>
              )}

              {/* Mode 3: Clean Infilled Background Plate */}
              {activeView === 'background' && (
                <img
                  src={grabResult.clean_background_url}
                  alt="Infilled Clean Plate"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}

              {/* Mode 4: Split Slider Comparison */}
              {activeView === 'slider' && (
                <div
                  style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
                  onPointerMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    setSliderPosition(pct);
                  }}
                >
                  {/* Before (Original) */}
                  <img
                    src={imageUrl}
                    alt="Original"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {/* After (Clean Plate) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                    }}
                  >
                    <img
                      src={grabResult.clean_background_url}
                      alt="Clean Infill"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {/* Divider line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${sliderPosition}%`,
                      width: '2px',
                      background: '#00d4ff',
                      boxShadow: '0 0 12px #00d4ff',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            /* Drawing Canvas for Mask Selection */
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
          )}

          {/* Loading overlay during inpainting */}
          {isGrabbing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(8, 12, 20, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '3px solid rgba(0, 212, 255, 0.2)',
                  borderTopColor: '#00d4ff',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                Lifting subject &amp; infilling background with neural LaMa...
              </span>
            </div>
          )}
        </div>

        {/* Bottom Toolbar & Action CTAs */}
        {!grabResult ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#080c14',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${S.borderLight}`,
            }}
          >
            {/* Brush Size Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: S.textSecondary, fontWeight: 600 }}>
                Brush Size: {brushSize}px
              </span>
              <input
                type="range"
                min="10"
                max="90"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ accentColor: '#00d4ff', cursor: 'pointer', width: '130px' }}
              />
            </div>

            {/* Undo / Redo / Clear */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                style={{
                  background: 'transparent',
                  border: `1px solid ${S.borderLight}`,
                  color: strokes.length > 0 ? S.textPrimary : S.textMuted,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: strokes.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Undo size={13} />
                <span>Undo</span>
              </button>

              <button
                onClick={handleRedo}
                disabled={redoStrokes.length === 0}
                style={{
                  background: 'transparent',
                  border: `1px solid ${S.borderLight}`,
                  color: redoStrokes.length > 0 ? S.textPrimary : S.textMuted,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: redoStrokes.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Redo size={13} />
                <span>Redo</span>
              </button>

              <button
                onClick={handleClearMask}
                disabled={strokes.length === 0}
                style={{
                  background: 'transparent',
                  border: `1px solid ${S.borderLight}`,
                  color: S.textSecondary,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>

              {/* Main Grab Action */}
              <button
                onClick={handleExecuteGrab}
                disabled={isGrabbing}
                style={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #6366f1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '8px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  boxShadow: '0 0 18px rgba(0, 212, 255, 0.4)',
                }}
              >
                <Scissors size={15} />
                <span>MAGIC GRAB (0 Cr)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Download & Export CTAs when Result is Ready */
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              flexWrap: 'wrap',
              gap: '10px',
              background: '#080c14',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${S.borderLight}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} color="#00d4ff" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: S.textPrimary }}>
                Subject extracted into transparent cutout &amp; plate infilled!
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={grabResult.cutout_url}
                download="magic_grab_cutout.png"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0, 212, 255, 0.15)',
                  border: '1px solid rgba(0, 212, 255, 0.35)',
                  color: '#00d4ff',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Download size={13} />
                <span>Download Cutout (PNG)</span>
              </a>

              <a
                href={grabResult.clean_background_url}
                download="magic_grab_plate.png"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Download size={13} />
                <span>Download Clean Plate</span>
              </a>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              marginTop: '12px',
              width: '100%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ef4444',
              fontSize: '12.5px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
