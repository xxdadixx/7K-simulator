import React, { useState, useEffect, useMemo } from 'react';

// --- CONSTANTS & MAPPING RULES ---
const TRANSCEND_MULTIPLIERS = {
  LEGEND: {
    ATK: {
      Attack:  [0, 0.12, 0.18, 0.18, 0.18, 0.30, 0.36, 0.38, 0.40, 0.42, 0.44, 0.46, 0.48],
      Defense: [0, 0, 0, 0, 0, 0, 0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12], 
      HP:      [0, 0, 0, 0, 0, 0, 0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12]
    },
    NON_ATK: {
      Attack:  [0, 0, 0, 0, 0, 0, 0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12],
      Defense: [0, 0.12, 0.18, 0.18, 0.18, 0.30, 0.36, 0.38, 0.40, 0.42, 0.44, 0.46, 0.48],
      HP:      [0, 0.12, 0.18, 0.18, 0.18, 0.30, 0.36, 0.38, 0.40, 0.42, 0.44, 0.46, 0.48]
    }
  },
  RARE: {
    ATK: {
      Attack:  [0, 0.08, 0.12, 0.12, 0.12, 0.20, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37],
      Defense: [0, 0, 0, 0, 0, 0, 0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06],
      HP:      [0, 0, 0, 0, 0, 0, 0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06]
    },
    NON_ATK: {
      Attack:  [0, 0, 0, 0, 0, 0, 0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06],
      Defense: [0, 0.08, 0.12, 0.12, 0.12, 0.20, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37],
      HP:      [0, 0.08, 0.12, 0.12, 0.12, 0.20, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37]
    }
  }
};

const WEAPON_MAIN_VALUES = {
  'Attack %': 28, 'Attack Flat': 240, 'Defense %': 28, 'Defense Flat': 160,
  'HP %': 28, 'HP Flat': 850, 'Crit Rate': 24, 'Crit Damage': 36,
  'Weakness Hit Chance': 28, 'Effect Hit Rate': 30
};

const ARMOR_MAIN_VALUES = {
  'Attack %': 28, 'Attack Flat': 240, 'Defense %': 28, 'Defense Flat': 160,
  'HP %': 28, 'HP Flat': 850, 'Block Rate': 24, 'Damage Taken Reduction': 16,
  'Effect Resistance': 30
};

const SUBSTAT_BASES = {
  'Attack %': 5, 'Attack Flat': 50, 'Defense %': 5, 'Defense Flat': 30,
  'HP %': 5, 'HP Flat': 180, 'Speed': 4, 'Crit Rate': 4, 'Crit Damage': 6,
  'Weakness Hit Chance': 5, 'Block Rate': 4, 'Effect Hit Rate': 5, 'Effect Resistance': 5
};

const SET_OPTIONS = ['Avenger', 'Orchestrator', 'Spellweaver', 'Paladin', 'Gatekeeper', 'Assassin', 'Bounty Tracker', 'None'];
const RING_OPTIONS = [
  { label: 'None', value: 0 }, { label: 'Ring 4★', value: 5 },
  { label: 'Ring 5★', value: 7 }, { label: 'Ring 6★', value: 10 }
];

// --- HELPER LOGIC FUNCTIONS ---
const getTranscendBonus = (baseValue, grade, type, statName, level) => {
  const safeGrade = grade.toUpperCase() === 'RARE' ? 'RARE' : 'LEGEND';
  const safeType = type.toUpperCase() === 'ATTACK' || type.toUpperCase() === 'ATK' ? 'ATK' : 'NON_ATK';
  const multipliers = TRANSCEND_MULTIPLIERS[safeGrade][safeType][statName];
  const multiplier = multipliers && level >= 0 && level <= 12 ? multipliers[level] : 0;
  return Math.floor(baseValue * multiplier);
};

const getSubstatValue = (type, rolls) => {
  const base = SUBSTAT_BASES[type] || 0;
  return base * (rolls + 1);
};

