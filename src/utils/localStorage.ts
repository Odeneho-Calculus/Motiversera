// LocalStorage utilities for editor persistence
export interface EditorState {
    textElements: TextElement[];
    quoteElement: QuoteElement | null;
    filters: FilterSettings;
    gradientColors: string[];
    gradientAngle: number;
    overlayColor: string;
    overlayOpacity: number;
    blendMode: string;
    quote: string; // Legacy support
    mediaType: string;
    selectedUrl: string | null;
    shapes?: ShapeElement[];
    cropSettings?: CropSettings;
    transformSettings?: TransformSettings;
    leftPanelWidth?: number;
    rightPanelWidth?: number;
}

export interface ShapeElement {
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

export interface CropSettings {
    x: number;
    y: number;
    width: number;
    height: number;
    aspectRatio: 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
}

export interface TransformSettings {
    scaleX: number;
    scaleY: number;
    rotation: number;
    skewX: number;
    skewY: number;
    flipH: boolean;
    flipV: boolean;
}

export interface TextElement {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
    rotation: number;
    opacity: number;
    letterSpacing: number;
    lineHeight: number;
    shadow: {
        enabled: boolean;
        offsetX: number;
        offsetY: number;
        blur: number;
        color: string;
    };
    stroke: {
        enabled: boolean;
        width: number;
        color: string;
    };
}

export interface QuoteElement extends TextElement {
    width: number;
    height: number;
    isCodeSnippet: boolean;
    codeColors: {
        keyword: string;
        string: string;
        comment: string;
        number: string;
        operator: string;
        variable: string;
        function: string;
    };
}

export interface FilterSettings {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sepia: number;
    hueRotate: number;
    invert: number;
    grayscale: number;
    opacity: number;
}

const STORAGE_KEY = 'motiversera_editor_state';

export const saveEditorState = (state: Partial<EditorState>): void => {
    try {
        const existingState = loadEditorState();
        const newState = { ...existingState, ...state };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
        console.error('Failed to save editor state:', error);
    }
};

export const loadEditorState = (): Partial<EditorState> => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Failed to load editor state:', error);
        return {};
    }
};

export const clearEditorState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear editor state:', error);
    }
};

export const resetEditorDefaults = (): EditorState => {
    return {
        textElements: [],
        quoteElement: {
            id: `quote-${Date.now()}`,
            text: 'while (struggling) { keepLearning(); } // Success is loading...',
            x: 540,
            y: 960,
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
        },
        filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            sepia: 0,
            hueRotate: 0,
            invert: 0,
            grayscale: 0,
            opacity: 100
        },
        gradientColors: ['#667eea', '#764ba2'],
        gradientAngle: 135,
        overlayColor: '#000000',
        overlayOpacity: 0.3,
        blendMode: 'normal',
        quote: 'while (struggling) { keepLearning(); } // Success is loading...',
        mediaType: 'gradient',
        selectedUrl: null,
        shapes: [],
        cropSettings: {
            x: 0,
            y: 0,
            width: 1080,
            height: 1920,
            aspectRatio: 'free'
        },
        transformSettings: {
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            skewX: 0,
            skewY: 0,
            flipH: false,
            flipV: false
        },
        leftPanelWidth: 320,
        rightPanelWidth: 300
    };
};