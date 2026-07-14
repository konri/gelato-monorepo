import { LanguageCode } from '../../../shared/interface/LanguageCode'
import { RegistrationSource } from '@prisma/client'

export interface SignUpRequest {
  email: string
  password: string
  name: string
  firstName?: string
  surname?: string
  gender?: string
  picture?: string
  language?: LanguageCode
  referralCode?: string
  registrationSource?: RegistrationSource
}
