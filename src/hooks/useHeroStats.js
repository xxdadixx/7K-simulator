import { useMemo } from 'react';
import { getTranscendBonus, getSubstatValue, getPotentialValue } from '../utils/helpers';

// 🌟 OPTIMIZATION: Moved static object OUTSIDE the hook
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

export const useHeroStats = (activeHero, equipment, potentials, transcend, ring) => {
  return useMemo(() => {
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

    const activeSetDetails = [];
    Object.entries(setCounts).forEach(([setName, count]) => {
      if (SET_BONUS_DATA[setName] && count >= 2) {
        const tier = count >= 4 ? 4 : 2;
        activeSetDetails.push({ name: setName, count: tier, effects: SET_BONUS_DATA[setName][tier] });
      }
    });

    let t4CR = 0, t4CDM = 0, t4WK = 0, t4BLK = 0, t4RED = 0, t4EFF = 0;
    if (transcend >= 4) {
      switch (activeHero.star4Type) {
        case 'CR': t4CR = 18; break; case 'CDM': t4CDM = 24; break; case 'WK': t4WK = 20; break;
        case 'BLK': t4BLK = 18; break; case 'RED': t4RED = 10; break; case 'EFF': t4EFF = 24; break;
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

    const cChar = 'text-(--color-char)'; const cEq = 'text-(--color-equip)';
    const cSet = 'text-(--color-set)'; const cRing = 'text-(--color-ring)';

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
};