import React from 'react';
import { SET_OPTIONS, SUBSTAT_BASES } from '../utils/constants';
import { getSubstatValue, formatStatValue } from '../utils/helpers';
import { GlassSelect } from './GlassSelect';

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
    if (usedByOthers + newVal > 5) newVal = 5 - usedByOthers;
    const newSubs = [...data.substats];
    newSubs[index].rolls = newVal;
    onChange({ ...data, substats: newSubs });
  };

  const mainStatKeys = allowedMains ? Object.keys(allowedMains) : Object.keys(SUBSTAT_BASES);

  return (
    <div className="relative flex flex-col h-full min-h-[500px]">
      <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) pointer-events-none">
        <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
      </div>

      <div className="relative z-20 flex flex-col h-full">
        {/* Header */}
        <div className="bg-(--card-header) p-4 border-b border-(--border-color) flex justify-between items-center gap-2 rounded-t-3xl">
          <h2 className="text-(--text-main) font-bold tracking-wide text-xs uppercase truncate min-w-0">
            {title}
          </h2>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border shadow-sm transition-all
            ${remainingRolls === 0
              ? "bg-(--input-bg) text-(--text-muted) border-(--border-color)"
              : "bg-(--accent)/10 text-(--accent) border-(--accent)/20"}`}>
            Usable Substats: {remainingRolls}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Set Name */}
          <div className="min-w-0">
            <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1">Set Name</label>
            <GlassSelect
              value={data.set}
              onChange={(val) => onChange({ ...data, set: val })}
              options={SET_OPTIONS.map(s => ({ label: s, value: s }))}
            />
          </div>

          {/* Main Stat - จัด Layout ใหม่ออกแบบเป็นตู้ LED แยกฝั่งชัดเจน */}
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

              {/* ตู้ LED ของ Main Stat */}
              <div className="arcade-led-board min-w-[100px]">
                <span
                  key={data.mainStat.value}
                  className="arcade-value-main animate-value-change"
                >
                  {formatStatValue(data.mainStat.type, data.mainStat.value)}
                </span>
              </div>
            </div>
          </div>

          {/* Substats Table */}
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
                      {/* ตู้ LED ของ Sub Stat */}
                      <div className="arcade-led-board min-w-[70px]">
                        <span
                          key={sub.rolls} /* ตัวแปรนี้เปลี่ยน Animation จะเล่น */
                          className="arcade-value-sub animate-value-change"
                        >
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