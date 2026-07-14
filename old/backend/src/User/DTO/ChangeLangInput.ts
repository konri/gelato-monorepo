import { Field, InputType } from 'type-graphql'
import { LanguageCode } from '../../shared/interface/LanguageCode'

@InputType()
export class ChangeLangInput {
  @Field(() => LanguageCode)
  code: LanguageCode

}
