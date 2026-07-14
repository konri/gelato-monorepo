import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  Int,
  ObjectType,
  Field,
} from 'type-graphql';
import { Role, QuestType as PrismaQuestType } from '@prisma/client';
import { GraphQLJSON } from 'graphql-type-json';
import { Context } from '../types/Context';

/**
 * Quest GraphQL Type — an admin-defined task that awards points.
 */
@ObjectType('Quest')
export class QuestType {
  @Field(() => ID)
  id!: string;

  @Field()
  type!: string;

  @Field()
  title!: string;

  @Field(() => GraphQLJSON)
  titleLocal!: any;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  descriptionLocal?: any;

  @Field(() => Int)
  pointsReward!: number;

  @Field(() => GraphQLJSON, { nullable: true })
  conditions?: any;

  @Field()
  isActive!: boolean;

  @Field()
  isRepeatable!: boolean;

  @Field(() => [String])
  targetCityIds!: string[];

  @Field(() => [String])
  targetSpotIds!: string[];

  @Field({ nullable: true })
  validFrom?: Date;

  @Field({ nullable: true })
  validUntil?: Date;

  @Field()
  createdAt!: Date;
}

const QUEST_TYPES = ['REFERRAL', 'BIRTHDAY', 'PURCHASE', 'VISIT', 'CUSTOM'];

/**
 * Quest Resolver
 *
 * SUPER_ADMIN manages the quest catalog; clients read active quests.
 * The two built-in quests (referral, birthday) are handled elsewhere; this
 * makes additional quests data-driven and admin-manageable.
 */
@Resolver()
export class QuestResolver {
  /**
   * List quests. Clients get active quests only; admins can include inactive.
   */
  @Query(() => [QuestType])
  async quests(
    @Arg('includeInactive', { defaultValue: false }) includeInactive: boolean,
    @Ctx() { prisma }: Context
  ): Promise<QuestType[]> {
    const where = includeInactive ? {} : { isActive: true };
    return prisma.quest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<QuestType[]>;
  }

  /**
   * Single quest by id.
   */
  @Query(() => QuestType, { nullable: true })
  async quest(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<QuestType | null> {
    return prisma.quest.findUnique({ where: { id } }) as unknown as Promise<QuestType | null>;
  }

  /**
   * Create a quest (SUPER_ADMIN). titleLocal/descriptionLocal/conditions are
   * JSON objects. type is one of QuestType (REFERRAL/BIRTHDAY/PURCHASE/VISIT/CUSTOM).
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => QuestType)
  async createQuest(
    @Arg('type') type: string,
    @Arg('title') title: string,
    @Arg('pointsReward', () => Int) pointsReward: number,
    @Arg('titleLocal', () => GraphQLJSON, { nullable: true }) titleLocal: any,
    @Arg('description', () => String, { nullable: true }) description: string | undefined,
    @Arg('descriptionLocal', () => GraphQLJSON, { nullable: true }) descriptionLocal: any,
    @Arg('conditions', () => GraphQLJSON, { nullable: true }) conditions: any,
    @Arg('isRepeatable', { defaultValue: false }) isRepeatable: boolean,
    @Arg('isActive', { defaultValue: true }) isActive: boolean,
    @Arg('targetCityIds', () => [String], { defaultValue: [] }) targetCityIds: string[],
    @Arg('targetSpotIds', () => [String], { defaultValue: [] }) targetSpotIds: string[],
    @Ctx() { prisma }: Context
  ): Promise<QuestType> {
    if (!QUEST_TYPES.includes(type)) {
      throw new Error(`Invalid quest type. Must be one of: ${QUEST_TYPES.join(', ')}`);
    }
    const quest = await prisma.quest.create({
      data: {
        type: type as PrismaQuestType,
        title,
        titleLocal:
          titleLocal && typeof titleLocal === 'object'
            ? titleLocal
            : { pl: title, en: title, ua: title },
        description,
        descriptionLocal:
          descriptionLocal && typeof descriptionLocal === 'object' ? descriptionLocal : undefined,
        pointsReward,
        conditions: conditions ?? undefined,
        isActive,
        isRepeatable,
        targetCityIds: targetCityIds ?? [],
        targetSpotIds: targetSpotIds ?? [],
      },
    });
    console.log(`✅ Quest created: ${quest.title} (${quest.id})`);
    return quest as unknown as QuestType;
  }

  /**
   * Update a quest, including enable/disable via isActive (SUPER_ADMIN).
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => QuestType)
  async updateQuest(
    @Arg('id', () => ID) id: string,
    @Arg('title', () => String, { nullable: true }) title: string | undefined,
    @Arg('titleLocal', () => GraphQLJSON, { nullable: true }) titleLocal: any,
    @Arg('description', () => String, { nullable: true }) description: string | undefined,
    @Arg('descriptionLocal', () => GraphQLJSON, { nullable: true }) descriptionLocal: any,
    @Arg('pointsReward', () => Int, { nullable: true }) pointsReward: number | undefined,
    @Arg('conditions', () => GraphQLJSON, { nullable: true }) conditions: any,
    @Arg('isRepeatable', () => Boolean, { nullable: true }) isRepeatable: boolean | undefined,
    @Arg('isActive', () => Boolean, { nullable: true }) isActive: boolean | undefined,
    @Arg('targetCityIds', () => [String], { nullable: true }) targetCityIds: string[] | undefined,
    @Arg('targetSpotIds', () => [String], { nullable: true }) targetSpotIds: string[] | undefined,
    @Ctx() { prisma }: Context
  ): Promise<QuestType> {
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (titleLocal !== undefined) data.titleLocal = titleLocal;
    if (description !== undefined) data.description = description;
    if (descriptionLocal !== undefined) data.descriptionLocal = descriptionLocal;
    if (pointsReward !== undefined) data.pointsReward = pointsReward;
    if (conditions !== undefined) data.conditions = conditions;
    if (isRepeatable !== undefined) data.isRepeatable = isRepeatable;
    if (isActive !== undefined) data.isActive = isActive;
    if (targetCityIds !== undefined) data.targetCityIds = targetCityIds;
    if (targetSpotIds !== undefined) data.targetSpotIds = targetSpotIds;

    const quest = await prisma.quest.update({ where: { id }, data });
    console.log(`✅ Quest updated: ${quest.title} (${quest.id})`);
    return quest as unknown as QuestType;
  }

  /**
   * Delete a quest (SUPER_ADMIN).
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => Boolean)
  async deleteQuest(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    await prisma.quest.delete({ where: { id } });
    console.log(`✅ Quest deleted: ${id}`);
    return true;
  }
}
