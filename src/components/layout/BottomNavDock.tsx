'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  Heart,
  Sliders,
  Sparkles,
  History,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface NavDockItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

/**
 * Main navigation items inside the primary container.
 * History is placed at the final position as requested.
 */
const MAIN_NAV_ITEMS: NavDockItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'explore', label: 'Explore Community', href: '/explore', icon: LayoutGrid },
  { id: 'favorites', label: 'Saved Favorites', href: '/saved', icon: Heart },
  { id: 'tools', label: 'Creative Tools', href: '/tools', icon: Sliders },
  { id: 'history', label: 'Generation History', href: '/library', icon: History },
];

export default function BottomNavDock() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [generateHovered, setGenerateHovered] = useState(false);

  // Hide on auth pages
  if (pathname.startsWith('/auth')) {
    return null;
  }

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isStudioActive = pathname.startsWith('/studio');

  return (
    <div
      aria-label="Bottom Quick Navigation Container"
      style={{
        position: 'fixed',
        bottom: '22px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* ── 1. Main Navigation Container (Home, Explore, Favorites, Tools, History) ── */}
      <nav
        aria-label="Main Navigation Dock"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: colors.glassSurface || (colors.isDark ? 'rgba(18, 18, 24, 0.88)' : 'rgba(255, 255, 255, 0.82)'),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${colors.glassBorder || (colors.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(99, 102, 241, 0.20)')}`,
          borderRadius: '9999px',
          boxShadow: colors.isDark
            ? '0 12px 40px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.15)'
            : '0 12px 32px rgba(15, 23, 42, 0.10), 0 0 1px rgba(99, 102, 241, 0.20)',
        }}
      >
        {MAIN_NAV_ITEMS.map((item) => {
          const active = isItemActive(item.href);
          const isHovered = hoveredItem === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Animated Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: colors.isDark ? '#090d16' : '#0f172a',
                    color: '#ffffff',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    pointerEvents: 'none',
                    zIndex: 60,
                  }}
                >
                  {item.label}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `5px solid ${colors.isDark ? '#090d16' : '#0f172a'}`,
                    }}
                  />
                </div>
              )}

              <Link
                href={item.href}
                id={`bottom-dock-btn-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '9999px',
                  background: active
                    ? (colors.isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.14)')
                    : isHovered
                    ? (colors.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                  border: active
                    ? `1px solid ${colors.primary}77`
                    : '1px solid transparent',
                  color: active
                    ? colors.primary
                    : isHovered
                    ? colors.textPrimary
                    : colors.textSecondary,
                  textDecoration: 'none',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <Icon
                  size={18}
                  style={{
                    fill: active && item.id === 'favorites' ? colors.primary : 'none',
                  }}
                />
              </Link>
            </div>
          );
        })}
      </nav>

      {/* ── 2. Separated Generate Image Action Container ────────────── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={() => setGenerateHovered(true)}
        onMouseLeave={() => setGenerateHovered(false)}
      >
        {/* Tooltip */}
        {generateHovered && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: colors.isDark ? '#090d16' : '#0f172a',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              pointerEvents: 'none',
              zIndex: 60,
            }}
          >
            Generate Image
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `5px solid ${colors.isDark ? '#090d16' : '#0f172a'}`,
              }}
            />
          </div>
        )}

        <Link
          href="/studio"
          id="bottom-dock-btn-generate"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 18px',
            borderRadius: '9999px',
            background: 'var(--grad-ai-cosmic, linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #06B6D4 100%))',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: isStudioActive
              ? '0 0 28px rgba(6, 182, 212, 0.65)'
              : '0 6px 22px rgba(99, 102, 241, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            transform: generateHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={16} />
          <span>Generate</span>
        </Link>
      </div>
    </div>
  );
}
