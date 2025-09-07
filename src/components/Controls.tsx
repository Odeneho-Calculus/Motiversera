import { useEffect, useState } from 'react';
import type { Theme } from '../utils/themes';
import { themes } from '../utils/themes';

export type ControlsState = {
    themeId: string;
    fontFamily: string;
    fontSize: number; // px
    lineHeight: number; // px
    veilOpacity: number; // 0..1 overrides theme veilOpacity
    showVeil: boolean;
};

export function useControls(defaults?: Partial<ControlsState>) {
    const [state, setState] = useState<ControlsState>({
        themeId: defaults?.themeId || themes[0].id,
        fontFamily: defaults?.fontFamily || '"JetBrains Mono", "Fira Code", monospace',
        fontSize: defaults?.fontSize ?? 48,
        lineHeight: defaults?.lineHeight ?? 62,
        veilOpacity: defaults?.veilOpacity ?? themes[0].veilOpacity,
        showVeil: defaults?.showVeil ?? true,
    });

    // keep veil opacity in sync when theme changes
    useEffect(() => {
        const t = themes.find(t => t.id === state.themeId) || themes[0];
        setState(s => ({ ...s, veilOpacity: s.veilOpacity ?? t.veilOpacity }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.themeId]);

    return { state, setState } as const;
}

import styles from './Controls.module.scss';
import { TextInput } from './ui/Input';

export default function Controls({ state, setState }: { state: ControlsState; setState: (v: ControlsState) => void; }) {
    const currentTheme: Theme = themes.find(t => t.id === state.themeId) || themes[0];

    return (
        <div className={styles.root}>
            <div className={styles.row}>
                <label>Theme</label>
                <select value={state.themeId} onChange={(e) => setState({ ...state, themeId: e.target.value })} className="input" style={{ width: '100%' }}>
                    {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>

            <div className={styles.row}>
                <label>Font family</label>
                <TextInput
                    value={state.fontFamily}
                    onChange={(e) => setState({ ...state, fontFamily: e.target.value })}
                    placeholder='"JetBrains Mono", "Fira Code", monospace'
                />
            </div>

            <div className={styles.twoCols}>
                <label>Font size</label>
                <input type="number" min={20} max={96} value={state.fontSize} onChange={(e) => setState({ ...state, fontSize: Number(e.target.value) })} className="input" />
                <label>Line height</label>
                <input type="number" min={28} max={120} value={state.lineHeight} onChange={(e) => setState({ ...state, lineHeight: Number(e.target.value) })} className="input" />
            </div>

            <div className={styles.twoCols}>
                <label>Veil opacity</label>
                <input type="range" min={0} max={1} step={0.01} value={state.veilOpacity} onChange={(e) => setState({ ...state, veilOpacity: Number(e.target.value) })} />
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={state.showVeil} onChange={(e) => setState({ ...state, showVeil: e.target.checked })} />
                    Show veil
                </label>
            </div>

            <div className={styles.meta}>
                <div>Theme text: <span style={{ color: currentTheme.text }}>{currentTheme.text}</span></div>
                <div>Theme accent: <span style={{ color: currentTheme.accent }}>{currentTheme.accent}</span></div>
            </div>
        </div>
    );
}