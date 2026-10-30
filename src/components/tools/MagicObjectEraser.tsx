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
} from 'lucide-react';
import { toolsApi, BaseToolResponse } from '@/lib/api/toolsApi';
import { theme } from '@/lib/theme/themeGuard';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  size: number;
}

interface MagicObjectEraserProps {
  initialImageUrl?: string;
  onSavedToLibrary?: (url: string) => void;
  onImageChange?: (url: string | null) => void;
}

export function MagicObjectEraser({
  initialImageUrl,
  onSavedToLibrary,
  onImageChange,
}: MagicObjectEraserProps) {
  const S = theme.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  useEffect(() => {
    setImageUrl(initialImageUrl || '');
    if (!initialImageUrl) {
      setResultUrl(null);
      setStrokes([]);
      setRedoStrokes([]);
    }
  }, [initialImageUrl]);
  const [brushSize, setBrushSize] = useState<number>(35);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      setResultUrl(null);
      setErrorMsg(null);
      setStrokes([]);
      setRedoStrokes([]);
      setLatency(null);
      if (onImageChange) onImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setResultUrl(null);
    setErrorMsg(null);
    setStrokes([]);
    setRedoStrokes([]);
    setLatency(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageChange) onImageChange(null);
  };
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Drawing canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

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

    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all strokes in semi-transparent violet
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
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

  // Coordinate normalizer from viewport canvas to image pixel space
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
    if (resultUrl) return; // In compare mode
    isDrawingRef.current = true;
    const point = getCanvasCoords(e);
    currentStrokeRef.current = [point];
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const point = getCanvasCoords(e);
    currentStrokeRef.current.push(point);

    // Live preview stroke directly on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
    ctx.lineWidth = brushSize;

    const pts = currentStrokeRef.current;
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current.length > 0) {
      setStrokes((prev) => [
        ...prev,
        { points: [...currentStrokeRef.current], size: brushSize },
      ]);
      setRedoStrokes([]);
      currentStrokeRef.current = [];
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setRedoStrokes((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStrokes.length === 0) return;
    const next = redoStrokes[redoStrokes.length - 1];
    setRedoStrokes((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, next]);
  };

  const handleClearMask = () => {
    setStrokes([]);
    setRedoStrokes([]);
    setResultUrl(null);
    setErrorMsg(null);
  };

  /**
   * Generates the mask matching FastAPI Specification:
   * #000000 Solid Black base (preserve)
   * #FFFFFF Solid White strokes (erase)
   */
  const exportMaskBase64 = (): string | null => {
    if (!imageObjRef.current || strokes.length === 0) return null;
    const img = imageObjRef.current;

    const offscreen = document.createElement('canvas');
    offscreen.width = img.naturalWidth || 800;
    offscreen.height = img.naturalHeight || 800;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    // Fill solid black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw all strokes in solid white
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#FFFFFF';

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    return offscreen.toDataURL('image/png');
  };

  const handleErase = async () => {
    if (!imageUrl) {
      setErrorMsg('Please upload an image first.');
      return;
    }
    const maskBase64 = exportMaskBase64();
    if (!maskBase64) {
      setErrorMsg('Please paint over the object you want to erase.');
      return;
    }

    setIsErasing(true);
    setErrorMsg(null);
    const start = performance.now();

    try {
      const res: BaseToolResponse = await toolsApi.eraseObject({
        image_url: imageUrl,
        mask_base64: maskBase64,
      });

      const latencyMs = Math.round(performance.now() - start);
      setLatency(latencyMs);

      const finalUrl = res.output_url || res.image_url || res.url;
      if (finalUrl) {
        setResultUrl(finalUrl);
        if (onSavedToLibrary) onSavedToLibrary(finalUrl);
      } else {
        throw new Error('Server returned an empty image URL');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to erase object. Please try again.');
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div
      style={{
        background: S.surface,
        border: `1px solid ${S.border}`,
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: S.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Zap size={22} style={{ color: S.purpleAccent }} />
            Magic Object Eraser
            <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.15)', color: S.purpleAccent, border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              LaMa Neural • 0 Cr Free
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: S.textSecondary, margin: '4px 0 0' }}>
            Paint over people, wires, text, or photobombers. Big-LaMa neural engine removes them seamlessly in sub-second latency.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {imageUrl && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${S.border}`,
                  color: S.textPrimary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={14} style={{ color: S.purpleAccent }} />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Remove image"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </>
          )}

          {resultUrl && (
            <a
              href={resultUrl}
              download="craftai-erased.png"
              target="_blank"
              rel="noreferrer"
              style={{
                background: S.primary,
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: `0 0 16px ${S.primaryGlow}`,
              }}
            >
              <Download size={16} />
              Save Clean PNG
            </a>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Main Canvas / Comparison Area */}
      <div
        style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#07070a',
          border: `1px solid ${S.border}`,
          minHeight: '440px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        {!imageUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelect(file);
            }}
            style={{
              padding: '60px 40px',
              textAlign: 'center',
              color: S.textSecondary,
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(168, 85, 247, 0.25)',
              borderRadius: '14px',
              margin: '16px',
              transition: 'border-color 0.2s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: S.purpleAccent,
              }}
            >
              <Upload size={32} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '16px', color: S.textPrimary, margin: '0 0 6px' }}>
              Upload Image to Erase Objects
            </p>
            <p style={{ fontSize: '13px', color: S.textMuted, margin: '0 0 16px', maxWidth: '380px' }}>
              Drag and drop an image here or click to browse. Paint over unwanted objects to erase them cleanly.
            </p>
            <span
              style={{
                background: S.purpleAccent,
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Select Image
            </span>
          </div>
        ) : resultUrl ? (
          /* Interactive Split Comparison Slider */
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: '480px',
              cursor: 'ew-resize',
              userSelect: 'none',
              touchAction: 'none',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              setSliderPosition(pct);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                setSliderPosition(pct);
              }
            }}
            onPointerUp={(e) => {
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
            }}
          >
            {/* Erased Result (Bottom layer) */}
            <img
              src={resultUrl}
              alt="Erased Inpainted Result"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
            />

            {/* Original Image (Top clipped layer via clip-path for 100% exact alignment) */}
            <img
              src={imageUrl}
              alt="Original"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                WebkitClipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                pointerEvents: 'none',
              }}
            />

            {/* Draggable Divider Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPosition}%`,
                width: '2px',
                background: S.purpleAccent,
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)',
                pointerEvents: 'none',
                transform: 'translateX(-50%)',
              }}
            />

            {/* Draggable Divider Handle */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${sliderPosition}%`,
                transform: 'translate(-50%, -50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: S.surface,
                border: `2px solid ${S.purpleAccent}`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
              }}
            >
              <Sliders size={16} />
            </div>

            {/* Comparison Badges */}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff' }}>
              Original
            </div>
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(168, 85, 247, 0.8)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>
              Object Erased {latency ? `(${latency}ms)` : ''}
            </div>
          </div>
        ) : (
          /* Interactive Paint Canvas */
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '520px',
              objectFit: 'contain',
              display: 'block',
              cursor: 'crosshair',
              touchAction: 'none',
            }}
          />
        )}

        {/* Loading Overlay */}
        {isErasing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11, 11, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                border: `3px solid rgba(168, 85, 247, 0.2)`,
                borderTopColor: S.purpleAccent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ color: S.textPrimary, fontWeight: 600, fontSize: '14px', margin: 0 }}>
              LaMa Neural Engine Inpainting...
            </p>
            <span style={{ color: S.textMuted, fontSize: '12px' }}>Synthesizing authentic micro-textures</span>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      {imageUrl ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: S.surfaceLight,
            padding: '12px 18px',
            borderRadius: '12px',
            border: `1px solid ${S.border}`,
          }}
        >
          {/* Brush Size Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: S.textSecondary, fontWeight: 500 }}>
              Brush: <strong style={{ color: S.textPrimary }}>{brushSize}px</strong>
            </span>
            <input
              type="range"
              min="10"
              max="90"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ accentColor: S.purpleAccent, cursor: 'pointer', width: '130px' }}
            />
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0 || !!resultUrl}
              title="Undo stroke"
              style={{
                background: 'transparent',
                border: `1px solid ${S.border}`,
                color: strokes.length > 0 && !resultUrl ? S.textPrimary : S.textMuted,
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: strokes.length > 0 && !resultUrl ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <Undo size={14} /> Undo
            </button>

            <button
              onClick={handleRedo}
              disabled={redoStrokes.length === 0 || !!resultUrl}
              title="Redo stroke"
              style={{
                background: 'transparent',
                border: `1px solid ${S.border}`,
                color: redoStrokes.length > 0 && !resultUrl ? S.textPrimary : S.textMuted,
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: redoStrokes.length > 0 && !resultUrl ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <Redo size={14} /> Redo
            </button>

            <button
              onClick={handleClearMask}
              disabled={strokes.length === 0 && !resultUrl}
              style={{
                background: 'transparent',
                border: `1px solid ${S.border}`,
                color: S.textSecondary,
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <Trash2 size={14} /> Clear
            </button>

            {/* Erase Action CTA */}
            <button
              onClick={handleErase}
              disabled={isErasing || strokes.length === 0}
              style={{
                background: strokes.length > 0 ? S.purpleAccent : S.border,
                color: '#ffffff',
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: strokes.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                boxShadow: strokes.length > 0 ? '0 0 16px rgba(168, 85, 247, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={16} />
              ERASE OBJECT
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: S.surfaceLight,
            padding: '12px 18px',
            borderRadius: '12px',
            border: `1px solid ${S.border}`,
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: S.purpleAccent,
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
            }}
          >
            <Upload size={16} />
            UPLOAD IMAGE TO ERASE OBJECTS
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: `1px solid ${S.accentError}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: S.accentError, fontSize: '13px' }}>
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
