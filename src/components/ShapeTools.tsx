import React, { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { TextInput } from './ui/Input';
import styles from './ShapeTools.module.scss';

interface ShapeElement {
    id: string;
    type: 'rectangle' | 'circle' | 'line' | 'arrow';
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    rotation: number;
}

interface ShapeToolsProps {
    shapes: ShapeElement[];
    onAddShape: (shape: Omit<ShapeElement, 'id'>) => void;
    onUpdateShape: (id: string, updates: Partial<ShapeElement>) => void;
    onDeleteShape: (id: string) => void;
    selectedShape: string | null;
    onSelectShape: (id: string) => void;
}

export default function ShapeTools({
    shapes,
    onAddShape,
    onUpdateShape,
    onDeleteShape,
    selectedShape,
    onSelectShape
}: ShapeToolsProps) {
    const [shapeType, setShapeType] = useState<ShapeElement['type']>('rectangle');

    const addShape = () => {
        const newShape: Omit<ShapeElement, 'id'> = {
            type: shapeType,
            x: 540,
            y: 960,
            width: shapeType === 'line' || shapeType === 'arrow' ? 200 : 150,
            height: shapeType === 'line' || shapeType === 'arrow' ? 5 : (shapeType === 'circle' ? 150 : 100),
            fill: shapeType === 'line' || shapeType === 'arrow' ? 'transparent' : '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            opacity: 1,
            rotation: 0
        };
        onAddShape(newShape);
    };

    const selectedShapeData = shapes.find(shape => shape.id === selectedShape);

    return (
        <div className={styles.shapeTools}>
            <div className={styles.panelHeader}>
                <h3>Shape Tools</h3>
                <Button size="sm" onClick={addShape}>
                    Add Shape
                </Button>
            </div>

            <Card>
                <label>Shape Type</label>
                <div className={styles.shapeTypeGrid}>
                    {[
                        { type: 'rectangle', icon: '▭', label: 'Rectangle' },
                        { type: 'circle', icon: '●', label: 'Circle' },
                        { type: 'line', icon: '━', label: 'Line' },
                        { type: 'arrow', icon: '→', label: 'Arrow' }
                    ].map(shape => (
                        <button
                            key={shape.type}
                            className={`${styles.shapeTypeButton} ${shapeType === shape.type ? styles.active : ''}`}
                            onClick={() => setShapeType(shape.type as ShapeElement['type'])}
                            title={shape.label}
                        >
                            <span className={styles.shapeIcon}>{shape.icon}</span>
                            <span className={styles.shapeLabel}>{shape.label}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {selectedShapeData && (
                <Card>
                    <div className={styles.panelHeader}>
                        <label>Selected Shape</label>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeleteShape(selectedShapeData.id)}
                        >
                            Delete
                        </Button>
                    </div>

                    <div className={styles.formGrid}>
                        <label>Width</label>
                        <TextInput
                            type="number"
                            value={selectedShapeData.width}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { width: Number(e.target.value) })}
                        />

                        <label>Height</label>
                        <TextInput
                            type="number"
                            value={selectedShapeData.height}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { height: Number(e.target.value) })}
                        />

                        <label>Fill Color</label>
                        <input
                            type="color"
                            value={selectedShapeData.fill}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { fill: e.target.value })}
                            className={styles.colorInput}
                        />

                        <label>Stroke Color</label>
                        <input
                            type="color"
                            value={selectedShapeData.stroke}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { stroke: e.target.value })}
                            className={styles.colorInput}
                        />

                        <label>Stroke Width</label>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            value={selectedShapeData.strokeWidth}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { strokeWidth: Number(e.target.value) })}
                            className={styles.rangeInput}
                        />

                        <label>Opacity</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedShapeData.opacity}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { opacity: Number(e.target.value) })}
                            className={styles.rangeInput}
                        />

                        <label>Rotation</label>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedShapeData.rotation}
                            onChange={(e) => onUpdateShape(selectedShapeData.id, { rotation: Number(e.target.value) })}
                            className={styles.rangeInput}
                        />
                    </div>
                </Card>
            )}

            <div className={styles.shapesList}>
                {shapes.map(shape => (
                    <div
                        key={shape.id}
                        className={`${styles.shapeItem} ${selectedShape === shape.id ? styles.selected : ''}`}
                        onClick={() => onSelectShape(shape.id)}
                    >
                        <span className={styles.shapeType}>{shape.type}</span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteShape(shape.id);
                            }}
                        >
                            ✕
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}