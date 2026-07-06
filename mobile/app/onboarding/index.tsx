import React from 'react';
import { View, Text, Pressable, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { styles } from '../../components/onboarding-styles';
import { useOnboarding } from '@/hooks/useOnboarding';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const { t } = useTranslation();
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
                    source={require('../../assets/images/onboard/phone.png')}
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