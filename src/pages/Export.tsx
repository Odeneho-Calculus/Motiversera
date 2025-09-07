import { Link } from 'react-router-dom';

import AppShell from '../layout/AppShell'
import Button from '../components/ui/Button'

export default function Export() {
    return (
        <AppShell>
            <h2>Export Center</h2>
            <p>Exports are triggered from the Editor. More options coming soon.</p>
            <div style={{ display: 'flex', gap: 12 }}>
                <Button onClick={() => (window.location.href = '/editor')}>Back to Editor</Button>
                <Button onClick={() => (window.location.href = '/')}>Home</Button>
            </div>
        </AppShell>
    );
}