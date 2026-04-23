import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RING_OPTIONS, WEAPON_MAIN_VALUES, ARMOR_MAIN_VALUES } from './utils/constants';
import { parseCSVData, getTranscendBonus, getSubstatValue, getValidationStatus, getPotentialValue } from './utils/helpers';
import { EquipmentBlock } from './components/EquipmentBlock';

const AnimatedStatRow = ({ item, stat, isPercent, textSize = "text-sm" }) => {
  const total = stat ? (stat.base + (stat.totalChar || 0) + (stat.totalEquip || 0)) : 0;

  const [isFlashing, setIsFlashing] = useState(false);
  const prevTotal = useRef(total);

  useEffect(() => {
    if (prevTotal.current !== total) {
      prevTotal.current = total;
      setIsFlashing(true);
    }
  }, [total]);

  useEffect(() => {
    if (isFlashing) {
      const timer = setTimeout(() => setIsFlashing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  if (!stat) return null;

  const fmt = (val) => isPercent ? `${val}%` : val.toLocaleString();

  return (
    <div className={`relative group flex justify-between items-center ${textSize} p-3 mb-2 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-color)] shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-2xl transition-all duration-300 ${isFlashing ? 'ring-2 ring-green-500 scale-[1.02] z-10' : 'hover:-translate-y-0.5 hover:shadow-md hover:z-50'}`}>
      <span className={`${item.color} font-medium tracking-wide`}>{item.label}</span>

      <div className="flex items-center gap-2">
        <span className={`font-semibold transition-colors duration-300 ${isFlashing ? 'text-green-500 scale-110' : 'text-[var(--text-main)]'}`}>
          {fmt(total)}
        </span>

        {stat.totalChar > 0 && <span className="text-[var(--color-char)] text-[11px] font-semibold">(+{fmt(stat.totalChar)})</span>}
        {stat.totalEquip > 0 && <span className="text-[var(--color-equip)] text-[11px] font-semibold">(+{fmt(stat.totalEquip)})</span>}
      </div>

      {stat.details.length > 0 && (
        <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-64 bg-[var(--tooltip-bg)] backdrop-blur-3xl border border-[var(--border-color)] rounded-2xl shadow-2xl p-4 pointer-events-none z-[100]">
          <div className="text-xs font-semibold text-[var(--text-main)] border-b border-[var(--border-color)] pb-2 mb-3 flex justify-between items-center">
            <span className="uppercase tracking-wider">{item.label}</span>
            <span className="text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-1 rounded-full border border-[var(--border-color)]">Base: {fmt(stat.base)}</span>
          </div>
          <div className="space-y-2">
            {stat.details.map((d, i) => (
              <div key={i} className={`flex justify-between text-[11px] font-medium ${d.color || 'text-[var(--text-main)]'} leading-tight`}>
                <span>{d.label}</span>
                <span className="font-semibold">+{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [heroDataList, setHeroDataList] = useState([]);
  const [selectedHeroName, setSelectedHeroName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [transcend, setTranscend] = useState(6);
  const [ring, setRing] = useState(5);
  const [potentials, setPotentials] = useState({ atk: 0, def: 0, hp: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('7k_simulator_presets');
    return saved ? JSON.parse(saved) : [];
  });

  const [presetNameInput, setPresetNameInput] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const presetMenuRef = useRef(null);

  const [eqLayout, setEqLayout] = useState('row');

  const eqListConfig = useMemo(() => {
    const baseConfig = [
      { title: "Weapon 1", key: "weapon1", allowed: WEAPON_MAIN_VALUES },
      { title: "Weapon 2", key: "weapon2", allowed: WEAPON_MAIN_VALUES },
      { title: "Armor 1", key: "armor1", allowed: ARMOR_MAIN_VALUES },
      { title: "Armor 2", key: "armor2", allowed: ARMOR_MAIN_VALUES }
    ];

    if (eqLayout === 'grid') {
      // สลับลำดับเป็น [W1, A1, W2, A2] เพื่อให้ Grid 2 Column แสดงผลตามที่คุณต้องการ
      return [baseConfig[0], baseConfig[2], baseConfig[1], baseConfig[3]];
    }
    return baseConfig;
  }, [eqLayout]);

  const defaultSubstats = () => [
    { type: 'Attack %', rolls: 0 }, { type: 'Defense %', rolls: 0 },
    { type: 'HP %', rolls: 0 }, { type: 'Speed', rolls: 0 }
  ];

  const [equipment, setEquipment] = useState({
    weapon1: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
    weapon2: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
    armor1: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() },
    armor2: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() }
  });

  const filteredHeroes = useMemo(() => {
    return heroDataList.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [heroDataList, searchTerm]);

  const activeHero = useMemo(() => heroDataList.find(h => h.name === selectedHeroName) || null, [heroDataList, selectedHeroName]);

  const getGradeColorClass = (grade) => {
    const g = grade?.toUpperCase();
    if (g === 'LEGEND') return 'text-[var(--color-legend)]';
    if (g === 'RARE') return 'text-[var(--color-rare)]';
    return 'text-[var(--color-normal)]';
  };

  const getGradeBgClass = (grade) => {
    const g = grade?.toUpperCase();
    if (g === 'LEGEND') return 'bg-[var(--color-legend)]/10 border-[var(--color-legend)]/30';
    if (g === 'RARE') return 'bg-[var(--color-rare)]/10 border-[var(--color-rare)]/30';
    return 'bg-[var(--color-normal)]/10 border-[var(--color-normal)]/30';
  };

  const getElementColorClass = (element) => {
    const el = element?.toUpperCase();
    if (el === 'ATTACK') return 'text-red-500';
    if (el === 'MAGIC') return 'text-blue-500';
    if (el === 'UNIVERSAL') return 'text-purple-500';
    if (el === 'DEFENSE') return 'text-amber-700'; // สีน้ำตาล
    if (el === 'SUPPORT') return 'text-yellow-500';
    return 'text-[var(--text-main)]';
  };

  const getTypeColorClass = (type) => {
    const t = type?.toUpperCase();
    if (t === 'ATTACK') return 'text-red-500';
    if (t === 'MAGIC') return 'text-blue-500';
    return 'text-[var(--text-main)]';
  };

  const getTransColorClass = (val) => {
    if (val >= 7) return 'text-red-500';
    if (val >= 1) return 'text-blue-500'; // สีฟ้า
    return 'text-[var(--text-main)]';
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('7k_simulator_presets', JSON.stringify(presets));
  }, [presets]);

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
        } else throw new Error("Parsed data is empty. Check CSV format.");
      })
      .catch(err => {
        console.error("Error loading CSV:", err);
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target)) {
        setShowPresetMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSavePreset = () => {
    if (!activeHero) return;
    const name = presetNameInput.trim() || `${activeHero.name} Setup`;
    const newPreset = {
      id: Date.now().toString(),
      name,
      heroName: selectedHeroName,
      transcend,
      ring,
      potentials,
      equipment
    };
    setPresets([newPreset, ...presets]);
    setPresetNameInput('');
    setShowPresetMenu(false);
  };

  const handleLoadPreset = (preset) => {
    setSelectedHeroName(preset.heroName);
    setTranscend(preset.transcend);
    setRing(preset.ring);
    setPotentials(preset.potentials);
    setEquipment(preset.equipment);
    setShowPresetMenu(false);
  };

  const handleDeletePreset = (id, e) => {
    e.stopPropagation();
    setPresets(presets.filter(p => p.id !== id));
  };


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
      eq.substats.forEach(sub => { totals[sub.type] = (totals[sub.type] || 0) + getSubstatValue(sub.type, sub.rolls); });
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

    // === NEW: ระบบจัดเตรียมข้อมูลสำหรับแสดงผล Set Bonus UI แบบใหม่ ===
    const SET_BONUS_DATA = {
      'Vanguard': { 2: ['Attack +20%'], 4: ['Attack +45%', 'Effect Hit Rate +20%'] },
      'Guardian': { 2: ['Defense +20%'], 4: ['Defense +45%', 'Effect Resistance +20%'] },
      'Paladin': { 2: ['HP +17%'], 4: ['HP +40%', 'Income Healing Boots 20%'] },
      'Assassin': { 2: ['Crit Rate +15%'], 4: ['Crit Rate +30%', 'Ignore Defense 15%'] },
      'Bounty Tracker': { 2: ['Weakness Hit Chance +15%'], 4: ['Weakness Hit Chance +35%', 'Weakness Hit Damage 35%'] },
      'Gatekeeper': { 2: ['Block Rate +15%'], 4: ['Block Rate +30%', 'Block Damage Reduction 10%'] },
      'Spellweaver': { 2: ['Effect Hit Rate +17%'], 4: ['Effect Hit Rate +35%', 'Effect Probability 10%'] },
      'Orchestrator': { 2: ['Effect Resistance +17%'], 4: ['Effect Resistance +35%', 'Star Battles with 1 turn of Crowd Control Immunity'] },
      'Avenger': { 2: ['Damage Dealt 15%'], 4: ['Damage Dealt 30%', 'Boss Damage 40%'] }
    };

    const activeSetDetails = [];
    Object.entries(setCounts).forEach(([setName, count]) => {
      if (SET_BONUS_DATA[setName] && count >= 2) {
        const tier = count >= 4 ? 4 : 2;
        activeSetDetails.push({
          name: setName,
          count: tier,
          effects: SET_BONUS_DATA[setName][tier]
        });
      }
    });

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

    const cChar = 'text-[var(--color-char)]';
    const cEq = 'text-[var(--color-equip)]';
    const cSet = 'text-[var(--color-set)]';
    const cRing = 'text-[var(--color-ring)]';

    const breakdown = {
      atk: {
        base: activeHero.baseAtk, totalChar: (304 * 2) + tAtk + pAtk, totalEquip: totals['Attack Flat'] + atkPctVal + atkSetVal + atkRingVal,
        details: [
          { label: 'Level Base Bonus', value: 304 * 2, color: cChar }, { label: 'Transcend', value: tAtk, color: cChar },
          { label: 'Potential', value: pAtk, color: cChar }, { label: 'Equipment Flat', value: totals['Attack Flat'], color: cEq },
          { label: `Equip % (${totals['Attack %']}%)`, value: atkPctVal, color: cEq }, { label: `Vanguard Set (${vanguardAtkPct}%)`, value: atkSetVal, color: cSet },
          { label: `Ring (${ring}%)`, value: atkRingVal, color: cRing }
        ].filter(d => d.value > 0)
      },
      def: {
        base: activeHero.baseDef, totalChar: (189 * 2) + tDef + pDef, totalEquip: totals['Defense Flat'] + defPctVal + defSetVal + defRingVal,
        details: [
          { label: 'Level Base Bonus', value: 189 * 2, color: cChar }, { label: 'Transcend', value: tDef, color: cChar },
          { label: 'Potential', value: pDef, color: cChar }, { label: 'Equipment Flat', value: totals['Defense Flat'], color: cEq },
          { label: `Equip % (${totals['Defense %']}%)`, value: defPctVal, color: cEq }, { label: `Guardian Set (${guardianDefPct}%)`, value: defSetVal, color: cSet },
          { label: `Ring (${ring}%)`, value: defRingVal, color: cRing }
        ].filter(d => d.value > 0)
      },
      hp: {
        base: activeHero.baseHp, totalChar: (1079 * 2) + tHp + pHp, totalEquip: totals['HP Flat'] + hpPctVal + hpSetVal + hpRingVal,
        details: [
          { label: 'Level Base Bonus', value: 1079 * 2, color: cChar }, { label: 'Transcend', value: tHp, color: cChar },
          { label: 'Potential', value: pHp, color: cChar }, { label: 'Equipment Flat', value: totals['HP Flat'], color: cEq },
          { label: `Equip % (${totals['HP %']}%)`, value: hpPctVal, color: cEq }, { label: `Paladin Set (${paladinHpPct}%)`, value: hpSetVal, color: cSet },
          { label: `Ring (${ring}%)`, value: hpRingVal, color: cRing }
        ].filter(d => d.value > 0)
      },
      spd: { base: activeHero.baseSpd, totalChar: 0, totalEquip: totals['Speed'], details: [{ label: 'Equipment Stats', value: totals['Speed'], color: cEq }].filter(d => d.value > 0) },
      critRate: { base: 5, totalChar: t4CR, totalEquip: assassinCR + totals['Crit Rate'], details: [{ label: 'Star 4 Bonus', value: t4CR, color: cChar }, { label: 'Equipment Stats', value: totals['Crit Rate'], color: cEq }, { label: 'Assassin Set', value: assassinCR, color: cSet }].filter(d => d.value > 0) },
      critDmg: { base: 150, totalChar: t4CDM, totalEquip: totals['Crit Damage'], details: [{ label: 'Star 4 Bonus', value: t4CDM, color: cChar }, { label: 'Equipment Stats', value: totals['Crit Damage'], color: cEq }].filter(d => d.value > 0) },
      weakness: { base: 0, totalChar: t4WK, totalEquip: bountyWK + totals['Weakness Hit Chance'], details: [{ label: 'Star 4 Bonus', value: t4WK, color: cChar }, { label: 'Equipment Stats', value: totals['Weakness Hit Chance'], color: cEq }, { label: 'Bounty Tracker Set', value: bountyWK, color: cSet }].filter(d => d.value > 0) },
      block: { base: 0, totalChar: t4BLK, totalEquip: gatekeeperBLK + totals['Block Rate'], details: [{ label: 'Star 4 Bonus', value: t4BLK, color: cChar }, { label: 'Equipment Stats', value: totals['Block Rate'], color: cEq }, { label: 'Gatekeeper Set', value: gatekeeperBLK, color: cSet }].filter(d => d.value > 0) },
      dmgReduc: { base: 0, totalChar: t4RED, totalEquip: totals['Damage Taken Reduction'], details: [{ label: 'Star 4 Bonus', value: t4RED, color: cChar }, { label: 'Equipment Stats', value: totals['Damage Taken Reduction'], color: cEq }].filter(d => d.value > 0) },
      effHit: { base: 0, totalChar: t4EFF, totalEquip: spellweaverEFF + vanguardEFF + totals['Effect Hit Rate'], details: [{ label: 'Star 4 Bonus', value: t4EFF, color: cChar }, { label: 'Equipment Stats', value: totals['Effect Hit Rate'], color: cEq }, { label: 'Spellweaver Set', value: spellweaverEFF, color: cSet }, { label: 'Vanguard Set', value: vanguardEFF, color: cSet }].filter(d => d.value > 0) },
      effRes: { base: 0, totalChar: 0, totalEquip: orchestratorRES + guardianRES + totals['Effect Resistance'], details: [{ label: 'Equipment Stats', value: totals['Effect Resistance'], color: cEq }, { label: 'Orchestrator Set', value: orchestratorRES, color: cSet }, { label: 'Guardian Set', value: guardianRES, color: cSet }].filter(d => d.value > 0) }
    };

    return { tAtk, tDef, tHp, pAtk, pDef, pHp, breakdown, activeSetDetails };
  }, [activeHero, potentials, equipment, ring, transcend]);

  const validationMsg = getValidationStatus(equipment);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!activeHero) return <div className="p-10">No character data available.</div>;

  const gradeColor = activeHero.grade === 'LEGEND' ? 'text-yellow-500' : activeHero.grade === 'RARE' ? 'text-blue-500' : 'text-[var(--text-main)]';

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 selection:bg-[var(--accent)] selection:text-white transition-colors duration-400">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Top Bar: เมนู Preset และปุ่มเปลี่ยนโหมด (อัปเดตเป็น Sticky Floating) */}
        <div className="sticky top-4 md:top-6 z-[120] flex justify-end gap-3 w-full pointer-events-none">

          {/* เมนู Dropdown สำหรับ Save/Load Presets */}
          <div className="relative pointer-events-auto" ref={presetMenuRef}>
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-color)] shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm font-medium text-[var(--text-main)]"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Presets
            </button>

            {showPresetMenu && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-[var(--card-header)] p-3 border-b border-[var(--border-color)] flex justify-between items-center">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Saved Setups</h3>
                  <span className="text-[10px] bg-[var(--input-bg)] px-2 py-1 rounded-full text-[var(--text-main)]">{presets.length} Configs</span>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {presets.length === 0 ? (
                    <div className="text-center p-4 text-[var(--text-muted)] text-sm">No saved presets</div>
                  ) : (
                    presets.map(p => (
                      <div key={p.id} className="flex items-center justify-between group p-2 hover:bg-[var(--hover-bg)] rounded-xl transition-colors cursor-pointer" onClick={() => handleLoadPreset(p)}>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[var(--text-main)]">{p.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">Hero: {p.heroName}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeletePreset(p.id, e)}
                          className="text-red-500 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all p-1"
                          title="Delete Preset"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-[var(--border-color)] bg-[var(--input-bg)] flex gap-2">
                  <input
                    type="text"
                    placeholder="Name your setup..."
                    value={presetNameInput}
                    onChange={e => setPresetNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                    className="flex-1 bg-[var(--bg-color)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                  />
                  <button
                    onClick={handleSavePreset}
                    className="bg-[var(--accent)] text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-all active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-color)] shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm font-medium text-[var(--text-main)] pointer-events-auto">
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {/* SECTION 1: HERO & BASE STATS */}
        <div className="flex flex-col xl:flex-row gap-8">

          {/* ซ้าย: Hero Profile */}
          <div className="relative z-[60] w-full xl:w-[30%] flex flex-col">
            <div className="absolute inset-0 rounded-3xl shadow-[var(--glass-shadow)] overflow-hidden">
              <div className="aurora-bg aurora-style-1"></div>
              <div className="absolute inset-0 bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--border-color)] shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-[var(--card-header)] p-4 border-b border-[var(--border-color)] rounded-t-3xl">
                <h2 className="text-[var(--text-muted)] font-semibold tracking-widest text-center text-xs uppercase">Hero Setup</h2>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="relative" ref={dropdownRef}>
                  <label className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2 block pl-1">Search Hero</label>
                  <div className="relative">
                    <input type="text" className={`w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3.5 pl-10 font-semibold focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all ${getGradeColorClass(activeHero?.grade)}`}
                      placeholder="Type to search..." value={isDropdownOpen ? searchTerm : activeHero?.name || ''}
                      onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => { setIsDropdownOpen(true); setSearchTerm(''); }} />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-[100] w-full mt-2 max-h-72 overflow-y-auto bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl custom-scrollbar animate-in fade-in zoom-in duration-200">
                      {filteredHeroes.length > 0 ? (
                        filteredHeroes.map(h => (
                          <button key={h.name} className={`w-full text-left px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors flex justify-between items-center border-b border-[var(--border-color)] last:border-0 ${getGradeColorClass(h.grade)}`}
                            onClick={() => { setSelectedHeroName(h.name); setIsDropdownOpen(false); setSearchTerm(''); }}>
                            <span className="font-semibold">{h.name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${getGradeBgClass(h.grade)}`}>{h.grade}</span>
                          </button>
                        ))
                      ) : (<div className="p-4 text-center text-[var(--text-muted)] text-sm">No hero found</div>)}
                    </div>
                  )}
                </div>

                {/* แถว Level และ Trans */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2 block pl-1">Level</label>
                    <div className="w-full bg-[var(--input-bg)] text-red-500 text-center border border-[var(--border-color)] rounded-2xl py-3 cursor-not-allowed font-bold text-sm shadow-[inset_0_1px_1px_var(--glass-inner)]">30 (MAX)</div>
                  </div>

                  <div className="flex-1">
                    <label className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2 block pl-1">Trans</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${getTransColorClass(transcend)}`}>★</span>
                      <input
                        type="number" min="0" max="12"
                        className={`w-full bg-[var(--input-bg)] ${getTransColorClass(transcend)} text-center border border-[var(--input-border)] rounded-2xl py-3 pl-6 text-sm font-bold focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all shadow-[inset_0_1px_1px_var(--glass-inner)]`}
                        value={transcend}
                        onChange={e => setTranscend(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* เพิ่ม Accessory Ring เข้ามาตรงนี้ */}
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2 block pl-1">Accessory Ring</label>
                  <div className="relative">
                    <select
                      className="w-full bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] rounded-2xl outline-none p-3.5 focus:ring-2 focus:ring-[var(--accent)] transition-all text-sm appearance-none cursor-pointer font-semibold shadow-[inset_0_1px_1px_var(--glass-inner)]"
                      value={ring}
                      onChange={e => setRing(Number(e.target.value))}
                    >
                      {RING_OPTIONS.map(r => <option key={r.value} value={r.value} className="bg-[var(--bg-color)]">{r.label} (+{r.value}%)</option>)}
                    </select>
                    {/* ไอคอนลูกศรลงเพื่อให้ดูเป็น Dropdown ที่สวยงาม */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="m19 9-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex-1 bg-[var(--input-bg)] rounded-2xl p-3 text-center border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase">Element</div>
                    {/* เรียกใช้ฟังก์ชันเปลี่ยนสี Element */}
                    <div className={`font-bold text-sm ${getElementColorClass(activeHero.element)}`}>{activeHero.element}</div>
                  </div>
                  <div className="flex-1 bg-[var(--input-bg)] rounded-2xl p-3 text-center border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase">Type</div>
                    {/* เรียกใช้ฟังก์ชันเปลี่ยนสี Type */}
                    <div className={`font-bold text-sm ${getTypeColorClass(activeHero.type)}`}>{activeHero.type}</div>
                  </div>
                  <div className="flex-1 bg-[var(--input-bg)] rounded-2xl p-3 text-center border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)] mb-1 uppercase">Grade</div>
                    <div className={`font-bold text-sm ${gradeColor}`}>{activeHero.grade}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ขวา: Base Stats & Potentials */}
          <div className="relative z-40 w-full xl:w-[70%] flex flex-col">
            <div className="absolute inset-0 rounded-3xl shadow-[var(--glass-shadow)] overflow-hidden">
              <div className="aurora-bg aurora-style-2"></div>
              <div className="absolute inset-0 bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--border-color)] shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-[var(--card-header)] p-4 border-b border-[var(--border-color)] rounded-t-3xl">
                <h2 className="text-[var(--text-muted)] font-semibold tracking-widest text-center text-xs uppercase">Base Stats & Potentials</h2>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="hidden md:flex items-center text-[11px] text-[var(--text-muted)] font-medium px-4 pb-2 border-b border-[var(--border-color)] tracking-wider uppercase">
                  <div className="w-1/4">Stat Type</div><div className="w-1/5 text-center">Base</div>
                  <div className="w-1/5 text-center">★ Transcend</div><div className="w-1/5 text-center">Poten Lv</div><div className="w-[15%] text-right">Poten Add</div>
                </div>
                {['atk', 'def', 'hp'].map((statKey) => {
                  const isAtk = statKey === 'atk'; const isDef = statKey === 'def';
                  const label = isAtk ? 'Attack' : isDef ? 'Defense' : 'HP';
                  const baseValue = isAtk ? activeHero.baseAtk : isDef ? activeHero.baseDef : activeHero.baseHp;
                  const transBonus = isAtk ? finalStats.tAtk : isDef ? finalStats.tDef : finalStats.tHp;
                  const potenValue = isAtk ? finalStats.pAtk : isDef ? finalStats.pDef : finalStats.pHp;
                  return (
                    <div key={statKey} className="flex flex-col md:flex-row md:items-center justify-between bg-[var(--input-bg)] hover:bg-[var(--hover-bg)] transition-colors p-4 rounded-2xl border border-[var(--border-color)] gap-4 md:gap-0">
                      <div className="flex items-center gap-3 w-full md:w-1/4">
                        {/* เปลี่ยนจุดสี Attack เป็นสีแดง (bg-red-500) */}
                        <div className={`w-1.5 h-6 rounded-full ${isAtk ? 'bg-red-500' : isDef ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        {/* เปลี่ยนตัวหนังสือ Attack เป็นสีแดง */}
                        <span className={`font-bold ${isAtk ? 'text-white-500' : 'text-[var(--text-main)]'}`}>{label}</span>
                      </div>
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[11px] text-[var(--text-muted)]">BASE</span>
                        <span className="text-[var(--text-main)] font-semibold text-base">{baseValue.toLocaleString()}</span>
                      </div>
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[11px] text-[var(--text-muted)]">TRANS</span>
                        <span className="text-[var(--text-muted)] font-medium text-sm">+{transBonus.toLocaleString()}</span>
                      </div>
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[11px] text-[var(--text-muted)]">LEVEL</span>

                        {/* เปลี่ยนจาก Input เป็นปุ่ม Stepper (+/-) */}
                        <div className="flex items-center bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm h-8 w-24">

                          {/* ปุ่ม - (ลดค่า) */}
                          <button
                            onClick={() => setPotentials({ ...potentials, [statKey]: Math.max(0, potentials[statKey] - 1) })}
                            disabled={potentials[statKey] <= 0}
                            className="w-8 h-full flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)] disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                          </button>

                          {/* ตัวเลขตรงกลาง (เปลี่ยนกลับมาเป็น Input ให้พิมพ์ได้ พร้อมซ่อนลูกศรขึ้นลงของเบราว์เซอร์) */}
                          <input
                            type="number"
                            className="flex-1 w-full h-full text-center text-sm font-bold text-[var(--text-main)] border-x border-[var(--border-color)] bg-[var(--input-bg)] focus:outline-none focus:bg-[var(--hover-bg)] transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none m-0"
                            value={potentials[statKey] === 0 ? '' : potentials[statKey]} // แสดงช่องว่างถ้าค่าเป็น 0 เพื่อให้พิมพ์ตัวแรกง่ายขึ้น
                            placeholder="0"
                            onChange={(e) => {
                              // ถ้าลบจนหมดให้เป็น 0
                              if (e.target.value === '') {
                                setPotentials({ ...potentials, [statKey]: 0 });
                                return;
                              }
                              // แปลงค่าที่พิมพ์เป็นตัวเลข
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val)) val = 0;

                              // ดักเงื่อนไขล็อกค่า ห้ามต่ำกว่า 0 และห้ามเกิน 30
                              if (val > 30) val = 30;
                              if (val < 0) val = 0;

                              setPotentials({ ...potentials, [statKey]: val });
                            }}
                          />

                          {/* ปุ่ม + (เพิ่มค่า) */}
                          <button
                            onClick={() => setPotentials({ ...potentials, [statKey]: Math.min(30, potentials[statKey] + 1) })}
                            disabled={potentials[statKey] >= 30}
                            className="w-8 h-full flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--hover-bg)] active:bg-[var(--border-color)] disabled:opacity-20 transition-all cursor-pointer disabled:cursor-not-allowed"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="w-full md:w-[15%] flex justify-between md:justify-end items-center pr-2">
                        <span className="md:hidden text-[11px] text-[var(--text-muted)]">POTEN</span>
                        <span className="text-[var(--accent)] font-semibold text-sm">+{potenValue.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: FINAL SUMMARY */}
        <div className="relative z-50 flex flex-col">
          <div className="absolute inset-0 rounded-3xl shadow-[var(--glass-shadow)] overflow-hidden">
            <div className="aurora-bg aurora-style-3"></div>
            <div className="absolute inset-0 bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--border-color)] shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-[var(--card-header)] p-4 border-b border-[var(--border-color)] rounded-t-3xl">
              <h2 className="text-[var(--text-muted)] font-semibold tracking-widest text-center text-xs uppercase">Final Combat Stats</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">
              <div className="p-6 space-y-2">
                {[{ label: 'Attack', color: 'text-red-500', key: 'atk' }, { label: 'Defense', color: 'text-blue-500', key: 'def' }, { label: 'HP', color: 'text-green-500', key: 'hp' }, { label: 'Speed', color: 'text-yellow-500', key: 'spd' }].map(item => (
                  <AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={false} textSize="text-[15px]" />
                ))}
              </div>
              <div className="p-6 space-y-2">
                {[{ label: 'Crit Rate', color: 'text-red-500', key: 'critRate' }, { label: 'Crit Damage', color: 'text-red-500', key: 'critDmg' }, { label: 'Weakness Hit', color: 'text-purple-500', key: 'weakness' }].map(item => (
                  <AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-sm" />
                ))}
              </div>
              <div className="p-6 space-y-2">
                {[{ label: 'Block Rate', color: 'text-blue-400', key: 'block' }, { label: 'Dmg Reduction', color: 'text-blue-400', key: 'dmgReduc' }, { label: 'Effect Hit', color: 'text-cyan-500', key: 'effHit' }, { label: 'Effect Res', color: 'text-cyan-500', key: 'effRes' }].map(item => (
                  <AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-sm" />
                ))}
              </div>

              {/* คอลัมน์ที่ 4: แสดงผล Set Bonus เท่านั้น */}
              <div className="p-6 flex flex-col h-full">
                {/* กล่องแสดง Set Bonus ที่ขยายเต็มพื้นที่ช่องขวา */}
                <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col shadow-inner relative overflow-hidden">
                  <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-4 block text-center">Active Set Bonus</label>

                  {finalStats.activeSetDetails && finalStats.activeSetDetails.length > 0 ? (
                    <div className="w-full space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                      {finalStats.activeSetDetails.map((set, idx) => (
                        <div key={idx} className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-color)] shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-2xl p-3.5 flex flex-col gap-1.5 text-left relative overflow-hidden transition-all hover:scale-[1.02]">
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-set)]"></div>
                          <div className="flex justify-between items-center pl-2">
                            <span className="font-bold text-sm text-[var(--text-main)] uppercase tracking-tight">{set.name}</span>
                            <span className="text-[10px] font-bold bg-[var(--color-set)]/10 text-[var(--color-set)] px-2.5 py-1 rounded-full border border-[var(--color-set)]/20">{set.count}-Set</span>
                          </div>
                          <div className="pl-2 flex flex-col mt-1 space-y-1">
                            {set.effects.map((eff, i) => (
                              <span key={i} className="text-[11px] font-bold text-[var(--accent)] leading-tight flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[var(--accent)]"></div>
                                {eff}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg>
                      <span className="text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-widest">No Active Set</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนหัวของ Section 3 พร้อม Status Pill และ ปุ่มเลือก Layout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4 pb-2">

          <div className="flex items-center gap-4">
            <h2 className="text-[var(--text-muted)] font-semibold tracking-widest text-xs uppercase">Equipment Slots</h2>

            {/* === ป้ายสถานะแบบใหม่ (ย้ายมาจากข้างบน) === */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${validationMsg.bg} ${validationMsg.border} ${validationMsg.color}`}>
              {/* ไอคอนติ๊กถูก (กรณี Complete) */}
              {validationMsg.status === 'success' && (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              )}
              {/* ไอคอนเตือน (กรณีเหลือค่าให้อัปเกรด) */}
              {validationMsg.status === 'warning' && (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m-3-9h6l3 3v6l-3 3H9l-3-3V9l3-3z" /></svg>
              )}
              {/* ไอคอนตกใจ (กรณีอัปเกรดเกิน) */}
              {validationMsg.status === 'error' && (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider">{validationMsg.text}</span>
            </div>
          </div>

          {/* ปุ่มสลับ Layout 1 ROW / 2x2 GRID (โค้ดเดิมของคุณ) */}
          <div className="flex bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)] gap-1">
            <button
              onClick={() => setEqLayout('row')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${eqLayout === 'row' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              1 ROW
            </button>
            <button
              onClick={() => setEqLayout('grid')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${eqLayout === 'grid' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              2x2 GRID
            </button>
          </div>

        </div>
        {/* Container ของอุปกรณ์ที่มีการปรับ Layout แบบ Dynamic */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${eqLayout === 'row' ? 'xl:grid-cols-4' : 'xl:grid-cols-2 max-w-4xl mx-auto'} gap-6 pt-2`}>

          {/* เปลี่ยนจาก Array ก้อนเดิมมาใช้ eqListConfig ที่สลับตำแหน่งเรียบร้อยแล้ว */}
          {eqListConfig.map((eq, idx) => {

            // Array สำหรับสลับแสงออโรร่าให้แต่ละกล่อง
            const auroraClasses = ['aurora-style-4', 'aurora-style-1', 'aurora-style-2', 'aurora-style-3'];

            return (
              <div key={eq.key} className="relative flex flex-col hover:-translate-y-1 transition-transform duration-300">

                {/* Layer 1: พื้นหลังและแสงออโรร่า */}
                <div className="absolute inset-0 rounded-3xl shadow-[var(--glass-shadow)] overflow-hidden">
                  <div className={`aurora-bg ${auroraClasses[idx]}`}></div>
                  <div className="absolute inset-0 bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--border-color)] shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
                </div>

                {/* Layer 2: เนื้อหา */}
                <div className="relative z-10 flex flex-col h-full">
                  <EquipmentBlock
                    title={eq.title}
                    data={equipment[eq.key]}
                    allowedMains={eq.allowed}
                    onChange={v => setEquipment({ ...equipment, [eq.key]: v })}
                  />
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}