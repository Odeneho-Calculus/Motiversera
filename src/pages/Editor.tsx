import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Controls, { useControls } from '../components/Controls';
import { getTheme } from '../utils/themes';
import { codeToTokens } from 'shiki';
import styles from './Editor.module.scss';
import Button from '../components/ui/Button';
import { TextArea, Select, TextInput } from '../components/ui/Input';
import Card from '../components/ui/Card';
import DraggableText from '../components/DraggableText';
import DraggableQuote from '../components/DraggableQuote';
import DraggableShape from '../components/DraggableShape';
import ShapeTools from '../components/ShapeTools';
import CropTools from '../components/CropTools';
import TransformTools from '../components/TransformTools';
import {
    saveEditorState,
    loadEditorState,
    clearEditorState,
    resetEditorDefaults,
    type TextElement,
    type QuoteElement,
    type FilterSettings
} from '../utils/localStorage';

// Advanced editor types
type MediaType = 'image' | 'video' | 'gradient';
type SearchKind = 'images' | 'videos';
type Tool = 'text' | 'shape' | 'filter' | 'overlay' | 'crop' | 'transform';
type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn';

const MAX_TEXT_ELEMENTS = 5;
const MAX_SHAPE_ELEMENTS = 5;

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

interface CropSettings {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
}

interface TransformSettings {
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    flipH: boolean;
    flipV: boolean;
}

