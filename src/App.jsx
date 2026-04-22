import React, { useState, useEffect, useMemo } from 'react';

// --- CONSTANTS ---
const SET_OPTIONS = ['Avenger', 'Orchestrator', 'Spellweaver', 'Guardian', 'None'];
const RING_OPTIONS = [
  { label: 'None', value: 0 },
  { label: 'Ring 4 Star', value: 5 },
  { label: 'Ring 5 Star', value: 7 },
  { label: 'Ring 6 Star', value: 10 }
];

const STAT_TYPES = [
  'Attack %', 'Defense %', 'HP %', 'Speed',
  'Crit Rate', 'Crit Damage', 'Weakness Hit Chance', 
  'Block Rate', 'Damage Taken Reduction', 'Effect Hit Rate', 'Effect Resistance'
];

const DEFAULT_SUBSTATS = Array(5).fill({ type: 'Attack %', rolls: 0, value: 0 });

// --- CSV PARSER UTILITY ---
const parseCSVData = (csvText) => {
  const lines = csvText.split(/\r?\n/);
  const parsedData = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(',');
    
    // Index mapping based on provided CSV structure:
    // ,Name,,,,,ELE,TYPE,ATK,DEF,HP,SPD,★,★4,GRADE
    // cols[1] = Name, cols[6] = Element, cols[7] = Type
    // cols[8] = ATK, cols[9] = DEF, cols[10] = HP, cols[11] = SPD
    const name = cols[1];
    if (!name || name === 'Name') continue;

    parsedData.push({
      name: name,
      element: cols[6] || 'Unknown',
      type: cols[7] || 'Unknown',
      baseAtk: parseInt(cols[8], 10) || 0,
      baseDef: parseInt(cols[9], 10) || 0,
      baseHp: parseInt(cols[10], 10) || 0,
      baseSpd: parseInt(cols[11], 10) || 0
    });
  }
  
  return parsedData;
};

// --- COMPONENTS ---
const GridHeader = ({ title }) => (
  <div className="bg-slate-700 text-white font-bold text-xs p-1 uppercase border border-slate-600">
    {title}
  </div>
);

