import { InputType, Field } from 'type-graphql';

/**
 * Input for updating the authenticated user's own profile.
 * All fields optional — only provided fields are updated.
 */
@InputType()
export class UserChangeInput {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  surname?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phone?: string;

  // ISO date string (YYYY-MM-DD). Once birthdayCompleted is true it cannot be changed.
  @Field({ nullable: true })
  birthDate?: string;

  // Profile picture URL (set by the S3 upload endpoint).
  @Field({ nullable: true })
  picture?: string;

  @Field({ nullable: true })
  referralCode?: string;

  // Preferred city id (see the `cities` query). Used for city-scoped content.
  @Field({ nullable: true })
  preferredCityId?: string;
}
