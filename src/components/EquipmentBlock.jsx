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
    if (usedByOthers + newVal > 5) newVal = 5 - usedByOthers;
    const newSubs = [...data.substats];
    newSubs[index].rolls = newVal;
    onChange({ ...data, substats: newSubs });
  };

  const mainStatKeys = allowedMains ? Object.keys(allowedMains) : Object.keys(SUBSTAT_BASES);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[var(--card-header)] p-4 border-b border-[var(--border-color)] flex justify-between items-center rounded-t-3xl">
        <h2 className="text-[var(--text-main)] font-semibold tracking-wide text-sm uppercase">{title}</h2>
        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${remainingRolls === 0 ? "bg-[var(--input-bg)] text-[var(--text-muted)]" : "bg-[var(--accent)] text-white"}`}>
          Usable Substats: {remainingRolls}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3">
          <span className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider w-1/3">Set Name</span>
          <select className="w-2/3 bg-transparent border-none outline-none text-sm p-0 text-[var(--text-main)] focus:ring-0 cursor-pointer appearance-none text-right font-medium"
            value={data.set} onChange={(e) => onChange({ ...data, set: e.target.value })}>
            {SET_OPTIONS.map(s => <option key={s} value={s} className="bg-[var(--bg-color)]">{s}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3">
          <span className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider w-1/4">Main</span>
          <select className="w-1/2 bg-transparent border-none outline-none text-sm p-0 text-[var(--text-main)] focus:ring-0 cursor-pointer appearance-none font-medium"
            value={data.mainStat.type} onChange={(e) => updateMainStat(e.target.value)}>
            {mainStatKeys.map(s => <option key={s} value={s} className="bg-[var(--bg-color)]">{s}</option>)}
          </select>
          <span className="w-1/4 text-right text-[var(--text-main)] font-semibold text-sm">
            {formatStatValue(data.mainStat.type, data.mainStat.value)}
          </span>
        </div>

        <div className="pt-2">
          {/* ปรับสัดส่วนความกว้างให้ปุ่ม +, - มีพื้นที่ (จาก 55/20/25 เป็น 50/25/25) */}
          <div className="flex text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider px-2 pb-2">
            <div className="w-[50%]">Substats</div>
            <div className="w-[25%] text-center">Rolls</div>
            <div className="w-[25%] text-right">Value</div>
          </div>

          <div className="flex flex-col gap-2">
            {data.substats.map((sub, idx) => {
              const selectedByOthers = data.substats.filter((_, i) => i !== idx).map(s => s.type);

              return (
                <div key={idx} className="flex items-center bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2 hover:bg-[var(--hover-bg)] transition-colors">
                  <div className="w-[50%] pr-1">
                    <select className="w-full bg-transparent border-none outline-none text-[12px] p-1 text-[var(--text-main)] focus:ring-0 cursor-pointer appearance-none font-medium"
                      value={sub.type} onChange={(e) => updateSubstatType(idx, e.target.value)}>
                      {Object.keys(SUBSTAT_BASES).map(s => (
                        <option key={s} value={s} className="bg-[var(--bg-color)] disabled:opacity-50" disabled={selectedByOthers.includes(s)}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[25%] flex justify-center">
                    {/* เปลี่ยนจากช่อง Input เป็นปุ่มกด สไตล์ Apple (Stepper UI) */}
                    <div className="flex items-center bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm h-7">

                      {/* ปุ่ม - (ลบ) */}
                      <button
                        onClick={() => updateSubstatRolls(idx, String(sub.rolls - 1))}
                        disabled={sub.rolls <= 0}
                        className="w-6 h-full flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)] disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>

                      {/* ตัวเลขตรงกลาง */}
                      <div className="w-5 h-full text-center text-[12px] font-bold text-[var(--text-main)] border-x border-[var(--border-color)] bg-[var(--input-bg)] flex items-center justify-center">
                        {sub.rolls}
                      </div>

                      {/* ปุ่ม + (บวก) */}
                      <button
                        onClick={() => updateSubstatRolls(idx, String(sub.rolls + 1))}
                        disabled={sub.rolls >= 5 || remainingRolls === 0}
                        className="w-6 h-full flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)] disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>

                    </div>
                  </div>

                  <div className="w-[25%] text-right text-[var(--text-main)] text-[12px] font-semibold pr-1">
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