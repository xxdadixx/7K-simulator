import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RING_OPTIONS } from './utils/constants';
import { parseCSVData, getValidationStatus, getTransColorClass } from './utils/helpers';
import { useHeroStats } from './hooks/useHeroStats';
import { TopBar } from './components/TopBar';
import { AnimatedStatRow } from './components/AnimatedStatRow';
import { EquipmentSection } from './components/EquipmentSection';
import { GlassSelect } from './components/GlassSelect';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [heroDataList, setHeroDataList] = useState([]);
  const [selectedHeroName, setSelectedHeroName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [transcend, setTranscend] = useState(6);
  const [ring, setRing] = useState(10);
  const [potentials, setPotentials] = useState({ atk: 0, def: 0, hp: 0, spd: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState('grid');
  const [snapshotStats, setSnapshotStats] = useState(null);
  const dropdownRef = useRef(null);

  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('7k_simulator_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse presets:", error);
      return []; // ถ้าพังให้คืนค่า Array ว่างแทน เว็บจะได้ไม่ค้าง
    }
  });

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

  const filteredHeroes = useMemo(() => heroDataList.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())), [heroDataList, searchTerm]);
  const activeHero = useMemo(() => heroDataList.find(h => h.name === selectedHeroName) || null, [heroDataList, selectedHeroName]);

  // เรียกใช้ Custom Hook ที่สร้างไว้
  const finalStats = useHeroStats(activeHero, equipment, potentials, transcend, ring);
  const validationMsg = getValidationStatus(equipment);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => { localStorage.setItem('7k_simulator_presets', JSON.stringify(presets)); }, [presets]);

  useEffect(() => {
    fetch('/DATA.csv')
      .then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.text(); })
      .then(text => {
        const parsed = parseCSVData(text);
        if (parsed.length > 0) { setHeroDataList(parsed); setSelectedHeroName(parsed[0].name); }
        else throw new Error("Parsed data is empty.");
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleSnapshot = () => {
    if (snapshotStats) {
      setSnapshotStats(null); // ปิดโหมด ล้างข้อมูลทิ้ง
    } else {
      // ถ่ายภาพข้อมูล finalStats ปัจจุบันเก็บไว้ (Deep Copy)
      setSnapshotStats(JSON.parse(JSON.stringify(finalStats.breakdown)));
    }
  };

  const handleSavePreset = (nameInput) => {
    if (!activeHero) return;
    const name = nameInput.trim() || `${activeHero.name} Setup`;
    const newPreset = { id: Date.now().toString(), name, heroName: selectedHeroName, transcend, ring, potentials, equipment };
    setPresets([newPreset, ...presets]);
  };

  const handleLoadPreset = (preset) => {
    setSelectedHeroName(preset.heroName); setTranscend(preset.transcend);
    setRing(preset.ring); setPotentials(preset.potentials); setEquipment(preset.equipment);
  };

  const handleDeletePreset = (id, e) => {
    e.stopPropagation(); // ป้องกันไม่ให้คลิกทะลุไปโดนปุ่มโหลด Preset

    // เด้งหน้าต่างแจ้งเตือนให้ผู้ใช้ยืนยันก่อน
    const isConfirmed = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Preset นี้?\n(ข้อมูลที่ลบไปแล้วจะไม่สามารถกู้คืนได้)");

    // ถ้าผู้ใช้กด "ตกลง" (OK) ถึงจะทำการลบ state
    if (isConfirmed) {
      setPresets(presets.filter(p => p.id !== id));
    }
  };

  const getElementColorClass = (element) => {
    const el = element?.toUpperCase();
    if (el === 'ATTACK') return 'text-red-500';
    if (el === 'MAGIC') return 'text-blue-500';
    if (el === 'UNIVERSAL') return 'text-purple-500';
    if (el === 'DEFENSE') return 'text-amber-700';
    if (el === 'SUPPORT') return 'text-yellow-500';
    return 'text-(--text-main)';
  };

  const getElementBgClass = (element) => {
    const el = element?.toUpperCase();
    if (el === 'ATTACK') return 'bg-red-500/10 border-red-500/30';
    if (el === 'MAGIC') return 'bg-blue-500/10 border-blue-500/30';
    if (el === 'UNIVERSAL') return 'bg-purple-500/10 border-purple-500/30';
    if (el === 'DEFENSE') return 'bg-amber-700/10 border-amber-700/30';
    if (el === 'SUPPORT') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  const getTypeColorClass = (t) => {
    const type = t?.toUpperCase();
    if (type === 'ATTACK') return 'text-red-500';
    if (type === 'MAGIC') return 'text-blue-500';
    return 'text-(--text-main)';
  };

  const getGradeColorClass = (grade) => {
    const g = grade?.toUpperCase();
    if (g === 'LEGEND') return 'text-(--color-legend)';
    if (g === 'RARE') return 'text-(--color-rare)';
    return 'text-(--color-normal)';
  };

  const getGradeBgClass = (grade) => {
    const g = grade?.toUpperCase();
    if (g === 'LEGEND') return 'bg-(--color-legend)/10 border-(--color-legend)/30';
    if (g === 'RARE') return 'bg-(--color-rare)/10 border-(--color-rare)/30';
    return 'bg-(--color-normal)/10 border-(--color-normal)/30';
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!activeHero) return <div className="p-10">No character data available.</div>;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 pb-48 selection:bg-(--accent) selection:text-white transition-colors duration-400">
      <div className="arcade-grid-bg"></div>
      <div className="crt-overlay"></div>

      <div className="max-w-[1400px] mx-auto space-y-8 relative">

        <TopBar presets={presets} onSavePreset={handleSavePreset} onLoadPreset={handleLoadPreset} onDeletePreset={handleDeletePreset} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />

        <div className="flex flex-col xl:flex-row gap-8">
          {/* ซ้าย: Hero Profile */}
          <div className="relative z-30 w-full xl:w-[30%] flex flex-col">
            <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
              <div className="aurora-bg aurora-style-1"></div>
              <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-(--card-header) p-4 border-b border-(--border-color) rounded-t-3xl">
                <h2 className="text-(--text-muted) font-semibold tracking-widest text-center text-xs uppercase">Hero Setup</h2>
              </div>
              <div className="p-6 flex flex-col gap-6">

                {/* --- 🌟 ส่วนแสดงรูปภาพ Hero 🌟 --- */}
                <div key={activeHero.name} className="flex flex-col items-center justify-center -mt-2 animate-hero-swap">

                  <div className={`relative w-[120px] aspect-[156/194] md:w-[140px] rounded-2xl overflow-hidden border-2 shadow-lg flex items-center justify-center transition-colors duration-300 ${getGradeBgClass(activeHero.grade)}`}>
                    <img
                      src={`/heroes/${activeHero.name}.png`}
                      alt={activeHero.name}
                      className="w-full h-full object-contain z-10 transition-transform duration-500 hover:scale-110 drop-shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/favicon.svg';
                        e.target.className = 'w-10 h-10 opacity-20 grayscale';
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent z-0"></div>
                  </div>

                  {/* แสดงชื่อตัวละครใต้รูป */}
                  <h3
                    className={`mt-4 uppercase tracking-widest transition-colors ${getGradeColorClass(activeHero.grade)}`}
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '1rem',
                      textShadow: '0 0 8px currentColor, 0 0 15px currentColor' // สร้างแสงนีออนจากสีหลัก
                    }}
                  >
                    {activeHero.name}
                  </h3>
                </div>
                {/* ---------------------------------- */}

                <div className="relative" ref={dropdownRef}>
                  <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1">Search Hero</label>
                  <div className="relative">
                    <input type="text" className={`w-full bg-(--input-bg) border border-(--input-border) rounded-2xl p-3.5 pl-10 font-semibold focus:ring-2 focus:ring-(--accent) outline-none transition-all shadow-[inset_0_1px_1px_var(--glass-inner)] ${getGradeColorClass(activeHero?.grade)}`} placeholder="Type to search..." value={isDropdownOpen ? searchTerm : activeHero?.name || ''} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} onFocus={() => { setIsDropdownOpen(true); setSearchTerm(''); }} />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg></div>
                  </div>
                  {isDropdownOpen && (
                    <div className="glass-dropdown-menu w-full overflow-hidden flex flex-col z-50">

                      {/* --- 🌟 แท็บสลับโหมด List / Grid 🌟 --- */}
                      <div className="flex justify-end gap-1.5 p-2 border-b border-(--border-color) bg-black/5 dark:bg-white/5">
                        <button
                          onClick={(e) => { e.preventDefault(); setSearchViewMode('list'); }}
                          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${searchViewMode === 'list' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:bg-black/10 dark:hover:bg-white/10'}`}
                          title="List View"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); setSearchViewMode('grid'); }}
                          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${searchViewMode === 'grid' ? 'bg-(--accent) text-white shadow-md' : 'text-(--text-muted) hover:bg-black/10 dark:hover:bg-white/10'}`}
                          title="Grid View"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
                        </button>
                      </div>

                      {/* พื้นที่แสดงผลลัพธ์การค้นหา */}
                      <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
                        {filteredHeroes.length > 0 ? (
                          searchViewMode === 'list' ? (
                            /* ---------------- โหมด 1: List View ---------------- */
                            <div className="flex flex-col gap-1">
                              {filteredHeroes.map(h => (
                                <button
                                  key={h.name}
                                  className="dropdown-item-hover w-full text-left px-4 py-3 flex justify-between items-center border border-transparent hover:border-(--border-color) rounded-xl"
                                  onClick={() => { setSelectedHeroName(h.name); setIsDropdownOpen(false); setSearchTerm(''); }}
                                >
                                  <span className={`font-semibold ${getGradeColorClass(h.grade)}`}>{h.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${getElementBgClass(h.element)} ${getElementColorClass(h.element)}`}>{h.element}</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${getGradeBgClass(h.grade)}`}>{h.grade}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            /* ---------------- โหมด 2: Grid View (เลือกจากรูป) ---------------- */
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {filteredHeroes.map(h => (
                                <button
                                  key={h.name}
                                  onClick={() => { setSelectedHeroName(h.name); setIsDropdownOpen(false); setSearchTerm(''); }}
                                  className={`relative aspect-[156/194] rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:z-10 shadow-sm group ${getGradeBgClass(h.grade)}`}
                                  title={h.name}
                                >
                                  {/* รูปภาพตัวละคร */}
                                  <img
                                    src={`/heroes/${h.name}.png`}
                                    alt={h.name}
                                    className="w-full h-full object-contain bg-black/10 dark:bg-black/40 group-hover:brightness-110 transition-all"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/favicon.svg';
                                      e.target.className = 'w-8 h-8 m-auto opacity-20 grayscale mt-6';
                                    }}
                                  />
                                  {/* ป้ายชื่อด้านล่างรูป */}
                                  <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-md px-1 py-1.5 border-t border-white/10">
                                    <span className={`block text-[9px] font-bold text-center truncate tracking-wider ${getGradeColorClass(h.grade)}`}>
                                      {h.name}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="p-8 text-center text-(--text-muted) text-sm font-bold uppercase tracking-widest">
                            No hero found
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* แถว Level และ Trans */}
                <div className="flex gap-4 w-full">

                  {/* กล่อง Level: เพิ่ม min-w-0 */}
                  <div className="flex-1 min-w-0">
                    <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1 truncate">Level</label>
                    <div className="w-full bg-(--input-bg) text-red-500 text-center border border-(--border-color) rounded-2xl py-3 cursor-not-allowed font-bold text-sm shadow-[inset_0_1px_1px_var(--glass-inner)] truncate">30 (MAX)</div>
                  </div>

                  {/* กล่อง Trans */}
                  <div className="flex-1 min-w-0">
                    <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1 truncate">Trans</label>
                    <div className="relative w-full">
                      <GlassSelect
                        value={transcend}
                        onChange={(val) => setTranscend(Number(val))}
                        options={[...Array(12)].map((_, i) => {
                          const val = i + 1;
                          const fontColor = val <= 6 ? 'text-[#3b82f6]' : 'text-[#ef4444]';
                          return { label: `★ ${val}`, value: val, className: fontColor };
                        })}
                        className={getTransColorClass(transcend)}
                        centered={true}
                        dropdownPosition="up" /* 🌟 เติมบรรทัดนี้เพื่อให้ Trans เด้งขึ้นด้านบน */
                      />
                    </div>
                  </div>

                </div>

                <div>
                  <label className="text-[11px] text-(--text-muted) font-medium uppercase tracking-wider mb-2 block pl-1">Accessory Ring</label>
                  <GlassSelect
                    value={ring}
                    onChange={(val) => setRing(Number(val))}
                    options={RING_OPTIONS.map(r => ({ label: r.label, value: r.value }))}
                    centered={true}
                    dropdownPosition="up" /* 🌟 เติมบรรทัดนี้เพื่อให้ Ring เด้งขึ้นด้านบน */
                  />
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-(--border-color)">
                  <div className="flex-1 bg-(--input-bg) rounded-2xl p-3 text-center border border-(--border-color)">
                    <div className="text-[10px] text-(--text-muted) mb-1 uppercase">Element</div><div className={`font-bold text-sm ${getElementColorClass(activeHero.element)}`}>{activeHero.element}</div>
                  </div>
                  <div className="flex-1 bg-(--input-bg) rounded-2xl p-3 text-center border border-(--border-color)">
                    <div className="text-[10px] text-(--text-muted) mb-1 uppercase">Type</div><div className={`font-bold text-sm ${getTypeColorClass(activeHero.type)}`}>{activeHero.type}</div>
                  </div>
                  <div className="flex-1 bg-(--input-bg) rounded-2xl p-3 text-center border border-(--border-color)">
                    <div className="text-[10px] text-(--text-muted) mb-1 uppercase">Grade</div><div className={`font-bold text-sm ${getGradeColorClass(activeHero.grade)}`}>{activeHero.grade}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ขวา: Base Stats & Potentials */}
          <div className="relative z-30 w-full xl:w-[70%] flex flex-col">
            <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
              <div className="aurora-bg aurora-style-2"></div>
              <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-(--card-header) p-4 border-b border-(--border-color) rounded-t-3xl"><h2 className="text-(--text-muted) font-semibold tracking-widest text-center text-xs uppercase">Base Stats & Potentials</h2></div>
              <div className="p-6 flex flex-col gap-4">
                <div className="hidden md:flex items-center text-[11px] text-(--text-muted) font-medium px-4 pb-2 border-b border-(--border-color) tracking-wider uppercase">
                  <div className="w-1/4">Stat Type</div><div className="w-1/5 text-center">Base</div><div className="w-1/5 text-center">★ Transcend</div><div className="w-1/5 text-center">Poten Lv</div><div className="w-[15%] text-right">Poten Add</div>
                </div>
                {['atk', 'def', 'hp', 'spd'].map((statKey) => {
                  const isAtk = statKey === 'atk';
                  const isDef = statKey === 'def';
                  const isHp = statKey === 'hp';
                  const isSpd = statKey === 'spd';

                  const label = isAtk ? 'Attack' : isDef ? 'Defense' : isHp ? 'HP' : 'Speed';

                  // กำหนดสีจุดด้านหน้า Speed เป็นสีเหลืองให้ตรงกับ Final Stats
                  const colorClass = isAtk ? 'bg-red-500' : isDef ? 'bg-blue-500' : isHp ? 'bg-green-500' : 'bg-yellow-500';

                  // ดึงค่า Base Speed จาก activeHero (DATA.csv)
                  const baseValue = isAtk ? activeHero.baseAtk :
                    isDef ? activeHero.baseDef :
                      isHp ? activeHero.baseHp :
                        activeHero.baseSpd;

                  // สำหรับ Speed จะไม่มีค่า Transcend และ Potential Bonus
                  const transBonus = isSpd ? 0 : (isAtk ? finalStats.tAtk : isDef ? finalStats.tDef : finalStats.tHp);
                  const potenValue = isSpd ? 0 : (isAtk ? finalStats.pAtk : isDef ? finalStats.pDef : finalStats.pHp);

                  return (
                    <div key={statKey} className="flex flex-col md:flex-row md:items-center justify-between bg-(--input-bg) hover:bg-(--hover-bg) transition-colors p-4 rounded-2xl border border-(--border-color) gap-4 md:gap-0 shadow-[inset_0_1px_1px_var(--glass-inner)]">

                      {/* 1. Stat Label & Icon Color */}
                      <div className="flex items-center gap-3 w-full md:w-1/4">
                        <div className={`w-1.5 h-6 rounded-full ${colorClass}`}></div>
                        <span className="font-bold text-(--text-main)">{label}</span>
                      </div>

                      {/* 2. Base Value (ดึงจาก CSV) */}
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Base</span>
                        <span className={`arcade-value-mini ${isDarkMode ? '' : '!text-slate-700 ![text-shadow:none]'}`}>
                          {baseValue?.toLocaleString() || 0}
                        </span>
                      </div>

                      {/* 3. Transcend Bonus */}
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Trans</span>
                        <span
                          key={transBonus}
                          className={`animate-value-change transition-colors ${isDarkMode ? 'arcade-value-bonus text-[#00bfff]' : 'text-blue-700 font-bold text-base'}`}
                        >
                          {isSpd ? '-' : `+${transBonus.toLocaleString()}`}
                        </span>
                      </div>

                      {/* 4. Potential Level (Stepper) */}
                      <div className="w-full md:w-1/5 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Level</span>
                        <div className={`flex items-center bg-(--bg-color) border border-(--border-color) rounded-lg overflow-hidden shadow-sm h-8 w-24 ${isSpd ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                          {/* ปุ่มลบ (-) */}
                          <button
                            onClick={() => setPotentials({ ...potentials, [statKey]: Math.max(0, potentials[statKey] - 1) })}
                            disabled={potentials[statKey] <= 0}
                            className="w-8 h-full flex items-center justify-center text-(--text-main) hover:bg-(--hover-bg) active:bg-(--border-color)"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 12H4" /></svg>
                          </button>

                          {/* ช่อง Input ที่พิมพ์ได้ */}
                          <input
                            type="number"
                            className={`flex-1 w-full h-full text-center bg-(--input-bg) border-x border-(--border-color) focus:outline-none hide-spin-button !text-[16px] transition-colors ${isDarkMode ? 'arcade-value-mini' : 'text-slate-800 font-bold'}`}
                            value={isSpd ? 0 : (potentials[statKey] === 0 ? '' : potentials[statKey])}
                            disabled={isSpd}
                            placeholder="0"
                            onChange={(e) => {
                              let val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 0) val = 0;
                              if (val > 30) val = 30; // ล็อกไม่ให้พิมพ์เกิน 30
                              setPotentials({ ...potentials, [statKey]: val });
                            }}
                            // เพิ่ม onKeyDown เพื่อสกัดกั้นการพิมพ์เครื่องหมายต่างๆ ทิ้งไปก่อนที่จะลงกล่อง
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />

                          {/* ปุ่มบวก (+) */}
                          <button
                            onClick={() => setPotentials({ ...potentials, [statKey]: Math.min(30, potentials[statKey] + 1) })}
                            disabled={potentials[statKey] >= 30}
                            className="w-8 h-full flex items-center justify-center text-(--text-main) hover:bg-(--hover-bg) active:bg-(--border-color)"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* 5. Potential Additional Value */}
                      <div className="w-full md:w-[15%] flex justify-between md:justify-end items-center pr-2">
                        <span className="md:hidden text-[11px] text-(--text-muted) uppercase">Poten Add</span>
                        <span
                          key={potenValue}
                          className={`animate-value-change transition-colors ${isDarkMode ? 'arcade-value-bonus text-[#ffd700]' : 'text-amber-700 font-bold text-base'}`}
                        >
                          {isSpd ? '-' : `+${potenValue.toLocaleString()}`}
                        </span>
                      </div>

                    </div>
                  );
                })}

                {/* 🌟 เพิ่มส่วน Total Raw Stats สรุปยอดรวมตรงนี้ 🌟 */}
                <div className="mt-2 pt-5 border-t border-(--border-color) flex flex-col gap-3">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[11px] text-(--text-muted) font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Total Raw Stats
                    </span>
                    <span className="text-[9px] text-(--text-muted) opacity-70 font-semibold uppercase tracking-wider">( Base + Trans + Poten )</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* กล่องรวม ATK */}
                    <div className="bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group transition-all hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/15 transition-colors"></div>
                      <span className="text-xs md:text-sm font-bold text-red-500 mb-2 uppercase tracking-widest">Attack</span>
                      <span
                        key={((activeHero.baseAtk || 0) + (finalStats.tAtk || 0) + (finalStats.pAtk || 0))}
                        className={`animate-value-change transition-colors tracking-widest ${isDarkMode ? 'text-red-400 ![text-shadow:0_0_8px_currentColor]' : '!text-red-700 ![text-shadow:none]'}`}
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.1rem' }}
                      >
                        {((activeHero.baseAtk || 0) + (finalStats.tAtk || 0) + (finalStats.pAtk || 0)).toLocaleString()}
                      </span>
                      {/* โชว์ส่วนต่าง (+) จาก Trans และ Poten */}
                      <div className="h-3 mt-1.5 flex items-center justify-center">
                        {((finalStats.tAtk || 0) + (finalStats.pAtk || 0)) > 0 && (
                          <span className="text-emerald-500 font-bold tracking-widest drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}>
                            (+{((finalStats.tAtk || 0) + (finalStats.pAtk || 0)).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* กล่องรวม DEF */}
                    <div className="bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group transition-all hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/15 transition-colors"></div>
                      <span className="text-xs md:text-sm font-bold text-blue-500 mb-2 uppercase tracking-widest">Defense</span>
                      <span
                        key={((activeHero.baseDef || 0) + (finalStats.tDef || 0) + (finalStats.pDef || 0))}
                        className={`animate-value-change transition-colors tracking-widest ${isDarkMode ? 'text-blue-400 ![text-shadow:0_0_8px_currentColor]' : '!text-blue-700 ![text-shadow:none]'}`}
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.1rem' }}
                      >
                        {((activeHero.baseDef || 0) + (finalStats.tDef || 0) + (finalStats.pDef || 0)).toLocaleString()}
                      </span>
                      {/* โชว์ส่วนต่าง (+) จาก Trans และ Poten */}
                      <div className="h-3 mt-1.5 flex items-center justify-center">
                        {((finalStats.tDef || 0) + (finalStats.pDef || 0)) > 0 && (
                          <span className="text-emerald-500 font-bold tracking-widest drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}>
                            (+{((finalStats.tDef || 0) + (finalStats.pDef || 0)).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* กล่องรวม HP */}
                    <div className="bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group transition-all hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/15 transition-colors"></div>
                      <span className="text-xs md:text-sm font-bold text-green-500 mb-2 uppercase tracking-widest">HP</span>
                      <span
                        key={((activeHero.baseHp || 0) + (finalStats.tHp || 0) + (finalStats.pHp || 0))}
                        className={`animate-value-change transition-colors tracking-widest ${isDarkMode ? 'text-green-400 ![text-shadow:0_0_8px_currentColor]' : '!text-green-700 ![text-shadow:none]'}`}
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.1rem' }}
                      >
                        {((activeHero.baseHp || 0) + (finalStats.tHp || 0) + (finalStats.pHp || 0)).toLocaleString()}
                      </span>
                      {/* โชว์ส่วนต่าง (+) จาก Trans และ Poten */}
                      <div className="h-3 mt-1.5 flex items-center justify-center">
                        {((finalStats.tHp || 0) + (finalStats.pHp || 0)) > 0 && (
                          <span className="text-emerald-500 font-bold tracking-widest drop-shadow-[0_0_2px_rgba(16,185,129,0.5)]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}>
                            (+{((finalStats.tHp || 0) + (finalStats.pHp || 0)).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* กล่องรวม SPD (ไม่มีโบนัสในส่วนนี้) */}
                    <div className="bg-(--input-bg) border border-(--border-color) rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group transition-all hover:-translate-y-0.5">
                      <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/15 transition-colors"></div>
                      <span className="text-xs md:text-sm font-bold text-yellow-500 mb-2 uppercase tracking-widest">Speed</span>
                      <span
                        key={(activeHero.baseSpd || 0)}
                        className={`animate-value-change transition-colors tracking-widest ${isDarkMode ? 'text-[#ffd700] ![text-shadow:0_0_8px_currentColor]' : '!text-amber-700 ![text-shadow:none]'}`}
                        style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '1.1rem' }}
                      >
                        {(activeHero.baseSpd || 0).toLocaleString()}
                      </span>
                      <div className="h-3 mt-1.5"></div>
                    </div>
                  </div>
                </div>
                {/* ---------------------------------------------------- */}

              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: FINAL SUMMARY */}
        <div className="relative z-50 flex flex-col">
          <div className="absolute inset-0 rounded-3xl shadow-(--glass-shadow) overflow-hidden">
            <div className="aurora-bg aurora-style-3"></div>
            <div className="absolute inset-0 bg-(--card-bg) backdrop-blur-3xl border border-(--border-color) shadow-[inset_0_1px_1px_var(--glass-inner)] rounded-3xl transition-colors duration-400"></div>
          </div>
          <div className="relative z-10 flex flex-col h-full">

            {/* 🌟 หัวตารางเพิ่มปุ่ม Snap Stats 🌟 */}
            <div className="bg-(--card-header) p-3 sm:p-4 border-b border-(--border-color) rounded-t-3xl flex justify-between items-center">
              <h2 className="text-(--text-muted) font-semibold tracking-widest text-center text-xs uppercase pl-2">Final Combat Stats</h2>

              {/* Wrapper สำหรับผูกปุ่มและ Tooltip เข้าด้วยกัน */}
              <div className="relative group">

                {/* ปุ่ม Toggle Compare Mode */}
                <button
                  onClick={handleToggleSnapshot}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${snapshotStats
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 text-(--text-muted) border border-(--border-color) hover:bg-black/10 dark:hover:bg-white/10 hover:text-(--text-main)'
                    }`}
                >
                  {snapshotStats ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Compare ON
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4a1 1 0 001 1h3m14-5v4a1 1 0 01-1 1h-3m-4-7a9 9 0 015.656 2.343M4.343 16.657A9 9 0 0112 21" /></svg>
                      Snap Stats
                    </>
                  )}
                </button>

                {/* กล่อง Glassmorphism Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 w-52 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-(--border-color) shadow-2xl rounded-xl p-3 text-center translate-y-2 group-hover:translate-y-0">
                  <span className="text-[10px] text-slate-700 dark:text-(--text-main) font-bold leading-relaxed block tracking-wide">
                    {snapshotStats
                      ? "Compare mode is active. Try changing gears to see the stat difference!"
                      : "Snap current stats to compare them when you change equipment."}
                  </span>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-(--border-color)">
              {/* คอลัมน์ที่ 1 */}
              <div className="p-4 sm:p-6 space-y-2">
                {[
                  { label: 'Attack', color: 'text-red-500', key: 'atk', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4" /></svg> },
                  { label: 'Defense', color: 'text-blue-500', key: 'def', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
                  { label: 'HP', color: 'text-green-500', key: 'hp', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
                  { label: 'Speed', color: 'text-yellow-500', key: 'spd', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> }
                ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={false} textSize="text-[15px]" snapStat={snapshotStats ? snapshotStats[item.key] : null} />))}
              </div>

              {/* คอลัมน์ที่ 2 */}
              <div className="p-4 sm:p-6 space-y-2">
                {[
                  { label: 'Crit Rate', color: 'text-red-500', key: 'critRate', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v8M8 12h8" /></svg> },
                  { label: 'Crit Damage', color: 'text-red-500', key: 'critDmg', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> },
                  { label: 'Weakness Hit', color: 'text-purple-500', key: 'weakness', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> }
                ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-sm" snapStat={snapshotStats ? snapshotStats[item.key] : null} />))}
              </div>

              {/* คอลัมน์ที่ 3 */}
              <div className="p-4 sm:p-6 space-y-2">
                {[
                  { label: 'Block Rate', color: 'text-blue-400', key: 'block', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4" /></svg> },
                  { label: 'Dmg Reduction', color: 'text-blue-400', key: 'dmgReduc', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v8M9 13l3 3 3-3" /></svg> },
                  { label: 'Effect Hit', color: 'text-cyan-500', key: 'effHit', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 3l2.286 6.857L22 12l-6.714 2.143L13 21l-2.286-6.857L4 12l6.714-2.143L13 3z" /></svg> },
                  { label: 'Effect Res', color: 'text-cyan-500', key: 'effRes', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> }
                ].map(item => (<AnimatedStatRow key={item.key} item={item} stat={finalStats.breakdown[item.key]} isPercent={true} textSize="text-sm" snapStat={snapshotStats ? snapshotStats[item.key] : null} />))}
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

        {/* SECTION 3: EQUIPMENT SLOTS (Component แยก) */}
        <EquipmentSection
          equipment={equipment}
          setEquipment={setEquipment}
          validationMsg={validationMsg}
          heroType={activeHero.type}
        />

        {/* เพิ่มกล่องเปล่า (Spacer) ตรงนี้ เพื่อดันให้เว็บมีพื้นที่ด้านล่างเหลือสำหรับ Dropdown */}
        <div className="h-64 w-full shrink-0 pointer-events-none"></div>

      </div>
    </div>
  );
}