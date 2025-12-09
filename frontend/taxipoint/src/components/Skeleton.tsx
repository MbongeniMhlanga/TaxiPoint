import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    width,
    height,
    style,
    ...props
}) => {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200 dark:bg-gray-700",
                {
                    "rounded-md": variant === 'text',
                    "rounded-full": variant === 'circular',
                    "rounded-none": variant === 'rectangular',
                    "rounded-xl": variant === 'rounded',
                },
                className
            )}
            style={{
                width,
                height,
                ...style,
            }}
            {...props}
        />
    );
};

export default Skeleton;
