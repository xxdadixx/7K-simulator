import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { parseCSVData, getValidationStatus } from './utils/helpers';
import { useHeroStats } from './hooks/useHeroStats';
import { TopBar } from './components/TopBar';
import { HeroSetupProfile } from './components/HeroSetupProfile';
import { BaseStatsPanel } from './components/BaseStatsPanel';
import { FinalCombatStats } from './components/FinalCombatStats';
import { EquipmentSection } from './components/EquipmentSection';

const defaultSubstats = () => [
  { type: 'Attack %', rolls: 0 }, { type: 'Defense %', rolls: 0 },
  { type: 'HP %', rolls: 0 }, { type: 'Speed', rolls: 0 }
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [heroDataList, setHeroDataList] = useState([]);
  const [selectedHeroName, setSelectedHeroName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [transcend, setTranscend] = useState(0);
  const [ring, setRing] = useState(0);
  const [potentials, setPotentials] = useState({ atk: 0, def: 0, hp: 0, spd: 0 });

  const [snapshotStats, setSnapshotStats] = useState(null);

  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('7k_simulator_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load presets:", error);
      return [];
    }
  });

  const [equipment, setEquipment] = useState({
    weapon1: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
    weapon2: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
    armor1: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() },
    armor2: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() }
  });

  const activeHero = useMemo(() => {
    const found = heroDataList.find(h => h.name === selectedHeroName);
    if (found) return found;
    return { name: 'Unselected', grade: 'NORMAL', element: '-', type: '-', baseAtk: 0, baseDef: 0, baseHp: 0, baseSpd: 0 };
  }, [heroDataList, selectedHeroName]);

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
        if (parsed.length > 0) {
          setHeroDataList(parsed);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleSnapshot = useCallback(() => {
    setSnapshotStats(prev => prev ? null : JSON.parse(JSON.stringify(finalStats.breakdown)));
  }, [finalStats]);

  const handleSavePreset = useCallback((nameInput) => {
    if (!activeHero || activeHero.name === 'Unselected') {
      alert("Please select a hero before saving a preset.");
      return;
    }
    setPresets(prev => {
      const name = nameInput.trim() || `${activeHero.name} Setup`;
      const newPreset = { id: Date.now().toString(), name, heroName: selectedHeroName, transcend, ring, potentials, equipment };
      return [newPreset, ...prev];
    });
  }, [activeHero, selectedHeroName, transcend, ring, potentials, equipment]);

  const handleLoadPreset = useCallback((preset) => {
    setSelectedHeroName(preset.heroName); setTranscend(preset.transcend);
    setRing(preset.ring); setPotentials(preset.potentials); setEquipment(preset.equipment);
  }, []);

  const handleDeletePreset = useCallback((id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this preset?\n(Deleted data cannot be recovered.)")) {
      setPresets(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  const handleUpdatePresetName = useCallback((id, newName) => {
    if (!newName.trim()) return;
    setPresets(prev => prev.map(p => p.id === id ? { ...p, name: newName.trim() } : p));
  }, []);

  const handlePotentialChange = useCallback((statKey, val) => {
    setPotentials(prev => ({ ...prev, [statKey]: Math.max(0, Math.min(30, val)) }));
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm("Are you sure you want to reset everything to unselected?")) {
      setSelectedHeroName(''); // เซ็ตให้ไม่มีฮีโร่
      setTranscend(0); // ล้างดาว Trans
      setRing(0); // ล้างแหวน
      setPotentials({ atk: 0, def: 0, hp: 0, spd: 0 }); // ล้าง Potentials เป็น 0
      setEquipment({ // ล้าง Equipment เป็น None ให้หมด
        weapon1: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
        weapon2: { set: 'None', mainStat: { type: 'Attack %', value: 0 }, substats: defaultSubstats() },
        armor1: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() },
        armor2: { set: 'None', mainStat: { type: 'Defense %', value: 0 }, substats: defaultSubstats() }
      });
      setSnapshotStats(null); // ล้าง Snap
    }
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 pb-48 selection:bg-(--accent) selection:text-white transition-colors duration-400">
      <div className="arcade-grid-bg"></div>
      <div className="crt-overlay"></div>

      <div className="max-w-[1400px] mx-auto space-y-8 relative">
      <TopBar
          presets={presets}
          onSavePreset={handleSavePreset}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          onUpdatePresetName={handleUpdatePresetName}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          activeHeroName={activeHero?.name !== 'Unselected' ? activeHero?.name : 'Setup'}
        />
        <div id="build-capture-area" className="p-2 sm:p-4 rounded-3xl space-y-8">
          <div className="flex flex-col xl:flex-row gap-8">
            <HeroSetupProfile
              activeHero={activeHero}
              heroDataList={heroDataList}
              setSelectedHeroName={setSelectedHeroName}
              transcend={transcend}
              setTranscend={setTranscend}
              ring={ring}
              setRing={setRing}
              onReset={handleReset}
            />
            <BaseStatsPanel
              activeHero={activeHero}
              finalStats={finalStats}
              potentials={potentials}
              handlePotentialChange={handlePotentialChange}
              isDarkMode={isDarkMode}
            />
          </div>

          <FinalCombatStats
            finalStats={finalStats}
            snapshotStats={snapshotStats}
            handleToggleSnapshot={handleToggleSnapshot}
            isDarkMode={isDarkMode} // 🌟 แก้ไขตรงนี้ ส่งค่าไปให้แล้วครับ 🌟
          />

          <EquipmentSection
            equipment={equipment}
            setEquipment={setEquipment}
            validationMsg={validationMsg}
            heroType={activeHero.type}
          />
        </div>
        <div className="h-64 w-full shrink-0 pointer-events-none"></div>
      </div>
    </div>
  );
}