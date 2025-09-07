import React, { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { TextInput } from './ui/Input';
import styles from './TransformTools.module.scss';

interface TransformSettings {
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    flipH: boolean;
    flipV: boolean;
}

interface TransformToolsProps {
    transformSettings: TransformSettings;
    onUpdateTransform: (settings: Partial<TransformSettings>) => void;
    onResetTransform: () => void;
    onApplyTransform: () => void;
}

export default function TransformTools({
    transformSettings,
    onUpdateTransform,
    onResetTransform,
    onApplyTransform
}: TransformToolsProps) {
    const [lockAspect, setLockAspect] = useState(true);

    const handleScaleXChange = (value: number) => {
        if (lockAspect) {
            onUpdateTransform({ scaleX: value, scaleY: value });
        } else {
            onUpdateTransform({ scaleX: value });
        }
    };

    const handleScaleYChange = (value: number) => {
        if (lockAspect) {
            onUpdateTransform({ scaleX: value, scaleY: value });
        } else {
            onUpdateTransform({ scaleY: value });
        }
    };

    const presetTransforms = [
        { label: 'Rotate 90°', action: () => onUpdateTransform({ rotation: (transformSettings.rotation + 90) % 360 }) },
        { label: 'Rotate -90°', action: () => onUpdateTransform({ rotation: (transformSettings.rotation - 90) % 360 }) },
        { label: 'Flip H', action: () => onUpdateTransform({ flipH: !transformSettings.flipH }) },
        { label: 'Flip V', action: () => onUpdateTransform({ flipV: !transformSettings.flipV }) },
        { label: 'Scale 2x', action: () => onUpdateTransform({ scaleX: 2, scaleY: 2 }) },
        { label: 'Scale 0.5x', action: () => onUpdateTransform({ scaleX: 0.5, scaleY: 0.5 }) }
    ];

    return (
        <div className={styles.transformTools}>
            <div className={styles.panelHeader}>
                <h3>Transform Tools</h3>
                <div className={styles.buttonGroup}>
                    <Button size="sm" variant="outline" onClick={onResetTransform}>
                        Reset
                    </Button>
                    <Button size="sm" onClick={onApplyTransform}>
                        Apply
                    </Button>
                </div>
            </div>

            <Card>
                <div className={styles.quickActions}>
                    <label>Quick Actions</label>
                    <div className={styles.actionGrid}>
                        {presetTransforms.map((preset, index) => (
                            <button
                                key={index}
                                className={styles.actionButton}
                                onClick={preset.action}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <div className={styles.scaleSection}>
                    <div className={styles.sectionHeader}>
                        <label>Scale</label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={lockAspect}
                                onChange={(e) => setLockAspect(e.target.checked)}
                            />
                            Lock Aspect
                        </label>
                    </div>

                    <div className={styles.formGrid}>
                        <label>Scale X</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={transformSettings.scaleX}
                                onChange={(e) => handleScaleXChange(Number(e.target.value))}
                                className={styles.rangeInput}
                            />
                            <TextInput
                                type="number"
                                value={transformSettings.scaleX}
                                onChange={(e) => handleScaleXChange(Number(e.target.value))}
                                step="0.1"
                                min="0.1"
                                max="5"
                                className={styles.numberInput}
                            />
                        </div>

                        <label>Scale Y</label>
                        <div className={styles.inputGroup}>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={transformSettings.scaleY}
                                onChange={(e) => handleScaleYChange(Number(e.target.value))}
                                className={styles.rangeInput}
                                disabled={lockAspect}
                            />
                            <TextInput
                                type="number"
                                value={transformSettings.scaleY}
                                onChange={(e) => handleScaleYChange(Number(e.target.value))}
                                step="0.1"
                                min="0.1"
                                max="5"
                                disabled={lockAspect}
                                className={styles.numberInput}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <label>Rotation</label>
                <div className={styles.rotationControls}>
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        value={transformSettings.rotation}
                        onChange={(e) => onUpdateTransform({ rotation: Number(e.target.value) })}
                        className={styles.rangeInput}
                    />
                    <div className={styles.rotationValue}>
                        {transformSettings.rotation}°
                    </div>
                </div>
                <div className={styles.rotationButtons}>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateTransform({ rotation: transformSettings.rotation - 15 })}
                    >
                        -15°
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateTransform({ rotation: 0 })}
                    >
                        0°
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateTransform({ rotation: transformSettings.rotation + 15 })}
                    >
                        +15°
                    </Button>
                </div>
            </Card>

            <Card>
                <label>Skew</label>
                <div className={styles.formGrid}>
                    <label>Skew X</label>
                    <div className={styles.inputGroup}>
                        <input
                            type="range"
                            min="-45"
                            max="45"
                            value={transformSettings.skewX}
                            onChange={(e) => onUpdateTransform({ skewX: Number(e.target.value) })}
                            className={styles.rangeInput}
                        />
                        <span className={styles.skewValue}>{transformSettings.skewX}°</span>
                    </div>

                    <label>Skew Y</label>
                    <div className={styles.inputGroup}>
                        <input
                            type="range"
                            min="-45"
                            max="45"
                            value={transformSettings.skewY}
                            onChange={(e) => onUpdateTransform({ skewY: Number(e.target.value) })}
                            className={styles.rangeInput}
                        />
                        <span className={styles.skewValue}>{transformSettings.skewY}°</span>
                    </div>
                </div>
            </Card>

            <Card>
                <label>Flip</label>
                <div className={styles.flipControls}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={transformSettings.flipH}
                            onChange={(e) => onUpdateTransform({ flipH: e.target.checked })}
                        />
                        Flip Horizontal
                    </label>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={transformSettings.flipV}
                            onChange={(e) => onUpdateTransform({ flipV: e.target.checked })}
                        />
                        Flip Vertical
                    </label>
                </div>
            </Card>
        </div>
    );
}