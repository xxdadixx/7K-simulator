import React from 'react';
import { AnimatedStatRow } from './AnimatedStatRow';

export const FinalCombatStats = React.memo(({
  finalStats,
  snapshotStats,
  handleToggleSnapshot,
  isDarkMode = { isDarkMode }
}) => {
  return (
    <div className="relative z-50 flex flex-col">
      <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
        <div className="aurora-bg aurora-style-3"></div>
        <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">

        <div className="bg-(--card-header) p-3 sm:p-4 border-b border-(--border-color) rounded-t-3xl flex justify-between items-center">
          <h2 className="text-(--text-muted) font-semibold tracking-widest text-center text-xs uppercase pl-2">Final Combat Stats</h2>

          <div className="relative group">
            <button type="button" onClick={handleToggleSnapshot} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${snapshotStats ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' : 'bg-black/5 dark:bg-white/5 text-(--text-muted) border border-(--border-color) hover:bg-black/10 dark:hover:bg-white/10 hover:text-(--text-main)'}`}>
              {snapshotStats ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Compare ON
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Snap Stats
                </>
              )}
            </button>
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 w-52 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-(--border-color) shadow-2xl rounded-xl p-3 text-center translate-y-2 group-hover:translate-y-0">
              <span className="text-[10px] text-slate-700 dark:text-(--text-main) font-bold leading-relaxed block tracking-wide">{snapshotStats ? "Compare mode is active. Try changing gears to see the stat difference!" : "Snap current stats to compare them when you change equipment."}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 divide-(--border-color)">
          <div className="p-4 sm:p-6 space-y-3 md:border-b md:border-r xl:border-b-0 border-(--border-color)">
            {[
              { label: 'Attack', color: 'text-red-500', key: 'atk', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4" /></svg> },
              { label: 'Defense', color: 'text-blue-500', key: 'def', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
              { label: 'HP', color: 'text-green-500', key: 'hp', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
              { label: 'Speed', color: 'text-yellow-500', key: 'spd', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> }
            ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={false} textSize="text-[18px] sm:text-[22px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} isDarkMode={isDarkMode} />))}
          </div>

          <div className="p-4 sm:p-6 space-y-3 md:border-b xl:border-b-0 xl:border-r border-(--border-color)">
            {[
              { label: 'Crit Rate', color: 'text-red-500', key: 'critRate', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v8M8 12h8" /></svg> },
              { label: 'Crit Damage', color: 'text-red-500', key: 'critDmg', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> },
              { label: 'Weakness Hit', color: 'text-purple-500', key: 'weakness', icon: <svg width="18" height="18" fill="currentColor" viewBox="0 0 506.611 506.611" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M204.628,270.838c-14.057-11.962-15.759-33.124-3.806-47.181c6.359-7.488,15.664-11.781,25.503-11.781 c7.927,0,15.625,2.831,21.678,7.975l29.454,25.054c-1.598-26.976-23.764-48.424-51.141-48.424 c-28.41,0-51.437,23.026-51.437,51.437s23.026,51.437,51.437,51.437c3.614,0,7.134-0.392,10.538-1.1L204.628,270.838z"></path> <path d="M339.115,385.445c-30.896,24.92-70.111,39.923-112.799,39.923c-99.269,0-180.023-80.755-180.023-180.023 S127.047,65.321,226.316,65.321c99.268,0,180.024,80.755,180.024,180.023c0,32.445-8.75,62.816-23.83,89.132l35.812,30.467 c21.715-34.731,34.309-75.707,34.309-119.599c0-124.791-101.523-226.315-226.315-226.315C101.525,19.029,0,120.554,0,245.345 C0,370.136,101.525,471.66,226.316,471.66c56.811,0,108.764-21.095,148.553-55.797L339.115,385.445z"></path> <path d="M272.102,328.72c-13.588,7.497-29.195,11.781-45.786,11.781c-52.469,0-95.156-42.687-95.156-95.156 c0-52.469,42.687-95.156,95.156-95.156s95.157,42.687,95.157,95.156c0,11.427-2.133,22.348-5.844,32.513l36.77,31.278 c9.752-19.191,15.365-40.822,15.365-63.791c0-77.992-63.455-141.448-141.448-141.448c-77.992,0-141.449,63.457-141.449,141.448 c0,77.992,63.457,141.448,141.449,141.448c30.821,0,59.278-10.021,82.534-26.813L272.102,328.72z"></path> <path d="M454.449,439.023c1.434-1.702,2.457-3.596,3.213-5.565l48.949,2.735l-57.566-49.802l-17.633,7.928l-192.704-163.94 c-8.042-6.837-20.119-5.872-26.956,2.171c-6.847,8.042-5.872,20.11,2.18,26.957l194.472,165.44l-2.781,16.734l52.594,45.9 l-5.021-47.382C453.598,439.798,454.057,439.473,454.449,439.023z"></path></svg> }
            ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-base sm:text-[18px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} isDarkMode={isDarkMode} />))}
          </div>

          <div className="p-4 sm:p-6 space-y-3 md:border-r border-(--border-color)">
            {[
              { label: 'Block Rate', color: 'text-blue-400', key: 'block', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg> },
              { label: 'Dmg Reduction', color: 'text-blue-400', key: 'dmgReduc', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v8M9 13l3 3 3-3" /></svg> },
              { label: 'Effect Hit', color: 'text-cyan-500', key: 'effHit', icon: <svg width="22" height="22" fill="currentColor" viewBox="0 0 32 32"><path d="M30.794 20.61l-3.754 1.056 3.587-5.793-4.276 1.798 3.383-6.386-4.532 2.688 1.156-7.701-3.228 7.235-4.438-8.987 1.435 10.299-4.134-3.276 2.65 5.352-7.515-4.804 4.593-3.411-8.035-7.324h-6.424l0 4.085 5.741 4.407-3.752 3.625 14.703 9.829-5.232-0.367 5.819 4.777-4.839 0.34 7.081 2.537-0.287-4.307h-1.36c0-2.359-0.046-5.739 2.030-6.239-0.318-0.477-0.512-1.103-0.512-1.788 0-1.497 0.921-2.711 2.058-2.711s2.058 1.214 2.058 2.711c0 0.701-0.202 1.34-0.534 1.822 1.903 0.54 2.050 3.856 2.050 6.205h-1.433l-0.328 4.355 5.735-3.718-3.062 0.274 3.595-6.586z"></path></svg> },
              { label: 'Effect Res', color: 'text-cyan-500', key: 'effRes', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> }
            ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-base sm:text-[18px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} isDarkMode={isDarkMode} />))}
          </div>

          <div className="p-6 flex flex-col h-full">
            <div className="flex-1 bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col shadow-inner relative overflow-hidden">
              <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest mb-4 block text-center">Active Set Bonus</label>

              {finalStats.activeSetDetails && finalStats.activeSetDetails.length > 0 ? (
                <div className="w-full space-y-3 flex-1 pb-2">
                  {finalStats.activeSetDetails.map((set, idx) => (

                    <div
                      key={idx}
                      className="bg-(--card-bg) border border-(--border-color) border-l-4 border-l-(--accent) shadow-sm rounded-xl p-3 flex flex-col text-left transition-all"
                    >
                      <table className="w-full border-collapse m-0">
                        <tbody>
                          <tr>
                            <td className="align-middle w-full pr-2">
                              <div className="font-bold text-sm text-(--text-main) uppercase tracking-tight leading-tight block">
                                {set.name}
                              </div>
                            </td>
                            <td className="align-middle whitespace-nowrap">
                              <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border bg-(--input-bg) border-(--border-color) text-(--text-main)">
                                {set.count}-Set
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex flex-col space-y-1.5 mt-2">
                        {set.effects.map((eff, i) => (
                          <div key={i} className="text-[11px] font-bold text-(--accent) leading-tight flex items-start gap-1.5">
                            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-(--accent) mt-1"></div>
                            <span>{eff}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40">
                  <span className="text-(--text-muted) font-bold text-[10px] uppercase tracking-widest">No Active Set</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
});