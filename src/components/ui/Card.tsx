import cls from './Card.module.scss'

export default function Card(props: React.HTMLAttributes<HTMLDivElement>) {
    return <div {...props} className={[cls.base, props.className].filter(Boolean).join(' ')} />
}