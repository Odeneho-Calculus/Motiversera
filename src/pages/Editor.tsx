import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Controls, { useControls } from '../components/Controls';
import { getTheme } from '../utils/themes';
import { codeToTokens } from 'shiki';
import styles from './Editor.module.scss';
import Button from '../components/ui/Button';
import { TextArea, Select, TextInput } from '../components/ui/Input';
import Card from '../components/ui/Card';

// ffmpeg assets will be served from /public/ffmpeg to avoid bundler resolution/CORS issues.

// Basic types
type MediaType = 'image' | 'video' | 'gradient';

type SearchKind = 'images' | 'videos';

// Video export removed: ffmpeg helpers not needed anymore

export default function Editor() {
    const [quote, setQuote] = useState('while (struggling) { keepLearning(); } // Success is loading...');
    const [mediaType, setMediaType] = useState<MediaType>('image');
    const [searchKind, setSearchKind] = useState<SearchKind>('images');
    const [results, setResults] = useState<any[]>([]);
    const [query, setQuery] = useState('coding background');
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoReady, setVideoReady] = useState(false);
    const width = 1080;
    const height = 1920;

    const { state: ui, setState: setUi } = useControls();

    const gradientCss = useMemo(() => {
        const t = getTheme(ui.themeId);
        return `linear-gradient(135deg, ${t.bgGradient[0]} 0%, ${t.bgGradient[1]} 100%)`;
    }, [ui.themeId]);

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

    // Draw preview to canvas
    useEffect(() => {
        const run = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Background
            if (mediaType === 'gradient' || !selectedUrl) {
                // draw gradient fallback
                const grd = ctx.createLinearGradient(0, 0, width, height);
                grd.addColorStop(0, '#0d1117');
                grd.addColorStop(1, '#1e1e1e');
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
                // For video, we let the <video> element render under the canvas.
                // Canvas only draws the overlay here, so we don't paint an opaque bg.
                ctx.clearRect(0, 0, width, height);
            }

            await overlay(ctx);
        };
        run();
    }, [mediaType, selectedUrl, quote]);

    // No per-frame drawing from video to canvas (performance). Video plays underneath.

    // Overlay text
    async function overlay(ctx: CanvasRenderingContext2D) {
        const theme = getTheme(ui.themeId);
        // dark veil for readability
        if (ui.showVeil) {
            ctx.fillStyle = hexToRgba(theme.veil, ui.veilOpacity ?? theme.veilOpacity);
            ctx.fillRect(0, 0, width, height);
        }

        // code-like text
        ctx.font = `bold ${ui.fontSize}px ${ui.fontFamily}`;
        ctx.fillStyle = theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // wrap text with syntax highlighting using Shiki, with fallback
        const maxWidth = width * 0.8;
        try {
            await drawHighlightedMultiline(ctx, quote, maxWidth);
        } catch (e) {
            // fallback to plain text rendering
            const lines = wrapText(ctx, quote, maxWidth);
            const lineHeight = ui.lineHeight;
            const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
            lines.forEach((l, i) => ctx.fillText(l, width / 2, startY + i * lineHeight));
        }
    }

    async function tokenize(code: string, themeName: string, lang = 'ts') {
        const { tokens } = await codeToTokens(code, { lang, theme: themeName as any });
        return tokens; // tokens: Token[][]
    }

    async function drawHighlightedMultiline(ctx: CanvasRenderingContext2D, code: string, maxWidth: number) {
        const theme = getTheme(ui.themeId);
        // choose shiki theme close to our UI theme
        const shikiTheme = ui.themeId === 'paper' ? 'vitesse-light' : 'vitesse-dark';
        const tokens = await tokenize(code, shikiTheme, 'ts');

        // measure and wrap with our font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${ui.fontSize}px ${ui.fontFamily}`;

        const lines: { parts: { text: string; color: string }[] }[] = [];
        for (const lineTokens of tokens) {
            // build plain string to wrap by words while keeping colors per token
            const parts: { text: string; color: string }[] = [];
            for (const t of lineTokens) {
                const text = t.content;
                const color = (t.color || theme.text);
                parts.push({ text, color });
            }

            // naive wrap: split parts by spaces and assemble lines
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
            // split each part by space to allow wrapping
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
            // draw each line centered: we compute total width to offset
            const total = line.parts.reduce((w, p) => w + ctx.measureText(p.text).width, 0);
            let x = (width - total) / 2;
            const y = startY + i * lineHeight;
            for (const p of line.parts) {
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, x + ctx.measureText(p.text).width / 2, y);
                x += ctx.measureText(p.text).width;
            }
        });
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

    // Export PNG from canvas
    function exportPNG() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url; a.download = 'motiversera.png'; a.click();
    }

    // Video export removed

    function onPick(hit: any) {
        if (!hit) return;
        if (searchKind === 'images') {
            setMediaType('image');
            setSelectedUrl(hit.largeImageURL || hit.webformatURL || hit.previewURL);
        } else {
            setMediaType('video');
            // Use medium or small rendition for showing in a <video> tag preview area if desired
            const url = hit?.videos?.medium?.url || hit?.videos?.small?.url || hit?.videos?.tiny?.url;
            setSelectedUrl(url || null);
        }
    }

    return (
        <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
                <h2 className={styles.heading}>Editor</h2>
                <div className={styles.controls}>
                    <Card>
                        <label>Quote</label>
                        <TextArea
                            value={quote}
                            onChange={(e) => setQuote(e.target.value)}
                            rows={6}
                            placeholder="Enter your motivational quote or code snippet..."
                        />
                    </Card>

                    <Card>
                        <label>Search</label>
                        <div className={styles.actions}>
                            <Select value={searchKind} onChange={(e) => setSearchKind(e.target.value as SearchKind)}>
                                <option value="images">Images</option>
                                <option value="videos">Videos</option>
                            </Select>
                            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. coding background" />
                            <Button onClick={doSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
                        </div>
                        {error && <p style={{ color: 'salmon' }}>{error}</p>}
                        <div className={styles.mediaGrid}>
                            {results.map((hit) => (
                                <Button key={hit.id} onClick={() => onPick(hit)} className={styles.mediaButton}>
                                    {searchKind === 'images' ? (
                                        <img src={hit.previewURL} alt={hit.tags} className={styles.thumb} />
                                    ) : (
                                        <video src={hit?.videos?.tiny?.url} className={styles.thumb} muted playsInline />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </Card>

                    <div className={styles.actions}>
                        <Button onClick={() => setMediaType('gradient')}>Use Gradient</Button>
                        <Button variant="primary" onClick={exportPNG}>Export PNG</Button>
                    </div>

                    <nav className={styles.actions}>
                        <Link to="/">Home</Link>
                        <Link to="/export">Export</Link>
                    </nav>
                </div>
            </aside>

            <section className={styles.center}>
                <div className={styles.canvasShell} style={{ background: gradientCss }}>
                    {/* 9:16 preview scaled */}
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
                </div>
            </section>
        </div>
    );
}

async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}