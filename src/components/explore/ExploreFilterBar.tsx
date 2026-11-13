"use client";

import React from "react";
import { Search, X, ChevronDown } from "lucide-react";

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
  // Count active non-default filters
  const activeCount =
    (selectedCategory && selectedCategory.toLowerCase() !== "all" ? 1 : 0) +
    (selectedModel && selectedModel !== "All Models" ? 1 : 0) +
    (selectedAspectRatio && selectedAspectRatio !== "All" && selectedAspectRatio !== "All Ratios" ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  return (
    <div className="w-full space-y-3 pb-3">
      {/* 1. Integrated Search Bar */}
      <div className="relative flex items-center w-full h-11 px-3.5 bg-[#1E1E2A]/90 border border-[#2E2E3E] rounded-full focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-sm">
        <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompts, artists, styles..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Header & 3-Dropdown Filter Row */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-extrabold text-white tracking-tight">Explore Feed</h2>
        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
              {activeCount} Active Filter{activeCount > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={onResetAll}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
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
            className={`w-full h-10 pl-3.5 pr-8 text-xs font-semibold rounded-full border transition-all appearance-none cursor-pointer ${
              selectedCategory && selectedCategory.toLowerCase() !== "all"
                ? "border-indigo-500 bg-indigo-500/15 text-indigo-300"
                : "border-[#2E2E3E] bg-[#1E1E2A] text-slate-200 hover:border-slate-500"
            }`}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#121218] text-white">
                {cat.toLowerCase() === "all" ? "Categories (All)" : cat}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dropdown 2: Models */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className={`w-full h-10 pl-3.5 pr-8 text-xs font-semibold rounded-full border transition-all appearance-none cursor-pointer ${
              selectedModel && selectedModel !== "All Models"
                ? "border-indigo-500 bg-indigo-500/15 text-indigo-300"
                : "border-[#2E2E3E] bg-[#1E1E2A] text-slate-200 hover:border-slate-500"
            }`}
          >
            {models.map((mod) => (
              <option key={mod} value={mod} className="bg-[#121218] text-white">
                {mod === "All Models" ? "Models (All)" : mod}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dropdown 3: Aspect Ratio */}
        <div className="relative">
          <select
            value={selectedAspectRatio}
            onChange={(e) => onSelectAspectRatio(e.target.value)}
            className={`w-full h-10 pl-3.5 pr-8 text-xs font-semibold rounded-full border transition-all appearance-none cursor-pointer ${
              selectedAspectRatio && selectedAspectRatio !== "All" && selectedAspectRatio !== "All Ratios"
                ? "border-indigo-500 bg-indigo-500/15 text-indigo-300"
                : "border-[#2E2E3E] bg-[#1E1E2A] text-slate-200 hover:border-slate-500"
            }`}
          >
            {aspectRatios.map((ratio) => (
              <option key={ratio} value={ratio} className="bg-[#121218] text-white">
                {ratio === "All" || ratio === "All Ratios" ? "Aspect Ratio (All)" : ratio}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

