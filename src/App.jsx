import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RING_OPTIONS, WEAPON_MAIN_VALUES, ARMOR_MAIN_VALUES } from './utils/constants';
import { parseCSVData, getTranscendBonus, getSubstatValue, calculateSetBonus, getValidationStatus, getPotentialValue } from './utils/helpers';
import { GridHeader } from './components/GridHeader';
import { EquipmentBlock } from './components/EquipmentBlock';

// คอมโพเนนต์สำหรับแสดงแถวสเตตัส (ปรับให้ดูนุ่มนวลขึ้น ไม่มีเส้นใต้แข็งๆ)
const AnimatedStatRow = ({ item, stat, isPercent, textSize = "text-sm" }) => {
  const total = stat ? (stat.base + (stat.totalChar || 0) + (stat.totalEquip || 0)) : 0;
  
  const [isFlashing, setIsFlashing] = useState(false);
  const prevTotal = useRef(total);

  useEffect(() => {
    if (!stat) return; 
    
    if (prevTotal.current !== total) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 500); 
      prevTotal.current = total; 
      return () => clearTimeout(timer);
    }
  }, [total, stat]);

  if (!stat) return null;

  const fmt = (val) => isPercent ? `${val}%` : val.toLocaleString();

  return (
    <div className={`relative group flex justify-between items-center ${textSize} py-1.5 border-b border-white/5 last:border-0 cursor-help px-2 rounded transition-all duration-300 ${isFlashing ? 'bg-green-900/40 scale-[1.02] border-transparent z-10 shadow-lg' : 'hover:bg-slate-800/50'}`}>
      <span className={`${item.color} font-bold tracking-wide`}>{item.label}</span>
      
      <div className="flex items-center gap-1.5">
        <span className={`font-bold transition-colors duration-300 ${isFlashing ? 'text-green-300 drop-shadow-[0_0_8px_rgba(74,222,128,1)]' : 'text-slate-100'}`}>
          {fmt(total)}
        </span>
        
        {stat.totalChar > 0 && <span className="text-yellow-300 text-[10px] font-bold bg-yellow-900/30 px-1 rounded">(+{fmt(stat.totalChar)})</span>}
        {stat.totalEquip > 0 && <span className="text-green-400 text-[10px] font-bold bg-green-900/30 px-1 rounded">(+{fmt(stat.totalEquip)})</span>}
      </div>

      {stat.details.length > 0 && (
        <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-56 bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-3 z-50 pointer-events-none">
          <div className="text-[11px] font-bold text-white border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
            <span className="text-slate-300 uppercase">{item.label}</span>
            <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full">Base: {fmt(stat.base)}</span>
          </div>
          <div className="space-y-1">
            {stat.details.map((d, i) => (
              <div key={i} className={`flex justify-between text-[10px] ${d.color} leading-tight`}>
                <span>{d.label}</span>
                <span className="font-bold">+{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [heroDataList, setHeroDataList] = useState([]);
  const [selectedHeroName, setSelectedHeroName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcend, setTranscend] = useState(6);
  const [ring, setRing] = useState(5);
  const [potentials, setPotentials] = useState({ atk: 0, def: 0, hp: 0 });

  const defaultSubstats = () => [
    { type: 'Attack %', rolls: 0 },
    { type: 'Defense %', rolls: 0 },
    { type: 'HP %', rolls: 0 },
    { type: 'Speed', rolls: 0 }
  ];

  const [equipment, setEquipment] = useState({
    weapon1: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
    weapon2: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
    armor1: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() },
    armor2: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() }
  });

  useEffect(() => {
    fetch('../public/DATA.csv')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then(text => {
        const parsed = parseCSVData(text);
        if (parsed.length > 0) {
          setHeroDataList(parsed);
          setSelectedHeroName(parsed[0].name);
        } else {
          throw new Error("Parsed data is empty. Check CSV format.");
        }
      })
      .catch(err => {
        console.error("Error loading CSV:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const activeHero = useMemo(() => heroDataList.find(h => h.name === selectedHeroName) || null, [heroDataList, selectedHeroName]);

  const finalStats = useMemo(() => {
    if (!activeHero) return null;

    let totals = {
      'Attack %': 0, 'Attack Flat': 0, 'Defense %': 0, 'Defense Flat': 0,
      'HP %': 0, 'HP Flat': 0, 'Speed': 0,
      'Crit Rate': 0, 'Crit Damage': 0,
      'Weakness Hit Chance': 0, 'Block Rate': 0, 'Damage Taken Reduction': 0,
      'Effect Hit Rate': 0, 'Effect Resistance': 0
    };

    Object.values(equipment).forEach(eq => {
      if (eq.set === 'None') return;
      totals[eq.mainStat.type] = (totals[eq.mainStat.type] || 0) + eq.mainStat.value;
      eq.substats.forEach(sub => {
        totals[sub.type] = (totals[sub.type] || 0) + getSubstatValue(sub.type, sub.rolls);
      });
    });

    const eqList = [equipment.weapon1.set, equipment.weapon2.set, equipment.armor1.set, equipment.armor2.set];
    const setCounts = {};
    eqList.forEach(s => { setCounts[s] = (setCounts[s] || 0) + 1; });

    const vanguardAtkPct = setCounts['Vanguard'] === 4 ? 45 : (setCounts['Vanguard'] >= 2 ? 20 : 0);
    const guardianDefPct = setCounts['Guardian'] === 4 ? 45 : (setCounts['Guardian'] >= 2 ? 20 : 0);
    const paladinHpPct = setCounts['Paladin'] === 4 ? 40 : (setCounts['Paladin'] >= 2 ? 17 : 0);

    const assassinCR = setCounts['Assassin'] === 4 ? 30 : (setCounts['Assassin'] >= 2 ? 15 : 0);
    const bountyWK = setCounts['Bounty Tracker'] === 4 ? 35 : (setCounts['Bounty Tracker'] >= 2 ? 15 : 0);
    const gatekeeperBLK = setCounts['Gatekeeper'] === 4 ? 30 : (setCounts['Gatekeeper'] >= 2 ? 15 : 0);
    const spellweaverEFF = setCounts['Spellweaver'] === 4 ? 35 : (setCounts['Spellweaver'] >= 2 ? 17 : 0);
    const vanguardEFF = setCounts['Vanguard'] === 4 ? 20 : 0;
    const orchestratorRES = setCounts['Orchestrator'] === 4 ? 35 : (setCounts['Orchestrator'] >= 2 ? 17 : 0);
    const guardianRES = setCounts['Guardian'] === 4 ? 20 : 0;

    let t4CR = 0, t4CDM = 0, t4WK = 0, t4BLK = 0, t4RED = 0, t4EFF = 0;
    if (transcend >= 4) {
      switch (activeHero.star4Type) {
        case 'CR': t4CR = 18; break;
        case 'CDM': t4CDM = 24; break;
        case 'WK': t4WK = 20; break;
        case 'BLK': t4BLK = 18; break;
        case 'RED': t4RED = 10; break;
        case 'EFF': t4EFF = 24; break;
        default: break;
      }
    }

    const tAtk = getTranscendBonus(activeHero.baseAtk, activeHero.grade, activeHero.starType, 'Attack', transcend);
    const tDef = getTranscendBonus(activeHero.baseDef, activeHero.grade, activeHero.starType, 'Defense', transcend);
    const tHp = getTranscendBonus(activeHero.baseHp, activeHero.grade, activeHero.starType, 'HP', transcend);

    const pAtk = getPotentialValue('atk', potentials.atk);
    const pDef = getPotentialValue('def', potentials.def);
    const pHp = getPotentialValue('hp', potentials.hp);

    const atkPctVal = Math.floor(activeHero.baseAtk * totals['Attack %'] / 100);
    const atkSetVal = Math.floor(activeHero.baseAtk * vanguardAtkPct / 100);
    const atkRingVal = Math.floor(activeHero.baseAtk * ring / 100);

    const defPctVal = Math.floor(activeHero.baseDef * totals['Defense %'] / 100);
    const defSetVal = Math.floor(activeHero.baseDef * guardianDefPct / 100);
    const defRingVal = Math.floor(activeHero.baseDef * ring / 100);

    const hpPctVal = Math.floor(activeHero.baseHp * totals['HP %'] / 100);
    const hpSetVal = Math.floor(activeHero.baseHp * paladinHpPct / 100);
    const hpRingVal = Math.floor(activeHero.baseHp * ring / 100);

    const breakdown = {
      atk: {
        base: activeHero.baseAtk, totalChar: (304 * 2) + tAtk + pAtk, totalEquip: totals['Attack Flat'] + atkPctVal + atkSetVal + atkRingVal,
        details: [
          { label: '[Char] Level Base Bonus', value: 304 * 2, color: 'text-yellow-300' },
          { label: '[Char] Transcend', value: tAtk, color: 'text-yellow-300' },
          { label: '[Char] Potential', value: pAtk, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Flat', value: totals['Attack Flat'], color: 'text-green-400' },
          { label: `[Equip] Main/Sub (${totals['Attack %']}%)`, value: atkPctVal, color: 'text-green-400' },
          { label: `[Equip] Vanguard Set (${vanguardAtkPct}%)`, value: atkSetVal, color: 'text-green-400' },
          { label: `[Equip] Ring (${ring}%)`, value: atkRingVal, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      def: {
        base: activeHero.baseDef, totalChar: (189 * 2) + tDef + pDef, totalEquip: totals['Defense Flat'] + defPctVal + defSetVal + defRingVal,
        details: [
          { label: '[Char] Level Base Bonus', value: 189 * 2, color: 'text-yellow-300' },
          { label: '[Char] Transcend', value: tDef, color: 'text-yellow-300' },
          { label: '[Char] Potential', value: pDef, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Flat', value: totals['Defense Flat'], color: 'text-green-400' },
          { label: `[Equip] Main/Sub (${totals['Defense %']}%)`, value: defPctVal, color: 'text-green-400' },
          { label: `[Equip] Guardian Set (${guardianDefPct}%)`, value: defSetVal, color: 'text-green-400' },
          { label: `[Equip] Ring (${ring}%)`, value: defRingVal, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      hp: {
        base: activeHero.baseHp, totalChar: (1079 * 2) + tHp + pHp, totalEquip: totals['HP Flat'] + hpPctVal + hpSetVal + hpRingVal,
        details: [
          { label: '[Char] Level Base Bonus', value: 1079 * 2, color: 'text-yellow-300' },
          { label: '[Char] Transcend', value: tHp, color: 'text-yellow-300' },
          { label: '[Char] Potential', value: pHp, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Flat', value: totals['HP Flat'], color: 'text-green-400' },
          { label: `[Equip] Main/Sub (${totals['HP %']}%)`, value: hpPctVal, color: 'text-green-400' },
          { label: `[Equip] Paladin Set (${paladinHpPct}%)`, value: hpSetVal, color: 'text-green-400' },
          { label: `[Equip] Ring (${ring}%)`, value: hpRingVal, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      spd: {
        base: activeHero.baseSpd, totalChar: 0, totalEquip: totals['Speed'],
        details: [{ label: '[Equip] Main/Sub Stats', value: totals['Speed'], color: 'text-green-400' }].filter(d => d.value > 0)
      },
      critRate: {
        base: 5, totalChar: t4CR, totalEquip: assassinCR + totals['Crit Rate'],
        details: [
          { label: '[Char] Star 4 Bonus', value: t4CR, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Stats', value: totals['Crit Rate'], color: 'text-green-400' },
          { label: '[Equip] Assassin Set', value: assassinCR, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      critDmg: {
        base: 150, totalChar: t4CDM, totalEquip: totals['Crit Damage'],
        details: [
          { label: '[Char] Star 4 Bonus', value: t4CDM, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Stats', value: totals['Crit Damage'], color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      weakness: {
        base: 0, totalChar: t4WK, totalEquip: bountyWK + totals['Weakness Hit Chance'],
        details: [
          { label: '[Char] Star 4 Bonus', value: t4WK, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Stats', value: totals['Weakness Hit Chance'], color: 'text-green-400' },
          { label: '[Equip] Bounty Tracker Set', value: bountyWK, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      block: {
        base: 0, totalChar: t4BLK, totalEquip: gatekeeperBLK + totals['Block Rate'],
        details: [
          { label: '[Char] Star 4 Bonus', value: t4BLK, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Stats', value: totals['Block Rate'], color: 'text-green-400' },
          { label: '[Equip] Gatekeeper Set', value: gatekeeperBLK, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      dmgReduc: {
        base: 0, totalChar: t4RED, totalEquip: totals['Damage Taken Reduction'],
        details: [
          { label: '[Char] Star 4 Bonus', value: t4RED, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Stats', value: totals['Damage Taken Reduction'], color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      effHit: {
        base: 0, totalChar: t4EFF, totalEquip: spellweaverEFF + vanguardEFF + totals['Effect Hit Rate'],
        details: [
          { label: '[Char] Star 4 Bonus', value: t4EFF, color: 'text-yellow-300' },
          { label: '[Equip] Main/Sub Stats', value: totals['Effect Hit Rate'], color: 'text-green-400' },
          { label: '[Equip] Spellweaver Set', value: spellweaverEFF, color: 'text-green-400' },
          { label: '[Equip] Vanguard Set', value: vanguardEFF, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      },
      effRes: {
        base: 0, totalChar: 0, totalEquip: orchestratorRES + guardianRES + totals['Effect Resistance'],
        details: [
          { label: '[Equip] Main/Sub Stats', value: totals['Effect Resistance'], color: 'text-green-400' },
          { label: '[Equip] Orchestrator Set', value: orchestratorRES, color: 'text-green-400' },
          { label: '[Equip] Guardian Set', value: guardianRES, color: 'text-green-400' }
        ].filter(d => d.value > 0)
      }
    };

    return {
      tAtk, tDef, tHp,
      pAtk, pDef, pHp,
      breakdown,
      activeSetBonus: calculateSetBonus(eqList)
    };
  }, [activeHero, potentials, equipment, ring, transcend]);

  const validationMsg = getValidationStatus(equipment);

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500">{error}</div>;
  if (!activeHero) return <div className="p-10 text-white font-mono">No character data available.</div>;

  const gradeColor = activeHero.grade === 'LEGEND' ? 'text-yellow-400' : activeHero.grade === 'RARE' ? 'text-blue-400' : 'text-white';
  
  const getRoleColor = (roleStr) => {
    const role = (roleStr || '').toUpperCase();
    if (role.includes('ATTACK')) return 'text-red-400';
    if (role.includes('MAGIC')) return 'text-purple-400';
    if (role.includes('DEFENSE')) return 'text-blue-400';
    if (role.includes('SUPPORT')) return 'text-green-400';
    return 'text-white';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-6 lg:p-8 font-mono text-sm selection:bg-yellow-500/30">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Validation Warning */}
        {validationMsg.text && (
          <div className={`border rounded-lg p-3 text-center font-bold text-xs shadow-lg ${validationMsg.color.replace('border-red-500', 'border-red-500/50').replace('bg-slate-900', 'bg-slate-900/80 backdrop-blur')}`}>
            {validationMsg.text}
          </div>
        )}

        {/* ==========================================
            SECTION 1: HERO & BASE STATS
            ========================================== */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* ซ้าย: Hero Profile (ดีไซน์ใหม่) */}
          <div className="w-full xl:w-[30%] bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-3 border-b border-white/5">
              <h2 className="text-white font-bold tracking-widest text-center text-xs">HERO SETUP</h2>
            </div>
            
            <div className="p-5 flex flex-col gap-5">
              {/* Name Dropdown */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block pl-1">Select Hero</label>
                <select className={`w-full bg-slate-950 border border-slate-700 rounded-xl outline-none text-base p-3 font-bold ${gradeColor} shadow-inner focus:border-yellow-500 transition-all cursor-pointer`}
                  value={selectedHeroName} onChange={e => setSelectedHeroName(e.target.value)}>
                  {heroDataList.map(h => (
                    <option key={h.name} value={h.name} className={`bg-slate-900 ${h.grade === 'LEGEND' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level & Trans */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block pl-1">Level</label>
                  <div className="w-full bg-slate-800/40 text-slate-500 text-center border border-slate-700/50 rounded-xl py-2.5 cursor-not-allowed font-bold text-sm">
                    30 (MAX)
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block pl-1 text-yellow-300">★ Trans</label>
                  <input type="number" min="0" max="12" 
                    className="w-full bg-slate-950 text-white text-center border border-slate-700 rounded-xl py-2.5 text-sm focus:border-yellow-500 shadow-inner outline-none transition-all"
                    value={transcend} onChange={e => setTranscend(Number(e.target.value))} />
                </div>
              </div>

              {/* Tags (Element, Type, Grade) */}
              <div className="flex justify-between gap-3 pt-4 border-t border-white/5">
                <div className="flex-1 bg-slate-950/50 rounded-xl p-2.5 text-center border border-slate-800/50">
                  <div className="text-[9px] text-slate-500 mb-1">ELEMENT</div>
                  <div className={`font-bold text-xs ${getRoleColor(activeHero.element)}`}>{activeHero.element}</div>
                </div>
                <div className="flex-1 bg-slate-950/50 rounded-xl p-2.5 text-center border border-slate-800/50">
                  <div className="text-[9px] text-slate-500 mb-1">TYPE</div>
                  <div className={`font-bold text-xs ${getRoleColor(activeHero.type)}`}>{activeHero.type}</div>
                </div>
                <div className="flex-1 bg-slate-950/50 rounded-xl p-2.5 text-center border border-slate-800/50">
                  <div className="text-[9px] text-slate-500 mb-1">GRADE</div>
                  <div className={`font-bold text-xs ${gradeColor}`}>{activeHero.grade}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ขวา: Base Stats & Potentials (ดีไซน์ใหม่ ไร้เส้นตาราง) */}
          <div className="w-full xl:w-[70%] bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-3 border-b border-white/5">
              <h2 className="text-white font-bold tracking-widest text-center text-xs">BASE STATS & POTENTIALS</h2>
            </div>
            
            <div className="p-5 flex flex-col gap-3">
              {/* Header Row สำหรับ Stats */}
              <div className="hidden md:flex items-center text-[10px] text-slate-500 font-bold px-4 pb-2 border-b border-white/5 tracking-wider">
                <div className="w-1/4">STAT TYPE</div>
                <div className="w-1/5 text-center">BASE</div>
                <div className="w-1/5 text-center text-yellow-500/80">★ TRANSCEND</div>
                <div className="w-1/5 text-center">POTEN LV</div>
                <div className="w-[15%] text-right text-green-500/80">POTEN ADD</div>
              </div>

              {/* Rows */}
              {['atk', 'def', 'hp'].map((statKey) => {
                const isAtk = statKey === 'atk';
                const isDef = statKey === 'def';
                const label = isAtk ? 'ATTACK' : isDef ? 'DEFENSE' : 'HP';
                const color = isAtk ? 'text-orange-400' : isDef ? 'text-blue-400' : 'text-green-400';
                const baseValue = isAtk ? activeHero.baseAtk : isDef ? activeHero.baseDef : activeHero.baseHp;
                const transBonus = isAtk ? finalStats.tAtk : isDef ? finalStats.tDef : finalStats.tHp;
                const potenValue = isAtk ? finalStats.pAtk : isDef ? finalStats.pDef : finalStats.pHp;

                return (
                  <div key={statKey} className="flex flex-col md:flex-row md:items-center justify-between bg-slate-800/30 hover:bg-slate-800/60 transition-colors p-3.5 rounded-xl border border-white/5 gap-3 md:gap-0">
                    
                    {/* 1. Stat Name */}
                    <div className="flex items-center gap-3 w-full md:w-1/4">
                      <div className={`w-1.5 h-6 rounded-full ${isAtk ? 'bg-orange-500' : isDef ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      <span className={`font-bold text-sm tracking-wider ${color}`}>{label}</span>
                    </div>

                    {/* 2. Base */}
                    <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-[10px] text-slate-500">BASE</span>
                      <span className="text-white font-bold text-base">{baseValue.toLocaleString()}</span>
                    </div>

                    {/* 3. Trans Bonus */}
                    <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-[10px] text-slate-500">TRANS</span>
                      <span className="text-yellow-400 font-bold text-sm bg-yellow-900/20 px-2 py-0.5 rounded-md">+{transBonus.toLocaleString()}</span>
                    </div>

                    {/* 4. Potential Input */}
                    <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-[10px] text-slate-500">LEVEL</span>
                      <input type="number" min="0" max="30" 
                        className="w-16 bg-slate-950 border border-slate-600 rounded-lg py-1.5 text-center text-sm text-white focus:border-green-400 outline-none transition-all"
                        value={potentials[statKey]} onChange={e => setPotentials({ ...potentials, [statKey]: Number(e.target.value) })} />
                    </div>

                    {/* 5. Potential Add */}
                    <div className="w-full md:w-[15%] flex justify-between md:justify-end items-center pr-2">
                      <span className="md:hidden text-[10px] text-slate-500">POTEN</span>
                      <span className="text-green-400 font-bold text-sm">+{potenValue.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==========================================
            SECTION 2: FINAL SUMMARY (ดีไซน์ใหม่)
            ========================================== */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-3 border-b border-white/5">
            <h2 className="text-white font-bold tracking-widest text-center text-xs">FINAL COMBAT STATS</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
            
            {/* Main Stats */}
            <div className="p-4 space-y-1 bg-slate-800/20">
              {[
                { label: 'Attack', color: 'text-orange-400', key: 'atk' },
                { label: 'Defense', color: 'text-blue-400', key: 'def' },
                { label: 'HP', color: 'text-green-400', key: 'hp' },
                { label: 'Speed', color: 'text-yellow-400', key: 'spd' }
              ].map(item => (
                <AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={false} textSize="text-[15px]" />
              ))}
            </div>

            {/* Sub Stats 1 */}
            <div className="p-4 space-y-1">
              {[
                { label: 'Crit Rate', color: 'text-red-400', key: 'critRate' },
                { label: 'Crit Damage', color: 'text-red-400', key: 'critDmg' },
                { label: 'Weakness Hit', color: 'text-purple-400', key: 'weakness' },
                { label: 'Block Rate', color: 'text-blue-300', key: 'block' }
              ].map(item => (
                <AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-xs" />
              ))}
            </div>

            {/* Sub Stats 2 */}
            <div className="p-4 space-y-1">
              {[
                { label: 'Dmg Reduction', color: 'text-emerald-400', key: 'dmgReduc' },
                { label: 'Effect Hit', color: 'text-teal-300', key: 'effHit' },
                { label: 'Effect Res', color: 'text-teal-300', key: 'effRes' }
              ].map(item => (
                <AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-xs" />
              ))}
            </div>

            {/* Accessory & Bonus */}
            <div className="p-4 flex flex-col gap-4 justify-center bg-slate-800/10">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block pl-1">Accessory Ring</label>
                <select className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl outline-none p-2.5 focus:border-green-400 transition-all shadow-inner text-sm"
                  value={ring} onChange={e => setRing(Number(e.target.value))}>
                  {RING_OPTIONS.map(r => <option key={r.value} value={r.value} className="bg-slate-900">{r.label} (+{r.value}%)</option>)}
                </select>
              </div>
              <div className="bg-slate-950/80 border border-slate-700/50 rounded-xl p-3 text-center text-green-400 whitespace-pre-line leading-relaxed h-full flex items-center justify-center font-bold text-[11px] shadow-inner">
                {finalStats.activeSetBonus || "No Active Set Bonus"}
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            SECTION 3: EQUIPMENT SLOTS
            ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6 pt-2">
          {[
            { title: "WEAPON 1", key: "weapon1", allowed: WEAPON_MAIN_VALUES },
            { title: "WEAPON 2", key: "weapon2", allowed: WEAPON_MAIN_VALUES },
            { title: "ARMOR 1", key: "armor1", allowed: ARMOR_MAIN_VALUES },
            { title: "ARMOR 2", key: "armor2", allowed: ARMOR_MAIN_VALUES }
          ].map((eq) => (
            <div key={eq.key} className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl hover:border-slate-500/80 transition-all hover:-translate-y-1 duration-300">
              <EquipmentBlock title={eq.title} data={equipment[eq.key]} allowedMains={eq.allowed} onChange={v => setEquipment({ ...equipment, [eq.key]: v })} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}