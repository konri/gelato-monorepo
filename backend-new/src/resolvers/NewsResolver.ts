import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  Int,
  FieldResolver,
  Root,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';
import { NewsType, CreateNewsInput, UpdateNewsInput, NewsCommentType } from '../types/NewsType';
import { PubSubService } from '../services/PubSubService';

/**
 * Resolves NewsCommentType.userName from the related user.
 */
@Resolver(() => NewsCommentType)
export class NewsCommentResolver {
  @FieldResolver(() => String, { nullable: true })
  async userName(
    @Root() comment: NewsCommentType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { id: comment.userId } });
    if (!user) return null;
    return (
      [user.firstName, user.surname].filter(Boolean).join(' ') ||
      user.name ||
      user.email.split('@')[0]
    );
  }

  @FieldResolver(() => String, { nullable: true })
  async userAvatar(
    @Root() comment: NewsCommentType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: comment.userId },
      select: { profilePicture: true },
    });
    return user?.profilePicture ?? null;
  }
}

/**
 * News and Announcements Resolver
 *
 * Role-based access:
 * - SUPER_ADMIN: Full CRUD on all news
 * - SPOTS_ADMIN: Create and manage news
 * - CLIENT: View published news, like, comment
 */
@Resolver(() => NewsType)
export class NewsResolver {
  /**
   * Whether the current user liked this news item.
   */
  @FieldResolver(() => Boolean)
  async isLiked(@Root() news: NewsType, @Ctx() { req, prisma }: Context): Promise<boolean> {
    const user = req.user;
    if (!user) return false;
    const like = await prisma.newsLike.findUnique({
      where: { userId_newsId: { userId: user.id, newsId: news.id } },
    });
    return !!like;
  }

  /**
   * Get published news for client (filtered by city)
   */
  @Query(() => [NewsType])
  async newsFeed(
    @Arg('cityId', () => ID, { nullable: true }) cityId: string | undefined,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number = 20,
    @Ctx() { prisma }: Context
  ): Promise<NewsType[]> {
    const where: any = {
      isPublished: true,
    };

    // Filter by city if provided
    if (cityId) {
      where.OR = [
        { targetCityIds: { has: cityId } },
        { targetCityIds: { isEmpty: true } }, // Global news
      ];
    }

    return prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    }) as Promise<NewsType[]>;
  }

  /**
   * Get single news item
   */
  @Query(() => NewsType, { nullable: true })
  async news(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<NewsType | null> {
    return prisma.news.findUnique({
      where: { id },
    }) as Promise<NewsType | null>;
  }

  /**
   * Get all news (admin)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Query(() => [NewsType])
  async allNews(
    @Arg('includeUnpublished', () => Boolean, { defaultValue: true }) includeUnpublished: boolean,
    @Ctx() { prisma }: Context
  ): Promise<NewsType[]> {
    const where: any = {};

    if (!includeUnpublished) {
      where.isPublished = true;
    }

    return prisma.news.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as Promise<NewsType[]>;
  }

  /**
   * Create news (admin)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => NewsType)
  async createNews(
    @Arg('input') input: CreateNewsInput,
    @Ctx() { prisma }: Context
  ): Promise<NewsType> {
    const news = await prisma.news.create({
      data: {
        title: input.title,
        titleLocal: JSON.parse(input.titleLocal),
        description: input.description,
        descriptionLocal: JSON.parse(input.descriptionLocal),
        images: [],
        targetCityIds: input.targetCityIds,
        isPublished: false,
      },
    });

    console.log(`✅ News created: ${news.id} - ${news.title}`);

    return news as NewsType;
  }

  /**
   * Update news (admin)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => NewsType)
  async updateNews(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdateNewsInput,
    @Ctx() { prisma }: Context
  ): Promise<NewsType> {
    const data: any = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.titleLocal !== undefined) data.titleLocal = JSON.parse(input.titleLocal);
    if (input.description !== undefined) data.description = input.description;
    if (input.descriptionLocal !== undefined) data.descriptionLocal = JSON.parse(input.descriptionLocal);
    if (input.images !== undefined) data.images = input.images;
    if (input.targetCityIds !== undefined) data.targetCityIds = input.targetCityIds;

    // Handle publishing
    if (input.isPublished !== undefined) {
      data.isPublished = input.isPublished;
      if (input.isPublished) {
        data.publishedAt = new Date();
      }
    }

    const news = await prisma.news.update({
      where: { id },
      data,
    });

    // Publish event if news was just published
    if (input.isPublished && !data.publishedAt) {
      await PubSubService.publishNewsPublished(news);
    }

    console.log(`✅ News updated: ${id}`);

    return news as NewsType;
  }

  /**
   * Delete news (admin)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async deleteNews(
    @Arg('id', () => ID) id: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    await prisma.news.delete({
      where: { id },
    });

    console.log(`✅ News deleted: ${id}`);

    return true;
  }

  /**
   * Like news
   */
  @Authorized()
  @Mutation(() => Boolean)
  async likeNews(
    @Arg('newsId', () => ID) newsId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const userId = req.user!.id;

    // Check if already liked
    const existing = await prisma.newsLike.findUnique({
      where: {
        userId_newsId: {
          userId,
          newsId,
        },
      },
    });

    if (existing) {
      // Unlike
      await prisma.newsLike.delete({
        where: {
          userId_newsId: {
            userId,
            newsId,
          },
        },
      });

      await prisma.news.update({
        where: { id: newsId },
        data: { likesCount: { decrement: 1 } },
      });

      return false;
    } else {
      // Like
      await prisma.newsLike.create({
        data: {
          userId,
          newsId,
        },
      });

      await prisma.news.update({
        where: { id: newsId },
        data: { likesCount: { increment: 1 } },
      });

      return true;
    }
  }

  /**
   * Add comment to news
   */
  @Authorized()
  @Mutation(() => NewsCommentType)
  async commentNews(
    @Arg('newsId', () => ID) newsId: string,
    @Arg('content') content: string,
    @Ctx() { req, prisma }: Context
  ): Promise<NewsCommentType> {
    const userId = req.user!.id;

    const comment = await prisma.newsComment.create({
      data: {
        userId,
        newsId,
        content,
      },
    });

    await prisma.news.update({
      where: { id: newsId },
      data: { commentsCount: { increment: 1 } },
    });

    console.log(`✅ Comment added to news ${newsId} by user ${userId}`);

    return comment as NewsCommentType;
  }

  /**
   * Get comments for news
   */
  @Query(() => [NewsCommentType])
  async newsComments(
    @Arg('newsId', () => ID) newsId: string,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number = 50,
    @Ctx() { prisma }: Context
  ): Promise<NewsCommentType[]> {
    return prisma.newsComment.findMany({
      where: { newsId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<NewsCommentType[]>;
  }
}
