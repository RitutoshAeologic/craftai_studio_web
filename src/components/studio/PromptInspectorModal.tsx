'use client';

import React, { useState, useEffect } from 'react';
import {
  ScanSearch, X, Check, Copy, Sparkles, Lock, ShieldCheck,
  User, Mountain, Sun, Camera, Palette, Ban, Cpu, Sliders
} from 'lucide-react';
import type { StructuredPromptMetadata } from '@/lib/api/backend-client';

interface PromptInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawPrompt: string;
  compiledPrompt?: string | null;
  modelUsed?: string;
  targetModel?: string;
  complexityScore?: number;
  structuredMetadata?: StructuredPromptMetadata | null;
  negativePrompt?: string | null;
}

export function PromptInspectorModal({
  isOpen,
  onClose,
  rawPrompt,
  compiledPrompt,
  modelUsed = 'Gemini 2.5 Flash',
  targetModel = 'FLUX.1 Schnell',
  complexityScore = 3,
  structuredMetadata,
  negativePrompt,
}: PromptInspectorModalProps) {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedCompiled, setCopiedCompiled] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyText = (text: string, isCompiled: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCompiled) {
      setCopiedCompiled(true);
      setTimeout(() => setCopiedCompiled(false), 2000);
    } else {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const meta = structuredMetadata || {
    subject: rawPrompt,
    environment: 'Cinematic environment with depth',
    lighting: 'Volumetric cinematic illumination',
    camera_optics: '85mm f/1.4 portrait lens',
    art_style: 'Photorealistic high fidelity 8K',
    avoid: negativePrompt ? negativePrompt.split(',').map((s) => s.trim()) : ['blurry', 'distorted', 'low quality'],
    preserved_elements: rawPrompt.toLowerCase().includes('face') || rawPrompt.toLowerCase().includes('preserve')
      ? ['Authentic Facial Structure & Likeness']
      : [],
  };

  const preserved = meta.preserved_elements && meta.preserved_elements.length > 0
    ? meta.preserved_elements
    : (rawPrompt.toLowerCase().includes('face') || rawPrompt.toLowerCase().includes('preserve')
        ? ['Authentic Facial Structure & Likeness']
        : []);

  const avoidTokens = meta.avoid && meta.avoid.length > 0
    ? meta.avoid
    : (negativePrompt ? negativePrompt.split(',').map((s) => s.trim()).filter(Boolean) : []);

  const effectiveCompiled = compiledPrompt || rawPrompt;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 13, 0.82)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="prompt-inspector-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        style={{
          width: 'min(760px, 98%)',
          maxHeight: 'min(88vh, 820px)',
          background: '#10131d',
          border: '1px solid #23293f',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 32px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1e2436',
            background: 'linear-gradient(180deg, rgba(26, 32, 54, 0.6) 0%, rgba(16, 19, 29, 0.6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(0, 212, 255, 0.12)',
                border: '1px solid rgba(0, 212, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00d4ff',
              }}
            >
              <ScanSearch size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="inspector-title"
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Visual Director & Prompt Lifecycle Inspector
                </h2>
              </div>
              <p
                style={{
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  margin: '2px 0 0 0',
                }}
              >
                Full lifecycle audit: Raw User Input → Structured Visual Breakdown → Diffusion Dialect
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Inspector"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #283048',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Metadata Badges Bar */}
        <div
          style={{
            padding: '10px 24px',
            background: '#0c0e17',
            borderBottom: '1px solid #1a2030',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#c7d2fe',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Cpu size={12} style={{ color: '#818cf8' }} />
            <span>Refined by: {modelUsed}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: '#7dd3fc',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Sparkles size={12} style={{ color: '#00d4ff' }} />
            <span>Target Engine: {targetModel}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fde68a',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <Sliders size={12} style={{ color: '#f59e0b' }} />
            <span>Complexity: {complexityScore}/5</span>
          </div>

          {preserved.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)',
              }}
            >
              <Lock size={12} />
              <span>Identity Locked ({preserved.length})</span>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Section 1: Raw User Input */}
          <div
            style={{
              background: '#141824',
              border: '1px solid #23293e',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. What You Typed (Raw Input)
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  ({rawPrompt.length} chars)
                </span>
              </div>
              <button
                onClick={() => copyText(rawPrompt, false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: copiedRaw ? '#10b981' : '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {copiedRaw ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedRaw ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div
              style={{
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#e2e8f0',
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {rawPrompt || <span style={{ color: '#64748b', fontStyle: 'italic' }}>No prompt entered</span>}
            </div>
          </div>

          {/* Section 2: AI Visual Director Decomposition */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. AI Visual Director Breakdown (Structured Metadata)
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                5 Key Scene Vectors
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Subject */}
              <div
                style={{
                  background: '#141824',
                  border: '1px solid #23293e',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a5b4fc', fontSize: '11px', fontWeight: 700 }}>
                  <User size={13} />
                  <span>CENTRAL SUBJECT & ENTITY</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#f8fafc', lineHeight: '1.45' }}>
                  {meta.subject || <span style={{ color: '#64748b' }}>Default scene subject</span>}
                </div>
              </div>

              {/* Environment */}
              <div
                style={{
                  background: '#141824',
                  border: '1px solid #23293e',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
                  <Mountain size={13} />
                  <span>ENVIRONMENT & ATMOSPHERE</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#f8fafc', lineHeight: '1.45' }}>
                  {meta.environment || <span style={{ color: '#64748b' }}>Volumetric atmospheric scene</span>}
                </div>
              </div>

              {/* Lighting */}
              <div
                style={{
                  background: '#141824',
                  border: '1px solid #23293e',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: 700 }}>
                  <Sun size={13} />
                  <span>LIGHTING & SHADOW DYNAMICS</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#f8fafc', lineHeight: '1.45' }}>
                  {meta.lighting || <span style={{ color: '#64748b' }}>Cinematic volumetric illumination</span>}
                </div>
              </div>

              {/* Camera Optics */}
              <div
                style={{
                  background: '#141824',
                  border: '1px solid #23293e',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#34d399', fontSize: '11px', fontWeight: 700 }}>
                  <Camera size={13} />
                  <span>CAMERA, LENS & OPTICS</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#f8fafc', lineHeight: '1.45' }}>
                  {meta.camera_optics || <span style={{ color: '#64748b' }}>85mm f/1.4 shallow depth of field</span>}
                </div>
              </div>

              {/* Art Style */}
              <div
                style={{
                  background: '#141824',
                  border: '1px solid #23293e',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  gridColumn: '1 / -1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#f472b6', fontSize: '11px', fontWeight: 700 }}>
                  <Palette size={13} />
                  <span>ART STYLE & RENDERING ENGINE</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#f8fafc', lineHeight: '1.45' }}>
                  {meta.art_style || <span style={{ color: '#64748b' }}>Photorealistic 8K render</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2.5: Preserved Identity Features (Locked) */}
          <div
            style={{
              background: preserved.length > 0 ? 'rgba(16, 185, 129, 0.08)' : '#141824',
              border: `1px solid ${preserved.length > 0 ? 'rgba(16, 185, 129, 0.3)' : '#23293e'}`,
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={15} style={{ color: preserved.length > 0 ? '#10b981' : '#94a3b8' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: preserved.length > 0 ? '#34d399' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Identity & Face Likeness Protection
              </span>
            </div>

            {preserved.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {preserved.map((elem, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.18)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        color: '#6ee7b7',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <Lock size={12} style={{ color: '#10b981' }} />
                      <span>🔒 Authentic Face Structure Locked</span>
                      <span style={{ fontSize: '10.5px', color: '#a7f3d0' }}>({elem})</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                  Facial features are locked in structured memory across multi-turn Chat Copilot edits to prevent face drift.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                No facial identity locks active. Synthesis will freely generate subjects from prompt description.
              </p>
            )}
          </div>

          {/* Section 2.6: Negative Filtering Concepts (Avoid Tokens) */}
          {avoidTokens.length > 0 && (
            <div
              style={{
                background: '#141824',
                border: '1px solid #23293e',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Ban size={14} style={{ color: '#f43f5e' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Negative Visual Filtering (Suppressed Artifacts)
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {avoidTokens.map((token, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      color: '#fda4af',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}
                  >
                    ✕ {token}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Target Model Diffusion Compilation */}
          <div
            style={{
              background: 'linear-gradient(180deg, #161c2d 0%, #111420 100%)',
              border: '1px solid #2e3852',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} style={{ color: '#6366f1' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Compiled Diffusion Master Formula (Dispatched to Engine)
                </span>
              </div>
              <button
                onClick={() => copyText(effectiveCompiled, true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: copiedCompiled ? '#10b981' : '#818cf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copiedCompiled ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCompiled ? 'Copied Formula' : 'Copy Formula'}</span>
              </button>
            </div>
            <div
              style={{
                fontSize: '12.5px',
                lineHeight: '1.5',
                color: '#f1f5f9',
                fontFamily: 'monospace',
                background: '#090b12',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #1a2032',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {effectiveCompiled}
            </div>
            <p style={{ fontSize: '10.5px', color: '#94a3b8', margin: '8px 0 0 0' }}>
              ℹ️ Automatically translated into {targetModel.includes('FLUX') ? 'photographic natural-language narrative' : 'weighted bracketed prompt vectors'} by Enterprise Visual Director.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1e2436',
            background: '#0d101a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Enterprise Visual Director Engine • v2.4
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => copyText(effectiveCompiled, true)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #283048',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copiedCompiled ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
              <span>{copiedCompiled ? 'Copied' : 'Copy Master'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#6366f1',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
