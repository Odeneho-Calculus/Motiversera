import React, { useRef, useEffect, useState } from 'react';
import { QuoteElement } from '../utils/localStorage';
import styles from './DraggableText.module.scss'; // Reuse existing styles

interface DraggableQuoteProps {
    element: QuoteElement;
    isSelected: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
    onUpdate: (updates: Partial<QuoteElement>) => void;
    onSelect: () => void;
    onEdit: () => void;
}

export default function DraggableQuote({
    element,
    isSelected,
    containerRef,
    onUpdate,
    onSelect,
    onEdit
}: DraggableQuoteProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Use refs to avoid stale closure issues
    const dragStateRef = useRef({
        active: false,
        startX: 0,
        startY: 0,
        elementX: 0,
        elementY: 0,
        resizeHandle: null as string | null,
        startFontSize: 0
    });

    // Store current handlers in refs to avoid stale closures
    const handlersRef = useRef<{
        onUpdate: typeof onUpdate;
        element: QuoteElement;
    }>({ onUpdate, element });

    // Update refs when props change
    useEffect(() => {
        handlersRef.current = { onUpdate, element };
    }, [onUpdate, element]);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
        const dragState = dragStateRef.current;
        const { onUpdate: currentOnUpdate, element: currentElement } = handlersRef.current;

        if (!dragState.active) {
            console.log('🚫 Quote MouseMove but drag not active');
            return;
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
            console.log('❌ No container rect in quote mousemove');
            return;
        }

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        // Convert screen coordinates to canvas coordinates
        const scaleX = 1080 / rect.width;
        const scaleY = 1920 / rect.height;

        if (dragState.resizeHandle) {
            // Handle resize (for quote, we resize the font)
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const direction = deltaX > 0 || deltaY > 0 ? 1 : -1;
            const scaleFactor = 1 + (direction * distance * 0.002);

            const newFontSize = Math.max(8, Math.min(200, dragState.startFontSize * scaleFactor));

            console.log('🔄 Resizing quote:', currentElement.id, { newFontSize, distance, direction });
            currentOnUpdate({ fontSize: newFontSize });
        } else {
            // Handle drag
            const newX = Math.max(0, Math.min(1080, dragState.elementX + deltaX * scaleX));
            const newY = Math.max(0, Math.min(1920, dragState.elementY + deltaY * scaleY));

            console.log('🔄 Dragging quote element:', currentElement.id, { newX, newY, deltaX, deltaY, scaleX, scaleY });
            currentOnUpdate({ x: newX, y: newY });
        }
    };

    // Mouse up handler
    const handleMouseUp = () => {
        const dragState = dragStateRef.current;
        console.log('🛑 Quote mouse up - stopping drag. Was active:', dragState.active);

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
        const target = e.target as HTMLElement;
        const resizeHandle = target.getAttribute('data-resize-handle');

        console.log('🟡 MouseDown on quote element:', element.id, 'isSelected:', isSelected, 'isEditing:', isEditing, 'resizeHandle:', resizeHandle);
        e.preventDefault();
        e.stopPropagation();

        // Don't start drag if in editing mode (unless it's a resize handle)
        if (isEditing && !resizeHandle) {
            console.log('⏸️ Quote in edit mode, skipping drag');
            return;
        }

        // Always select the element first
        if (!isSelected) {
            console.log('🔵 Selecting quote element:', element.id);
            onSelect();
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
            console.log('❌ No container rect found for quote');
            return;
        }

        console.log('📏 Quote container rect:', rect);

        // Initialize drag state
        console.log('🟢 Starting drag/resize quote element:', element.id);
        dragStateRef.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            elementX: element.x,
            elementY: element.y,
            resizeHandle,
            startFontSize: element.fontSize
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

    const handleDoubleClick = (e: React.MouseEvent) => {
        console.log('💫 Quote double click - toggling edit mode');
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(!isEditing);
        if (!isEditing) {
            onEdit();
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ text: e.target.value });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            setIsEditing(false);
            e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            e.currentTarget.blur();
        }
    };

    // Simple syntax highlighting for code snippets
    const renderHighlightedText = (text: string) => {
        if (!element.isCodeSnippet) {
            return <span>{text}</span>;
        }

        // Basic syntax highlighting patterns
        const patterns = [
            { pattern: /(\/\/.*$)/gm, className: 'comment', color: element.codeColors.comment },
            { pattern: /\b(while|for|if|else|function|const|let|var|return|class|extends|import|export|try|catch|finally)\b/g, className: 'keyword', color: element.codeColors.keyword },
            { pattern: /(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g, className: 'string', color: element.codeColors.string },
            { pattern: /\b\d+(\.\d+)?\b/g, className: 'number', color: element.codeColors.number },
            { pattern: /[+\-*/%=<>!&|{}()[\];,.:]/g, className: 'operator', color: element.codeColors.operator },
            { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\()/g, className: 'function', color: element.codeColors.function },
        ];

        let highlightedText = text;
        const spans: Array<{ start: number; end: number; color: string }> = [];

        patterns.forEach(({ pattern, color }) => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                spans.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    color
                });
            }
        });

        // Sort spans by start position and merge overlapping ones
        spans.sort((a, b) => a.start - b.start);

        if (spans.length === 0) {
            return <span>{text}</span>;
        }

        const result = [];
        let lastIndex = 0;

        spans.forEach((span, i) => {
            // Add text before this span
            if (span.start > lastIndex) {
                result.push(<span key={`text-${i}`}>{text.slice(lastIndex, span.start)}</span>);
            }

            // Add the highlighted span
            result.push(
                <span key={`highlight-${i}`} style={{ color: span.color }}>
                    {text.slice(span.start, span.end)}
                </span>
            );

            lastIndex = span.end;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            result.push(<span key="text-end">{text.slice(lastIndex)}</span>);
        }

        return <>{result}</>;
    };

    // Calculate position relative to container
    const containerRect = containerRef.current?.getBoundingClientRect();
    const scaleX = containerRect ? containerRect.width / 1080 : 1;
    const scaleY = containerRect ? containerRect.height / 1920 : 1;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${element.x * scaleX}px`,
        top: `${element.y * scaleY}px`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        fontSize: `${element.fontSize * Math.min(scaleX, scaleY)}px`,
        fontFamily: element.fontFamily,
        color: element.color,
        fontWeight: element.fontWeight,
        textAlign: element.textAlign,
        opacity: element.opacity,
        letterSpacing: `${element.letterSpacing}px`,
        lineHeight: element.lineHeight,
        cursor: isDragging ? 'grabbing' : (isResizing ? 'nw-resize' : (isEditing ? 'text' : 'grab')),
        userSelect: isEditing ? 'text' : 'none',
        zIndex: isSelected ? 1000 : 100,
        whiteSpace: 'pre-wrap',
        ...(element.shadow.enabled && {
            textShadow: `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color}`
        }),
        ...(element.stroke.enabled && {
            WebkitTextStroke: `${element.stroke.width}px ${element.stroke.color}`
        })
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
            ref={textRef}
            className={`${styles.draggableText} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
            style={style}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            {/* Resize handles - only show when selected and not editing */}
            {isSelected && !isEditing && (
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

            {isEditing ? (
                <textarea
                    value={element.text}
                    onChange={handleTextChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={styles.textInput}
                    style={{
                        fontSize: `${element.fontSize * Math.min(scaleX, scaleY)}px`,
                        fontFamily: element.fontFamily,
                        color: element.color,
                        fontWeight: element.fontWeight,
                        textAlign: element.textAlign,
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '8px',
                        resize: 'none',
                        minWidth: '300px',
                        minHeight: '100px',
                    }}
                    autoFocus
                />
            ) : (
                <div>
                    {renderHighlightedText(element.text)}
                </div>
            )}
        </div>
    );
}