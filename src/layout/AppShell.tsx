import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import cls from './AppShell.module.scss'
import Button from '../components/ui/Button'
import Footer from '../components/Footer'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'dark' | 'light'>(() => (document.documentElement.dataset.theme as any) || 'dark')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        document.documentElement.dataset.theme = theme
    }, [theme])

    const isActive = (path: string) => location.pathname === path

    return (
        <div className={cls.shell}>
            <header className={cls.header}>
                <div className={cls.headerContainer}>
                    <div className={cls.branding}>
                        <Link to="/" className={cls.logo}>
                            <div className={cls.logoIcon}>
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                    <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                                    <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                                    <path d="M16 8V24M8 12L24 20M24 12L8 20" stroke="white" strokeWidth="1" opacity="0.6" />
                                    <defs>
                                        <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#60a5fa" />
                                            <stop offset="1" stopColor="#22d3ee" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <div className={cls.logoText}>
                                <span className={cls.logoTitle}>MotiVersera</span>
                                <span className={cls.logoSubtitle}>Visual Content Studio</span>
                            </div>
                        </Link>
                    </div>

                    <nav className={cls.desktopNav}>
                        <Link
                            to="/"
                            className={`${cls.navLink} ${isActive('/') ? cls.active : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/editor"
                            className={`${cls.navLink} ${isActive('/editor') ? cls.active : ''}`}
                        >
                            Editor
                        </Link>
                        <Link
                            to="/gallery"
                            className={`${cls.navLink} ${isActive('/gallery') ? cls.active : ''}`}
                        >
                            Gallery
                        </Link>
                        <Link
                            to="/export"
                            className={`${cls.navLink} ${isActive('/export') ? cls.active : ''}`}
                        >
                            Export
                        </Link>
                    </nav>

                    <div className={cls.headerActions}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            className={cls.themeToggle}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </Button>
                        <a href="https://github.com/" target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className={cls.githubBtn}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </Button>
                        </a>

                        <button
                            className={cls.mobileMenuToggle}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                        >
                            <span className={cls.hamburger}></span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`${cls.mobileNav} ${isMobileMenuOpen ? cls.open : ''}`}>
                    <Link
                        to="/"
                        className={`${cls.mobileNavLink} ${isActive('/') ? cls.active : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/editor"
                        className={`${cls.mobileNavLink} ${isActive('/editor') ? cls.active : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Editor
                    </Link>
                    <Link
                        to="/gallery"
                        className={`${cls.mobileNavLink} ${isActive('/gallery') ? cls.active : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Gallery
                    </Link>
                    <Link
                        to="/export"
                        className={`${cls.mobileNavLink} ${isActive('/export') ? cls.active : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Export
                    </Link>
                </div>
            </header>
            <main className={cls.content}>{children}</main>
            <Footer />
        </div>
    )
}