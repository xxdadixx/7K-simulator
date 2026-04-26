import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RING_OPTIONS } from '../utils/constants';
import { getTransColorClass } from '../utils/helpers';
import { GlassSelect } from './GlassSelect';

const MotionDiv = motion.div;

const getElementColorClass = (element) => {
  const el = element?.toUpperCase();
  if (el === 'ATTACK') return 'text-red-500';
  if (el === 'MAGIC') return 'text-blue-500';
  if (el === 'UNIVERSAL') return 'text-purple-500';
  if (el === 'DEFENSE') return 'text-amber-700';
  if (el === 'SUPPORT') return 'text-yellow-500';
  return 'text-(--text-main)';
};

const getElementBgClass = (element) => {
  const el = element?.toUpperCase();
  if (el === 'ATTACK') return 'bg-red-500/10 border-red-500/30';
  if (el === 'MAGIC') return 'bg-blue-500/10 border-blue-500/30';
  if (el === 'UNIVERSAL') return 'bg-purple-500/10 border-purple-500/30';
  if (el === 'DEFENSE') return 'bg-amber-700/10 border-amber-700/30';
  if (el === 'SUPPORT') return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-gray-500/10 border-gray-500/30';
};

const getTypeColorClass = (t) => {
  const type = t?.toUpperCase();
  if (type === 'ATTACK') return 'text-red-500';
  if (type === 'MAGIC') return 'text-blue-500';
  return 'text-(--text-main)';
};

const getGradeColorClass = (grade) => {
  const g = grade?.toUpperCase();
  if (g === 'LEGEND') return 'text-(--color-legend)';
  if (g === 'RARE') return 'text-(--color-rare)';
  return 'text-(--color-normal)';
};

const getGradeBgClass = (grade) => {
  const g = grade?.toUpperCase();
  if (g === 'LEGEND') return 'bg-(--color-legend)/10 border-(--color-legend)/30';
  if (g === 'RARE') return 'bg-(--color-rare)/10 border-(--color-rare)/30';
  return 'bg-(--color-normal)/10 border-(--color-normal)/30';
};

