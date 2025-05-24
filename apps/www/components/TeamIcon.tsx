import React from 'react';
import Image from 'next/image';
import { cn } from '@workspace/ui/lib/utils';

interface TeamIconProps {
    size?: number;
    className?: string;
    alt?: string;
}

export const TeamIcon: React.FC<TeamIconProps> = ({
    size = 24,
    className,
    alt = 'Team Icon',
}) => {
    return (
        <Image
            src="/assets/team.svg"
            width={size}
            height={size}
            alt={alt}
            className={cn('inline-block', className)}
        />
    );
};

export default TeamIcon;