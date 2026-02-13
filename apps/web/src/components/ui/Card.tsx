import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={`glass-panel p-6 ${className}`}
            {...props}
        />
    );
}
