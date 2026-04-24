import React, { useState, useMemo } from 'react';
import { WEAPON_MAIN_VALUES, ARMOR_MAIN_VALUES } from '../utils/constants';
import { EquipmentBlock } from './EquipmentBlock';

export const EquipmentSection = ({ equipment, setEquipment, validationMsg }) => {
  const [eqLayout, setEqLayout] = useState('row');

  const eqListConfig = useMemo(() => {
    const baseConfig = [
      { title: "Weapon 1", key: "weapon1", allowed: WEAPON_MAIN_VALUES },
      { title: "Weapon 2", key: "weapon2", allowed: WEAPON_MAIN_VALUES },
      { title: "Armor 1", key: "armor1", allowed: ARMOR_MAIN_VALUES },
      { title: "Armor 2", key: "armor2", allowed: ARMOR_MAIN_VALUES }
    ];
    if (eqLayout === 'grid') return [baseConfig[0], baseConfig[2], baseConfig[1], baseConfig[3]];
    return baseConfig;
  }, [eqLayout]);

  return (
    <div className="pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4 pb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-(--text-muted) font-semibold tracking-widest text-xs uppercase">Equipment Slots</h2>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${validationMsg.bg} ${validationMsg.border} ${validationMsg.color}`}>
            {validationMsg.status === 'success' && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            {validationMsg.status === 'warning' && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m-3-9h6l3 3v6l-3 3H9l-3-3V9l3-3z"/></svg>}
            {validationMsg.status === 'error' && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
            <span className="text-[10px] font-bold uppercase tracking-wider">{validationMsg.text}</span>
          </div>
        </div>

        <div className="flex bg-(--input-bg) p-1 rounded-xl border bordeborder-(--border-color)1">
          <button onClick={() => setEqLayout('row')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${eqLayout === 'row' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted)r:text-[var(--text-main)]'}`}>1 ROW</button>
          <button onClick={() => setEqLayout('grid')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${eqLayout === 'grid' ? 'bg-(--accent) text-white shadow-sm' : 'text-(--text-muted) hover:text-(--text-main)'}`}>2x2 GRID</button>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${eqLayout === 'row' ? 'xl:grid-cols-4' : 'xl:grid-cols-2 max-w-4xl mx-auto'} gap-6 pt-2`}>
        {eqListConfig.map((eq, idx) => {
          const auroraClasses = ['aurora-style-4', 'aurora-style-1', 'aurora-style-2', 'aurora-style-3'];
          return (
            <div key={eq.key} className="relative flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
                <div className={`aurora-bg ${auroraClasses[idx]}`}></div>
                <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) rounded-3xl transition-colors duration-400"></div>
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <EquipmentBlock title={eq.title} data={equipment[eq.key]} allowedMains={eq.allowed} onChange={v => setEquipment({ ...equipment, [eq.key]: v })} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};