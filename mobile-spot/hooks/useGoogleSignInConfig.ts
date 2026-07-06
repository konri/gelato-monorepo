import { GOOGLE_SIGNIN_CONFIG } from '@/config'
import Constants from 'expo-constants'
import { useEffect } from 'react'

let GoogleSignin: any
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin
} catch (e) {
  GoogleSignin = null
}

export const useGoogleSignInConfig = () => {
  useEffect(() => {
    if (GoogleSignin && Constants.appOwnership !== 'expo') {
      GoogleSignin.configure(GOOGLE_SIGNIN_CONFIG)
    }
  }, [])
}
