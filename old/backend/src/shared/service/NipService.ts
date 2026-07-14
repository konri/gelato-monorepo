import axios from 'axios'

export interface CompanyData {
  nip: string
  name: string
  regon?: string
  krs?: string
  address: string
  city: string
  postalCode: string
  accountNumbers?: string[]
  hasVirtualAccounts: boolean
  registrationLegalDate?: string
  registrationDenialDate?: string
  registrationDenialBasis?: string
  restorationDate?: string
  restorationBasis?: string
  removalDate?: string
  removalBasis?: string
}

export class NipService {
  private static readonly API_URL = 'https://wl-api.mf.gov.pl/api/search/nip'

  static async getCompanyByNip(nip: string): Promise<CompanyData | null> {
    try {
      // Walidacja NIP
      const cleanNip = nip.replace(/[-\s]/g, '')
      if (!/^\d{10}$/.test(cleanNip)) {
        throw new Error('Invalid NIP number format')
      }

      const currentDate = new Date().toISOString().split('T')[0]
      const response = await axios.get(`${this.API_URL}/${cleanNip}?date=${currentDate}`, {
        timeout: 10000,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'EasyBons-API/1.0',
        },
      })

      const data = response.data

      if (!data.result || !data.result.subject) {
        return null
      }

      const subject = data.result.subject

      return {
        nip: subject.nip,
        name: subject.name,
        regon: subject.regon,
        krs: subject.krs,
        address: subject.residenceAddress || subject.workingAddress || '',
        city: this.extractCity(subject.residenceAddress || subject.workingAddress || ''),
        postalCode: this.extractPostalCode(subject.residenceAddress || subject.workingAddress || ''),
        accountNumbers: subject.accountNumbers || [],
        hasVirtualAccounts: subject.hasVirtualAccounts || false,
        registrationLegalDate: subject.registrationLegalDate,
        registrationDenialDate: subject.registrationDenialDate,
        registrationDenialBasis: subject.registrationDenialBasis,
        restorationDate: subject.restorationDate,
        restorationBasis: subject.restorationBasis,
        removalDate: subject.removalDate,
        removalBasis: subject.removalBasis,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('NIP API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        })

        if (error.response?.status === 404) {
          return null
        }
        if (error.response?.status === 400) {
          throw new Error('Invalid NIP number or API request format')
        }
        throw new Error(`API Error: ${error.response?.status} - ${error.message}`)
      }
      throw error
    }
  }

  private static extractCity(address: string): string {
    const match = address.match(/\d{2}-\d{3}\s+([^,]+)/)
    return match ? match[1].trim() : ''
  }

  private static extractPostalCode(address: string): string {
    const match = address.match(/(\d{2}-\d{3})/)
    return match ? match[1] : ''
  }
}
