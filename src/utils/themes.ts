export type Theme = {
    id: string;
    name: string;
    text: string; // default text color
    accent: string; // typing effect color
    veil: string; // base overlay color
    veilOpacity: number; // 0..1
    bgGradient: [string, string]; // for gradient fallback
    keyword?: string;
    string?: string;
    number?: string;
    comment?: string;
};

export const themes: Theme[] = [
    {
        id: 'dark-code',
        name: 'Dark Code',
        text: '#c9d1d9',
        accent: '#7ee787',
        veil: '#000000',
        veilOpacity: 0.5,
        bgGradient: ['#0d1117', '#1e1e1e'],
        keyword: '#79c0ff',
        string: '#a5d6ff',
        number: '#ffab70',
        comment: '#8b949e',
    },
    {
        id: 'midnight',
        name: 'Midnight',
        text: '#e6edf3',
        accent: '#00e7a7',
        veil: '#0b1220',
        veilOpacity: 0.55,
        bgGradient: ['#0b1220', '#101b30'],
        keyword: '#5ab5ff',
        string: '#ffd580',
        number: '#ffa657',
        comment: '#7d8590',
    },
    {
        id: 'paper',
        name: 'Paper',
        text: '#1f2328',
        accent: '#0969da',
        veil: '#ffffff',
        veilOpacity: 0.18,
        bgGradient: ['#f7f7f7', '#eaeef2'],
        keyword: '#6639ba',
        string: '#0550ae',
        number: '#bc4c00',
        comment: '#6e7781',
    },
];

export function getTheme(id: string | null | undefined): Theme {
    const t = themes.find(t => t.id === id);
    return t || themes[0];
}