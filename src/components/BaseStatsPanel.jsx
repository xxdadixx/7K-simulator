import React from 'react';

export const BaseStatsPanel = React.memo(({
  activeHero,
  finalStats,
  potentials,
  handlePotentialChange,
  isDarkMode
}) => {
  return (
    <div className="relative z-30 w-full xl:w-[70%] flex flex-col">
      <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
        <div className="aurora-bg aurora-style-2"></div>
        <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="bg-(--card-header) p-4 border-b border-(--border-color) rounded-t-3xl">
          <h2 className="text-(--text-muted) font-semibold tracking-widest text-center text-xs uppercase">Base Stats & Potentials</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="hidden md:flex items-center text-[11px] text-(--text-muted) font-medium px-4 pb-2 border-b border-(--border-color) tracking-wider uppercase">
            <div className="w-1/4">Stat Type</div><div className="w-1/5 text-center">Base</div><div className="w-1/5 text-center">★ Transcend</div><div className="w-1/5 text-center">Poten Lv</div><div className="w-[15%] text-right">Poten Add</div>
          </div>
          {['atk', 'def', 'hp', 'spd'].map((statKey) => {
            const isAtk = statKey === 'atk'; const isDef = statKey === 'def'; const isHp = statKey === 'hp'; const isSpd = statKey === 'spd';
            const label = isAtk ? 'Attack' : isDef ? 'Defense' : isHp ? 'HP' : 'Speed';
            const colorClass = isAtk ? 'bg-red-500' : isDef ? 'bg-blue-500' : isHp ? 'bg-green-500' : 'bg-yellow-500';
            const baseValue = isAtk ? activeHero.baseAtk : isDef ? activeHero.baseDef : isHp ? activeHero.baseHp : activeHero.baseSpd;
            const transBonus = isSpd ? 0 : (isAtk ? finalStats.tAtk : isDef ? finalStats.tDef : finalStats.tHp);
            const potenValue = isSpd ? 0 : (isAtk ? finalStats.pAtk : isDef ? finalStats.pDef : finalStats.pHp);

            return (
              <div key={statKey} className="relative hover:z-20 flex flex-col md:flex-row md:items-center justify-between bg-(--input-bg) hover:bg-(--hover-bg) transition-colors p-4 rounded-2xl border border-(--border-color) gap-4 md:gap-0 shadow-[inset_0_1px_1px_var(--glass-inner)]">
                <div className="flex items-center gap-3 w-full md:w-1/4">
                  <div className={`w-1.5 h-6 rounded-full ${colorClass}`}></div>
                  <span className="font-bold text-(--text-main)">{label}</span>
                </div>
                <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                  <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Base</span>
                  <span className={`arcade-value-mini ${isDarkMode ? '' : '!text-slate-700 ![text-shadow:none]'}`}>{baseValue?.toLocaleString() || 0}</span>
                </div>
                <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                  <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Trans</span>
                  <span key={transBonus} className={`animate-value-change transition-colors ${isDarkMode ? 'arcade-value-bonus text-[#00bfff]' : 'text-blue-700 font-bold text-base'}`}>{isSpd ? '-' : `+${transBonus.toLocaleString()}`}</span>
                </div>
                
                <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                  <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Level</span>
                  
                  <div className={`flex items-center bg-(--bg-color) border border-(--border-color) rounded-lg shadow-sm h-8 w-24 sm:w-28 transition-all hover:border-(--accent)/50 ${isSpd ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                    
                    <div className="relative h-full flex items-center group">
                      <button 
                        type="button" 
                        onClick={() => handlePotentialChange(statKey, potentials[statKey] - 1)} 
                        disabled={potentials[statKey] <= 0 || isSpd} 
                        className="w-8 shrink-0 h-full flex items-center justify-center text-(--text-main) hover:bg-(--hover-bg) active:bg-(--border-color) disabled:opacity-30 transition-colors rounded-l-lg border-r border-(--border-color)"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 12H4" /></svg>
                      </button>

                      {!isSpd && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-1.5 z-50 pointer-events-none group-hover:pointer-events-auto">
                          <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <button 
                              type="button" 
                              onClick={() => handlePotentialChange(statKey, 0)} 
                              disabled={potentials[statKey] <= 0} 
                              className="w-10 py-1.5 flex items-center justify-center bg-(--card-bg) text-slate-500 dark:text-slate-400 hover:bg-slate-500 hover:text-white disabled:opacity-30 transition-colors border border-slate-500/30 rounded-md text-[9px] font-black tracking-wider shadow-xl backdrop-blur-xl"
                              title={`Reset ${label} Potential to 0`}
                            >
                              MIN
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`flex-1 w-full h-full text-center bg-(--input-bg) focus:bg-(--card-bg) focus:outline-none hide-spin-button !text-[13px] sm:!text-[15px] transition-colors ${isDarkMode ? 'arcade-value-mini' : 'text-slate-800 font-bold'}`} 
                      value={isSpd ? 0 : (potentials[statKey] === 0 ? '' : potentials[statKey])} 
                      disabled={isSpd} 
                      placeholder="0" 
                      onKeyDown={(e) => {
                        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                        if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => { 
                        const numericVal = e.target.value.replace(/[^0-9]/g, '');
                        let val = parseInt(numericVal, 10); 
                        if (isNaN(val)) val = 0; 
                        if (val > 30) val = 30;
                        handlePotentialChange(statKey, val); 
                      }} 
                    />

                    <div className="relative h-full flex items-center group">
                      <button 
                        type="button" 
                        onClick={() => handlePotentialChange(statKey, potentials[statKey] + 1)} 
                        disabled={potentials[statKey] >= 30 || isSpd} 
                        className="w-8 shrink-0 h-full flex items-center justify-center text-(--text-main) hover:bg-(--hover-bg) active:bg-(--border-color) disabled:opacity-30 transition-colors rounded-r-lg border-l border-(--border-color)"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                      </button>

                      {!isSpd && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-1.5 z-50 pointer-events-none group-hover:pointer-events-auto">
                          <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <button 
                              type="button" 
                              onClick={() => handlePotentialChange(statKey, 30)} 
                              disabled={potentials[statKey] >= 30} 
                              className="w-10 py-1.5 flex items-center justify-center bg-(--card-bg) text-amber-600 dark:text-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-30 transition-colors border border-amber-500/30 rounded-md text-[9px] font-black tracking-wider shadow-xl backdrop-blur-xl"
                              title={`Max out ${label} Potential to 30`}
                            >
                              MAX
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <div className="w-full md:w-[15%] flex justify-between md:justify-end items-center pr-2">
                  <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Poten Add</span>
                  <span key={potenValue} className={`animate-value-change transition-colors ${isDarkMode ? 'arcade-value-bonus text-[#ffd700]' : 'text-amber-700 font-bold text-base'}`}>{isSpd ? '-' : `+${potenValue.toLocaleString()}`}</span>
                </div>
              </div>
            );
          })}

          <div className="mt-2 pt-5 border-t border-(--border-color) flex flex-col gap-3">
            <div className="flex justify-between items-end px-1">
              <span className="text-[11px] text-(--text-muted) font-bold tracking-widest uppercase flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Total Raw Stats</span>
              <span className="text-[9px] text-(--text-muted) opacity-70 font-semibold uppercase tracking-wider">( Base + Trans + Poten )</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Attack', colorClass: 'red', base: activeHero.baseAtk || 0, trans: finalStats.tAtk || 0, poten: finalStats.pAtk || 0, val: (activeHero.baseAtk || 0) + (finalStats.tAtk || 0) + (finalStats.pAtk || 0), add: (finalStats.tAtk || 0) + (finalStats.pAtk || 0) },
                { label: 'Defense', colorClass: 'blue', base: activeHero.baseDef || 0, trans: finalStats.tDef || 0, poten: finalStats.pDef || 0, val: (activeHero.baseDef || 0) + (finalStats.tDef || 0) + (finalStats.pDef || 0), add: (finalStats.tDef || 0) + (finalStats.pDef || 0) },
                { label: 'HP', colorClass: 'green', base: activeHero.baseHp || 0, trans: finalStats.tHp || 0, poten: finalStats.pHp || 0, val: (activeHero.baseHp || 0) + (finalStats.tHp || 0) + (finalStats.pHp || 0), add: (finalStats.tHp || 0) + (finalStats.pHp || 0) },
                { label: 'Speed', colorClass: 'yellow', base: activeHero.baseSpd || 0, trans: 0, poten: 0, val: activeHero.baseSpd || 0, add: 0 }
              ].map(stat => (
                <div key={stat.label} className="bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative group transition-all hover:-translate-y-0.5">
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className={`absolute inset-0 bg-${stat.colorClass}-500/5 group-hover:bg-${stat.colorClass}-500/15 transition-colors`}></div>
                  </div>
                  
                  <span className={`relative z-10 text-xs md:text-sm font-bold text-${stat.colorClass}-500 mb-2 uppercase tracking-widest`}>{stat.label}</span>
                  
                  {/* 🌟 ลบ !important ออก และเปลี่ยนไปใช้ drop-shadow เช่นเดียวกัน 🌟 */}
                  <span key={stat.val} className={`relative z-10 animate-value-change transition-colors tracking-widest ${isDarkMode ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-slate-800 drop-shadow-sm'}`} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.1rem' }}>
                    {stat.val.toLocaleString()}
                  </span>

                  <div className="relative z-10 h-3 mt-1.5 flex items-center justify-center">
                    {stat.add > 0 && <span className="text-emerald-500 font-bold tracking-widest drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}>(+{stat.add.toLocaleString()})</span>}
                  </div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-48 sm:w-56 bg-(--card-bg) backdrop-blur-2xl border border-(--border-color) shadow-2xl rounded-2xl p-4">
                       <div className="text-[10px] text-(--text-muted) uppercase font-bold tracking-widest mb-3 pb-2 border-b border-(--border-color) text-left">
                         {stat.label} Sources
                       </div>
                       <div className="space-y-2 w-full text-left">
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-(--text-main)">Base</span>
                            <span className="font-bold text-(--text-main)">{stat.base.toLocaleString()}</span>
                         </div>
                         {stat.trans > 0 && (
                           <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-[#00bfff] dark:text-blue-400">★ Trans</span>
                             <span className="font-black text-[#00bfff] dark:text-blue-400">+{stat.trans.toLocaleString()}</span>
                           </div>
                         )}
                         {stat.poten > 0 && (
                           <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-amber-600 dark:text-amber-500">Potential</span>
                             <span className="font-black text-amber-600 dark:text-amber-500">+{stat.poten.toLocaleString()}</span>
                           </div>
                         )}
                         <div className="pt-2 mt-2 border-t border-(--border-color) flex justify-between items-center">
                             <span className="text-[10px] text-(--text-muted) uppercase font-bold tracking-widest">Total</span>
                             <span className={`text-sm font-black text-${stat.colorClass}-500`}>{stat.val.toLocaleString()}</span>
                         </div>
                       </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});