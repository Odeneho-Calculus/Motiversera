import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import cls from './AppShell.module.scss'
import Button from '../components/ui/Button'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => (document.documentElement.dataset.theme as any) || 'dark')
    useEffect(() => {
        document.documentElement.dataset.theme = theme
    }, [theme])

    return (
        <div className={cls.shell}>
            <header className={cls.header}>
                <div className={cls.title}>Motiversera</div>
                <nav className={cls.nav}>
                    <Link to="/">Home</Link>
                    <Link to="/editor">Editor</Link>
                    <Link to="/gallery">Gallery</Link>
                    <Link to="/export">Export</Link>
                    <Button variant="outline" size="sm" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </Button>
                    <a href="https://github.com/" target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">GitHub</Button>
                    </a>
                </nav>
            </header>
            <main className={cls.content}>{children}</main>
        </div>
    )
}