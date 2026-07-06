import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

export const useSignUpDetails = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  useEffect(() => {
    const loadUserData = async () => {
      const firstTime = await AsyncStorage.getItem('isFirstTimeLogin');
      setIsFirstTimeLogin(firstTime === 'true');
      
      // First try to get phone from pendingPhoneNumber (for new phone signups)
      const pendingPhone = await AsyncStorage.getItem('pendingPhoneNumber');
      if (pendingPhone) {
        setPhoneNumber(pendingPhone);
        return;
      }
      
      // Otherwise load phone number from userData
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        // Extract phone from email if it's a phone email (+48123456789@phone.easybons)
        if (user.email && user.email.includes('@phone.easybons')) {
          const phone = user.email.split('@')[0];
          setPhoneNumber(phone);
        } else if (user.phone) {
          setPhoneNumber(user.phone);
        }
      }
    };
    loadUserData();
  }, []);

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return {
    profileImage,
    isFirstTimeLogin,
    phoneNumber,
    handleImagePicker,
  };
};
