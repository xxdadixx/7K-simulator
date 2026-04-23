import { SUBSTAT_BASES, TRANSCEND_MULTIPLIERS } from './constants';

export const getTranscendBonus = (baseValue, grade, heroStarType, statName, level) => {
    const safeGrade = grade.toUpperCase() === 'RARE' ? 'RARE' : 'LEGEND';
    const multipliers = TRANSCEND_MULTIPLIERS[safeGrade];
    const lv = Math.max(0, Math.min(12, level));

    let percent = 0;

    if (statName === 'Attack') {
        // Check if hero's StarType matching ATK
        if (heroStarType === 'ATK') {
            percent = multipliers.ATK[lv];
        } else {
            percent = multipliers.SUPPORT[lv];
        }
    } else if (statName === 'Defense') {
        // Check if hero's StarType matching DEF
        if (heroStarType === 'DEF') {
            percent = multipliers.DEF[lv];
        } else {
            percent = multipliers.SUPPORT[lv];
        }
    } else if (statName === 'HP') {
        // HP follows its own table without type check based on your formula
        percent = multipliers.HP[lv];
    }

    return Math.floor((baseValue * percent) / 100);
};

export const getSubstatValue = (type, rolls) => {
    const base = SUBSTAT_BASES[type] || 0;
    return base * (rolls + 1);
};

export const getValidationStatus = (equipments) => {
    let totalRemaining = 0;
    Object.values(equipments).forEach(eq => {
        const sumRolls = eq.substats.reduce((acc, sub) => acc + sub.rolls, 0);
        totalRemaining += (5 - sumRolls);
    });

    // คืนค่าเป็นรูปแบบ UI ที่พร้อมนำไปแสดงเป็นป้าย Pill
    if (totalRemaining > 0) {
        return { status: 'warning', text: `${totalRemaining} Substats Remaining`, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    } else if (totalRemaining < 0) {
        return { status: 'error', text: `Over Limit (${Math.abs(totalRemaining)})`, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
    } else {
        return { status: 'success', text: "Build Complete", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" };
    }
};

export const parseCSVData = (csvText) => {
    if (csvText.trim().toLowerCase().startsWith('<!doctype html>') || csvText.includes('<html')) {
        throw new Error("File not found. Please ensure 'DATA.csv' is exactly inside the 'public' folder.");
    }

    const lines = csvText.split(/\r?\n/);
    const parsedData = [];

    // รายชื่อที่ไม่อนุญาตให้ดึงมาเป็นตัวละคร
    const excludeNames = [
        'ICON', 'Acid Aqua Face', 'Vanguard', 'Bounty Tracker',
        'Paladin', 'Assassin', 'Gatekeeper', 'Guardian',
        'Avenger', 'Spellweaver', 'Orchestrator'
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');

        if (cols[0] === "" || cols[0] === "Name" || cols.includes('ELE') || cols.includes('GRADE')) continue;

        const name = cols[0];

        // ดักจับ: ถ้าชื่อว่าง หรือ ชื่อตรงกับใน Blacklist ให้ข้ามบรรทัดนี้ไปเลย
        if (!name || excludeNames.includes(name)) continue;

        parsedData.push({
            name: name,
            element: cols[5] || 'Unknown',
            type: cols[6] || 'Unknown',
            baseAtk: parseInt(cols[7], 10) || 0,
            baseDef: parseInt(cols[8], 10) || 0,
            baseHp: parseInt(cols[9], 10) || 0,
            baseSpd: parseInt(cols[10], 10) || 0,
            starType: cols[11] || '',
            star4Type: cols[12] || '',
            grade: cols[13] || 'LEGEND'
        });
    }

    if (parsedData.length === 0) {
        throw new Error("No valid character data found. Please check CSV column positions.");
    }

    return parsedData;
};

export const getPotentialValue = (type, level) => {
    let val = 0;
    let lv = Math.max(0, Math.min(30, level)); // Clamp between 0 and 30

    if (type === 'atk') {
        if (lv > 20) { val += (lv - 20) * 15; lv = 20; }
        if (lv > 10) { val += (lv - 10) * 12; lv = 10; }
        val += lv * 10;
    } else if (type === 'def') {
        if (lv > 20) { val += (lv - 20) * 10; lv = 20; }
        if (lv > 10) { val += (lv - 10) * 8; lv = 10; }
        val += lv * 7;
    } else if (type === 'hp') {
        if (lv > 20) { val += (lv - 20) * 45; lv = 20; }
        if (lv > 10) { val += (lv - 10) * 36; lv = 10; }
        val += lv * 32;
    }

    return val;
};

export const formatStatValue = (statName, value) => {
    if (!statName) return value;

    const percentStats = [
        'Crit Rate', 'Crit Damage', 'Weakness Hit Chance',
        'Block Rate', 'Damage Taken Reduction', 'Effect Hit Rate', 'Effect Resistance'
    ];

    if (statName.includes('%') || percentStats.includes(statName)) {
        return `${value}%`;
    }

    return value.toLocaleString();
};