const calculateSetBonus = (setsArray) => {
  const counts = {};
  setsArray.forEach(s => { if (s !== 'None') counts[s] = (counts[s] || 0) + 1; });

  if (counts['Paladin'] === 4) return "Income Healing Boots 20%";
  if (counts['Gatekeeper'] === 4) return "Block Damage Reduction 10%";
  if (counts['Avenger'] === 4) return "Damage Dealt 30%\nBoss Damage 40%";
  if (counts['Avenger'] >= 2) return "Damage Dealt 15%";
  if (counts['Assassin'] === 4) return "Ignore Defense 15%";
  if (counts['Bounty Tracker'] === 4) return "Weakness Hit Damage 35%";
  if (counts['Spellweaver'] === 4) return "Effect Probability 10%";
  if (counts['Orchestrator'] === 4) return "Star Battles with 1 turn of Crowd Control Immunity";
  
  return "-";
};

const getValidationStatus = (equipments) => {
  let totalRemaining = 0;
  Object.values(equipments).forEach(eq => {
    const sumRolls = eq.substats.reduce((acc, sub) => acc + sub.rolls, 0);
    totalRemaining += (5 - sumRolls);
  });

  if (totalRemaining > 0) {
    return { text: "ยังเหลือออฟรองที่ยังไม่ได้ใช้น้า\n--------------------------\nYou still have unused substats remaining", color: "text-yellow-400" };
  } else if (totalRemaining < 0) {
    return { text: "มีออฟรองเกินความเป็นจริงแล้ว!?\n--------------------------\nThere are more substats than possible!?", color: "text-red-500" };
  } else {
    return { text: "ยินดีด้วยคุณบิลด์เสร็จแล้ว\n--------------------------\nYour build is complete!", color: "text-green-400" };
  }
};

const parseCSVData = (csvText) => {
  const lines = csvText.split(/\r?\n/);
  const parsedData = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    const name = cols[1];
    if (!name || name === 'Name') continue;

    parsedData.push({
      name: name,
      element: cols[6] || 'Unknown',
      type: cols[7] || 'Unknown',
      baseAtk: parseInt(cols[8], 10) || 0,
      baseDef: parseInt(cols[9], 10) || 0,
      baseHp: parseInt(cols[10], 10) || 0,
      baseSpd: parseInt(cols[11], 10) || 0,
      grade: cols[14] || 'LEGEND'
    });
  }
  return parsedData;
};

// --- UI COMPONENTS ---
const GridHeader = ({ title }) => (
  <div className="bg-slate-700 text-white font-bold text-xs p-1 uppercase border border-slate-600">
    {title}
  </div>
);

