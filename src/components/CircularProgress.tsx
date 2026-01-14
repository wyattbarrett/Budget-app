import React from 'react';

interface CircularProgressProps {
    percentage: number;
    color?: string;
    size?: number;
    strokeWidth?: number;
    icon?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    percentage,
    color = '#10B981', // Default Emerald-500
    size = 80,
    strokeWidth = 8,
    icon
}) => {
    // Ensure percentage is between 0 and 100
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (clampedPercentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.2}
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                {icon ? (
                    <span className="material-symbols-outlined text-[24px]" style={{ color }}>{icon}</span>
                ) : (
                    <span className="text-xs font-bold">{Math.round(clampedPercentage)}%</span>
                )}
                {icon && <span className="text-[10px] font-bold mt-[-2px]">{Math.round(clampedPercentage)}%</span>}
            </div>
        </div>
    );
};
