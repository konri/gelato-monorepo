import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// The mocked-screen image is a 1212x2192 device frame (aspect ~0.553). Size
// it to fit the space above the white content card (which is `contentOverlay`
// tall) instead of a fixed multiple of screen width, so it never spills
// past the card.
const CONTENT_OVERLAY_HEIGHT = 400;
const PHONE_IMAGE_ASPECT = 1212 / 2192;
const phoneImageHeight = height - CONTENT_OVERLAY_HEIGHT - 90;
const phoneImageWidth = Math.min(width * 0.72, phoneImageHeight * PHONE_IMAGE_ASPECT);

export const styles = StyleSheet.create({
    container: { flex: 1 },
    gradientBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    phoneImage: {
        width: phoneImageWidth,
        height: phoneImageWidth / PHONE_IMAGE_ASPECT,
        position: 'absolute',
        top: 60,
        alignSelf: 'center'
    },
    contentOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: CONTENT_OVERLAY_HEIGHT,
        backgroundColor: '#FFFFFF',
        shadowColor: '#181A20',
        shadowOffset: { width: 12, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10
    },
    curvedTop: {
        position: 'absolute',
        top: -40,
        left: 0,
        right: 0
    },
    textSlider: { 
        height: 280,
        width: '100%'
    },
    textContainer: {
        paddingTop: 30,
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 16,
        alignItems: 'center'
    },
    title: {
        width: 354,
        fontFamily: 'Urbanist',
        fontWeight: '700',
        fontSize: 32,
        lineHeight: 40,
        letterSpacing: 0,
        textAlign: 'center',
        color: '#212121'
    },
    description: {
        width: 354,
        fontFamily: 'Urbanist',
        fontWeight: '100',
        fontSize: 17,
        lineHeight: 24,
        letterSpacing: 0.2,
        textAlign: 'center',
        color: '#616161'
    },
    bulletsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 354,
        height: 8,
        gap: 8,
        marginTop: -20,
        alignSelf: 'center'
    },
    bullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EEEEEE'
    },
    activeBullet: {
        backgroundColor: '#EC2828',
        width: 28,
        borderRadius: 4
    },
    buttonContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 24, 
        paddingBottom: 40,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0
    },
    button: { 
        backgroundColor: '#F3F3F3',
        paddingVertical: 15, 
        paddingHorizontal: 30, 
        borderRadius: 26,
        minWidth: 170
    },
    buttonText: { 
        color: '#616161',
        textAlign: 'center', 
        fontSize: 16,
        fontFamily: 'Urbanist',
        fontWeight: '700',
        lineHeight: 30,
        letterSpacing: 0.2
    },
    buttonTextPressed: {
        color: '#000000'
    }
});