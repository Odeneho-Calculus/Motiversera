import { Link } from 'react-router-dom';

import AppShell from '../layout/AppShell'
import Button from '../components/ui/Button'

export default function Gallery() {
    return (
        <AppShell>
            <h2>Gallery</h2>
            <p>Showcase of creations (placeholder).</p>
            <div style={{ display: 'flex', gap: 12 }}>
                <Button onClick={() => (window.location.href = '/editor')}>Open Editor</Button>
                <Button onClick={() => (window.location.href = '/')}>Home</Button>
            </div>
        </AppShell>
    );
}