import cls from './Input.module.scss'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={[cls.base, props.className].filter(Boolean).join(' ')} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={[cls.base, cls.textarea, props.className].filter(Boolean).join(' ')} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={[cls.base, cls.select, props.className].filter(Boolean).join(' ')} />
}