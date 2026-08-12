import React from 'react';
import { View, Text, Pressable, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { styles } from '../../components/onboarding-styles';
import { useOnboarding } from '@/hooks/useOnboarding';

const { width } = Dimensions.get('window');

// Metro needs static require() paths, so the per-language slide images are
// enumerated rather than built from a template string.
const SLIDE_IMAGES: Record<'en' | 'pl' | 'ua', any[]> = {
    en: [
        require('../../assets/images/onboard/slide1_en.png'),
        require('../../assets/images/onboard/slide2_en.png'),
        require('../../assets/images/onboard/slide3_en.png'),
    ],
    pl: [
        require('../../assets/images/onboard/slide1_pl.png'),
        require('../../assets/images/onboard/slide2_pl.png'),
        require('../../assets/images/onboard/slide3_pl.png'),
    ],
    ua: [
        require('../../assets/images/onboard/slide1_ua.png'),
        require('../../assets/images/onboard/slide2_ua.png'),
        require('../../assets/images/onboard/slide3_ua.png'),
    ],
};

export default function OnboardingScreen() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language?.split('-')[0] as 'en' | 'pl' | 'ua';
    const slideImages = SLIDE_IMAGES[lang] ?? SLIDE_IMAGES.en;
    const {
        pagerRef,
        currentPage,
        setCurrentPage,
        slides,
        nextPage,
        skipOnboarding,
    } = useOnboarding();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#EC2828', '#B01E1E', '#861616']}
                locations={[0, 0.3, 1]}
                style={styles.gradientBackground}
            >
                <Image
                    source={slideImages[currentPage]}
                    style={styles.phoneImage}
                    resizeMode="contain"
                />
                <View style={styles.contentOverlay}>
                    <Svg 
                        height="60" 
                        width={width} 
                        style={styles.curvedTop}
                        viewBox={`0 0 ${width} 60`}
                    >
                        <Path 
                            d={`M0,0 Q${width/2},80 ${width},0 L${width},60 L0,60 Z`}
                            fill="#FFFFFF" 
                        />
                    </Svg>
                    <PagerView
                        ref={pagerRef}
                        style={styles.textSlider}
                        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
                    >
                        {slides.map((slide, index) => (
                            <View key={index} style={styles.textContainer}>
                                <Text style={styles.title}>{slide.title}</Text>
                                <Text style={styles.description}>{slide.description}</Text>
                            </View>
                        ))}
                    </PagerView>
                    
                    <View style={styles.bulletsContainer}>
                        {slides.map((_, index) => (
                            <View 
                                key={index}
                                style={[
                                    styles.bullet,
                                    currentPage === index && styles.activeBullet
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.buttonContainer}>
                <Pressable 
                    style={styles.button} 
                    onPress={skipOnboarding}
                >
                    {({ pressed }) => (
                        <Text style={[styles.buttonText, pressed && styles.buttonTextPressed]}>{t('Onboarding.buttons.skip')}</Text>
                    )}
                </Pressable>
                
                <Pressable 
                    style={styles.button} 
                    onPress={nextPage}
                >
                    {({ pressed }) => (
                        <Text style={[styles.buttonText, pressed && styles.buttonTextPressed]}>
                            {currentPage < 2 ? t('Onboarding.buttons.continue') : t('Onboarding.buttons.getStarted')}
                        </Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}