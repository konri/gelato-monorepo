import { registerEnumType } from 'type-graphql'

export enum LanguageCode {
  PL = 'PL',
  EN = 'EN',
  SK = 'SK',
  SL = 'SL',
  SV = 'SV',
  DE = 'DE',
  PT = 'PT',
}

registerEnumType(LanguageCode, {
  name: 'LanguageCode',
  description: 'Code for Languages',
})
