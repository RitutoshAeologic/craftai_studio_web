'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Download,
  Sliders,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Upload,
  Check,
  Layers,
  Trash2,
} from 'lucide-react';
import { toolsApi, BaseToolResponse } from '@/lib/api/toolsApi';
import { theme } from '@/lib/theme/themeGuard';

interface PhotoColorizerProps {
  initialImageUrl?: string;
  onSavedToLibrary?: (url: string) => void;
  onImageChange?: (url: string | null) => void;
}

const SATURATION_PRESETS = [
  { value: 0.8, label: '0.8x Muted', desc: 'Subtle historical tones' },
  { value: 1.0, label: '1.0x Natural', desc: 'Authentic archival realism' },
  { value: 1.2, label: '1.2x Rich ★', desc: 'Vivid color restoration' },
  { value: 1.4, label: '1.4x Vibrant', desc: 'Modern high-chroma vibrancy' },
];

export function PhotoColorizer({
  initialImageUrl,
  onSavedToLibrary,
  onImageChange,
}: PhotoColorizerProps) {
  const S = theme.colors;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  useEffect(() => {
    setImageUrl(initialImageUrl || '');
    if (!initialImageUrl) {
      setResultUrl(null);
    }
  }, [initialImageUrl]);
  const [saturation, setSaturation] = useState<number>(1.2);
  const [isColorizing, setIsColorizing] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      setResultUrl(null);
      setErrorMsg(null);
      setLatency(null);
      if (onImageChange) onImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setResultUrl(null);
    setErrorMsg(null);
    setLatency(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImageChange) onImageChange(null);
  };

  const handleColorize = async (selectedSat: number = saturation) => {
    if (!imageUrl) {
      setErrorMsg('Please upload a monochrome or vintage photo first.');
      return;
    }

    setIsColorizing(true);
    setErrorMsg(null);
    const start = performance.now();

    try {
      const res: BaseToolResponse = await toolsApi.colorizePhoto({
        image_url: imageUrl,
        saturation: selectedSat,
      });

      const latencyMs = Math.round(performance.now() - start);
      setLatency(latencyMs);

      const finalUrl = res.output_url || res.image_url || res.url;
      if (finalUrl) {
        setResultUrl(finalUrl);
        if (onSavedToLibrary) onSavedToLibrary(finalUrl);
      } else {
        throw new Error('Server returned an empty colorized asset URL');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Color restoration failed. Please try again.');
    } finally {
      setIsColorizing(false);
    }
  };

  const handleSelectPreset = (val: number) => {
    setSaturation(val);
    if (resultUrl) {
      // Re-run colorization with the new saturation preset
      handleColorize(val);
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
            <Palette size={22} style={{ color: S.primary }} />
            Vintage Photo Colorizer
            <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: S.primary, border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              DDColor Neural • 0 Cr Free
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: S.textSecondary, margin: '4px 0 0' }}>
            Dual-Decoder (DDColor) neural engine. Restores vivid, lifelike color to historical B&W photos while preserving 100% native sharpness.
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
                <Upload size={14} style={{ color: S.primary }} />
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
              download="craftai-colorized.png"
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
              Save Restored PNG
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

      {/* Main Canvas / Split Comparison Viewer */}
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
              border: '2px dashed rgba(99, 102, 241, 0.25)',
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
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: S.primary,
              }}
            >
              <Upload size={32} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '16px', color: S.textPrimary, margin: '0 0 6px' }}>
              Upload Black & White or Sepia Photo
            </p>
            <p style={{ fontSize: '13px', color: S.textMuted, margin: '0 0 16px', maxWidth: '380px' }}>
              Drag and drop an archival portrait, family photo, or street scene here, or click to browse
            </p>
            <span
              style={{
                background: S.primary,
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
          /* Split Comparison Viewer */
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
            {/* Restored Colorized Result (Bottom layer) */}
            <img
              src={resultUrl}
              alt="Restored Color"
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

            {/* Original B&W (Top clipped layer via clip-path for 100% exact alignment) */}
            <img
              src={imageUrl}
              alt="Original B&W"
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
                background: S.primary,
                boxShadow: `0 0 12px ${S.primaryGlow}`,
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
                border: `2px solid ${S.primary}`,
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

            {/* Badges */}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff' }}>
              Original (B & W)
            </div>
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: S.primary, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>
              Vibrant Restored {latency ? `(${latency}ms)` : ''}
            </div>
          </div>
        ) : (
          /* Initial Monochrome Preview */
          <img
            src={imageUrl}
            alt="Monochrome input"
            style={{ width: '100%', maxHeight: '520px', objectFit: 'contain', display: 'block' }}
          />
        )}

        {/* Loading Overlay */}
        {isColorizing && (
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
                border: `3px solid rgba(99, 102, 241, 0.2)`,
                borderTopColor: S.primary,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ color: S.textPrimary, fontWeight: 600, fontSize: '14px', margin: 0 }}>
              DDColor Dual-Decoder Neural Restorer...
            </p>
            <span style={{ color: S.textMuted, fontSize: '12px' }}>Synthesizing natural chromatic spectrum</span>
          </div>
        )}
      </div>

      {/* Saturation Controls & Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: S.surfaceLight,
          padding: '14px 18px',
          borderRadius: '12px',
          border: `1px solid ${S.border}`,
        }}
      >
        {/* Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: S.textSecondary, marginRight: '4px' }}>Saturation:</span>
          {SATURATION_PRESETS.map((preset) => {
            const isSelected = saturation === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handleSelectPreset(preset.value)}
                style={{
                  background: isSelected ? S.primary : 'transparent',
                  color: isSelected ? '#ffffff' : S.textSecondary,
                  border: `1px solid ${isSelected ? S.primary : S.border}`,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (!imageUrl) {
              fileInputRef.current?.click();
            } else {
              handleColorize();
            }
          }}
          disabled={isColorizing}
          style={{
            background: S.primary,
            color: '#ffffff',
            fontWeight: 700,
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            cursor: isColorizing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            boxShadow: `0 0 20px ${S.primaryGlow}`,
            transition: 'all 0.15s ease',
          }}
        >
          {!imageUrl ? <Upload size={16} /> : <Palette size={16} />}
          {!imageUrl ? 'UPLOAD IMAGE TO RESTORE' : 'RESTORE NATURAL COLORS'}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: `1px solid ${S.accentError}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: S.accentError, fontSize: '13px' }}>
          <AlertCircle size={18} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
