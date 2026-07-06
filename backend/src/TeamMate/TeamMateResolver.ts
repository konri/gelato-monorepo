import { Arg, Authorized, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import { TeamMate } from './objectType/TeamMate'
import { Context } from '../shared/interface/Context'
import { Role } from '../User/objectType/Role'
import { convertPageableToPrisma, Pageable } from '../shared/interface/Pageable'
import PageableResponse from '../shared/interface/PageableResponse'

@InputType()
class TeamMateCreateInput {
  @Field(() => String)
  name: string

  @Field(() => String)
  title: string

  @Field(() => String)
  description: string

  @Field(() => String)
  photoPath: string

  @Field(() => String)
  instagram: string

  @Field(() => String)
  facebook: string

  @Field(() => String)
  web: string

  @Field(() => String)
  linkedin: string
}

@ObjectType()
class TeamMatePageableResponse extends PageableResponse<TeamMate>(TeamMate) {}

@Resolver(TeamMate)
export class TeamMateResolver {
  @Authorized(Role.ADMIN)
  @Mutation(() => TeamMate)
  async createTeamMate(
    @Arg('data') { name, title, description, photoPath, instagram, facebook, web, linkedin }: TeamMateCreateInput,
    @Ctx() ctx: Context
  ): Promise<Partial<TeamMate>> {
    return ctx.prisma.teamMate.create({
      data: {
        name,
        title,
        description,
        photoPath,
        instagram,
        facebook,
        web,
        linkedin,
      },
    })
  }

  @Query(() => TeamMatePageableResponse)
  async allTeamMates(@Arg('pageable', { nullable: true }) pageable: Pageable, @Ctx() ctx: Context) {
    const pageablePrisma = convertPageableToPrisma(pageable)
    const total = await ctx.prisma.teamMate.count()
    const items = await ctx.prisma.teamMate.findMany({
      skip: pageablePrisma.skip,
      take: pageablePrisma.take,
      orderBy: pageablePrisma.orderBy,
    })
    return { total, items }
  }
}
