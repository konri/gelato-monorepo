import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { Role, Language, RegistrationSource } from '@prisma/client';

// Register Prisma enums with TypeGraphQL
registerEnumType(Role, {
  name: 'Role',
  description: 'User role in the system',
});

registerEnumType(Language, {
  name: 'Language',
  description: 'Supported languages',
});

registerEnumType(RegistrationSource, {
  name: 'RegistrationSource',
  description: 'User registration source',
});

/**
 * User GraphQL Type
 */
@ObjectType()
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  surname?: string;

  @Field({ nullable: true })
  birthDate?: Date;

  @Field()
  birthdayCompleted!: boolean;

  @Field({ nullable: true })
  profilePicture?: string;

  @Field(() => [Role])
  roles!: Role[];

  @Field(() => Language)
  language!: Language;

  @Field({ nullable: true })
  preferredCityId?: string;

  @Field()
  locationPermission!: boolean;

  @Field()
  notificationPermission!: boolean;

  @Field()
  emailVerified!: boolean;

  @Field()
  phoneVerified!: boolean;

  // Whether an admin has revoked this staff member's login (spot staff mgmt).
  @Field({ nullable: true })
  loginDisabled?: boolean;

  @Field({ nullable: true })
  loyaltyCode?: string;

  @Field(() => RegistrationSource, { nullable: true })
  registrationSource?: RegistrationSource;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Note: Do not expose password, tokenVersion, or other sensitive fields
}
