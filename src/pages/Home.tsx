import { Link } from 'react-router-dom';

import AppShell from '../layout/AppShell'
import Button from '../components/ui/Button'

export default function Home() {
    return (
        <AppShell>
            <h1>Welcome</h1>
            <p>Create motivational coding quotes with video/image backgrounds.</p>
            <div style={{ display: 'flex', gap: 12 }}>
                <Button as={undefined as any} onClick={() => (window.location.href = '/editor')} variant="primary">Open Editor</Button>
                <Button as={undefined as any} onClick={() => (window.location.href = '/gallery')}>Gallery</Button>
                <Button as={undefined as any} onClick={() => (window.location.href = '/export')}>Export</Button>
            </div>
        </AppShell>
    );
}