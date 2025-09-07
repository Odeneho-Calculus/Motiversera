import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Export from './pages/Export';
import Gallery from './pages/Gallery';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/editor" element={<Editor />} />
                <Route path="/export" element={<Export />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}