export default function Editor() {
    // Load initial state from localStorage
    const savedState = loadEditorState();

    // Basic state
    const [quote, setQuote] = useState(savedState.quote || 'while (struggling) { keepLearning(); } // Success is loading...');
    const [mediaType, setMediaType] = useState<MediaType>((savedState.mediaType as MediaType) || 'gradient');
    const [searchKind, setSearchKind] = useState<SearchKind>('images');
    const [results, setResults] = useState<any[]>([]);
    const [query, setQuery] = useState('coding background');
    const [selectedUrl, setSelectedUrl] = useState<string | null>(savedState.selectedUrl || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Advanced editor state
    const [activeTool, setActiveTool] = useState<Tool>('text');
    const [textElements, setTextElements] = useState<TextElement[]>(savedState.textElements || []);
    const [quoteElement, setQuoteElement] = useState<QuoteElement | null>(
        savedState.quoteElement ||
        (savedState.quote ? {
            // Migrate legacy quote to new format
            id: `quote-${Date.now()}`,
            text: savedState.quote,
            x: 540,
            y: 960,
            fontSize: 32,
            fontFamily: 'Monaco, Consolas, monospace',
            color: '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center' as const,
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.4,
            shadow: { enabled: false, offsetX: 2, offsetY: 2, blur: 4, color: '#000000' },
            stroke: { enabled: false, width: 1, color: '#000000' },
            isCodeSnippet: true,
            codeColors: {
                keyword: '#ff6b6b',
                string: '#4ecdc4',
                comment: '#95a5a6',
                number: '#f39c12',
                operator: '#e74c3c',
                variable: '#3498db',
                function: '#9b59b6'
            }
        } : null)
    );
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<boolean>(false);
    const [filters, setFilters] = useState<FilterSettings>(savedState.filters || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        sepia: 0,
        hueRotate: 0,
        invert: 0,
        grayscale: 0,
        opacity: 100
    });
    const [blendMode, setBlendMode] = useState<BlendMode>((savedState.blendMode as BlendMode) || 'normal');
    const [overlayColor, setOverlayColor] = useState(savedState.overlayColor || '#000000');
    const [overlayOpacity, setOverlayOpacity] = useState(savedState.overlayOpacity || 0.3);
    const [gradientAngle, setGradientAngle] = useState(savedState.gradientAngle || 135);
    const [gradientColors, setGradientColors] = useState(savedState.gradientColors || ['#667eea', '#764ba2']);

    // New state for additional tools
    const [shapes, setShapes] = useState<ShapeElement[]>(savedState.shapes || []);
    const [selectedShape, setSelectedShape] = useState<string | null>(null);
    const [cropSettings, setCropSettings] = useState<CropSettings>(savedState.cropSettings || {
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
        aspectRatio: 'free'
    });
    const [transformSettings, setTransformSettings] = useState<TransformSettings>(savedState.transformSettings || {
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        skewY: 0,
        flipH: false,
        flipV: false
    });
    const [isDragging, setIsDragging] = useState(false);

    // Canvas refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const [videoReady, setVideoReady] = useState(false);

    const width = 1080;
    const height = 1920;

    const { state: ui, setState: setUi } = useControls();

    // Advanced gradient CSS with customizable angle and colors
    const gradientCss = useMemo(() => {
        if (mediaType === 'gradient') {
            const colorStops = gradientColors.map((color, index) =>
                `${color} ${(index / (gradientColors.length - 1)) * 100}%`
            ).join(', ');
            return `linear-gradient(${gradientAngle}deg, ${colorStops})`;
        }
        const t = getTheme(ui.themeId);
        return `linear-gradient(135deg, ${t.bgGradient[0]} 0%, ${t.bgGradient[1]} 100%)`;
    }, [ui.themeId, mediaType, gradientAngle, gradientColors]);

    // Add text element with 5-element limit
    const addTextElement = useCallback(() => {
        if (textElements.length >= MAX_TEXT_ELEMENTS) {
            alert(`Maximum ${MAX_TEXT_ELEMENTS} text elements allowed!`);
            return;
        }

        const newElement: TextElement = {
            id: Date.now().toString(),
            text: 'New Text',
            x: width / 2,
            y: height / 2,
            fontSize: 48,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            rotation: 0,
            opacity: 1,
            letterSpacing: 0,
            lineHeight: 1.2,
            shadow: {
                enabled: false,
                offsetX: 2,
                offsetY: 2,
                blur: 4,
                color: '#000000'
            },
            stroke: {
                enabled: false,
                width: 2,
                color: '#000000'
            }
        };
        setTextElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
    }, [textElements.length]);

    // Update selected text element
    const updateSelectedElement = useCallback((updates: Partial<TextElement>) => {
        if (!selectedElement) return;
        setTextElements(prev => prev.map(el =>
            el.id === selectedElement ? { ...el, ...updates } : el
        ));
    }, [selectedElement]);

    // Delete selected element
    const deleteSelectedElement = useCallback(() => {
        if (!selectedElement) return;
        setTextElements(prev => prev.filter(el => el.id !== selectedElement));
        setSelectedElement(null);
    }, [selectedElement]);

    // Add or remove quote element (only one allowed)
    const toggleQuoteElement = useCallback(() => {
        if (quoteElement) {
            setQuoteElement(null);
            setSelectedQuote(false);
        } else {
            const newQuote: QuoteElement = {
                id: `quote-${Date.now()}`,
                text: quote || 'while (struggling) { keepLearning(); } // Success is loading...',
                x: width / 2,
                y: height / 2,
                fontSize: 32,
                fontFamily: 'Monaco, Consolas, monospace',
                color: '#ffffff',
                fontWeight: 'bold',
                textAlign: 'center',
                rotation: 0,
                opacity: 1,
                letterSpacing: 0,
                lineHeight: 1.4,
                shadow: {
                    enabled: false,
                    offsetX: 2,
                    offsetY: 2,
                    blur: 4,
                    color: '#000000'
                },
                stroke: {
                    enabled: false,
                    width: 1,
                    color: '#000000'
                },
                isCodeSnippet: true,
                codeColors: {
                    keyword: '#ff6b6b',
                    string: '#4ecdc4',
                    comment: '#95a5a6',
                    number: '#f39c12',
                    operator: '#e74c3c',
                    variable: '#3498db',
                    function: '#9b59b6'
                }
            };
            setQuoteElement(newQuote);
            setSelectedQuote(true);
        }
    }, [quoteElement, quote, width, height]);

    // Update quote element
    const updateQuoteElement = useCallback((updates: Partial<QuoteElement>) => {
        if (!quoteElement) return;
        setQuoteElement(prev => prev ? { ...prev, ...updates } : null);
    }, [quoteElement]);

    // Delete quote element
    const deleteQuoteElement = useCallback(() => {
        setQuoteElement(null);
        setSelectedQuote(false);
    }, []);

    // Pixabay search via proxy
    const doSearch = async () => {
        setLoading(true); setError(null);
        try {
            const endpoint = searchKind === 'images' ? '/api/pixabay/images' : '/api/pixabay/videos';
            const u = new URL(endpoint, window.location.origin);
            u.searchParams.set('q', query);
            u.searchParams.set('safesearch', 'true');
            u.searchParams.set('per_page', '20');
            const res = await fetch(u.toString());
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            const hits = Array.isArray(data?.hits) ? data.hits : [];
            setResults(hits);
        } catch (e: any) {
            setError(e.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        doSearch(); // initial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-run search when switching between images/videos
    useEffect(() => {
        doSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchKind]);

    // Save state changes to localStorage
    useEffect(() => {
        saveEditorState({
            textElements,
            quoteElement,
            filters,
            gradientColors,
            gradientAngle,
            overlayColor,
            overlayOpacity,
            blendMode,
            quote,
            mediaType,
            selectedUrl,
            shapes,
            cropSettings,
            transformSettings
        });
    }, [textElements, quoteElement, filters, gradientColors, gradientAngle, overlayColor, overlayOpacity, blendMode, quote, mediaType, selectedUrl, shapes, cropSettings, transformSettings]);

    // Draw preview to canvas
    useEffect(() => {
        const run = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Apply filters to context
            const filterString = `
                brightness(${filters.brightness}%)
                contrast(${filters.contrast}%)
                saturate(${filters.saturation}%)
                blur(${filters.blur}px)
                sepia(${filters.sepia}%)
                hue-rotate(${filters.hueRotate}deg)
                invert(${filters.invert}%)
                grayscale(${filters.grayscale}%)
            `.trim();
            ctx.filter = filterString;
            ctx.globalCompositeOperation = blendMode;

            // Background
            if (mediaType === 'gradient' || !selectedUrl) {
                // draw custom gradient
                const grd = ctx.createLinearGradient(
                    0, 0,
                    Math.cos((gradientAngle - 90) * Math.PI / 180) * width,
                    Math.sin((gradientAngle - 90) * Math.PI / 180) * height
                );
                gradientColors.forEach((color, index) => {
                    grd.addColorStop(index / (gradientColors.length - 1), color);
                });
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, width, height);
            } else if (mediaType === 'image') {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = async () => {
                    // cover-fit draw
                    const scale = Math.max(width / img.width, height / img.height);
                    const w = img.width * scale;
                    const h = img.height * scale;
                    const x = (width - w) / 2;
                    const y = (height - h) / 2;
                    ctx.drawImage(img, x, y, w, h);
                    await overlay(ctx);
                };
                img.onerror = async () => { await overlay(ctx); };
                img.src = selectedUrl;
                return;
            } else {
                // For video, clear canvas for transparency
                ctx.clearRect(0, 0, width, height);
            }

            await overlay(ctx);
        };
        run();
    }, [mediaType, selectedUrl, quote, textElements, filters, blendMode, gradientAngle, gradientColors, overlayColor, overlayOpacity, shapes]);

    // Overlay rendering
    async function overlay(ctx: CanvasRenderingContext2D) {
        // Reset filters for overlay
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'normal';

        const theme = getTheme(ui.themeId);

        // Color overlay
        if (overlayOpacity > 0) {
            ctx.fillStyle = hexToRgba(overlayColor, overlayOpacity);
            ctx.fillRect(0, 0, width, height);
        }

        // Dark veil for main text readability
        if (ui.showVeil) {
            ctx.fillStyle = hexToRgba(theme.veil, ui.veilOpacity ?? theme.veilOpacity);
            ctx.fillRect(0, 0, width, height);
        }

        // Legacy quote support removed - now handled by DraggableQuote component

        // Draw custom text elements
        for (const element of textElements) {
            drawTextElement(ctx, element);
        }

        // Shapes are now handled by DraggableShape components
    }

    // Draw individual text element
    function drawTextElement(ctx: CanvasRenderingContext2D, element: TextElement) {
        ctx.save();

        // Set text properties
        ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.textAlign;
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = element.opacity;

        // Apply rotation if needed
        if (element.rotation !== 0) {
            ctx.translate(element.x, element.y);
            ctx.rotate(element.rotation * Math.PI / 180);
            ctx.translate(-element.x, -element.y);
        }

        // Apply shadow if enabled
        if (element.shadow.enabled) {
            ctx.shadowOffsetX = element.shadow.offsetX;
            ctx.shadowOffsetY = element.shadow.offsetY;
            ctx.shadowBlur = element.shadow.blur;
            ctx.shadowColor = element.shadow.color;
        }

        // Apply stroke if enabled
        if (element.stroke.enabled) {
            ctx.strokeStyle = element.stroke.color;
            ctx.lineWidth = element.stroke.width;
            ctx.strokeText(element.text, element.x, element.y);
        }

        // Draw text
        ctx.fillText(element.text, element.x, element.y);

        ctx.restore();
    }

    // Draw individual shape element
    function drawShapeElement(ctx: CanvasRenderingContext2D, shape: ShapeElement) {
        ctx.save();

        // Apply rotation and opacity
        ctx.globalAlpha = shape.opacity;

        if (shape.rotation !== 0) {
            ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
            ctx.rotate(shape.rotation * Math.PI / 180);
            ctx.translate(-(shape.x + shape.width / 2), -(shape.y + shape.height / 2));
        }

        // Set stroke properties
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = shape.strokeWidth;

        // Set fill properties
        if (shape.fill !== 'transparent') {
            ctx.fillStyle = shape.fill;
        }

        // Draw shape based on type
        switch (shape.type) {
            case 'rectangle':
                if (shape.fill !== 'transparent') {
                    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                }
                if (shape.strokeWidth > 0) {
                    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                }
                break;

            case 'circle':
                const centerX = shape.x + shape.width / 2;
                const centerY = shape.y + shape.height / 2;
                const radius = Math.min(shape.width, shape.height) / 2;

                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

                if (shape.fill !== 'transparent') {
                    ctx.fill();
                }
                if (shape.strokeWidth > 0) {
                    ctx.stroke();
                }
                break;

            case 'line':
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y + shape.height / 2);
                ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2);
                ctx.stroke();
                break;

            case 'arrow':
                const arrowHeadSize = 20;
                const arrowY = shape.y + shape.height / 2;

                // Draw line
                ctx.beginPath();
                ctx.moveTo(shape.x, arrowY);
                ctx.lineTo(shape.x + shape.width - arrowHeadSize, arrowY);
                ctx.stroke();

                // Draw arrow head
                ctx.beginPath();
                ctx.moveTo(shape.x + shape.width, arrowY);
                ctx.lineTo(shape.x + shape.width - arrowHeadSize, arrowY - arrowHeadSize / 2);
                ctx.lineTo(shape.x + shape.width - arrowHeadSize, arrowY + arrowHeadSize / 2);
                ctx.closePath();

                if (shape.fill !== 'transparent') {
                    ctx.fill();
                }
                if (shape.strokeWidth > 0) {
                    ctx.stroke();
                }
                break;
        }

        ctx.restore();
    }

    // Legacy syntax highlighting function
    async function drawHighlightedMultiline(ctx: CanvasRenderingContext2D, code: string, maxWidth: number) {
        const theme = getTheme(ui.themeId);
        const shikiTheme = ui.themeId === 'paper' ? 'vitesse-light' : 'vitesse-dark';

        try {
            const { tokens } = await codeToTokens(code, { lang: 'ts', theme: shikiTheme as any });

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${ui.fontSize}px ${ui.fontFamily}`;

            const lines: { parts: { text: string; color: string }[] }[] = [];
            for (const lineTokens of tokens) {
                const parts: { text: string; color: string }[] = [];
                for (const t of lineTokens) {
                    const text = t.content;
                    const color = (t.color || theme.text);
                    parts.push({ text, color });
                }

                let currentLine: { parts: { text: string; color: string }[] } = { parts: [] };
                let currentText = '';
                function pushCurrent() {
                    if (currentLine.parts.length) lines.push(currentLine);
                    currentLine = { parts: [] };
                    currentText = '';
                }
                function addPart(text: string, color: string) {
                    const measure = ctx.measureText(currentText + text);
                    if (measure.width > maxWidth && currentText) {
                        pushCurrent();
                    }
                    currentLine.parts.push({ text, color });
                    currentText += text;
                }

                for (const p of parts) {
                    const chunks = p.text.split(/(\s+)/);
                    for (const ch of chunks) {
                        if (!ch) continue;
                        addPart(ch, p.color);
                    }
                }
                pushCurrent();
            }

            const lineHeight = ui.lineHeight;
            const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
            lines.forEach((line, i) => {
                const total = line.parts.reduce((w, p) => w + ctx.measureText(p.text).width, 0);
                let x = (width - total) / 2;
                const y = startY + i * lineHeight;
                for (const p of line.parts) {
                    ctx.fillStyle = p.color;
                    ctx.fillText(p.text, x + ctx.measureText(p.text).width / 2, y);
                    x += ctx.measureText(p.text).width;
                }
            });
        } catch (e) {
            // Fallback to plain text
            const lines = wrapText(ctx, code, maxWidth);
            const lineHeight = ui.lineHeight;
            const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
            lines.forEach((l, i) => ctx.fillText(l, width / 2, startY + i * lineHeight));
        }
    }

    function hexToRgba(hex: string, alpha = 1) {
        const h = hex.replace('#', '');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
        const words = text.split(' ');
        const lines: string[] = [];
        let line = '';
        for (const w of words) {
            const test = line ? line + ' ' + w : w;
            const m = ctx.measureText(test);
            if (m.width > maxWidth) {
                if (line) lines.push(line);
                line = w;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    // Export functions
    async function createExportCanvas(): Promise<HTMLCanvasElement> {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d')!;

        // Draw background (same as original canvas drawing)
        if (mediaType === 'image' && selectedUrl) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    // Apply filters
                    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg) invert(${filters.invert}%) grayscale(${filters.grayscale}%) opacity(${filters.opacity}%)`;

                    ctx.drawImage(img, 0, 0, width, height);
                    ctx.filter = 'none';

                    drawOverlayElements(ctx);
                    resolve(exportCanvas);
                };
                img.src = selectedUrl;
            });
        } else if (mediaType === 'video' && selectedUrl && videoReady) {
            const video = document.querySelector('video') as HTMLVideoElement;
            if (video) {
                // Apply filters
                ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg) invert(${filters.invert}%) grayscale(${filters.grayscale}%) opacity(${filters.opacity}%)`;

                ctx.drawImage(video, 0, 0, width, height);
                ctx.filter = 'none';
            }
            drawOverlayElements(ctx);
            return exportCanvas;
        } else {
            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, width, height);

            if (ui.bgMode === 'custom-gradient' && gradientColors.length >= 2) {
                const colorStops = gradientColors.map((color, index) =>
                    `${color} ${(index / (gradientColors.length - 1)) * 100}%`
                ).join(', ');

                gradientColors.forEach((color, index) => {
                    gradient.addColorStop(index / (gradientColors.length - 1), color);
                });
            } else {
                const t = getTheme(ui.themeId);
                gradient.addColorStop(0, t.bgGradient[0]);
                gradient.addColorStop(1, t.bgGradient[1]);
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            drawOverlayElements(ctx);
            return exportCanvas;
        }
    }

    function drawOverlayElements(ctx: CanvasRenderingContext2D) {
        // Draw veil if enabled
        if (ui.showVeil) {
            const theme = getTheme(ui.themeId);
            ctx.fillStyle = hexToRgba(theme.veil, ui.veilOpacity ?? theme.veilOpacity);
            ctx.fillRect(0, 0, width, height);
        }

        // Draw text elements
        for (const element of textElements) {
            drawTextElement(ctx, element);
        }

        // Draw quote element
        if (quoteElement) {
            drawQuoteElement(ctx, quoteElement);
        }

        // Draw shapes
        for (const shape of shapes) {
            drawShapeElement(ctx, shape);
        }
    }

    function drawQuoteElement(ctx: CanvasRenderingContext2D, element: QuoteElement) {
        ctx.save();

        // Set text properties
        ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.textAlign;
        ctx.textBaseline = 'top';
        ctx.globalAlpha = element.opacity;

        // Apply rotation if needed
        if (element.rotation !== 0) {
            ctx.translate(element.x, element.y);
            ctx.rotate(element.rotation * Math.PI / 180);
            ctx.translate(-element.x, -element.y);
        }

        // Apply shadow if enabled
        if (element.shadow.enabled) {
            ctx.shadowOffsetX = element.shadow.offsetX;
            ctx.shadowOffsetY = element.shadow.offsetY;
            ctx.shadowBlur = element.shadow.blur;
            ctx.shadowColor = element.shadow.color;
        }

        // Apply stroke if enabled
        if (element.stroke.enabled) {
            ctx.strokeStyle = element.stroke.color;
            ctx.lineWidth = element.stroke.width;
        }

        // Break text into lines and draw
        const lines = element.text.split('\n');
        const lineHeight = element.fontSize * element.lineHeight;

        if (element.isCodeSnippet) {
            // Process the entire text for syntax highlighting, then draw line by line
            drawSyntaxHighlightedText(ctx, element.text, element.x, element.y, element, lineHeight);
        } else {
            // Draw regular text line by line
            lines.forEach((line, lineIndex) => {
                const y = element.y + (lineIndex * lineHeight);
                ctx.fillStyle = element.color;
                if (element.stroke.enabled) {
                    ctx.strokeStyle = element.stroke.color;
                    ctx.lineWidth = element.stroke.width;
                    ctx.strokeText(line, element.x, y);
                }
                ctx.fillText(line, element.x, y);
            });
        }

        ctx.restore();
    }

    function drawSyntaxHighlightedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, element: QuoteElement, lineHeight: number) {
        // Basic syntax highlighting patterns (same as DraggableQuote)
        const patterns = [
            { pattern: /(\/\/.*$)/gm, color: element.codeColors.comment },
            { pattern: /\b(while|for|if|else|function|const|let|var|return|class|extends|import|export|try|catch|finally)\b/g, color: element.codeColors.keyword },
            { pattern: /(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g, color: element.codeColors.string },
            { pattern: /\b\d+(\.\d+)?\b/g, color: element.codeColors.number },
            { pattern: /[+\-*/%=<>!&|{}()[\];,.:]/g, color: element.codeColors.operator },
            { pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\()/g, color: element.codeColors.function },
        ];

        const spans: Array<{ start: number; end: number; color: string }> = [];

        patterns.forEach(({ pattern, color }) => {
            let match;
            // Reset pattern lastIndex to avoid issues with global regex
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                spans.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    color
                });
                // Prevent infinite loop with global regex
                if (!pattern.global) break;
            }
        });

        // Sort spans by start position and remove overlapping
        spans.sort((a, b) => a.start - b.start);

        // Split text into lines and track line positions
        const lines = text.split('\n');
        let currentTextIndex = 0;
        const linePositions: Array<{ start: number; end: number }> = [];

        lines.forEach((line) => {
            linePositions.push({
                start: currentTextIndex,
                end: currentTextIndex + line.length
            });
            currentTextIndex += line.length + 1; // +1 for the newline character
        });

        // Draw each line with appropriate syntax highlighting
        lines.forEach((line, lineIndex) => {
            const lineY = y + (lineIndex * lineHeight);
            const lineStart = linePositions[lineIndex].start;
            const lineEnd = linePositions[lineIndex].end;

            // Find spans that intersect with this line
            const lineSpans = spans.filter(span =>
                span.start < lineEnd && span.end > lineStart
            ).map(span => ({
                start: Math.max(span.start - lineStart, 0),
                end: Math.min(span.end - lineStart, line.length),
                color: span.color
            })).filter(span => span.start < span.end);

            if (lineSpans.length === 0) {
                // No highlighting for this line
                ctx.fillStyle = element.color;
                if (element.stroke.enabled) {
                    ctx.strokeStyle = element.stroke.color;
                    ctx.lineWidth = element.stroke.width;
                    ctx.strokeText(line, x, lineY);
                }
                ctx.fillText(line, x, lineY);
                return;
            }

            // Draw line with syntax highlighting
            let currentX = x;
            let lastIndex = 0;

            lineSpans.forEach((span) => {
                // Draw text before this span (default color)
                if (span.start > lastIndex) {
                    const beforeText = line.slice(lastIndex, span.start);
                    ctx.fillStyle = element.color;
                    if (element.stroke.enabled) {
                        ctx.strokeStyle = element.stroke.color;
                        ctx.lineWidth = element.stroke.width;
                        ctx.strokeText(beforeText, currentX, lineY);
                    }
                    ctx.fillText(beforeText, currentX, lineY);
                    currentX += ctx.measureText(beforeText).width;
                }

                // Draw the highlighted span
                const spanText = line.slice(span.start, span.end);
                ctx.fillStyle = span.color;
                if (element.stroke.enabled) {
                    ctx.strokeStyle = element.stroke.color;
                    ctx.lineWidth = element.stroke.width;
                    ctx.strokeText(spanText, currentX, lineY);
                }
                ctx.fillText(spanText, currentX, lineY);
                currentX += ctx.measureText(spanText).width;

                lastIndex = span.end;
            });

            // Draw remaining text after the last span
            if (lastIndex < line.length) {
                const remainingText = line.slice(lastIndex);
                ctx.fillStyle = element.color;
                if (element.stroke.enabled) {
                    ctx.strokeStyle = element.stroke.color;
                    ctx.lineWidth = element.stroke.width;
                    ctx.strokeText(remainingText, currentX, lineY);
                }
                ctx.fillText(remainingText, currentX, lineY);
            }
        });
    }

    async function exportPNG() {
        try {
            const exportCanvas = await createExportCanvas();
            const url = exportCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url; a.download = 'motiversera.png'; a.click();
        } catch (error) {
            console.error('Error exporting PNG:', error);
            alert('Error exporting image. Please try again.');
        }
    }

    async function exportJPEG() {
        try {
            const exportCanvas = await createExportCanvas();
            const url = exportCanvas.toDataURL('image/jpeg', 0.95);
            const a = document.createElement('a');
            a.href = url; a.download = 'motiversera.jpg'; a.click();
        } catch (error) {
            console.error('Error exporting JPEG:', error);
            alert('Error exporting image. Please try again.');
        }
    }

    function onPick(hit: any) {
        if (!hit) return;
        if (searchKind === 'images') {
            setMediaType('image');
            setSelectedUrl(hit.largeImageURL || hit.webformatURL || hit.previewURL);
        } else {
            setMediaType('video');
            const url = hit?.videos?.medium?.url || hit?.videos?.small?.url || hit?.videos?.tiny?.url;
            setSelectedUrl(url || null);
        }
    }

    const selectedElementData = textElements.find(el => el.id === selectedElement);

    const tools = [
        { id: 'text', icon: 'T', label: 'Text' },
        { id: 'shape', icon: '◇', label: 'Shapes' },
        { id: 'filter', icon: 'F', label: 'Filters' },
        { id: 'overlay', icon: 'O', label: 'Overlays' },
        { id: 'crop', icon: 'C', label: 'Crop' },
        { id: 'transform', icon: 'R', label: 'Transform' }
    ];

    return (
        <div className={styles.wrapper}>
            {/* Toolbar */}
            <header className={styles.toolbar}>
                <div className={styles.toolbarSection}>
                    <div className={styles.logo}>
                        <Link to="/" className={styles.logoLink}>
                            <div className={styles.logoIcon}>MV</div>
                            <span>MotiVersera</span>
                        </Link>
                    </div>

                    <div className={styles.toolButtons}>
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                className={`${styles.toolButton} ${activeTool === tool.id ? styles.active : ''}`}
                                onClick={() => setActiveTool(tool.id as Tool)}
                                title={tool.label}
                            >
                                <span className={styles.toolIcon}>{tool.icon}</span>
                                <span className={styles.toolLabel}>{tool.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.toolbarSection}>
                    <Button variant="outline" size="sm" onClick={() => setMediaType('gradient')}>
                        Gradient
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (confirm('This will clear all settings and text elements. Continue?')) {
                                clearEditorState();
                                // Reset all state to defaults
                                setTextElements([]);
                                setQuoteElement(null);
                                setSelectedElement(null);
                                setSelectedQuote(false);
                                setFilters({
                                    brightness: 100, contrast: 100, saturation: 100, blur: 0,
                                    sepia: 0, hueRotate: 0, invert: 0, grayscale: 0, opacity: 100
                                });
                                setBlendMode('normal');
                                setOverlayColor('#000000');
                                setOverlayOpacity(0.3);
                                setGradientAngle(135);
                                setGradientColors(['#667eea', '#764ba2']);
                                setQuote('while (struggling) { keepLearning(); } // Success is loading...');
                                setMediaType('gradient');
                                setSelectedUrl(null);
                                setShapes([]);
                                setSelectedShape(null);
                            }
                        }}
                    >
                        Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportJPEG}>
                        JPEG
                    </Button>
                    <Button variant="primary" size="sm" onClick={exportPNG}>
                        PNG
                    </Button>
                </div>
            </header>

            <div className={styles.editorLayout}>
                {/* Left Panel */}
                <aside className={styles.leftPanel}>
                    {activeTool === 'text' && (
                        <div className={styles.toolPanel}>
                            <div className={styles.panelHeader}>
                                <h3>Text Tools</h3>
                                <div className={styles.buttonGroup}>
                                    <Button
                                        size="sm"
                                        onClick={addTextElement}
                                        disabled={textElements.length >= MAX_TEXT_ELEMENTS}
                                        title={textElements.length >= MAX_TEXT_ELEMENTS
                                            ? `Maximum ${MAX_TEXT_ELEMENTS} text elements allowed`
                                            : `Add Text (${textElements.length}/${MAX_TEXT_ELEMENTS} used)`}
                                    >
                                        Add Text ({textElements.length}/{MAX_TEXT_ELEMENTS})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={quoteElement ? "primary" : "outline"}
                                        onClick={toggleQuoteElement}
                                        title={quoteElement ? "Remove Quote" : "Add Quote (Code Snippet)"}
                                    >
                                        {quoteElement ? "Remove Quote" : "Add Quote"}
                                    </Button>
                                </div>
                            </div>

                            {/* Legacy quote input (for backward compatibility) */}
                            <Card>
                                <label>Legacy Quote (for canvas rendering)</label>
                                <TextArea
                                    value={quote}
                                    onChange={(e) => setQuote(e.target.value)}
                                    rows={4}
                                    placeholder="Enter your motivational quote or code snippet..."
                                />
                            </Card>

                            {selectedElementData && (
                                <Card>
                                    <div className={styles.panelHeader}>
                                        <label>Selected Text Element</label>
                                        <Button size="sm" variant="outline" onClick={deleteSelectedElement}>
                                            Delete
                                        </Button>
                                    </div>

                                    <div className={styles.formGrid}>
                                        <label>Text</label>
                                        <TextInput
                                            value={selectedElementData.text}
                                            onChange={(e) => updateSelectedElement({ text: e.target.value })}
                                        />

                                        <label>Font Size</label>
                                        <TextInput
                                            type="number"
                                            value={selectedElementData.fontSize}
                                            onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                                        />

                                        <label>Color</label>
                                        <input
                                            type="color"
                                            value={selectedElementData.color}
                                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                            className={styles.colorInput}
                                        />

                                        <label>Font Weight</label>
                                        <Select
                                            value={selectedElementData.fontWeight}
                                            onChange={(e) => updateSelectedElement({ fontWeight: e.target.value })}
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="100">Thin</option>
                                            <option value="300">Light</option>
                                            <option value="500">Medium</option>
                                            <option value="700">Bold</option>
                                            <option value="900">Black</option>
                                        </Select>

                                        <label>Text Align</label>
                                        <Select
                                            value={selectedElementData.textAlign}
                                            onChange={(e) => updateSelectedElement({ textAlign: e.target.value as any })}
                                        >
                                            <option value="left">Left</option>
                                            <option value="center">Center</option>
                                            <option value="right">Right</option>
                                        </Select>

                                        <label>Opacity</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={selectedElementData.opacity}
                                            onChange={(e) => updateSelectedElement({ opacity: Number(e.target.value) })}
                                            className={styles.rangeInput}
                                        />

                                        <label>Rotation</label>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            value={selectedElementData.rotation}
                                            onChange={(e) => updateSelectedElement({ rotation: Number(e.target.value) })}
                                            className={styles.rangeInput}
                                        />
                                    </div>

                                    <div className={styles.panelSection}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedElementData.shadow.enabled}
                                                onChange={(e) => updateSelectedElement({
                                                    shadow: { ...selectedElementData.shadow, enabled: e.target.checked }
                                                })}
                                            />
                                            Text Shadow
                                        </label>

                                        {selectedElementData.shadow.enabled && (
                                            <div className={styles.formGrid}>
                                                <label>Shadow Color</label>
                                                <input
                                                    type="color"
                                                    value={selectedElementData.shadow.color}
                                                    onChange={(e) => updateSelectedElement({
                                                        shadow: { ...selectedElementData.shadow, color: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />

                                                <label>Blur</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="20"
                                                    value={selectedElementData.shadow.blur}
                                                    onChange={(e) => updateSelectedElement({
                                                        shadow: { ...selectedElementData.shadow, blur: Number(e.target.value) }
                                                    })}
                                                    className={styles.rangeInput}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.panelSection}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedElementData.stroke.enabled}
                                                onChange={(e) => updateSelectedElement({
                                                    stroke: { ...selectedElementData.stroke, enabled: e.target.checked }
                                                })}
                                            />
                                            Text Stroke
                                        </label>

                                        {selectedElementData.stroke.enabled && (
                                            <div className={styles.formGrid}>
                                                <label>Stroke Color</label>
                                                <input
                                                    type="color"
                                                    value={selectedElementData.stroke.color}
                                                    onChange={(e) => updateSelectedElement({
                                                        stroke: { ...selectedElementData.stroke, color: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />

                                                <label>Width</label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={selectedElementData.stroke.width}
                                                    onChange={(e) => updateSelectedElement({
                                                        stroke: { ...selectedElementData.stroke, width: Number(e.target.value) }
                                                    })}
                                                    className={styles.rangeInput}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Quote Element Controls */}
                            {selectedQuote && quoteElement && (
                                <Card>
                                    <div className={styles.panelHeader}>
                                        <label>Selected Quote Element</label>
                                        <Button size="sm" variant="outline" onClick={deleteQuoteElement}>
                                            Delete
                                        </Button>
                                    </div>

                                    <div className={styles.formGrid}>
                                        <label>Text</label>
                                        <TextArea
                                            value={quoteElement.text}
                                            onChange={(e) => updateQuoteElement({ text: e.target.value })}
                                            rows={3}
                                        />

                                        <label>Font Size</label>
                                        <TextInput
                                            type="number"
                                            value={quoteElement.fontSize}
                                            onChange={(e) => updateQuoteElement({ fontSize: Number(e.target.value) })}
                                        />

                                        <label>Color</label>
                                        <input
                                            type="color"
                                            value={quoteElement.color}
                                            onChange={(e) => updateQuoteElement({ color: e.target.value })}
                                            className={styles.colorInput}
                                        />

                                        <label>Code Snippet</label>
                                        <input
                                            type="checkbox"
                                            checked={quoteElement.isCodeSnippet}
                                            onChange={(e) => updateQuoteElement({ isCodeSnippet: e.target.checked })}
                                        />

                                        {quoteElement.isCodeSnippet && (
                                            <>
                                                <label>Keyword Color</label>
                                                <input
                                                    type="color"
                                                    value={quoteElement.codeColors.keyword}
                                                    onChange={(e) => updateQuoteElement({
                                                        codeColors: { ...quoteElement.codeColors, keyword: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />

                                                <label>String Color</label>
                                                <input
                                                    type="color"
                                                    value={quoteElement.codeColors.string}
                                                    onChange={(e) => updateQuoteElement({
                                                        codeColors: { ...quoteElement.codeColors, string: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />

                                                <label>Comment Color</label>
                                                <input
                                                    type="color"
                                                    value={quoteElement.codeColors.comment}
                                                    onChange={(e) => updateQuoteElement({
                                                        codeColors: { ...quoteElement.codeColors, comment: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />

                                                <label>Number Color</label>
                                                <input
                                                    type="color"
                                                    value={quoteElement.codeColors.number}
                                                    onChange={(e) => updateQuoteElement({
                                                        codeColors: { ...quoteElement.codeColors, number: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />

                                                <label>Function Color</label>
                                                <input
                                                    type="color"
                                                    value={quoteElement.codeColors.function}
                                                    onChange={(e) => updateQuoteElement({
                                                        codeColors: { ...quoteElement.codeColors, function: e.target.value }
                                                    })}
                                                    className={styles.colorInput}
                                                />
                                            </>
                                        )}

                                        <label>Opacity</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={quoteElement.opacity}
                                            onChange={(e) => updateQuoteElement({ opacity: Number(e.target.value) })}
                                            className={styles.rangeInput}
                                        />
                                    </div>
                                </Card>
                            )}

                            <div className={styles.textElementsList}>
                                {textElements.map(element => (
                                    <div
                                        key={element.id}
                                        className={`${styles.textElementItem} ${selectedElement === element.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedElement(element.id)}
                                    >
                                        <span className={styles.elementText}>{element.text}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTextElements(prev => prev.filter(el => el.id !== element.id));
                                                if (selectedElement === element.id) setSelectedElement(null);
                                            }}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === 'filter' && (
                        <div className={styles.toolPanel}>
                            <div className={styles.panelHeader}>
                                <h3>Filters & Effects</h3>
                                <Button size="sm" onClick={() => setFilters({
                                    brightness: 100, contrast: 100, saturation: 100, blur: 0,
                                    sepia: 0, hueRotate: 0, invert: 0, grayscale: 0, opacity: 100
                                })}>
                                    Reset
                                </Button>
                            </div>

                            <Card>
                                <div className={styles.filterGrid}>
                                    <label>Brightness</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={filters.brightness}
                                        onChange={(e) => setFilters(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.brightness}%</span>

                                    <label>Contrast</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={filters.contrast}
                                        onChange={(e) => setFilters(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.contrast}%</span>

                                    <label>Saturation</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={filters.saturation}
                                        onChange={(e) => setFilters(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.saturation}%</span>

                                    <label>Blur</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={filters.blur}
                                        onChange={(e) => setFilters(prev => ({ ...prev, blur: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.blur}px</span>

                                    <label>Sepia</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={filters.sepia}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sepia: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.sepia}%</span>

                                    <label>Hue Rotate</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={filters.hueRotate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, hueRotate: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.hueRotate}°</span>

                                    <label>Grayscale</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={filters.grayscale}
                                        onChange={(e) => setFilters(prev => ({ ...prev, grayscale: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.grayscale}%</span>

                                    <label>Invert</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={filters.invert}
                                        onChange={(e) => setFilters(prev => ({ ...prev, invert: Number(e.target.value) }))}
                                        className={styles.rangeInput}
                                    />
                                    <span>{filters.invert}%</span>
                                </div>
                            </Card>

                            <Card>
                                <label>Blend Mode</label>
                                <Select value={blendMode} onChange={(e) => setBlendMode(e.target.value as BlendMode)}>
                                    <option value="normal">Normal</option>
                                    <option value="multiply">Multiply</option>
                                    <option value="screen">Screen</option>
                                    <option value="overlay">Overlay</option>
                                    <option value="soft-light">Soft Light</option>
                                    <option value="hard-light">Hard Light</option>
                                    <option value="color-dodge">Color Dodge</option>
                                    <option value="color-burn">Color Burn</option>
                                </Select>
                            </Card>
                        </div>
                    )}

                    {activeTool === 'overlay' && (
                        <div className={styles.toolPanel}>
                            <div className={styles.panelHeader}>
                                <h3>Overlays & Gradients</h3>
                            </div>

                            <Card>
                                <label>Overlay Color</label>
                                <input
                                    type="color"
                                    value={overlayColor}
                                    onChange={(e) => setOverlayColor(e.target.value)}
                                    className={styles.colorInput}
                                />

                                <label>Overlay Opacity</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={overlayOpacity}
                                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                                    className={styles.rangeInput}
                                />
                            </Card>

                            <Card>
                                <label>Gradient Angle</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={gradientAngle}
                                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                                    className={styles.rangeInput}
                                />
                                <span>{gradientAngle}°</span>

                                <div className={styles.gradientColors}>
                                    {gradientColors.map((color, index) => (
                                        <div key={index} className={styles.gradientColorItem}>
                                            <label>Color {index + 1}</label>
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => {
                                                    const newColors = [...gradientColors];
                                                    newColors[index] = e.target.value;
                                                    setGradientColors(newColors);
                                                }}
                                                className={styles.colorInput}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.gradientActions}>
                                    <Button
                                        size="sm"
                                        onClick={() => setGradientColors([...gradientColors, '#ffffff'])}
                                        disabled={gradientColors.length >= 5}
                                    >
                                        Add Color
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setGradientColors(gradientColors.slice(0, -1))}
                                        disabled={gradientColors.length <= 2}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTool === 'shape' && (
                        <div className={styles.toolPanel}>
                            <ShapeTools
                                shapes={shapes}
                                onAddShape={(shape) => {
                                    if (shapes.length >= MAX_SHAPE_ELEMENTS) return;
                                    const newShape = { ...shape, id: Date.now().toString() };
                                    setShapes(prev => [...prev, newShape]);
                                    setSelectedShape(newShape.id);
                                }}
                                onUpdateShape={(id, updates) => {
                                    setShapes(prev => prev.map(shape =>
                                        shape.id === id ? { ...shape, ...updates } : shape
                                    ));
                                }}
                                onDeleteShape={(id) => {
                                    setShapes(prev => prev.filter(shape => shape.id !== id));
                                    if (selectedShape === id) setSelectedShape(null);
                                }}
                                selectedShape={selectedShape}
                                onSelectShape={setSelectedShape}
                            />
                        </div>
                    )}

                    {activeTool === 'crop' && (
                        <div className={styles.toolPanel}>
                            <CropTools
                                cropSettings={cropSettings}
                                onUpdateCrop={(updates) => setCropSettings(prev => ({ ...prev, ...updates }))}
                                onApplyCrop={() => {
                                    // Apply crop to canvas
                                    console.log('Crop applied:', cropSettings);
                                }}
                                onResetCrop={() => setCropSettings({
                                    x: 0,
                                    y: 0,
                                    width: 1080,
                                    height: 1920,
                                    aspectRatio: 'free'
                                })}
                                isActive={true}
                            />
                        </div>
                    )}

                    {activeTool === 'transform' && (
                        <div className={styles.toolPanel}>
                            <TransformTools
                                transformSettings={transformSettings}
                                onUpdateTransform={(updates) => setTransformSettings(prev => ({ ...prev, ...updates }))}
                                onApplyTransform={() => {
                                    // Apply transform to canvas
                                    console.log('Transform applied:', transformSettings);
                                }}
                                onResetTransform={() => setTransformSettings({
                                    scaleX: 1,
                                    scaleY: 1,
                                    rotation: 0,
                                    skewX: 0,
                                    skewY: 0,
                                    flipH: false,
                                    flipV: false
                                })}
                            />
                        </div>
                    )}
                </aside>

                {/* Center Canvas */}
                <section className={styles.canvasArea}>
                    <div className={styles.canvasContainer}>
                        <div
                            ref={canvasContainerRef}
                            className={styles.canvasShell}
                            style={{ background: gradientCss }}
                            onClick={(e) => {
                                // Only deselect if clicking on the container itself (not child elements)
                                if (e.target === e.currentTarget) {
                                    setSelectedElement(null);
                                    setSelectedQuote(false);
                                    setSelectedShape(null);
                                }
                            }}
                        >
                            {mediaType === 'video' && selectedUrl && (
                                <video
                                    ref={videoRef}
                                    src={selectedUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    crossOrigin="anonymous"
                                    className={styles.bgVideo}
                                    onLoadedData={() => setVideoReady(true)}
                                />
                            )}
                            <canvas ref={canvasRef} className={styles.canvas} />

                            {/* Draggable Text Elements */}
                            {textElements.map(element => (
                                <DraggableText
                                    key={element.id}
                                    element={element}
                                    isSelected={selectedElement === element.id}
                                    containerRef={canvasContainerRef}
                                    onUpdate={(id, updates) => {
                                        setTextElements(prev => prev.map(el =>
                                            el.id === id ? { ...el, ...updates } : el
                                        ));
                                    }}
                                    onSelect={(id) => {
                                        setSelectedElement(id);
                                        setSelectedQuote(false);
                                    }}
                                    onEdit={(id) => {
                                        // Focus on the selected element for editing
                                        setSelectedElement(id);
                                    }}
                                />
                            ))}

                            {/* Draggable Quote Element */}
                            {quoteElement && (
                                <DraggableQuote
                                    key={quoteElement.id}
                                    element={quoteElement}
                                    isSelected={selectedQuote}
                                    containerRef={canvasContainerRef}
                                    onUpdate={updateQuoteElement}
                                    onSelect={() => {
                                        setSelectedQuote(true);
                                        setSelectedElement(null);
                                    }}
                                    onEdit={() => {
                                        setSelectedQuote(true);
                                    }}
                                />
                            )}

                            {/* Draggable Shape Elements */}
                            {shapes.map(shape => (
                                <DraggableShape
                                    key={shape.id}
                                    element={shape}
                                    isSelected={selectedShape === shape.id}
                                    containerRef={canvasContainerRef}
                                    onUpdate={(id, updates) => {
                                        setShapes(prev => prev.map(s =>
                                            s.id === id ? { ...s, ...updates } : s
                                        ));
                                    }}
                                    onSelect={(id) => {
                                        setSelectedShape(id);
                                        setSelectedElement(null);
                                        setSelectedQuote(false);
                                    }}
                                />
                            ))}
                        </div>

                        <div className={styles.canvasInfo}>
                            <span>1080×1920 • 9:16 • {mediaType.toUpperCase()}</span>
                        </div>
                    </div>
                </section>

                {/* Right Panel */}
                <aside className={styles.rightPanel}>
                    <div className={styles.panelHeader}>
                        <h3>Media Library</h3>
                    </div>

                    <Card>
                        <div className={styles.searchControls}>
                            <Select value={searchKind} onChange={(e) => setSearchKind(e.target.value as SearchKind)}>
                                <option value="images">Images</option>
                                <option value="videos">Videos</option>
                            </Select>
                            <TextInput
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search media..."
                                onKeyPress={(e) => e.key === 'Enter' && doSearch()}
                            />
                            <Button onClick={doSearch} disabled={loading} size="sm">
                                {loading ? '...' : 'Search'}
                            </Button>
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <div className={styles.mediaGrid}>
                            {results.map((hit) => (
                                <div
                                    key={hit.id}
                                    className={`${styles.mediaItem} ${selectedUrl === (hit.largeImageURL || hit.webformatURL || hit?.videos?.medium?.url) ? styles.selected : ''}`}
                                    onClick={() => onPick(hit)}
                                >
                                    {searchKind === 'images' ? (
                                        <img src={hit.previewURL} alt={hit.tags} className={styles.thumb} />
                                    ) : (
                                        <video src={hit?.videos?.tiny?.url} className={styles.thumb} muted />
                                    )}
                                    <div className={styles.mediaOverlay}>
                                        <span className={styles.mediaDimensions}>
                                            {hit.imageWidth || hit.width}×{hit.imageHeight || hit.height}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Typography Controls */}
                    <Card>
                        <h4>Typography</h4>
                        <Controls state={ui} setState={setUi} />
                    </Card>
                </aside>
            </div>
        </div>
    );
}