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
import {
  NewsType,
  NewsSpotType,
  CreateNewsInput,
  CreateSpotNewsInput,
  UpdateNewsInput,
  NewsCommentType,
} from '../types/NewsType';
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
    // Official spot reply → show the spot's name.
    if (comment.asSpotId) {
      const spot = await prisma.spot.findUnique({
        where: { id: comment.asSpotId },
        select: { name: true },
      });
      if (spot) return spot.name;
    }
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
    // Official spot reply → show the spot's logo.
    if (comment.asSpotId) {
      const spot = await prisma.spot.findUnique({
        where: { id: comment.asSpotId },
        select: { logoUrl: true },
      });
      if (spot?.logoUrl) return spot.logoUrl;
    }
    const user = await prisma.user.findUnique({
      where: { id: comment.userId },
      select: { profilePicture: true },
    });
    return user?.profilePicture ?? null;
  }

  @FieldResolver(() => Boolean)
  isSpotReply(@Root() comment: NewsCommentType): boolean {
    return !!comment.asSpotId;
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
   * Authoring spot for this news item (null for global/admin news).
   */
  @FieldResolver(() => NewsSpotType, { nullable: true })
  async spot(@Root() news: NewsType, @Ctx() { prisma }: Context): Promise<NewsSpotType | null> {
    if (!news.spotId) return null;
    const spot = await prisma.spot.findUnique({
      where: { id: news.spotId },
      select: { id: true, name: true, logoUrl: true, cityId: true },
    });
    if (!spot) return null;
    return {
      id: spot.id,
      name: spot.name,
      logoUrl: spot.logoUrl ?? undefined,
      cityId: spot.cityId,
    };
  }

  /**
   * Get published news for client, optionally filtered by city.
   *
   * A city sees: news authored by a spot IN that city, news explicitly
   * targeted at that city, and global news (no spot + empty targetCityIds).
   */
  @Query(() => [NewsType])
  async newsFeed(
    @Arg('cityId', () => ID, { nullable: true }) cityId: string | undefined,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number = 20,
    @Ctx() { prisma }: Context
  ): Promise<NewsType[]> {
    const where: any = { isPublished: true };

    if (cityId) {
      // Spots located in this city (to match spot-authored news).
      const spotsInCity = await prisma.spot.findMany({
        where: { cityId },
        select: { id: true },
      });
      const spotIds = spotsInCity.map((s) => s.id);
      where.OR = [
        { spotId: { in: spotIds } }, // authored by a spot in this city
        { targetCityIds: { has: cityId } }, // explicitly targeted here
        // global: no authoring spot AND no city targeting
        { AND: [{ spotId: null }, { targetCityIds: { isEmpty: true } }] },
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
    // Publish immediately so it shows in the feed. (Previously created
    // unpublished with no follow-up publish, so admin news never appeared.)
    const news = await prisma.news.create({
      data: {
        title: input.title,
        titleLocal: JSON.parse(input.titleLocal),
        description: input.description,
        descriptionLocal: JSON.parse(input.descriptionLocal),
        images: [],
        targetCityIds: input.targetCityIds,
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    await PubSubService.publishNewsPublished(news);
    console.log(`✅ News created + published: ${news.id} - ${news.title}`);

    return news as NewsType;
  }

  /**
   * Create + publish a news post authored by a spot, from the spot app.
   * Allowed for the spot's own admins (or global admins). Images are uploaded
   * beforehand via POST /upload/news/:id and passed in here, OR added after
   * with updateNews — but this simple flow accepts already-hosted URLs.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => NewsType)
  async createSpotNews(
    @Arg('input') input: CreateSpotNewsInput,
    @Ctx() { req, prisma }: Context
  ): Promise<NewsType> {
    await this.assertCanManageSpot(req.user!, input.spotId, prisma);

    // Default the localized blobs to the single title/description if not given.
    const titleLocal = input.titleLocal
      ? JSON.parse(input.titleLocal)
      : { pl: input.title, en: input.title, ua: input.title };
    const descriptionLocal = input.descriptionLocal
      ? JSON.parse(input.descriptionLocal)
      : { pl: input.description, en: input.description, ua: input.description };

    const news = await prisma.news.create({
      data: {
        title: input.title,
        titleLocal,
        description: input.description,
        descriptionLocal,
        images: input.images ?? [],
        spotId: input.spotId,
        targetCityIds: [], // audience is derived from the spot's city
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    await PubSubService.publishNewsPublished(news);
    console.log(`✅ Spot news created + published: ${news.id} by spot ${input.spotId}`);

    return news as NewsType;
  }

  /**
   * Attach an already-hosted image URL to a spot's news post (used by the
   * spot composer after uploading via REST). Spot owners + global admins.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => NewsType)
  async addSpotNewsImage(
    @Arg('newsId', () => ID) newsId: string,
    @Arg('imageUrl') imageUrl: string,
    @Ctx() { req, prisma }: Context
  ): Promise<NewsType> {
    const existing = await prisma.news.findUnique({ where: { id: newsId }, select: { spotId: true } });
    if (!existing?.spotId) throw new Error('News post not found');
    await this.assertCanManageSpot(req.user!, existing.spotId, prisma);
    const news = await prisma.news.update({
      where: { id: newsId },
      data: { images: { push: imageUrl } },
    });
    return news as NewsType;
  }

  /**
   * News posts authored by a given spot (for the spot app's own list).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [NewsType])
  async spotNews(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('limit', () => Int, { defaultValue: 30 }) limit: number = 30,
    @Ctx() { req, prisma }: Context
  ): Promise<NewsType[]> {
    await this.assertCanManageSpot(req.user!, spotId, prisma);
    return prisma.news.findMany({
      where: { spotId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<NewsType[]>;
  }

  /**
   * Global admins pass; otherwise the caller must be a spot admin or employee
   * of the given spot.
   */
  private async assertCanManageSpot(user: any, spotId: string, prisma: any): Promise<void> {
    if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
    const [spotAdmin, employee] = await Promise.all([
      prisma.spotAdminProfile.findFirst({ where: { userId: user.id, spotId } }),
      prisma.employeeProfile.findFirst({ where: { userId: user.id, spotId } }),
    ]);
    if (!spotAdmin && !employee) {
      throw new Error('You can only manage news for your spot');
    }
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
    @Arg('parentId', () => ID, { nullable: true }) parentId: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<NewsCommentType> {
    const user = req.user!;
    const userId = user.id;

    // If the commenter manages the post's authoring spot, the comment is
    // posted officially "as the spot" (shows the spot's name + logo).
    let asSpotId: string | null = null;
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { spotId: true },
    });
    if (news?.spotId) {
      const isGlobalAdmin =
        user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN);
      if (isGlobalAdmin) {
        asSpotId = news.spotId;
      } else {
        const [spotAdmin, employee] = await Promise.all([
          prisma.spotAdminProfile.findFirst({ where: { userId, spotId: news.spotId } }),
          prisma.employeeProfile.findFirst({ where: { userId, spotId: news.spotId } }),
        ]);
        if (spotAdmin || employee) asSpotId = news.spotId;
      }
    }

    const comment = await prisma.newsComment.create({
      data: {
        userId,
        newsId,
        content,
        parentId: parentId ?? null,
        asSpotId,
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
