import type React from 'react'
import cls from './Button.module.scss'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'outline' | 'subtle'
    size?: 'sm' | 'md' | 'lg'
}

export default function Button({ variant = 'subtle', size = 'md', className, ...rest }: ButtonProps) {
    const classes = [cls.base, cls[variant], cls[size], className].filter(Boolean).join(' ')
    return <button className={classes} {...rest} />
}