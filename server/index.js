import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json());

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
if (!PIXABAY_API_KEY) {
    console.warn('[WARN] PIXABAY_API_KEY not set. Set it in .env to enable API calls.');
}

// Helper to forward query params safely
const forwardParams = (query, allowed) => {
    const params = new URLSearchParams();
    for (const key of allowed) {
        if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
            params.append(key, String(query[key]));
        }
    }
    return params;
};

// GET /api/pixabay/images
app.get('/api/pixabay/images', async (req, res) => {
    try {
        if (!PIXABAY_API_KEY) return res.status(500).json({ error: 'PIXABAY_API_KEY not configured' });
        const base = 'https://pixabay.com/api/';
        const params = forwardParams(req.query, [
            'q', 'lang', 'id', 'image_type', 'orientation', 'category', 'min_width', 'min_height', 'colors',
            'editors_choice', 'safesearch', 'order', 'page', 'per_page'
        ]);
        params.append('key', PIXABAY_API_KEY);

        const url = `${base}?${params.toString()}`;
        const { data } = await axios.get(url, { timeout: 15000 });
        res.json(data);
    } catch (err) {
        console.error('Pixabay images error', err?.response?.status, err?.message);
        res.status(err?.response?.status || 500).json({ error: 'Failed to fetch images' });
    }
});

// GET /api/pixabay/videos
app.get('/api/pixabay/videos', async (req, res) => {
    try {
        if (!PIXABAY_API_KEY) return res.status(500).json({ error: 'PIXABAY_API_KEY not configured' });
        const base = 'https://pixabay.com/api/videos/';
        const params = forwardParams(req.query, [
            'q', 'lang', 'id', 'video_type', 'category', 'min_width', 'min_height', 'editors_choice',
            'safesearch', 'order', 'page', 'per_page'
        ]);
        params.append('key', PIXABAY_API_KEY);

        const url = `${base}?${params.toString()}`;
        const { data } = await axios.get(url, { timeout: 15000 });
        res.json(data);
    } catch (err) {
        console.error('Pixabay videos error', err?.response?.status, err?.message);
        res.status(err?.response?.status || 500).json({ error: 'Failed to fetch videos' });
    }
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`);
});