const EquipmentBlock = ({ title, data, onChange }) => {
  const updateMainStat = (field, val) => onChange({ ...data, mainStat: { ...data.mainStat, [field]: val }});
  const updateSubstat = (index, field, val) => {
    const newSubs = [...data.substats];
    newSubs[index] = { ...newSubs[index], [field]: val };
    onChange({ ...data, substats: newSubs });
  };

  return (
    <div className="border border-slate-600 bg-slate-900 flex flex-col">
      <GridHeader title={title} />
      
      {/* Set Row */}
      <div className="grid grid-cols-4 border-b border-slate-700">
        <div className="bg-slate-800 text-slate-300 text-xs p-1 flex items-center">SET NAME</div>
        <div className="col-span-3 p-1">
          <select className="w-full bg-transparent text-white text-xs border border-slate-600 outline-none p-1"
            value={data.set} onChange={(e) => onChange({...data, set: e.target.value})}>
            {SET_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
      </div>

      {/* Main Stat Row */}
      <div className="grid grid-cols-4 border-b border-slate-700">
        <div className="bg-slate-800 text-yellow-500 font-bold text-xs p-1 flex items-center">MAIN STAT</div>
        <div className="col-span-2 p-1 border-r border-slate-700">
          <select className="w-full bg-transparent text-white text-xs outline-none p-1"
            value={data.mainStat.type} onChange={(e) => updateMainStat('type', e.target.value)}>
            {STAT_TYPES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
        <div className="col-span-1 p-1">
          <input type="number" className="w-full bg-transparent text-white text-xs outline-none p-1 text-right"
            value={data.mainStat.value} onChange={(e) => updateMainStat('value', Number(e.target.value))} />
        </div>
      </div>

      {/* Substats Header */}
      <div className="grid grid-cols-12 bg-slate-800 border-b border-slate-700 text-xs text-slate-400">
        <div className="col-span-7 p-1 border-r border-slate-700">SUBSTATS</div>
        <div className="col-span-2 p-1 border-r border-slate-700 text-center">ROLLS</div>
        <div className="col-span-3 p-1 text-center">VALUE</div>
      </div>

      {/* Substats Rows */}
      {data.substats.map((sub, idx) => (
        <div key={idx} className="grid grid-cols-12 border-b border-slate-800 last:border-b-0 text-xs hover:bg-slate-800">
          <div className="col-span-7 p-1 border-r border-slate-700">
            <select className="w-full bg-transparent text-slate-200 outline-none"
              value={sub.type} onChange={(e) => updateSubstat(idx, 'type', e.target.value)}>
              {STAT_TYPES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
            </select>
          </div>
          <div className="col-span-2 p-1 border-r border-slate-700">
            <input type="number" min="0" max="5" className="w-full bg-transparent text-slate-200 outline-none text-center"
              value={sub.rolls} onChange={(e) => updateSubstat(idx, 'rolls', Number(e.target.value))} />
          </div>
          <div className="col-span-3 p-1">
            <input type="number" className="w-full bg-transparent text-slate-200 outline-none text-right"
              value={sub.value} onChange={(e) => updateSubstat(idx, 'value', Number(e.target.value))} />
          </div>
        </div>
      ))}
    </div>
  );
};

// --- MAIN APPLICATION ---
export default function Simulator() {
  const [heroDataList, setHeroDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedHeroName, setSelectedHeroName] = useState('');
  const [level, setLevel] = useState(30);
  const [transcend, setTranscend] = useState(5);
  
  const [potentials, setPotentials] = useState({
    atk: { lv: 0, val: 0 },
    def: { lv: 0, val: 0 },
    hp: { lv: 0, val: 0 }
  });

  const [ring, setRing] = useState(5);

  const [equipment, setEquipment] = useState({
    weapon: { set: 'Avenger', mainStat: { type: 'Weakness Hit Chance', value: 28 }, substats: [...DEFAULT_SUBSTATS] },
    armor: { set: 'Avenger', mainStat: { type: 'Effect Resistance', value: 30 }, substats: [...DEFAULT_SUBSTATS] },
    accessory: { set: 'Avenger', mainStat: { type: 'Crit Rate', value: 24 }, substats: [...DEFAULT_SUBSTATS] }
  });

  // Fetch CSV on mount
  useEffect(() => {
    fetch('/DATA.csv')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load DATA.csv');
        return response.text();
      })
      .then(text => {
        const parsed = parseCSVData(text);
        if (parsed.length > 0) {
          setHeroDataList(parsed);
          setSelectedHeroName(parsed[0].name);
        } else {
          setErrorMsg('No character data found in CSV.');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('CSV Load Error:', err);
        setErrorMsg('Error loading DATA.csv. Please ensure it is in the public folder.');
        setIsLoading(false);
      });
  }, []);

  const activeHero = useMemo(() => {
    return heroDataList.find(h => h.name === selectedHeroName) || null;
  }, [heroDataList, selectedHeroName]);

  const finalStats = useMemo(() => {
    if (!activeHero) return null;

    let totals = {
      'Attack %': 0, 'Defense %': 0, 'HP %': 0, 'Speed': 0,
      'Crit Rate': 0, 'Crit Damage': 100, 
      'Weakness Hit Chance': 0, 'Block Rate': 0, 
      'Damage Taken Reduction': 0, 'Effect Hit Rate': 0, 'Effect Resistance': 0
    };

    Object.values(equipment).forEach(eq => {
      totals[eq.mainStat.type] += eq.mainStat.value;
      eq.substats.forEach(sub => totals[sub.type] += sub.value);
    });

    totals['Attack %'] += ring;
    totals['Defense %'] += ring;
    totals['HP %'] += ring;

    const baseAtkSum = activeHero.baseAtk + potentials.atk.val;
    const baseDefSum = activeHero.baseDef + potentials.def.val;
    const baseHpSum = activeHero.baseHp + potentials.hp.val;

    return {
      atk: Math.floor(baseAtkSum * (1 + totals['Attack %'] / 100)),
      def: Math.floor(baseDefSum * (1 + totals['Defense %'] / 100)),
      hp: Math.floor(baseHpSum * (1 + totals['HP %'] / 100)),
      spd: activeHero.baseSpd + totals['Speed'],
      critRate: totals['Crit Rate'],
      critDmg: totals['Crit Damage'],
      weakness: totals['Weakness Hit Chance'],
      block: totals['Block Rate'],
      dmgReduc: totals['Damage Taken Reduction'],
      effHit: totals['Effect Hit Rate'],
      effRes: totals['Effect Resistance']
    };
  }, [activeHero, potentials, equipment, ring]);

  if (isLoading) return <div className="p-10 text-white font-mono">Loading data from CSV...</div>;
  if (errorMsg) return <div className="p-10 text-red-500 font-mono">{errorMsg}</div>;
  if (!activeHero) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-2 font-mono text-sm">
      <div className="max-w-7xl mx-auto space-y-2">
        
        {/* TOP SECTION: Horizontal Spreadsheet Grid */}
        <div className="border border-slate-600 bg-slate-900 grid grid-cols-1 lg:grid-cols-12">
          
          {/* Character Selection block */}
          <div className="lg:col-span-4 border-r border-slate-600 flex flex-col">
            <GridHeader title="CHARACTER SELECTION" />
            <div className="grid grid-cols-3 gap-0 border-b border-slate-700">
              <div className="bg-slate-800 p-1 text-xs text-slate-400">Name</div>
              <div className="col-span-2 p-1">
                <select className="w-full bg-slate-950 text-white border border-slate-600 outline-none text-xs p-1"
                  value={selectedHeroName} onChange={e => setSelectedHeroName(e.target.value)}>
                  {heroDataList.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-0 border-b border-slate-700 text-xs">
              <div className="bg-slate-800 p-1 text-slate-400 text-center">Level</div>
              <div className="p-1 border-r border-slate-700">
                <input type="number" className="w-full bg-slate-950 text-white text-center border border-slate-600 outline-none" 
                  value={level} onChange={e => setLevel(Number(e.target.value))} />
              </div>
              <div className="bg-slate-800 p-1 text-slate-400 text-center">Trans</div>
              <div className="p-1">
                <input type="number" className="w-full bg-slate-950 text-white text-center border border-slate-600 outline-none" 
                  value={transcend} onChange={e => setTranscend(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 text-xs flex-1">
              <div className="bg-slate-800 p-1 text-slate-400 text-center border-r border-slate-700 flex flex-col justify-center">
                Element: <span className="text-white font-bold">{activeHero.element}</span>
              </div>
              <div className="bg-slate-800 p-1 text-slate-400 text-center flex flex-col justify-center">
                Type: <span className="text-white font-bold">{activeHero.type}</span>
              </div>
            </div>
          </div>

          {/* Potentials & Base Stats block */}
          <div className="lg:col-span-8 grid grid-cols-12">
            <div className="col-span-12">
              <GridHeader title="BASE STATS & POTENTIALS" />
            </div>
            {/* Headers */}
            <div className="col-span-12 grid grid-cols-12 bg-slate-800 border-b border-slate-700 text-xs text-center text-slate-400">
              <div className="col-span-3 p-1 border-r border-slate-700">STAT TYPE</div>
              <div className="col-span-3 p-1 border-r border-slate-700">BASE VALUE</div>
              <div className="col-span-3 p-1 border-r border-slate-700">POTENTIAL LV</div>
              <div className="col-span-3 p-1">POTENTIAL ADD</div>
            </div>
            {/* Rows */}
            {['atk', 'def', 'hp'].map((statKey) => {
              const label = statKey === 'atk' ? 'Attack' : statKey === 'def' ? 'Defense' : 'HP';
              const baseValue = statKey === 'atk' ? activeHero.baseAtk : statKey === 'def' ? activeHero.baseDef : activeHero.baseHp;
              return (
                <div key={statKey} className="col-span-12 grid grid-cols-12 border-b border-slate-700 text-xs items-center text-center">
                  <div className="col-span-3 p-1 border-r border-slate-700 bg-slate-800 font-bold uppercase">{label}</div>
                  <div className="col-span-3 p-1 border-r border-slate-700 text-white">{baseValue}</div>
                  <div className="col-span-3 p-1 border-r border-slate-700">
                     <input type="number" className="w-16 bg-slate-950 text-white text-center border border-slate-600 outline-none" 
                        value={potentials[statKey].lv} onChange={e => setPotentials({...potentials, [statKey]: {...potentials[statKey], lv: Number(e.target.value)}})} />
                  </div>
                  <div className="col-span-3 p-1">
                     <input type="number" className="w-20 bg-slate-950 text-green-400 font-bold text-center border border-slate-600 outline-none" 
                        value={potentials[statKey].val} onChange={e => setPotentials({...potentials, [statKey]: {...potentials[statKey], val: Number(e.target.value)}})} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE SECTION: Final Stats Summary */}
        <div className="border border-slate-600 bg-slate-900 grid grid-cols-1 md:grid-cols-4">
          <div className="md:col-span-4">
            <GridHeader title="FINAL STATUS CALCULATION SUMMARY" />
          </div>
          
          <div className="border-r border-slate-700 p-2 space-y-1 bg-slate-800">
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-1">
              <span className="text-orange-400 font-bold">Attack</span>
              <span className="text-white font-bold">{finalStats.atk.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-1">
              <span className="text-blue-400 font-bold">Defense</span>
              <span className="text-white font-bold">{finalStats.def.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-1">
              <span className="text-green-400 font-bold">HP</span>
              <span className="text-white font-bold">{finalStats.hp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-yellow-400 font-bold">Speed</span>
              <span className="text-white font-bold">{finalStats.spd}</span>
            </div>
          </div>

          <div className="border-r border-slate-700 p-2 space-y-1 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Crit Rate</span><span className="text-red-400 font-bold">{finalStats.critRate}%</span></div>
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Crit Damage</span><span className="text-red-400 font-bold">{finalStats.critDmg}%</span></div>
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Weakness Hit</span><span className="text-purple-400 font-bold">{finalStats.weakness}%</span></div>
            <div className="flex justify-between"><span>Block Rate</span><span className="text-blue-300 font-bold">{finalStats.block}%</span></div>
          </div>

          <div className="border-r border-slate-700 p-2 space-y-1 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Dmg Reduction</span><span className="text-emerald-400 font-bold">{finalStats.dmgReduc}%</span></div>
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Effect Hit</span><span className="text-teal-300 font-bold">{finalStats.effHit}%</span></div>
            <div className="flex justify-between"><span>Effect Res</span><span className="text-teal-300 font-bold">{finalStats.effRes}%</span></div>
          </div>

          <div className="p-2 space-y-2 text-xs flex flex-col justify-center">
             <div>
                <div className="text-slate-400 mb-1">Accessory Ring</div>
                <select className="w-full bg-slate-950 text-white border border-slate-600 outline-none p-1"
                  value={ring} onChange={e => setRing(Number(e.target.value))}>
                  {RING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label} (+{r.value}%)</option>)}
                </select>
             </div>
             <div className="bg-slate-950 border border-slate-700 p-1 text-center text-green-400">
               Damage Dealt 30%<br/>Boss Damage 40%
             </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Equipment Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <EquipmentBlock title="WEAPON" data={equipment.weapon} onChange={val => setEquipment({...equipment, weapon: val})} />
          <EquipmentBlock title="ARMOR" data={equipment.armor} onChange={val => setEquipment({...equipment, armor: val})} />
          <div className="md:col-span-2">
            <EquipmentBlock title="ACCESSORY" data={equipment.accessory} onChange={val => setEquipment({...equipment, accessory: val})} />
          </div>
        </div>

      </div>
    </div>
  );
}