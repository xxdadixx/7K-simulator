import React from 'react';
import { SET_OPTIONS, SUBSTAT_BASES } from '../utils/constants';
import { getSubstatValue, formatStatValue } from '../utils/helpers';

export const EquipmentBlock = ({ title, data, onChange, allowedMains }) => {
  const usedRolls = data.substats.reduce((sum, sub) => sum + sub.rolls, 0);
  const remainingRolls = 5 - usedRolls;

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
    
    if (usedByOthers + newVal > 5) {
      newVal = 5 - usedByOthers;
    }

    const newSubs = [...data.substats];
    newSubs[index].rolls = newVal;
    onChange({ ...data, substats: newSubs });
  };

  const mainStatKeys = allowedMains ? Object.keys(allowedMains) : Object.keys(SUBSTAT_BASES);

  return (
    <div className="flex flex-col h-full">
      {/* Header - ล้อตามดีไซน์ Header ของกล่องอื่นๆ ใน App.jsx */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-3 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-white font-bold tracking-widest text-xs">{title}</h2>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${remainingRolls === 0 ? "bg-slate-800 text-slate-400" : "bg-green-900/40 text-green-400"}`}>
          USABLE ROLLS: {remainingRolls}
        </span>
      </div>
      
      {/* Body - ใส่ Padding ให้เท่ากับ Card อื่นๆ จะได้ไม่เบียดขอบ */}
      <div className="p-4 flex flex-col gap-3">
        
        {/* Set Name */}
        <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider w-1/3">Set Name</span>
          <select className="w-2/3 bg-slate-950 border border-slate-600 rounded-lg outline-none text-xs p-1.5 text-white focus:border-green-400 transition-colors cursor-pointer"
            value={data.set} onChange={(e) => onChange({...data, set: e.target.value})}>
            {SET_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>

        {/* Main Stat */}
        <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 rounded-xl p-2.5">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider w-1/4">Main</span>
          <select className="w-1/2 bg-slate-950 border border-slate-600 rounded-lg outline-none text-xs p-1.5 text-white focus:border-yellow-500 transition-colors cursor-pointer"
            value={data.mainStat.type} onChange={(e) => updateMainStat(e.target.value)}>
            {mainStatKeys.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
          <span className="w-1/4 text-right text-white font-bold text-xs">
            {formatStatValue(data.mainStat.type, data.mainStat.value)}
          </span>
        </div>

        {/* Substats Section */}
        <div className="pt-1">
          {/* Header เล็กๆ สำหรับ Substats */}
          <div className="flex text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 pb-2">
            <div className="w-[55%]">Substats</div>
            <div className="w-[20%] text-center">Rolls</div>
            <div className="w-[25%] text-right">Value</div>
          </div>

          <div className="flex flex-col gap-1.5">
            {data.substats.map((sub, idx) => {
              const selectedByOthers = data.substats.filter((_, i) => i !== idx).map(s => s.type);

              return (
                <div key={idx} className="flex items-center bg-slate-800/20 border border-slate-700/30 rounded-lg p-1.5 hover:bg-slate-800/50 transition-colors">
                  <div className="w-[55%] pr-1">
                    <select className="w-full bg-slate-950 border border-slate-700 rounded-md outline-none text-[11px] p-1.5 text-slate-300 focus:border-white/30 cursor-pointer"
                      value={sub.type} onChange={(e) => updateSubstatType(idx, e.target.value)}>
                      {Object.keys(SUBSTAT_BASES).map(s => (
                        <option key={s} value={s} className="bg-slate-900 disabled:text-slate-600 disabled:bg-slate-950" disabled={selectedByOthers.includes(s)}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-[20%] flex justify-center">
                    <input 
                      type="number" min="0" max="5" 
                      className="w-10 bg-slate-950 border border-slate-600 rounded-md text-center text-[11px] text-white py-1.5 outline-none focus:border-green-400 transition-all disabled:opacity-50"
                      value={sub.rolls} onChange={(e) => updateSubstatRolls(idx, e.target.value)} 
                    />
                  </div>
                  <div className="w-[25%] text-right text-slate-100 text-[11px] font-bold">
                    {formatStatValue(sub.type, getSubstatValue(sub.type, sub.rolls))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};