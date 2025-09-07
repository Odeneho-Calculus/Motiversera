import { Link } from 'react-router-dom'
import AppShell from '../layout/AppShell'
import Button from '../components/ui/Button'
import cls from './Home.module.scss'

export default function Home() {
    const features = [
        {
            icon: '🎨',
            title: 'Visual Editor',
            description: 'Intuitive drag-and-drop editor with real-time preview',
            path: '/editor'
        },
        {
            icon: '🖼️',
            title: 'Media Gallery',
            description: 'Browse thousands of high-quality images and videos',
            path: '/gallery'
        },
        {
            icon: '📤',
            title: 'Export Studio',
            description: 'Export in multiple formats with custom settings',
            path: '/export'
        }
    ]

    const stats = [
        { number: '10K+', label: 'Media Assets' },
        { number: '50+', label: 'Export Formats' },
        { number: '99.9%', label: 'Uptime' }
    ]

    return (
        <AppShell>
            <div className={cls.hero}>
                <div className={cls.heroContent}>
                    <div className={cls.heroText}>
                        <div className={cls.badge}>
                            <span>✨ New</span>
                            <span>Enhanced FFMPEG Processing</span>
                        </div>
                        <h1 className={cls.heroTitle}>
                            Create Stunning
                            <span className={cls.gradient}> Visual Content</span>
                        </h1>
                        <p className={cls.heroDescription}>
                            Transform your ideas into captivating motivational content with our
                            professional-grade visual editor. Combine powerful media processing
                            with intuitive design tools.
                        </p>
                        <div className={cls.heroActions}>
                            <Link to="/editor">
                                <Button variant="primary" size="lg" className={cls.primaryBtn}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Start Creating
                                </Button>
                            </Link>
                            <Link to="/gallery">
                                <Button variant="outline" size="lg" className={cls.secondaryBtn}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Browse Gallery
                                </Button>
                            </Link>
                        </div>
                        <div className={cls.stats}>
                            {stats.map((stat, index) => (
                                <div key={index} className={cls.stat}>
                                    <div className={cls.statNumber}>{stat.number}</div>
                                    <div className={cls.statLabel}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cls.heroVisual}>
                        <div className={cls.visualContainer}>
                            <div className={cls.mockup}>
                                <div className={cls.mockupHeader}>
                                    <div className={cls.mockupControls}>
                                        <div className={cls.mockupDot}></div>
                                        <div className={cls.mockupDot}></div>
                                        <div className={cls.mockupDot}></div>
                                    </div>
                                    <div className={cls.mockupTitle}>MotiVersera Editor</div>
                                </div>
                                <div className={cls.mockupContent}>
                                    <div className={cls.mockupCanvas}>
                                        <div className={cls.mockupText}>
                                            "Code is poetry written in logic"
                                        </div>
                                        <div className={cls.mockupOverlay}></div>
                                    </div>
                                    <div className={cls.mockupToolbar}>
                                        <div className={cls.mockupTool}></div>
                                        <div className={cls.mockupTool}></div>
                                        <div className={cls.mockupTool}></div>
                                    </div>
                                </div>
                            </div>
                            <div className={cls.floatingElements}>
                                <div className={cls.floatingElement} style={{ animationDelay: '0s' }}>🎨</div>
                                <div className={cls.floatingElement} style={{ animationDelay: '0.5s' }}>✨</div>
                                <div className={cls.floatingElement} style={{ animationDelay: '1s' }}>🚀</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cls.features}>
                <div className={cls.featuresHeader}>
                    <h2 className={cls.featuresTitle}>Everything you need to create</h2>
                    <p className={cls.featuresDescription}>
                        Professional tools and resources at your fingertips
                    </p>
                </div>
                <div className={cls.featuresGrid}>
                    {features.map((feature, index) => (
                        <Link key={index} to={feature.path} className={cls.featureCard}>
                            <div className={cls.featureIcon}>{feature.icon}</div>
                            <h3 className={cls.featureTitle}>{feature.title}</h3>
                            <p className={cls.featureDescription}>{feature.description}</p>
                            <div className={cls.featureArrow}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className={cls.cta}>
                <div className={cls.ctaContent}>
                    <h2 className={cls.ctaTitle}>Ready to get started?</h2>
                    <p className={cls.ctaDescription}>
                        Join thousands of creators who trust MotiVersera for their visual content needs
                    </p>
                    <Link to="/editor">
                        <Button variant="primary" size="lg" className={cls.ctaButton}>
                            Launch Editor
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Button>
                    </Link>
                </div>
            </div>
        </AppShell>
    )
}