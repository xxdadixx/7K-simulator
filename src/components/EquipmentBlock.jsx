import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SET_OPTIONS, SUBSTAT_BASES } from '../utils/constants';
import { getSubstatValue, formatStatValue } from '../utils/helpers';
import { GlassSelect } from './GlassSelect';

export const EquipmentBlock = ({ title, data, allowedMains, onChange, heroType, isWeapon }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const dropdownRef = useRef(null);

  // 🌟 OPTIMIZATION: Attach event listener ONLY when the dropdown is open
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const usedRolls = data.substats.reduce((sum, sub) => sum + sub.rolls, 0);
  const remainingRolls = 5 - usedRolls;

  // 🌟 OPTIMIZATION: Memoize the function to prevent recreation
  const getEquipmentImage = useCallback((setName) => {
    if (!setName || setName === 'None') return null;
    if (isWeapon) {
      const typeStr = heroType?.toUpperCase() === 'MAGIC' ? 'Magic' : 'Attack';
      return `/equipment/weapon_${setName}_${typeStr}.png`;
    } else {
      return `/equipment/armor_${setName}.png`;
    }
  }, [heroType, isWeapon]);

  const updateMainStat = (typeStr) => {
    let newValue = data.mainStat.value;
    if (allowedMains && allowedMains[typeStr] !== undefined) {
      newValue = allowedMains[typeStr];
    }
    onChange({ ...data, mainStat: { type: typeStr, value: newValue } });
  };

  const updateSubstatType = (index, typeStr) => {
    const newSubs = [...data.substats];
    newSubs[index].type = typeStr;
    onChange({ ...data, substats: newSubs });
  };

  const updateSubstatRolls = (index, rollStr) => {
    let newVal = parseInt(rollStr, 10);
    if (isNaN(newVal) || newVal < 0) newVal = 0;
    const currentRolls = data.substats[index].rolls;
    const usedByOthers = usedRolls - currentRolls;
    if (usedByOthers + newVal > 5) newVal = 5 - usedByOthers;
    const newSubs = [...data.substats];
    newSubs[index].rolls = newVal;
    onChange({ ...data, substats: newSubs });
  };

  const mainStatKeys = allowedMains ? Object.keys(allowedMains) : Object.keys(SUBSTAT_BASES);

  return (
    <div className={`relative flex flex-col h-full min-h-[500px] transition-all duration-300 ${isDropdownOpen ? 'z-[100]' : 'z-10 hover:z-[50] focus-within:z-[50]'}`}>
      <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) pointer-events-none">
        <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
      </div>

      <div className="relative z-20 flex flex-col h-full">
        {/* Header */}
        <div className="bg-(--card-header) p-4 border-b border-(--border-color) flex justify-between items-center gap-2 rounded-t-3xl">
          <h2 className="text-(--text-main) font-bold tracking-wide text-xs uppercase truncate min-w-0 flex items-center gap-1.5">
            {isWeapon ? '⚔️' : '🛡️'} {title}
          </h2>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border shadow-sm transition-all
            ${remainingRolls === 0
              ? "bg-(--input-bg) text-(--text-muted) border-(--border-color)"
              : "bg-(--accent)/10 text-(--accent) border-(--accent)/20"}`}>
            Usable Substats: {remainingRolls}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-6">

          <div className="flex items-center gap-4 bg-black/5 dark:bg-black/20 p-2 rounded-2xl border border-(--border-color) shadow-inner">
            <div className="w-16 h-16 shrink-0 bg-(--card-bg) border border-(--border-color) rounded-xl flex items-center justify-center overflow-hidden shadow-sm relative group">
              {data.set !== 'None' ? (
                <img
                  src={getEquipmentImage(data.set)}
                  alt={data.set}
                  // 🌟 OPTIMIZATION: Lazy loading
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/favicon.svg';
                    e.target.className = 'w-8 h-8 opacity-20 grayscale';
                  }}
                />
              ) : (
                <span className="text-[10px] text-(--text-muted) font-black uppercase tracking-widest opacity-40">Empty</span>
              )}
            </div>

            <div className="flex-1 w-full min-w-0 flex flex-col justify-center relative" ref={dropdownRef}>
              <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-1 block pl-1 text-left">Set Name</label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-(--input-bg) border rounded-xl p-3 flex justify-between items-center font-semibold text-sm outline-none transition-all shadow-[inset_0_1px_1px_var(--glass-inner)] text-(--text-main) ${isDropdownOpen ? 'border-(--accent) ring-2 ring-(--accent)/20' : 'border-(--border-color) hover:border-(--accent)/50'}`}
              >
                <span className="truncate">{data.set}</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-(--accent)' : 'text-(--text-muted)'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] glass-dropdown-menu flex flex-col overflow-hidden shadow-2xl border border-(--border-color) rounded-xl origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-end gap-1.5 p-2 border-b border-(--border-color) bg-black/5 dark:bg-white/5">
                    <button
                      onClick={(e) => { e.preventDefault(); setViewMode('list'); }}
                      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${viewMode === 'list' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:bg-black/10 dark:hover:bg-white/10'}`}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setViewMode('grid'); }}
                      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:bg-black/10 dark:hover:bg-white/10'}`}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
                    </button>
                  </div>

                  <div className="max-h-[260px] overflow-y-auto custom-scrollbar p-2 bg-(--card-bg) backdrop-blur-3xl">
                    {viewMode === 'list' ? (
                      <div className="flex flex-col gap-1">
                        {SET_OPTIONS.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`dropdown-item-hover w-full text-left px-3 py-2.5 flex justify-between items-center border border-transparent hover:border-(--border-color) rounded-lg font-semibold text-sm transition-colors ${data.set === s ? 'text-(--accent) bg-(--accent)/10' : 'text-(--text-main)'}`}
                            onClick={() => { onChange({ ...data, set: s }); setIsDropdownOpen(false); }}
                          >
                            {s}
                            {data.set === s && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {SET_OPTIONS.map(s => {
                          const imgSrc = getEquipmentImage(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { onChange({...data, set: s}); setIsDropdownOpen(false); }}
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:z-10 hover:shadow-lg group bg-black/10 dark:bg-black/40 ${data.set === s ? 'border-(--accent) ring-2 ring-(--accent)/50' : 'border-transparent hover:border-(--border-color)'}`}
                            >
                              {imgSrc ? (
                                <img 
                                  src={imgSrc} 
                                  alt={s} 
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-contain p-1 group-hover:scale-110 group-hover:brightness-110 transition-transform duration-300"
                                  onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src = '/favicon.svg'; 
                                    e.target.className = 'w-6 h-6 m-auto opacity-20 grayscale mt-4';
                                  }} 
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center opacity-40 bg-black/5 dark:bg-white/5">
                                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-md px-1 py-1.5 border-t border-white/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-y-full">
                                <span className={`block text-[10px] font-bold text-center truncate tracking-wider ${data.set === s ? 'text-(--accent)' : 'text-white'}`}>
                                  {s}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0 bg-(--input-bg) p-3 rounded-2xl border border-(--border-color) shadow-inner transition-colors">
            <label className="text-[11px] text-(--text-muted) font-bold uppercase tracking-wider pl-1">Main Stat</label>
            <div className="flex justify-between items-center gap-3">
              <div className="flex-1">
                <GlassSelect
                  value={data.mainStat.type}
                  onChange={(val) => updateMainStat(val)}
                  options={mainStatKeys.map(s => ({ label: s, value: s }))}
                  compact={true}
                />
              </div>

              <div className="arcade-led-board min-w-[100px]">
                <span key={data.mainStat.value} className="arcade-value-main animate-value-change">
                  {formatStatValue(data.mainStat.type, data.mainStat.value)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex text-[10px] text-(--text-muted) font-bold uppercase tracking-wider px-2 pb-2">
              <div className="w-[45%]">Substats</div>
              <div className="w-[20%] text-center">Rolls</div>
              <div className="w-[35%] text-right">Power</div>
            </div>

            <div className="flex flex-col gap-3">
              {data.substats.map((sub, idx) => {
                const selectedByOthers = data.substats.filter((_, i) => i !== idx).map(s => s.type);
                return (
                  <div key={idx} className="flex items-center gap-2 min-w-0">
                    <div className="w-[45%] min-w-0">
                      <GlassSelect
                        value={sub.type}
                        onChange={(val) => updateSubstatType(idx, val)}
                        options={Object.keys(SUBSTAT_BASES).map(s => ({
                          label: s,
                          value: s,
                          disabled: selectedByOthers.includes(s)
                        }))}
                        compact={true}
                      />
                    </div>

                    <div className="w-[20%] flex justify-center">
                      <div className="flex items-center bg-(--bg-color) border border-(--border-color) rounded-lg overflow-hidden h-7">
                        <button
                          type="button"
                          onClick={() => updateSubstatRolls(idx, String(sub.rolls - 1))}
                          disabled={sub.rolls <= 0}
                          className="w-5 h-full flex items-center justify-center text-(--text-main) hover:bg-(--hover-bg) disabled:opacity-20 cursor-pointer"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 12H4" /></svg>
                        </button>
                        <div className="w-5 h-full text-center text-[11px] font-bold text-(--text-main) border-x border-(--border-color) flex items-center justify-center">
                          {sub.rolls}
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSubstatRolls(idx, String(sub.rolls + 1))}
                          disabled={sub.rolls >= 5 || remainingRolls === 0}
                          className="w-5 h-full flex items-center justify-center text-(--text-main) hover:bg-(--hover-bg) disabled:opacity-20 cursor-pointer"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="w-[35%] flex justify-end">
                      <div className="arcade-led-board min-w-[70px]">
                        <span key={sub.rolls} className="arcade-value-sub animate-value-change">
                          {formatStatValue(sub.type, getSubstatValue(sub.type, sub.rolls))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};