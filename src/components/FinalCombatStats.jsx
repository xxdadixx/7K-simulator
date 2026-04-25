import React from 'react';
import { AnimatedStatRow } from './AnimatedStatRow';

export const FinalCombatStats = React.memo(({
  finalStats,
  snapshotStats,
  handleToggleSnapshot
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

        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-(--border-color)">
          <div className="p-4 sm:p-6 space-y-3">
            {[
              { label: 'Attack', color: 'text-red-500', key: 'atk', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4" /></svg> },
              { label: 'Defense', color: 'text-blue-500', key: 'def', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
              { label: 'HP', color: 'text-green-500', key: 'hp', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
              { label: 'Speed', color: 'text-yellow-500', key: 'spd', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> }
            ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={false} textSize="text-[18px] sm:text-[22px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} />))}
          </div>

          <div className="p-4 sm:p-6 space-y-3">
            {[
              { label: 'Crit Rate', color: 'text-red-500', key: 'critRate', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v8M8 12h8" /></svg> },
              { label: 'Crit Damage', color: 'text-red-500', key: 'critDmg', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> },
              { label: 'Weakness Hit', color: 'text-purple-500', key: 'weakness', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> }
            ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-base sm:text-[18px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} />))}
          </div>

          <div className="p-4 sm:p-6 space-y-3">
            {[
              { label: 'Block Rate', color: 'text-blue-400', key: 'block', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg> },
              { label: 'Dmg Reduction', color: 'text-blue-400', key: 'dmgReduc', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v8M9 13l3 3 3-3" /></svg> },
              { label: 'Effect Hit', color: 'text-cyan-500', key: 'effHit', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 3l2.286 6.857L22 12l-6.714 2.143L13 21l-2.286-6.857L4 12l6.714-2.143L13 3z" /></svg> },
              { label: 'Effect Res', color: 'text-cyan-500', key: 'effRes', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> }
            ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-base sm:text-[18px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} />))}
          </div>

          <div className="p-6 flex flex-col h-full">
            <div className="flex-1 bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col shadow-inner relative overflow-hidden">
              <label className="text-[10px] text-(--text-muted) font-bold uppercase tracking-widest mb-4 block text-center">Active Set Bonus</label>
              {finalStats.activeSetDetails && finalStats.activeSetDetails.length > 0 ? (
                <div className="w-full space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  {finalStats.activeSetDetails.map((set, idx) => (
                    <div key={idx} className="bg-(--card-bg) backdrop-blur-xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-2xl p-3.5 flex flex-col gap-1.5 text-left relative overflow-hidden transition-all hover:scale-[1.02]">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-(--color-set)"></div>
                      <div className="flex justify-between items-center pl-2">
                        <span className="font-bold text-sm text-(--text-main) uppercase tracking-tight">{set.name}</span><span className="text-[10px] font-bold bg-(--color-set)/10 text-(--color-set) px-2.5 py-1 rounded-full border border-(--color-set)/20">{set.count}-Set</span>
                      </div>
                      <div className="pl-2 flex flex-col mt-1 space-y-1">{set.effects.map((eff, i) => (<span key={i} className="text-[11px] font-bold text-(--accent) leading-tight flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-(--accent)"></div>{eff}</span>))}</div>
                    </div>
                  ))}
                </div>
              ) : (<div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40"><span className="text-(--text-muted) font-bold text-[10px] uppercase tracking-widest">No Active Set</span></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});