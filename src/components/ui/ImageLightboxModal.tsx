"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Share2, Download, ZoomIn, RotateCcw } from "lucide-react";

export interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string; // e.g., "FLUX.1 Schnell • Text to Image"
  aspectRatio?: string; // e.g., "1:1", "16:9"
  isUnlocked?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  aspectRatio,
  isUnlocked,
  onDownload,
  onShare,
}: ImageLightboxModalProps) {
  const [scale, setScale] = useState(1.0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1.0);
      setTranslate({ x: 0, y: 0 });
      setShowControls(true);
    }
  }, [isOpen]);

  // Keyboard navigation: Esc to close, 0 / R to reset
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "0" || e.key.toLowerCase() === "r") {
        setScale(1.0);
        setTranslate({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Double-click toggle zoom (1.0x <-> 3.0x)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (scale > 1.1) {
      setScale(1.0);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(3.0);
      // Center zoom around click
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      setTranslate({ x: -clickX * 1.5, y: -clickY * 1.5 });
    }
  };

  // Scroll wheel zoom (1.0x to 5.0x)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => {
      const nextScale = Math.min(Math.max(prev * zoomFactor, 1.0), 5.0);
      if (nextScale <= 1.05) {
        setTranslate({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1.05) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1.05) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none transition-opacity duration-200"
      onClick={() => setShowControls((prev) => !prev)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      {/* Top Header Controls Overlay */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/85 via-black/50 to-transparent transition-all duration-200 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            aria-label="Close Lightbox"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-white truncate max-w-md">{title}</h2>}
            {subtitle && <p className="text-xs text-white/70 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {aspectRatio && (
            <span className="px-2.5 py-1 text-xs font-semibold text-white/90 bg-white/10 border border-white/20 rounded-full">
              {aspectRatio}
            </span>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className={`flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-full text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer ${
                isUnlocked
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
              }`}
              title={isUnlocked ? "Re-Download (Free)" : "Download 4K (2 Cr)"}
            >
              <Download className="w-4 h-4" />
              <span>{isUnlocked ? "Re-Download" : "Download 4K"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Interactive Artwork Display */}
      <div
        className="relative max-w-full max-h-full flex items-center justify-center cursor-zoom-in overflow-hidden p-4"
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={title || "Artwork Preview"}
          draggable={false}
          className={`max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-150 ease-out select-none ${
            scale > 1.05 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        />
      </div>

      {/* Bottom Floating Zoom Level & Reset Pill */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-200 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-white/20 text-xs font-medium text-white shadow-2xl backdrop-blur-md">
          <ZoomIn className="w-3.5 h-3.5 text-white/70" />
          <span>{scale > 1.05 ? `${scale.toFixed(1)}x Zoom` : "Click or Double-Click to Zoom"}</span>
          {scale > 1.05 && (
            <button
              onClick={() => {
                setScale(1.0);
                setTranslate({ x: 0, y: 0 });
              }}
              className="ml-2 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
