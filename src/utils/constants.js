export const TRANSCEND_MULTIPLIERS = {
    LEGEND: {
        ATK: [0, 12, 18, 18, 18, 30, 36, 38, 40, 42, 44, 46, 48],
        DEF: [0, 12, 18, 18, 18, 30, 36, 38, 40, 42, 44, 46, 48],
        HP: [0, 0, 0, 18, 18, 18, 18, 20, 22, 24, 26, 28, 30],
        SUPPORT: [0, 0, 0, 0, 0, 0, 0, 2, 4, 6, 8, 10, 12] // Non-matching type bonus
    },
    RARE: {
        ATK: [0, 9, 13.5, 13.5, 13.5, 22.5, 27, 29, 31, 33, 35, 37, 39],
        DEF: [0, 9, 13.5, 13.5, 13.5, 22.5, 27, 29, 31, 33, 35, 37, 39],
        HP: [0, 0, 0, 14, 14, 14, 14, 16, 18, 20, 22, 24, 36], // Followed your 36 for Lv.12
        SUPPORT: [0, 0, 0, 0, 0, 0, 0, 2, 4, 6, 8, 10, 12]
    }
};

export const WEAPON_MAIN_VALUES = {
    'Attack %': 28, 'Attack Flat': 240, 'Defense %': 28, 'Defense Flat': 160,
    'HP %': 28, 'HP Flat': 850, 'Crit Rate': 24, 'Crit Damage': 36,
    'Weakness Hit Chance': 28, 'Effect Hit Rate': 30
};

export const ARMOR_MAIN_VALUES = {
    'Attack %': 28, 'Attack Flat': 240, 'Defense %': 28, 'Defense Flat': 160,
    'HP %': 28, 'HP Flat': 850, 'Block Rate': 24, 'Damage Taken Reduction': 16,
    'Effect Resistance': 30
};

export const SUBSTAT_BASES = {
    'Attack %': 5, 'Attack Flat': 50, 'Defense %': 5, 'Defense Flat': 30,
    'HP %': 5, 'HP Flat': 180, 'Speed': 4, 'Crit Rate': 4, 'Crit Damage': 6,
    'Weakness Hit Chance': 5, 'Block Rate': 4, 'Effect Hit Rate': 5, 'Effect Resistance': 5
};

export const SET_OPTIONS = [
    'Avenger', 'Orchestrator', 'Spellweaver', 'Paladin',
    'Gatekeeper', 'Assassin', 'Bounty Tracker', 'Guardian', 'Vanguard', 'None'
];

export const RING_OPTIONS = [
    { label: 'None', value: 0 },
    { label: 'Ring 4 Star', value: 5 },
    { label: 'Ring 5 Star', value: 7 },
    { label: 'Ring 6 Star', value: 10 }
];