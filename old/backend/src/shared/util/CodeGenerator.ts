export class CodeGenerator {
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static generateRandomString(length: number): string {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
      counter += 1
    }
    return result
  }

  static generateUniqueRandomStrings(length: number, amount: number): Array<string> {
    const results: Array<string> = []
    let counter = 0
    while (counter < amount) {
      const generateString = this.generateRandomString(length)
      if (!results.includes(generateString)) {
        counter += 1
        results.push(generateString)
      }
    }
    return results
  }

  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  static generateReferralCode(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
    const prefix = sanitized.substring(0, 6).padEnd(6, 'X')
    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    return `${prefix}${suffix}`
  }
}
