import React from 'react';
import { ImageHeader } from '@/components/atoms/ImageHeader';
import { SearchableHeader } from '@/components/atoms/SearchableHeader';
import { BasicHeader } from '@/components/atoms/BasicHeader';

interface HeaderWithBackButtonProps {
    title?: string;
    variant?: 'default' | 'card' | 'overlay';
    onBack?: () => void;
    showSearch?: boolean;
    onSearchPress?: () => void;
    isSearchActive?: boolean;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    onSearchClose?: () => void;
    searchPlaceholder?: string;
    imageUrl?: string;
    showBackButton?: boolean;
    rightActions?: React.ReactNode;
}

export const HeaderWithBackButton = (props: HeaderWithBackButtonProps) => {
    const { variant = 'default' } = props;
    
    switch (variant) {
        case 'overlay':
            return <ImageHeader imageUrl={props.imageUrl} onBack={props.onBack} />;
        case 'card':
            return <SearchableHeader {...props} />;
        default:
            return <BasicHeader onBack={props.onBack} showBackButton={props.showBackButton} rightActions={props.rightActions} />;
    }
};