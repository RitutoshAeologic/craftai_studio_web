"use client";

import React from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface ExploreFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  models: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  aspectRatios: string[];
  selectedAspectRatio: string;
  onSelectAspectRatio: (ratio: string) => void;
  onResetAll: () => void;
}

export function ExploreFilterBar({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  models,
  selectedModel,
  onSelectModel,
  aspectRatios,
  selectedAspectRatio,
  onSelectAspectRatio,
  onResetAll,
}: ExploreFilterBarProps) {
  const { colors } = useTheme();

  // Count active non-default filters
  const activeCount =
    (selectedCategory && selectedCategory.toLowerCase() !== "all" ? 1 : 0) +
    (selectedModel && selectedModel !== "All Models" ? 1 : 0) +
    (selectedAspectRatio && selectedAspectRatio !== "All" && selectedAspectRatio !== "All Ratios" ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  return (
    <div className="w-full space-y-3 pb-3">
      {/* 1. Integrated Search Bar */}
      <div
        style={{
          background: colors.surfaceLight,
          borderColor: colors.borderLight,
        }}
        className="relative flex items-center w-full h-11 px-3.5 border rounded-full focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-sm"
      >
        <Search style={{ color: colors.textMuted }} className="w-4 h-4 mr-2.5 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompts, artists, styles..."
          style={{ color: colors.textPrimary }}
          className="w-full bg-transparent text-sm placeholder:opacity-60 focus:outline-none"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            style={{ color: colors.textMuted }}
            className="p-1 hover:opacity-100 rounded-full transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Header & 3-Dropdown Filter Row */}
      <div className="flex items-center justify-between pt-1">
        <h2 style={{ color: colors.textPrimary }} className="text-base font-extrabold tracking-tight">Explore Feed</h2>
        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <span
              style={{
                color: colors.primary,
                background: `${colors.primary}18`,
                borderColor: `${colors.primary}40`,
              }}
              className="px-2.5 py-0.5 text-xs font-bold border rounded-full"
            >
              {activeCount} Active Filter{activeCount > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={onResetAll}
              style={{ color: colors.textSecondary }}
              className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Dropdown 1: Categories */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            style={{
              background: colors.surfaceLight,
              borderColor: selectedCategory && selectedCategory.toLowerCase() !== "all" ? colors.primary : colors.borderLight,
              color: selectedCategory && selectedCategory.toLowerCase() !== "all" ? colors.primary : colors.textSecondary,
            }}
            className="w-full h-10 pl-3.5 pr-8 text-xs font-semibold rounded-full border transition-all appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option
                key={cat}
                value={cat}
                style={{
                  background: colors.surface,
                  color: colors.textPrimary,
                }}
              >
                {cat.toLowerCase() === "all" ? "Categories (All)" : cat}
              </option>
            ))}
          </select>
          <ChevronDown style={{ color: colors.textMuted }} className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dropdown 2: Models */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            style={{
              background: colors.surfaceLight,
              borderColor: selectedModel && selectedModel !== "All Models" ? colors.primary : colors.borderLight,
              color: selectedModel && selectedModel !== "All Models" ? colors.primary : colors.textSecondary,
            }}
            className="w-full h-10 pl-3.5 pr-8 text-xs font-semibold rounded-full border transition-all appearance-none cursor-pointer"
          >
            {models.map((mod) => (
              <option
                key={mod}
                value={mod}
                style={{
                  background: colors.surface,
                  color: colors.textPrimary,
                }}
              >
                {mod === "All Models" ? "Models (All)" : mod}
              </option>
            ))}
          </select>
          <ChevronDown style={{ color: colors.textMuted }} className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dropdown 3: Aspect Ratio */}
        <div className="relative">
          <select
            value={selectedAspectRatio}
            onChange={(e) => onSelectAspectRatio(e.target.value)}
            style={{
              background: colors.surfaceLight,
              borderColor: selectedAspectRatio && selectedAspectRatio !== "All" && selectedAspectRatio !== "All Ratios" ? colors.primary : colors.borderLight,
              color: selectedAspectRatio && selectedAspectRatio !== "All" && selectedAspectRatio !== "All Ratios" ? colors.primary : colors.textSecondary,
            }}
            className="w-full h-10 pl-3.5 pr-8 text-xs font-semibold rounded-full border transition-all appearance-none cursor-pointer"
          >
            {aspectRatios.map((ratio) => (
              <option
                key={ratio}
                value={ratio}
                style={{
                  background: colors.surface,
                  color: colors.textPrimary,
                }}
              >
                {ratio === "All" || ratio === "All Ratios" ? "Aspect Ratio (All)" : ratio}
              </option>
            ))}
          </select>
          <ChevronDown style={{ color: colors.textMuted }} className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