export const HeroSetupProfile = React.memo(({
  activeHero,
  heroDataList,
  setSelectedHeroName,
  transcend,
  setTranscend,
  ring,
  setRing,
  onReset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState('grid');
  const dropdownRef = useRef(null);

  // 🌟 1. สร้าง State และ Ref สำหรับเอฟเฟกต์ 3D Tilt 🌟
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, scale: 1 });

  const filteredHeroes = useMemo(() =>
    heroDataList.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [heroDataList, searchTerm]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // 🌟 2. ฟังก์ชันคำนวณการเอียงของการ์ดตามเมาส์ 🌟
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || activeHero.name === 'Unselected') return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // คำนวณองศาการเอียง (ปรับเลข 20 เพื่อเพิ่ม/ลดความชัน)
    const rotateX = ((y - centerY) / centerY) * -20;
    const rotateY = ((x - centerX) / centerX) * 20;

    setTilt({ x: rotateX, y: rotateY, scale: 1.05 });
  }, [activeHero.name]);

  const handleMouseLeave = useCallback(() => {
    // คืนค่ากลับที่เดิมเมื่อเอาเมาส์ออก
    setTilt({ x: 0, y: 0, scale: 1 });
  }, []);

  return (
    <div className={`relative w-full xl:w-[30%] flex flex-col transition-all duration-300 ${isDropdownOpen ? 'z-70' : 'z-30 hover:z-70 focus-within:z-70'}`}>
      <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
        <div className="aurora-bg aurora-style-1"></div>
        <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">

        <div className="bg-(--card-header) p-3 sm:p-4 border-b border-(--border-color) rounded-t-3xl flex justify-between items-center">
          <h2 className="text-(--text-muted) font-semibold tracking-widest text-xs uppercase pl-2">Hero Setup</h2>
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-xl hover:bg-rose-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Reset
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">

          {/* 🌟 โครงสร้างกรอบรูปภาพที่รองรับ 3D Parallax Tilt 🌟 */}
          <div key={activeHero.name} className="flex flex-col items-center justify-center -mt-2 animate-hero-swap" style={{ perspective: '1000px' }}>
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`relative w-[120px] aspect-156/194 md:w-[140px] rounded-2xl overflow-hidden border-2 shadow-xl flex items-center justify-center ease-out ${getGradeBgClass(activeHero.grade)} ${tilt.scale === 1 ? 'transition-all duration-500' : ''}`}
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.scale})`,
                transformStyle: 'preserve-3d',
                cursor: activeHero.name !== 'Unselected' ? 'crosshair' : 'default'
              }}
            >
              <img
                src={activeHero.name === 'Unselected' ? '/favicon.svg' : `/heroes/${activeHero.name}.png`}
                alt={activeHero.name}
                loading="lazy"
                decoding="async"
                className={`object-contain transition-all duration-500 drop-shadow-2xl ${activeHero.name === 'Unselected' ? 'w-12 h-12 opacity-20 grayscale' : 'w-[115%] h-[115%]'}`}
                style={{
                  transform: 'translateZ(40px)',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/favicon.svg';
                  e.target.className = 'w-10 h-10 opacity-20 grayscale';
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/30 to-transparent" style={{ transform: 'translateZ(10px)' }}></div>
            </div>

            <style>
              {`
                @keyframes breathe-effect {
                  0%, 100% { text-shadow: 0 0 8px currentColor, 0 0 15px currentColor; transform: translateY(0) scale(1); }
                  50% { text-shadow: 0 0 15px currentColor, 0 0 25px currentColor; transform: translateY(-2px) scale(1.05); }
                }
              `}
            </style>

            <h3
              className={`mt-5 uppercase tracking-widest transition-colors ${getGradeColorClass(activeHero.grade)}`}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '1.1rem',
                animation: activeHero.name !== 'Unselected' ? 'breathe-effect 2.5s ease-in-out infinite' : 'none'
              }}
            >
              {activeHero.name}
            </h3>

            {activeHero.name !== 'Unselected' ? (
              <div className="mt-1.5 flex items-center gap-1.5 animate-[pulse_1.5s_ease-in-out_infinite]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-(--text-muted)">Active Setup</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              </div>
            ) : (
              <div className="mt-1.5 h-[14px]"></div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1">Search Hero</label>
            <div className="relative">
              <input type="text" className={`w-full bg-(--input-bg) border border-(--input-border) rounded-2xl p-3.5 pl-10 font-semibold focus:ring-2 focus:ring-(--accent) outline-none transition-all shadow-[inset_0_1px_1px_var(--glass-inner)] ${getGradeColorClass(activeHero?.grade)}`} placeholder="Type to search..." value={isDropdownOpen ? searchTerm : activeHero?.name || ''} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} onFocus={() => { setIsDropdownOpen(true); setSearchTerm(''); }} />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg></div>
            </div>
            {isDropdownOpen && (
              <div className="glass-dropdown-menu absolute top-full mt-2 left-0 w-full overflow-hidden flex flex-col z-100 origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-end gap-1.5 p-2 border-b border-(--border-color) bg-black/5 dark:bg-white/5">
                  <button type="button" onClick={(e) => { e.preventDefault(); setSearchViewMode('list'); }} className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${searchViewMode === 'list' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:bg-black/10 dark:hover:bg-white/10'}`}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <button type="button" onClick={(e) => { e.preventDefault(); setSearchViewMode('grid'); }} className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${searchViewMode === 'grid' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:bg-black/10 dark:hover:bg-white/10'}`}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
                  </button>
                </div>

                <div className="max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar p-2">
                  <AnimatePresence mode="wait">
                    {filteredHeroes.length > 0 ? (
                      <MotionDiv
                        key={searchViewMode}
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={searchViewMode === 'list' ? 'flex flex-col gap-1' : 'grid grid-cols-3 sm:grid-cols-4 gap-2'}
                      >
                        {filteredHeroes.map(h => (
                          <button
                            key={h.name}
                            type="button"
                            onClick={() => { setSelectedHeroName(h.name); setIsDropdownOpen(false); setSearchTerm(''); }}
                            className={
                              searchViewMode === 'list'
                                ? "dropdown-item-hover w-full text-left px-4 py-3 flex justify-between items-center border border-transparent hover:border-(--border-color) rounded-xl"
                                : `relative aspect-156/194 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:z-10 shadow-sm group ${getGradeBgClass(h.grade)}`
                            }
                          >
                            {searchViewMode === 'list' ? (
                              <>
                                <span className={`font-semibold ${getGradeColorClass(h.grade)}`}>{h.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${getElementBgClass(h.element)} ${getElementColorClass(h.element)}`}>{h.element}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${getGradeBgClass(h.grade)}`}>{h.grade}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <img src={`/heroes/${h.name}.png`} alt={h.name} loading="lazy" decoding="async" className="w-full h-full object-contain bg-black/10 dark:bg-black/40 group-hover:brightness-110 transition-all" onError={(e) => { e.target.onerror = null; e.target.src = '/favicon.svg'; e.target.className = 'w-8 h-8 m-auto opacity-20 grayscale mt-6'; }} />
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-md px-1 py-1.5 border-t border-white/10"><span className={`block text-[9px] font-bold text-center truncate tracking-wider ${getGradeColorClass(h.grade)}`}>{h.name}</span></div>
                              </>
                            )}
                          </button>
                        ))}
                      </MotionDiv>
                    ) : (
                      <MotionDiv 
                        key="not-found"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="p-8 text-center text-(--text-muted) text-sm font-bold uppercase tracking-widest col-span-full"
                      >
                        No hero found
                      </MotionDiv>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex-1 min-w-0">
              <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1 truncate">Level</label>
              <div className="w-full bg-(--input-bg) text-red-500 text-center border border-(--border-color) rounded-2xl py-3 cursor-not-allowed font-bold text-sm shadow-[inset_0_1px_1px_var(--glass-inner)] truncate">
                {activeHero.name === 'Unselected' ? '-' : '30 (MAX)'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1 truncate">Trans</label>
              <div className="relative w-full">
                <GlassSelect
                  value={transcend}
                  onChange={(val) => setTranscend(Number(val))}
                  options={[
                    { label: 'None', value: 0, className: 'text-(--text-muted)' },
                    ...[...Array(12)].map((_, i) => { const val = i + 1; return { label: `★ ${val}`, value: val, className: val <= 6 ? 'text-[#3b82f6]' : 'text-[#ef4444]' }; })
                  ]}
                  className={getTransColorClass(transcend)}
                  centered={true}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1">Accessory Ring</label>
            <GlassSelect
              value={ring}
              onChange={(val) => setRing(Number(val))}
              options={[
                { label: 'None', value: 0, className: 'text-(--text-muted)' },
                ...RING_OPTIONS.map(r => ({ label: r.label, value: r.value }))
              ]}
              centered={true}
            />
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-(--border-color)">
            <div className="flex-1 bg-(--input-bg) rounded-2xl p-3 text-center border border-(--border-color)">
              <div className="text-[10px] text-(--text-muted) mb-1 uppercase">Element</div><div className={`font-bold text-sm ${getElementColorClass(activeHero.element)}`}>{activeHero.element}</div>
            </div>
            <div className="flex-1 bg-(--input-bg) rounded-2xl p-3 text-center border border-(--border-color)">
              <div className="text-[10px] text-(--text-muted) mb-1 uppercase">Type</div><div className={`font-bold text-sm ${getTypeColorClass(activeHero.type)}`}>{activeHero.type}</div>
            </div>
            <div className="flex-1 bg-(--input-bg) rounded-2xl p-3 text-center border border-(--border-color)">
              <div className="text-[10px] text-(--text-muted) mb-1 uppercase">Grade</div><div className={`font-bold text-sm ${getGradeColorClass(activeHero.grade)}`}>{activeHero.grade}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});