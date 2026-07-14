export interface AppleProfile {
  id: string
  provider: string
  displayName: string
  name?: {
    familyName: string
    givenName: string
    middleName?: string
  }
  emails?: Array<{
    value: string
    type?: string
  }>
  photos?: []
}
