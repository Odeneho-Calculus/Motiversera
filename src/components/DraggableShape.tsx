import React, { useRef, useEffect, useState } from 'react';
import styles from './DraggableText.module.scss'; // Reuse existing styles

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

interface DraggableShapeProps {
    element: ShapeElement;
    isSelected: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
    onUpdate: (id: string, updates: Partial<ShapeElement>) => void;
    onSelect: (id: string) => void;
}

export default function DraggableShape({
    element,
    isSelected,
    containerRef,
    onUpdate,
    onSelect
}: DraggableShapeProps) {
    const shapeRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Use refs to avoid stale closure issues
    const dragStateRef = useRef({
        active: false,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
        resizeHandle: null as string | null,
        startWidth: 0,
        startHeight: 0
    });

    // Store current handlers in refs to avoid stale closures
    const handlersRef = useRef<{
        onUpdate: typeof onUpdate;
        element: ShapeElement;
    }>({ onUpdate, element });

    // Update refs when props change
    useEffect(() => {
        handlersRef.current = { onUpdate, element };
    }, [onUpdate, element]);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
        const dragState = dragStateRef.current;
        const { onUpdate: currentOnUpdate, element: currentElement } = handlersRef.current;

        if (!dragState.active) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        // Convert screen coordinates to canvas coordinates
        const scaleX = 1080 / rect.width;
        const scaleY = 1920 / rect.height;

        if (dragState.resizeHandle) {
            // Handle resize
            const scaledDeltaX = deltaX * scaleX;
            const scaledDeltaY = deltaY * scaleY;

            let newWidth = dragState.startWidth;
            let newHeight = dragState.startHeight;
            let newX = currentElement.x;
            let newY = currentElement.y;

            switch (dragState.resizeHandle) {
                case 'nw': // Northwest corner
                    newWidth = Math.max(20, dragState.startWidth - scaledDeltaX);
                    newHeight = Math.max(20, dragState.startHeight - scaledDeltaY);
                    newX = dragState.elementX + (dragState.startWidth - newWidth) / 2;
                    newY = dragState.elementY + (dragState.startHeight - newHeight) / 2;
                    break;
                case 'ne': // Northeast corner
                    newWidth = Math.max(20, dragState.startWidth + scaledDeltaX);
                    newHeight = Math.max(20, dragState.startHeight - scaledDeltaY);
                    newX = dragState.elementX - (newWidth - dragState.startWidth) / 2;
                    newY = dragState.elementY + (dragState.startHeight - newHeight) / 2;
                    break;
                case 'sw': // Southwest corner
                    newWidth = Math.max(20, dragState.startWidth - scaledDeltaX);
                    newHeight = Math.max(20, dragState.startHeight + scaledDeltaY);
                    newX = dragState.elementX + (dragState.startWidth - newWidth) / 2;
                    newY = dragState.elementY - (newHeight - dragState.startHeight) / 2;
                    break;
                case 'se': // Southeast corner
                    newWidth = Math.max(20, dragState.startWidth + scaledDeltaX);
                    newHeight = Math.max(20, dragState.startHeight + scaledDeltaY);
                    newX = dragState.elementX - (newWidth - dragState.startWidth) / 2;
                    newY = dragState.elementY - (newHeight - dragState.startHeight) / 2;
                    break;
            }

            console.log('🔄 Resizing shape:', currentElement.id, { newWidth, newHeight, newX, newY });
            currentOnUpdate(currentElement.id, { width: newWidth, height: newHeight, x: newX, y: newY });
        } else {
            // Handle drag
            const newX = Math.max(0, Math.min(1080, dragState.elementX + deltaX * scaleX));
            const newY = Math.max(0, Math.min(1920, dragState.elementY + deltaY * scaleY));

            console.log('🔄 Dragging shape:', currentElement.id, { newX, newY });
            currentOnUpdate(currentElement.id, { x: newX, y: newY });
        }
    };

    // Mouse up handler
    const handleMouseUp = () => {
        const dragState = dragStateRef.current;
        console.log('🛑 Shape mouse up - stopping drag/resize. Was active:', dragState.active);

        // Reset drag state
        dragState.active = false;
        dragState.resizeHandle = null;
        setIsDragging(false);
        setIsResizing(false);

        // Clean up event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        const resizeHandle = target.getAttribute('data-resize-handle');

        console.log('🟡 MouseDown on shape:', element.id, 'resizeHandle:', resizeHandle);

        // Always select the element first
        if (!isSelected) {
            console.log('🔵 Selecting shape:', element.id);
            onSelect(element.id);
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Initialize drag state
        console.log('🟢 Starting drag/resize shape:', element.id);
        dragStateRef.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            elementX: element.x,
            elementY: element.y,
            resizeHandle,
            startWidth: element.width,
            startHeight: element.height
        };

        if (resizeHandle) {
            setIsResizing(true);
        } else {
            setIsDragging(true);
        }

        // Add event listeners to document
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Calculate position relative to container
    const containerRect = containerRef.current?.getBoundingClientRect();
    const scaleX = containerRect ? containerRect.width / 1080 : 1;
    const scaleY = containerRect ? containerRect.height / 1920 : 1;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${(element.x - element.width / 2) * scaleX}px`,
        top: `${(element.y - element.height / 2) * scaleY}px`,
        width: `${element.width * scaleX}px`,
        height: `${element.height * scaleY}px`,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
        cursor: isDragging ? 'grabbing' : (isResizing ? 'nw-resize' : 'grab'),
        zIndex: isSelected ? 1000 : 100,
        pointerEvents: 'all'
    };

    const shapeStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth
    };

    const renderShape = () => {
        switch (element.type) {
            case 'rectangle':
                return (
                    <svg style={shapeStyle} onMouseDown={handleMouseDown}>
                        <rect
                            width="100%"
                            height="100%"
                            fill={element.fill}
                            stroke={element.stroke}
                            strokeWidth={element.strokeWidth}
                            rx="4"
                        />
                    </svg>
                );
            case 'circle':
                return (
                    <svg style={shapeStyle} onMouseDown={handleMouseDown}>
                        <ellipse
                            cx="50%"
                            cy="50%"
                            rx="50%"
                            ry="50%"
                            fill={element.fill}
                            stroke={element.stroke}
                            strokeWidth={element.strokeWidth}
                        />
                    </svg>
                );
            case 'line':
                return (
                    <svg style={shapeStyle} onMouseDown={handleMouseDown}>
                        <line
                            x1="0"
                            y1="50%"
                            x2="100%"
                            y2="50%"
                            stroke={element.stroke}
                            strokeWidth={element.strokeWidth}
                        />
                    </svg>
                );
            case 'arrow':
                return (
                    <svg style={shapeStyle} onMouseDown={handleMouseDown}>
                        <defs>
                            <marker
                                id={`arrowhead-${element.id}`}
                                markerWidth="10"
                                markerHeight="7"
                                refX="10"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill={element.stroke}
                                />
                            </marker>
                        </defs>
                        <line
                            x1="0"
                            y1="50%"
                            x2="100%"
                            y2="50%"
                            stroke={element.stroke}
                            strokeWidth={element.strokeWidth}
                            markerEnd={`url(#arrowhead-${element.id})`}
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        return () => {
            // Clean up any remaining event listeners on component unmount
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div
            ref={shapeRef}
            className={`${styles.draggableText} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
            style={style}
        >
            {/* Shape content */}
            {renderShape()}

            {/* Resize handles - only show when selected */}
            {isSelected && (
                <div className={styles.resizeHandles}>
                    <div
                        className={`${styles.resizeHandle} ${styles.nw}`}
                        data-resize-handle="nw"
                        onMouseDown={handleMouseDown}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.ne}`}
                        data-resize-handle="ne"
                        onMouseDown={handleMouseDown}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.sw}`}
                        data-resize-handle="sw"
                        onMouseDown={handleMouseDown}
                    />
                    <div
                        className={`${styles.resizeHandle} ${styles.se}`}
                        data-resize-handle="se"
                        onMouseDown={handleMouseDown}
                    />
                </div>
            )}
        </div>
    );
}