const EquipmentBlock = ({ title, data, onChange, allowedMains }) => {
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
    const newSubs = [...data.substats];
    newSubs[index].rolls = Number(rollStr);
    onChange({ ...data, substats: newSubs });
  };

  const mainStatKeys = allowedMains ? Object.keys(allowedMains) : Object.keys(SUBSTAT_BASES);

  return (
    <div className="border border-slate-600 bg-slate-900 flex flex-col">
      <GridHeader title={title} />
      
      <div className="grid grid-cols-4 border-b border-slate-700">
        <div className="bg-slate-800 text-slate-300 text-xs p-1 flex items-center">SET NAME</div>
        <div className="col-span-3 p-1">
          <select className="w-full bg-transparent text-white text-xs border border-slate-600 outline-none p-1"
            value={data.set} onChange={(e) => onChange({...data, set: e.target.value})}>
            {SET_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-700">
        <div className="bg-slate-800 text-yellow-500 font-bold text-xs p-1 flex items-center">MAIN STAT</div>
        <div className="col-span-2 p-1 border-r border-slate-700">
          <select className="w-full bg-transparent text-white text-xs outline-none p-1"
            value={data.mainStat.type} onChange={(e) => updateMainStat(e.target.value)}>
            {mainStatKeys.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
        <div className="col-span-1 p-1 flex items-center justify-end pr-2 text-white text-xs font-bold">
          {data.mainStat.value}
        </div>
      </div>

      <div className="grid grid-cols-12 bg-slate-800 border-b border-slate-700 text-[10px] text-slate-400 font-bold">
        <div className="col-span-7 p-1 border-r border-slate-700">SUBSTATS</div>
        <div className="col-span-2 p-1 border-r border-slate-700 text-center">ROLLS</div>
        <div className="col-span-3 p-1 text-center">TOTAL VAL</div>
      </div>

      {data.substats.map((sub, idx) => (
        <div key={idx} className="grid grid-cols-12 border-b border-slate-800 last:border-b-0 text-xs hover:bg-slate-800">
          <div className="col-span-7 p-1 border-r border-slate-700">
            <select className="w-full bg-transparent text-slate-200 outline-none text-xs"
              value={sub.type} onChange={(e) => updateSubstatType(idx, e.target.value)}>
              {Object.keys(SUBSTAT_BASES).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
            </select>
          </div>
          <div className="col-span-2 p-1 border-r border-slate-700">
            <input type="number" min="0" max="5" className="w-full bg-slate-950 text-slate-200 border border-slate-600 outline-none text-center"
              value={sub.rolls} onChange={(e) => updateSubstatRolls(idx, e.target.value)} />
          </div>
          <div className="col-span-3 p-1 flex items-center justify-end pr-2 text-white">
            {getSubstatValue(sub.type, sub.rolls)}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- MAIN APPLICATION ---
export default function Simulator() {
  const [heroDataList, setHeroDataList] = useState([]);
  const [selectedHeroName, setSelectedHeroName] = useState('');
  
  const [level, setLevel] = useState(30);
  const [transcend, setTranscend] = useState(5);
  const [ring, setRing] = useState(5);

  const [potentials, setPotentials] = useState({
    atk: { lv: 0, val: 0 }, def: { lv: 0, val: 0 }, hp: { lv: 0, val: 0 }
  });

  const defaultSubstats = () => Array(5).fill(0).map(() => ({ type: 'Attack %', rolls: 0 }));

  const [equipment, setEquipment] = useState({
    weapon: { set: 'Avenger', mainStat: { type: 'Attack %', value: 28 }, substats: defaultSubstats() },
    armor: { set: 'Avenger', mainStat: { type: 'Defense %', value: 28 }, substats: defaultSubstats() },
    acc1: { set: 'Avenger', mainStat: { type: 'Crit Rate', value: 24 }, substats: defaultSubstats() },
    acc2: { set: 'Avenger', mainStat: { type: 'Crit Damage', value: 36 }, substats: defaultSubstats() }
  });

  useEffect(() => {
    fetch('/DATA.csv')
      .then(res => res.text())
      .then(text => {
        const parsed = parseCSVData(text);
        if (parsed.length > 0) {
          setHeroDataList(parsed);
          setSelectedHeroName(parsed[0].name);
        }
      }).catch(err => console.error(err));
  }, []);

  const activeHero = useMemo(() => heroDataList.find(h => h.name === selectedHeroName) || null, [heroDataList, selectedHeroName]);

  const finalStats = useMemo(() => {
    if (!activeHero) return null;

    let totals = {
      'Attack %': 0, 'Attack Flat': 0, 'Defense %': 0, 'Defense Flat': 0,
      'HP %': 0, 'HP Flat': 0, 'Speed': 0, 'Crit Rate': 0, 'Crit Damage': 100, 
      'Weakness Hit Chance': 0, 'Block Rate': 0, 'Damage Taken Reduction': 0, 
      'Effect Hit Rate': 0, 'Effect Resistance': 0
    };

    Object.values(equipment).forEach(eq => {
      totals[eq.mainStat.type] = (totals[eq.mainStat.type] || 0) + eq.mainStat.value;
      eq.substats.forEach(sub => {
        totals[sub.type] = (totals[sub.type] || 0) + getSubstatValue(sub.type, sub.rolls);
      });
    });

    totals['Attack %'] += ring;
    totals['Defense %'] += ring;
    totals['HP %'] += ring;

    const tAtk = getTranscendBonus(activeHero.baseAtk, activeHero.grade, activeHero.type, 'Attack', transcend);
    const tDef = getTranscendBonus(activeHero.baseDef, activeHero.grade, activeHero.type, 'Defense', transcend);
    const tHp  = getTranscendBonus(activeHero.baseHp, activeHero.grade, activeHero.type, 'HP', transcend);

    const baseAtkSum = activeHero.baseAtk + tAtk + potentials.atk.val;
    const baseDefSum = activeHero.baseDef + tDef + potentials.def.val;
    const baseHpSum = activeHero.baseHp + tHp + potentials.hp.val;

    return {
      tAtk, tDef, tHp,
      atk: Math.floor(baseAtkSum * (1 + totals['Attack %'] / 100)) + totals['Attack Flat'],
      def: Math.floor(baseDefSum * (1 + totals['Defense %'] / 100)) + totals['Defense Flat'],
      hp:  Math.floor(baseHpSum * (1 + totals['HP %'] / 100)) + totals['HP Flat'],
      spd: activeHero.baseSpd + totals['Speed'],
      critRate: totals['Crit Rate'],
      critDmg: totals['Crit Damage'],
      weakness: totals['Weakness Hit Chance'],
      block: totals['Block Rate'],
      dmgReduc: totals['Damage Taken Reduction'],
      effHit: totals['Effect Hit Rate'],
      effRes: totals['Effect Resistance'],
      activeSetBonus: calculateSetBonus([equipment.weapon.set, equipment.armor.set, equipment.acc1.set, equipment.acc2.set])
    };
  }, [activeHero, potentials, equipment, ring, transcend]);

  const validationMsg = getValidationStatus(equipment);

  if (!activeHero) return <div className="p-10 text-white font-mono">Loading data...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-2 font-mono text-sm">
      <div className="max-w-7xl mx-auto space-y-2">
        
        {/* VALIDATION MESSAGE */}
        <div className={`border border-slate-700 bg-slate-900 p-3 text-center whitespace-pre-line font-bold text-xs ${validationMsg.color}`}>
          {validationMsg.text}
        </div>

        {/* TOP SECTION: Horizontal Spreadsheet Grid */}
        <div className="border border-slate-600 bg-slate-900 grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-4 border-r border-slate-600 flex flex-col">
            <GridHeader title="CHARACTER SETUP" />
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
              <div className="bg-slate-800 p-1 text-slate-400 text-center">★ Trans</div>
              <div className="p-1">
                <input type="number" min="0" max="12" className="w-full bg-slate-950 text-white text-center border border-slate-600 outline-none" 
                  value={transcend} onChange={e => setTranscend(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-0 text-xs flex-1">
              <div className="bg-slate-800 p-1 text-slate-400 text-center border-r border-slate-700">
                Ele: <span className="text-white font-bold">{activeHero.element}</span>
              </div>
              <div className="bg-slate-800 p-1 text-slate-400 text-center border-r border-slate-700">
                Type: <span className="text-white font-bold">{activeHero.type}</span>
              </div>
              <div className="bg-slate-800 p-1 text-slate-400 text-center">
                Grade: <span className="text-white font-bold">{activeHero.grade}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-12">
            <div className="col-span-12">
              <GridHeader title="BASE STATS & POTENTIALS & TRANSCENDENCE" />
            </div>
            <div className="col-span-12 grid grid-cols-12 bg-slate-800 border-b border-slate-700 text-[10px] text-center text-slate-400 font-bold">
              <div className="col-span-2 p-1 border-r border-slate-700">STAT</div>
              <div className="col-span-2 p-1 border-r border-slate-700">BASE VAL</div>
              <div className="col-span-3 p-1 border-r border-slate-700">★ BONUS</div>
              <div className="col-span-2 p-1 border-r border-slate-700">POTEN LV</div>
              <div className="col-span-3 p-1">POTEN ADD</div>
            </div>
            {['atk', 'def', 'hp'].map((statKey) => {
              const label = statKey === 'atk' ? 'Attack' : statKey === 'def' ? 'Defense' : 'HP';
              const baseValue = statKey === 'atk' ? activeHero.baseAtk : statKey === 'def' ? activeHero.baseDef : activeHero.baseHp;
              const transBonus = statKey === 'atk' ? finalStats.tAtk : statKey === 'def' ? finalStats.tDef : finalStats.tHp;
              return (
                <div key={statKey} className="col-span-12 grid grid-cols-12 border-b border-slate-700 text-xs items-center text-center">
                  <div className="col-span-2 p-1 border-r border-slate-700 bg-slate-800 font-bold">{label}</div>
                  <div className="col-span-2 p-1 border-r border-slate-700 text-white">{baseValue}</div>
                  <div className="col-span-3 p-1 border-r border-slate-700 text-yellow-300">+{transBonus}</div>
                  <div className="col-span-2 p-1 border-r border-slate-700">
                     <input type="number" className="w-full bg-slate-950 text-white text-center border border-slate-600 outline-none" 
                        value={potentials[statKey].lv} onChange={e => setPotentials({...potentials, [statKey]: {...potentials[statKey], lv: Number(e.target.value)}})} />
                  </div>
                  <div className="col-span-3 p-1">
                     <input type="number" className="w-full bg-slate-950 text-green-400 font-bold text-center border border-slate-600 outline-none" 
                        value={potentials[statKey].val} onChange={e => setPotentials({...potentials, [statKey]: {...potentials[statKey], val: Number(e.target.value)}})} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE SECTION: Final Stats */}
        <div className="border border-slate-600 bg-slate-900 grid grid-cols-1 md:grid-cols-4">
          <div className="md:col-span-4">
            <GridHeader title="FINAL SUMMARY" />
          </div>
          
          <div className="border-r border-slate-700 p-2 space-y-1 bg-slate-800">
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-1">
              <span className="text-orange-400 font-bold">Attack</span><span className="text-white font-bold">{finalStats.atk.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-1">
              <span className="text-blue-400 font-bold">Defense</span><span className="text-white font-bold">{finalStats.def.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-1">
              <span className="text-green-400 font-bold">HP</span><span className="text-white font-bold">{finalStats.hp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-yellow-400 font-bold">Speed</span><span className="text-white font-bold">{finalStats.spd}</span>
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
            <div className="flex justify-between border-b border-slate-800 pb-1"><span>Effect Res</span><span className="text-teal-300 font-bold">{finalStats.effRes}%</span></div>
          </div>

          <div className="p-2 space-y-2 text-xs flex flex-col justify-center">
             <div>
                <select className="w-full bg-slate-950 text-white border border-slate-600 outline-none p-1"
                  value={ring} onChange={e => setRing(Number(e.target.value))}>
                  {RING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label} (+{r.value}%)</option>)}
                </select>
             </div>
             <div className="bg-slate-950 border border-slate-700 p-1 text-center text-green-400 whitespace-pre-line leading-tight h-full flex items-center justify-center">
               {finalStats.activeSetBonus}
             </div>
          </div>
        </div>

        {/* BOTTOM SECTION: 4 Equipment Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <EquipmentBlock title="WEAPON / SLOT 1" data={equipment.weapon} allowedMains={WEAPON_MAIN_VALUES} onChange={v => setEquipment({...equipment, weapon: v})} />
          <EquipmentBlock title="ARMOR / SLOT 2" data={equipment.armor} allowedMains={ARMOR_MAIN_VALUES} onChange={v => setEquipment({...equipment, armor: v})} />
          <EquipmentBlock title="ACC 1 / SLOT 3" data={equipment.acc1} onChange={v => setEquipment({...equipment, acc1: v})} />
          <EquipmentBlock title="ACC 2 / SLOT 4" data={equipment.acc2} onChange={v => setEquipment({...equipment, acc2: v})} />
        </div>

      </div>
    </div>
  );
}