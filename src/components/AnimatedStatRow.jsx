import React, { useState, useEffect } from 'react';

// Dictionary mapping each stat to its in-game mechanic description
const statDescriptions = {
    'Attack': 'Base damage for Physical and Magical attacks and skills.',
    'Defense': 'Reduces incoming Physical and Magical damage.',
    'HP': 'Maximum Health Points before the hero is defeated.',
    'Speed': 'Determines attack order and skill queue priority.',
    'Crit Rate': 'Chance to land a Critical Hit (deals 1.5x Damage).',
    'Crit Damage': 'Bonus damage multiplier applied when landing a Critical Hit.',
    'Weakness Hit': 'Chance to target the lowest HP enemy (deals 1.3x Damage).',
    'Block Rate': 'Chance to block incoming attacks, reducing damage by half.',
    'Dmg Reduction': 'Flat percentage reduction applied to all damage taken.',
    'Effect Hit': 'Increases the probability of inflicting debuffs on enemies.',
    'Effect Res': 'Increases resistance against incoming enemy debuffs.'
};

// Helper function to color-code the source dots
const getSourceColor = (label) => {
    const text = label.toLowerCase();
    if (text.includes('potential')) return 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]';
    if (text.includes('trans')) return 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]';
    if (text.includes('weapon') || text.includes('armor') || text.includes('jewel') || text.includes('accessory')) return 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]';
    return 'bg-slate-400';
};

export const AnimatedStatRow = ({ item, stat, isPercent, textSize = "text-sm", snapStat }) => {
    const currentTotal = (stat.base || 0) + (stat.totalChar || 0) + (stat.totalEquip || 0);
    const bonusTotal = (stat.totalChar || 0) + (stat.totalEquip || 0);

    const [isFlashing, setIsFlashing] = useState(false);
    const [prevValue, setPrevValue] = useState(currentTotal);

    if (currentTotal !== prevValue) {
        setPrevValue(currentTotal);
        setIsFlashing(true);
    }

    useEffect(() => {
        if (isFlashing) {
            const timer = setTimeout(() => setIsFlashing(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isFlashing]);

    const fmt = (v) => isPercent ? `${(v || 0).toFixed(1)}%` : Math.round(v || 0).toLocaleString();

    let diff = 0;
    let hasDiff = false;
    let diffStr = '';

    if (snapStat) {
        const snapTotal = (snapStat.base || 0) + (snapStat.totalChar || 0) + (snapStat.totalEquip || 0);
        diff = currentTotal - snapTotal;
        hasDiff = Math.abs(diff) > 0.01;
        if (hasDiff) {
            diffStr = isPercent
                ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
                : `${diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString()}`;
        }
    }

    const description = statDescriptions[item.label] || 'Improves combat performance.';

    return (
        <div className={`relative group flex justify-between items-center ${textSize} p-2 sm:p-3 mb-2 bg-(--card-bg) backdrop-blur-xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-2xl transition-all duration-300 ${isFlashing ? 'ring-2 ring-emerald-500 scale-[1.02] z-10' : 'hover:-translate-y-0.5 hover:shadow-lg hover:z-50'}`}>

            <div className={`flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2 transition-colors ${isFlashing ? 'text-emerald-400' : (item.color || 'text-(--text-main)')}`}>
                {item.icon && <span className="text-lg sm:text-xl opacity-90 shrink-0">{item.icon}</span>}
                <span className="font-bold tracking-wide truncate w-full block">
                    {item.label}
                </span>
            </div>

            <div className="flex flex-col items-end justify-center min-w-[75px] h-full">
                <span
                    key={currentTotal}
                    className={`font-bold tracking-widest transition-colors animate-value-change ${isFlashing ? 'text-emerald-400 ![text-shadow:0_0_8px_currentColor]' : 'text-(--text-main) dark:![text-shadow:none]'}`}
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.85rem' }}
                >
                    {fmt(currentTotal)}
                </span>
                {snapStat ? (
                    <div className="h-3 mt-1 flex items-center justify-end overflow-visible">
                        {hasDiff ? (
                            <span
                                className={`font-black tracking-widest animate-value-change ${diff > 0 ? 'text-emerald-500 drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]' : 'text-red-500 drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]'}`}
                                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}
                            >
                                {diffStr}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-(--text-muted) opacity-40">-</span>
                        )}
                    </div>
                ) : (
                    bonusTotal > 0 && (
                        <div className="h-3 mt-1 flex items-center justify-end overflow-visible">
                            <span className="text-emerald-500 font-bold tracking-widest drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.5rem' }}>
                                (+{fmt(bonusTotal)})
                            </span>
                        </div>
                    )
                )}
            </div>

            {/* 🌟 Upgraded Holographic Tooltip 🌟 */}
            <div className="hidden group-hover:flex flex-col absolute bottom-full right-0 mb-3 w-72 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-300 dark:border-(--border-color) shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-2xl p-4 pointer-events-none z-[100] origin-bottom-right transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">

                {/* 1. Header Area */}
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-(--border-color) pb-2 mb-2">
                    <div className={`flex items-center gap-2 ${item.color || 'text-(--text-main)'}`}>
                        <span className="text-xl drop-shadow-sm">{item.icon}</span>
                        <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-(--text-muted) bg-white dark:bg-white/10 px-2 py-1 rounded-full border border-slate-200 dark:border-(--border-color) shadow-sm">
                        Base: {fmt(stat.base)}
                    </span>
                </div>

                {/* 2. Mechanics Description */}
                <p className="text-[10px] text-slate-600 dark:text-(--text-muted) leading-relaxed mb-3 italic font-semibold">
                    "{description}"
                </p>

                {/* 3. Stat Sources Breakdown (Inner Panel) */}
                {stat.details.length > 0 && (
                    <div className="space-y-1.5 bg-white dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-(--border-color) shadow-inner">
                        <div className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-(--text-muted) font-extrabold mb-1.5 pl-1 flex items-center gap-1">
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            Bonus Sources
                        </div>
                        {stat.details.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] font-bold leading-tight">
                                <span className="text-slate-700 dark:text-(--text-main) flex items-center gap-2 truncate">
                                    <div className={`w-1.5 h-1.5 rounded-full ${getSourceColor(d.label)}`}></div>
                                    {d.label}
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-500 shrink-0">
                                    +{fmt(d.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Final Total Preview */}
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-(--border-color) flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-(--text-main)">Final Total</span>
                    <span className="text-sm font-black text-slate-800 dark:text-(--text-main)" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>
                        {fmt(currentTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
};