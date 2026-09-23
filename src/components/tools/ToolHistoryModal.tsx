'use client';

import React, { useEffect } from 'react';
import { X, History, Sparkles, Download, ArrowRight, ExternalLink, Calendar, Zap } from 'lucide-react';
import type { ToolHistoryItem } from '@/lib/api/toolsApi';
import Link from 'next/link';

interface ToolHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ToolHistoryItem[];
  isLoading: boolean;
  onSelectImage: (url: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ToolHistoryModal({
  isOpen,
  onClose,
  items,
  isLoading,
  onSelectImage,
  onLoadMore,
  hasMore = false,
}: ToolHistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="tool-history-title"
        style={{
          width: 'min(780px, 98%)',
          maxHeight: 'min(86vh, 800px)',
          background: '#10131d',
          border: '1px solid #23293f',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 32px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
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
              <History size={20} />
            </div>
            <div>
              <h2
                id="tool-history-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                Creative Tools Execution History
              </h2>
              <p
                style={{
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  margin: '2px 0 0 0',
                }}
              >
                Audit ledger of processed cutouts, AI backdrops, outpaint expands, and upscales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close History"
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
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '3px solid #1e2436',
                  borderTopColor: '#00d4ff',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <span style={{ fontSize: '13px' }}>Loading tool history...</span>
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                color: '#64748b',
                background: '#0c0e17',
                borderRadius: '12px',
                border: '1px dashed #1e2436',
              }}
            >
              <History size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                No Tool History Found
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Execute any creative skill (Remove BG, AI Background, AI Expand, Upscale) to see audit logs here.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#141824',
                  border: '1px solid #23293e',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                  <img
                    src={item.output_image_url}
                    alt={item.tool_type}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      background: '#080c14',
                      border: '1px solid #283048',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#c7d2fe',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.tool_type.replace(/_/g, ' ')}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: item.credits_consumed > 0 ? '#f59e0b' : '#10b981',
                          fontWeight: 600,
                        }}
                      >
                        {item.credits_consumed > 0 ? `${item.credits_consumed} Cr` : 'Free (0 Cr)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                      <Calendar size={11} />
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                      {item.latency_ms ? <span>· {item.latency_ms}ms</span> : null}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      onSelectImage(item.output_image_url);
                      onClose();
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid #283048',
                      color: '#e2e8f0',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Load in Tool
                  </button>

                  <Link
                    href={`/remix?anchorImageUrl=${encodeURIComponent(item.output_image_url)}&initialPrompt=${encodeURIComponent(`Refine ${item.tool_type.replace(/_/g, ' ')}`)}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#c7d2fe',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Zap size={11} />
                    <span>⚡ Remix in Lab</span>
                  </Link>

                  <a
                    href={item.output_image_url}
                    download={`craftai-${item.tool_type}.png`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid #283048',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Download size={13} />
                  </a>
                </div>
              </div>
            ))
          )}

          {hasMore && onLoadMore && (
            <div style={{ textAlign: 'center', paddingTop: '10px' }}>
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#c7d2fe',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isLoading ? 'Fetching older records...' : 'Load More Previous Generations'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1e2436',
            background: '#0d101a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            FastAPI v1.4.0 Dual-Parity Audit Ledger
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              background: '#6366f1',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
