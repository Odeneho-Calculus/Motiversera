import React, { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { TextInput, Select } from './ui/Input';
import styles from './CropTools.module.scss';

interface CropSettings {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
}

interface CropToolsProps {
    cropSettings: CropSettings;
    onUpdateCrop: (settings: Partial<CropSettings>) => void;
    onApplyCrop: () => void;
    onResetCrop: () => void;
    isActive: boolean;
}

export default function CropTools({
    cropSettings,
    onUpdateCrop,
    onApplyCrop,
    onResetCrop,
    isActive
}: CropToolsProps) {
    const [presetSizes] = useState([
        { label: 'Instagram Story', width: 1080, height: 1920, ratio: '9:16' },
        { label: 'Instagram Post', width: 1080, height: 1080, ratio: '1:1' },
        { label: 'YouTube Thumbnail', width: 1280, height: 720, ratio: '16:9' },
        { label: 'Twitter Header', width: 1500, height: 500, ratio: '3:1' },
        { label: 'Facebook Cover', width: 820, height: 312, ratio: '2.63:1' }
    ]);

    const aspectRatios = [
        { value: 'free', label: 'Free' },
        { value: '1:1', label: '1:1 Square' },
        { value: '4:3', label: '4:3 Landscape' },
        { value: '3:4', label: '3:4 Portrait' },
        { value: '16:9', label: '16:9 Widescreen' },
        { value: '9:16', label: '9:16 Vertical' }
    ];

    const handlePresetClick = (preset: typeof presetSizes[0]) => {
        onUpdateCrop({
            width: preset.width,
            height: preset.height,
            x: (1080 - preset.width) / 2,
            y: (1920 - preset.height) / 2,
            aspectRatio: preset.ratio as CropSettings['aspectRatio']
        });
    };

    const handleAspectRatioChange = (ratio: CropSettings['aspectRatio']) => {
        onUpdateCrop({ aspectRatio: ratio });

        if (ratio !== 'free') {
            const [w, h] = ratio.split(':').map(Number);
            const aspectRatio = w / h;

            let newWidth = cropSettings.width;
            let newHeight = cropSettings.height;

            if (cropSettings.width / cropSettings.height > aspectRatio) {
                newWidth = cropSettings.height * aspectRatio;
            } else {
                newHeight = cropSettings.width / aspectRatio;
            }

            onUpdateCrop({
                width: Math.round(newWidth),
                height: Math.round(newHeight),
                x: (1080 - newWidth) / 2,
                y: (1920 - newHeight) / 2
            });
        }
    };

    return (
        <div className={styles.cropTools}>
            <div className={styles.panelHeader}>
                <h3>Crop Tools</h3>
                <div className={styles.buttonGroup}>
                    <Button size="sm" variant="outline" onClick={onResetCrop}>
                        Reset
                    </Button>
                    <Button size="sm" onClick={onApplyCrop} disabled={!isActive}>
                        Apply
                    </Button>
                </div>
            </div>

            <Card>
                <label>Aspect Ratio</label>
                <Select
                    value={cropSettings.aspectRatio}
                    onChange={(e) => handleAspectRatioChange(e.target.value as CropSettings['aspectRatio'])}
                >
                    {aspectRatios.map(ratio => (
                        <option key={ratio.value} value={ratio.value}>
                            {ratio.label}
                        </option>
                    ))}
                </Select>
            </Card>

            <Card>
                <label>Crop Dimensions</label>
                <div className={styles.formGrid}>
                    <label>X Position</label>
                    <TextInput
                        type="number"
                        value={cropSettings.x}
                        onChange={(e) => onUpdateCrop({ x: Number(e.target.value) })}
                        min="0"
                        max="1080"
                    />

                    <label>Y Position</label>
                    <TextInput
                        type="number"
                        value={cropSettings.y}
                        onChange={(e) => onUpdateCrop({ y: Number(e.target.value) })}
                        min="0"
                        max="1920"
                    />

                    <label>Width</label>
                    <TextInput
                        type="number"
                        value={cropSettings.width}
                        onChange={(e) => onUpdateCrop({ width: Number(e.target.value) })}
                        min="50"
                        max="1080"
                    />

                    <label>Height</label>
                    <TextInput
                        type="number"
                        value={cropSettings.height}
                        onChange={(e) => onUpdateCrop({ height: Number(e.target.value) })}
                        min="50"
                        max="1920"
                    />
                </div>
            </Card>

            <Card>
                <label>Preset Sizes</label>
                <div className={styles.presetGrid}>
                    {presetSizes.map((preset, index) => (
                        <button
                            key={index}
                            className={styles.presetButton}
                            onClick={() => handlePresetClick(preset)}
                            title={`${preset.width}×${preset.height}`}
                        >
                            <div className={styles.presetLabel}>{preset.label}</div>
                            <div className={styles.presetSize}>
                                {preset.width}×{preset.height}
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            {isActive && (
                <Card>
                    <div className={styles.cropPreview}>
                        <div className={styles.previewLabel}>Crop Preview</div>
                        <div className={styles.cropInfo}>
                            Position: {cropSettings.x}, {cropSettings.y}<br />
                            Size: {cropSettings.width}×{cropSettings.height}<br />
                            Aspect: {cropSettings.aspectRatio}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}