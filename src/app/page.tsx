'use client'

import React, { useState } from 'react'
import { Sparkles, Image as ImageIcon, Lock, Sliders, Download, Layers, ShieldCheck } from 'lucide-react'

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [batchCount, setBatchCount] = useState(1)
  const [isSeedLocked, setIsSeedLocked] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('2K')

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] font-sans">
      {/* Header */}
      <header className="border-b border-[#1E293B] bg-[#151D2F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00F2FE] to-[#4FACFE] flex items-center justify-center font-bold text-black shadow-lg shadow-[#00F2FE]/20">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              CraftAI <span className="text-[#00F2FE]">Studio</span>
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-300">
            <a href="#explore" className="text-[#00F2FE] hover:text-white transition">Explore Feed</a>
            <a href="#studio" className="hover:text-white transition">Creation Studio</a>
            <a href="#library" className="hover:text-white transition">Cloud Library</a>
            <div className="px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-xs font-semibold text-[#00F2FE] flex items-center gap-1.5">
              <span>✦ 120 Credits</span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero Section */}
        <section className="text-center py-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-xs font-semibold text-[#00F2FE] mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Studio & Creator Economy
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-white">
            Create, Remix & Earn with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] to-[#4FACFE]">CraftAI</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Free in-app studio creation with Pay-to-Download 4K gating, Consistent Character face locking, and encrypted prompt DRM royalties.
          </p>
        </section>

        {/* Studio Interactive Card */}
        <section id="studio" className="bg-[#151D2F] border border-[#1E293B] rounded-2xl p-8 shadow-2xl mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#00F2FE]" /> Generation Studio Bar
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">Model: <strong className="text-white">Flux.1 Schnell / SDXL</strong></span>
            </div>
          </div>

          {/* Prompt Input Box with Actions */}
          <div className="relative mb-6">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene or concept... (e.g. samurai girl in neon cyber city, volumetric rim light)"
              className="w-full bg-[#0B0F19] border border-[#1E293B] focus:border-[#00F2FE] rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none transition resize-none"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#00F2FE] flex items-center gap-1.5 transition">
                <Sparkles className="w-3.5 h-3.5" /> Enhance (Magic Expander)
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-purple-400 flex items-center gap-1.5 transition">
                <ShieldCheck className="w-3.5 h-3.5" /> ✨ AI Edit (Subject Lock)
              </button>
            </div>
          </div>

          {/* Studio Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-[#1E293B] text-sm">
            {/* Batch Count */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Batch Count</label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBatchCount(n)}
                    className={`w-9 h-9 rounded-lg font-bold transition ${batchCount === n ? 'bg-[#00F2FE] text-black' : 'bg-[#0B0F19] border border-[#1E293B] text-gray-300 hover:border-gray-500'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Lock */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Seed Lock</label>
              <button
                onClick={() => setIsSeedLocked(!isSeedLocked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition ${isSeedLocked ? 'bg-[#00F2FE]/10 border-[#00F2FE] text-[#00F2FE]' : 'bg-[#0B0F19] border-[#1E293B] text-gray-400'}`}
              >
                <Lock className="w-4 h-4" />
                {isSeedLocked ? 'Seed Locked (🔒)' : 'Random Seed'}
              </button>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00F2FE]"
              >
                <option value="Auto">Auto (Detect)</option>
                <option value="1:1">1:1 Square</option>
                <option value="9:16">9:16 Story/Reel</option>
                <option value="16:9">16:9 Widescreen</option>
                <option value="4:5">4:5 Portrait</option>
              </select>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">Resolution</label>
              <div className="flex items-center gap-2">
                {['HD', '2K', '4K'].map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${resolution === res ? 'bg-[#4FACFE] text-black' : 'bg-[#0B0F19] border border-[#1E293B] text-gray-400 hover:border-gray-500'}`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 flex justify-end">
            <button className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] text-black font-bold text-base shadow-lg shadow-[#00F2FE]/25 hover:opacity-95 transition flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Generate ✨ {batchCount * 2} Credits
            </button>
          </div>
        </section>

        {/* Explore Feed Masonry Preview */}
        <section id="explore" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Explore & Prompt Marketplace</h2>
              <p className="text-gray-400 text-sm">Remix trending prompts with 1-tap dual actions</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-[#1E293B] text-gray-300 font-medium">All</span>
              <span className="px-3 py-1.5 rounded-full bg-[#0B0F19] text-gray-400 hover:text-white transition cursor-pointer">Anime</span>
              <span className="px-3 py-1.5 rounded-full bg-[#0B0F19] text-gray-400 hover:text-white transition cursor-pointer">Cyberpunk</span>
              <span className="px-3 py-1.5 rounded-full bg-[#0B0F19] text-gray-400 hover:text-white transition cursor-pointer">Photorealism</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Neon Cyber Samurai", author: "@neo_artist", tag: "Cyberpunk", cut: "40% Royalty" },
              { title: "Ethereal Portrait 8K", author: "@studio_master", tag: "Photorealism", cut: "40% Royalty" },
              { title: "Futuristic Hypercar", author: "@mecha_labs", tag: "3D Render", cut: "30% Royalty" }
            ].map((card, i) => (
              <div key={i} className="bg-[#151D2F] border border-[#1E293B] rounded-2xl overflow-hidden hover:border-[#00F2FE]/50 transition group">
                <div className="h-64 bg-[#0B0F19] flex items-center justify-center text-gray-600 relative overflow-hidden">
                  <ImageIcon className="w-12 h-12 opacity-30" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-semibold text-[#00F2FE]">
                    {card.tag}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white group-hover:text-[#00F2FE] transition">{card.title}</h3>
                    <span className="text-xs text-green-400 font-semibold">{card.cut}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">By {card.author} • AES-256 Protected Recipe</p>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1E293B]">
                    <button className="py-2 px-3 rounded-lg bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] hover:bg-[#00F2FE]/20 text-xs font-semibold transition">
                      Use as Prompt
                    </button>
                    <button className="py-2 px-3 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-gray-300 text-xs font-semibold transition">
                      Use as Ref
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
