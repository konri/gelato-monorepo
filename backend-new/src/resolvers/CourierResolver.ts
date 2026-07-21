import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
  Float,
  Int,
  FieldResolver,
  Root,
} from 'type-graphql';
import { Role, OrderStatus } from '@prisma/client';
import { Context } from '../types/Context';
import {
  CourierProfileType,
  CourierApplicationType,
  CourierLocationType,
  AvailableCourierType,
  CourierApprovedSpotType,
  WorkSessionType,
  CourierDeliveryType,
  CourierEarningsSummaryType,
} from '../types/CourierType';
import { PubSubService } from '../services/PubSubService';

/**
 * Resolves spot/city display fields on a courier application.
 */
@Resolver(() => CourierApplicationType)
export class CourierApplicationResolver {
  @FieldResolver(() => String, { nullable: true })
  async spotName(
    @Root() app: CourierApplicationType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const spot = await prisma.spot.findUnique({ where: { id: app.spotId } });
    return spot?.name ?? null;
  }

  @FieldResolver(() => String, { nullable: true })
  async spotAddress(
    @Root() app: CourierApplicationType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const spot = await prisma.spot.findUnique({ where: { id: app.spotId } });
    return spot?.address ?? null;
  }

  @FieldResolver(() => String, { nullable: true })
  async cityName(
    @Root() app: CourierApplicationType,
    @Ctx() { prisma }: Context
  ): Promise<string | null> {
    const spot = await prisma.spot.findUnique({
      where: { id: app.spotId },
      include: { city: true },
    });
    return spot?.city?.name ?? null;
  }
}

/**
 * Courier Management Resolver
 *
 * Handles:
 * - Courier applications to spots
 * - Courier profile management (online/available status)
 * - Order assignment to couriers
 * - GPS location tracking
 * - Delivery status updates
 *
 * Role-based access:
 * - COURIER: Manage own profile, apply to spots, update location
 * - SPOT_ADMIN/EMPLOYEE: Approve applications, assign orders
 * - SUPER_ADMIN/SPOTS_ADMIN: Full access to all courier operations
 */
@Resolver()
export class CourierResolver {
  /**
   * Get courier profile (self or admin)
   */
  @Authorized([Role.COURIER, Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Query(() => CourierProfileType, { nullable: true })
  async courierProfile(
    @Arg('courierId', () => ID, { nullable: true }) courierId: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierProfileType | null> {
    const user = req.user!;

    // If courierId provided, check admin permissions
    if (courierId) {
      if (!user.roles.includes(Role.SUPER_ADMIN) && !user.roles.includes(Role.SPOTS_ADMIN)) {
        throw new Error('Only admins can view other courier profiles');
      }
    } else {
      // Get own profile
      if (!user.roles.includes(Role.COURIER)) {
        throw new Error('User is not a courier');
      }
      const profile = await prisma.courierProfile.findUnique({
        where: { userId: user.id },
      });
      return profile as CourierProfileType | null;
    }

    return prisma.courierProfile.findUnique({
      where: { id: courierId },
    }) as Promise<CourierProfileType | null>;
  }

  /**
   * The current courier's spot applications (pending / approved / rejected),
   * newest first. Used by the courier app's apply-to-spot screen.
   */
  @Authorized([Role.COURIER])
  @Query(() => [CourierApplicationType])
  async myCourierApplications(
    @Ctx() { req, prisma }: Context
  ): Promise<CourierApplicationType[]> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return [];
    return prisma.courierApplication.findMany({
      where: { courierId: profile.id },
      orderBy: { appliedAt: 'desc' },
    }) as Promise<CourierApplicationType[]>;
  }

  /**
   * The spots the current courier is approved to work at (active relationships),
   * with display info. Used by the "go online → pick spots" screen.
   */
  @Authorized([Role.COURIER])
  @Query(() => [CourierApprovedSpotType])
  async myApprovedSpots(
    @Ctx() { req, prisma }: Context
  ): Promise<CourierApprovedSpotType[]> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return [];

    const courierSpots = await prisma.courierSpot.findMany({
      where: { courierId: profile.id, isActive: true },
      include: { spot: { include: { city: true } } },
      orderBy: { approvedAt: 'desc' },
    });

    return courierSpots.map((cs) => ({
      spotId: cs.spotId,
      spotName: cs.spot.name,
      spotAddress: cs.spot.address ?? undefined,
      cityName: cs.spot.city?.name ?? undefined,
      isActive: cs.isActive,
    }));
  }

  /**
   * The courier's currently-active work session (null if not working).
   */
  @Authorized([Role.COURIER])
  @Query(() => WorkSessionType, { nullable: true })
  async myActiveWorkSession(
    @Ctx() { req, prisma }: Context
  ): Promise<WorkSessionType | null> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return null;

    return prisma.workSession.findFirst({
      where: { courierId: profile.id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    }) as Promise<WorkSessionType | null>;
  }

  /**
   * Go online: open a work session for the selected (approved) spots.
   * Closes any dangling active session first, then marks the courier online.
   */
  @Authorized([Role.COURIER])
  @Mutation(() => WorkSessionType)
  async startWorkSession(
    @Arg('spotIds', () => [ID]) spotIds: string[],
    @Ctx() { req, prisma }: Context
  ): Promise<WorkSessionType> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) throw new Error('Courier profile not found');

    if (!spotIds || spotIds.length === 0) {
      throw new Error('Select at least one spot to work from');
    }

    // Only allow spots the courier is actually approved for.
    const approved = await prisma.courierSpot.findMany({
      where: { courierId: profile.id, spotId: { in: spotIds }, isActive: true },
      select: { spotId: true },
    });
    const approvedIds = approved.map((a) => a.spotId);
    if (approvedIds.length === 0) {
      throw new Error('You are not approved for any of the selected spots');
    }

    // Close any dangling active sessions.
    await prisma.workSession.updateMany({
      where: { courierId: profile.id, endedAt: null },
      data: { endedAt: new Date() },
    });

    const session = await prisma.workSession.create({
      data: {
        courierId: profile.id,
        selectedSpotIds: approvedIds,
      },
    });

    // Mark courier online + available for delivery.
    await prisma.courierProfile.update({
      where: { id: profile.id },
      data: { isOnline: true, isAvailable: true },
    });

    console.log(`✅ Courier ${profile.id} started work session ${session.id} for spots ${approvedIds.join(', ')}`);

    return session as WorkSessionType;
  }

  /**
   * Go offline: close the active work session and mark the courier offline.
   */
  @Authorized([Role.COURIER])
  @Mutation(() => Boolean)
  async endWorkSession(
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) throw new Error('Courier profile not found');

    await prisma.workSession.updateMany({
      where: { courierId: profile.id, endedAt: null },
      data: { endedAt: new Date() },
    });

    await prisma.courierProfile.update({
      where: { id: profile.id },
      data: { isOnline: false, isAvailable: false },
    });

    console.log(`✅ Courier ${profile.id} ended work session`);

    return true;
  }

  /**
   * Update courier online/available status
   */
  @Authorized([Role.COURIER])
  @Mutation(() => Boolean)
  async updateCourierStatus(
    @Arg('isOnline', () => Boolean) isOnline: boolean,
    @Arg('isAvailable', () => Boolean, { nullable: true }) isAvailable: boolean | undefined,
    @Arg('currentSpotId', () => ID, { nullable: true }) currentSpotId: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    const profile = await prisma.courierProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new Error('Courier profile not found');
    }

    // Update status
    await prisma.courierProfile.update({
      where: { id: profile.id },
      data: {
        isOnline,
        isAvailable: isAvailable !== undefined ? isAvailable : profile.isAvailable,
        currentSpotId,
      },
    });

    console.log(`✅ Courier ${profile.id} status updated: online=${isOnline}, available=${isAvailable}, spot=${currentSpotId}`);

    return true;
  }

  /**
   * Apply to work at a spot
   */
  @Authorized([Role.COURIER])
  @Mutation(() => CourierApplicationType)
  async applyCourierToSpot(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierApplicationType> {
    const user = req.user!;

    // Get courier profile
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new Error('Courier profile not found');
    }

    // Check if spot exists
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
    });

    if (!spot) {
      throw new Error('Spot not found');
    }

    // Check if already applied
    const existing = await prisma.courierApplication.findUnique({
      where: {
        courierId_spotId: {
          courierId: profile.id,
          spotId,
        },
      },
    });

    if (existing) {
      throw new Error('Already applied to this spot');
    }

    // Create application
    const application = await prisma.courierApplication.create({
      data: {
        courierId: profile.id,
        spotId,
        status: 'pending',
      },
    });

    // Publish courier request event
    await PubSubService.publishCourierRequest(spotId, profile);

    console.log(`✅ Courier ${profile.id} applied to spot ${spotId}`);

    return application as CourierApplicationType;
  }

  /**
   * Review courier application (approve/reject)
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => Boolean)
  async reviewCourierApplication(
    @Arg('applicationId', () => ID) applicationId: string,
    @Arg('approved', () => Boolean) approved: boolean,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get application
    const application = await prisma.courierApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check permission for SPOT_ADMIN
    if (user.roles.includes(Role.SPOT_ADMIN) && !user.roles.includes(Role.SUPER_ADMIN)) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: {
          userId: user.id,
          spotId: application.spotId,
        },
      });

      if (!spotAdmin) {
        throw new Error('You can only review applications for your spots');
      }
    }

    // Update application
    await prisma.courierApplication.update({
      where: { id: applicationId },
      data: {
        status: approved ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    // If approved, create CourierSpot relationship
    if (approved) {
      await prisma.courierSpot.create({
        data: {
          courierId: application.courierId,
          spotId: application.spotId,
          isActive: true,
        },
      });

      console.log(`✅ Courier ${application.courierId} approved for spot ${application.spotId}`);
    } else {
      console.log(`❌ Courier ${application.courierId} rejected for spot ${application.spotId}`);
    }

    // Notify the courier of the decision (in-app bell + FCM push). courierId is
    // a CourierProfile id, so resolve the underlying userId first.
    await this.notifyCourierOfReview(
      application.courierId,
      application.spotId,
      approved,
      prisma,
    );

    return true;
  }

  /**
   * Notify a courier that their spot application was approved/rejected: persist
   * an in-app notification and send an FCM push. Best-effort — never blocks the
   * review from succeeding.
   */
  private async notifyCourierOfReview(
    courierProfileId: string,
    spotId: string,
    approved: boolean,
    prisma: any,
  ): Promise<void> {
    try {
      const [profile, spot] = await Promise.all([
        prisma.courierProfile.findUnique({
          where: { id: courierProfileId },
          select: { userId: true },
        }),
        prisma.spot.findUnique({ where: { id: spotId }, select: { name: true } }),
      ]);
      if (!profile?.userId) return;

      const spotName = spot?.name ?? 'A spot';
      const title = approved ? "You're approved! 🎉" : 'Application reviewed';
      const body = approved
        ? `${spotName} approved you as a courier. You can start delivering now.`
        : `${spotName} did not approve your delivery application.`;

      await prisma.notification.create({
        data: {
          userId: profile.userId,
          title,
          body,
          type: approved ? 'COURIER_APPROVED' : 'COURIER_REJECTED',
          data: { spotId, spotName },
        },
      });

      const { FCMService, NotificationType } = await import('../services/FCMService');
      await FCMService.sendToUser(
        profile.userId,
        approved ? NotificationType.COURIER_APPROVED : NotificationType.COURIER_REJECTED,
        { spotName },
        { kind: approved ? 'COURIER_APPROVED' : 'COURIER_REJECTED', spotId },
        prisma,
      ).catch(() => {});
    } catch (e) {
      console.error('Failed to notify courier of application review:', e);
    }
  }

  /**
   * Get available couriers for a spot
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [AvailableCourierType])
  async availableCouriers(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<AvailableCourierType[]> {
    const user = req.user!;

    // Check permission for SPOT_ADMIN/EMPLOYEE
    if (
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: { userId: user.id, spotId },
      });

      const employee = await prisma.employeeProfile.findFirst({
        where: { userId: user.id, spotId },
      });

      if (!spotAdmin && !employee) {
        throw new Error('You can only view couriers for your spots');
      }
    }

    // Get approved couriers for this spot who are online and available
    const courierSpots = await prisma.courierSpot.findMany({
      where: {
        spotId,
        isActive: true,
      },
      include: {
        courier: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    // Filter online and available couriers
    const available: AvailableCourierType[] = courierSpots
      .filter((cs) => cs.courier.isOnline && cs.courier.isAvailable)
      .map((cs) => ({
        courierId: cs.courier.id,
        userId: cs.courier.userId,
        userName: cs.courier.user.name || `${cs.courier.user.firstName || ''} ${cs.courier.user.surname || ''}`.trim(),
        averageRating: cs.courier.averageRating || undefined,
        totalDeliveries: cs.courier.totalDeliveries,
        distanceKm: undefined, // Could calculate distance from last location
      }));

    return available;
  }

  /**
   * Assign order to courier
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Mutation(() => Boolean)
  async assignOrderToCourier(
    @Arg('orderId', () => ID) orderId: string,
    @Arg('courierId', () => ID) courierId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { spotId: true, status: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check permission
    if (
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const spotAdmin = await prisma.spotAdminProfile.findFirst({
        where: { userId: user.id, spotId: order.spotId },
      });

      const employee = await prisma.employeeProfile.findFirst({
        where: { userId: user.id, spotId: order.spotId },
      });

      if (!spotAdmin && !employee) {
        throw new Error('You can only assign orders for your spots');
      }
    }

    // Verify courier is approved for this spot
    const courierSpot = await prisma.courierSpot.findFirst({
      where: {
        courierId,
        spotId: order.spotId,
        isActive: true,
      },
    });

    if (!courierSpot) {
      throw new Error('Courier is not approved for this spot');
    }

    // Assign courier to order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        courierId,
        courierAssignedAt: new Date(),
        status: OrderStatus.COURIER_ASSIGNED,
      },
      include: {
        items: true,
        courier: true,
      },
    });

    // Publish events
    await PubSubService.publishOrderStatusChanged(updatedOrder);
    await PubSubService.publishOrderAssigned(updatedOrder, updatedOrder.courier);

    console.log(`✅ Order ${orderId} assigned to courier ${courierId}`);

    return true;
  }

  /**
   * Update courier GPS location
   */
  @Authorized([Role.COURIER])
  @Mutation(() => Boolean)
  async updateCourierLocation(
    @Arg('latitude', () => Float) latitude: number,
    @Arg('longitude', () => Float) longitude: number,
    @Arg('accuracy', () => Float, { nullable: true }) accuracy: number | undefined,
    @Arg('orderId', () => ID, { nullable: true }) orderId: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get courier profile
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new Error('Courier profile not found');
    }

    // Save location
    await prisma.courierLocation.create({
      data: {
        courierId: profile.id,
        latitude,
        longitude,
        accuracy,
        orderId,
        timestamp: new Date(),
      },
    });

    // If orderId provided, publish location update
    if (orderId) {
      await PubSubService.publishCourierLocationUpdated(
        orderId,
        latitude,
        longitude,
        new Date()
      );
    }

    return true;
  }

  /**
   * Get courier location history
   */
  @Authorized([Role.COURIER, Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE])
  @Query(() => [CourierLocationType])
  async courierLocationHistory(
    @Arg('courierId', () => ID, { nullable: true }) courierId: string | undefined,
    @Arg('orderId', () => ID, { nullable: true }) orderId: string | undefined,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number = 50,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierLocationType[]> {
    const user = req.user!;

    // If courier querying own history
    if (!courierId && user.roles.includes(Role.COURIER)) {
      const profile = await prisma.courierProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        throw new Error('Courier profile not found');
      }

      courierId = profile.id;
    }

    if (!courierId && !orderId) {
      throw new Error('Must provide either courierId or orderId');
    }

    const where: any = {};
    if (courierId) where.courierId = courierId;
    if (orderId) where.orderId = orderId;

    return prisma.courierLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    }) as Promise<CourierLocationType[]>;
  }

  /**
   * Update delivery status by courier
   */
  @Authorized([Role.COURIER])
  @Mutation(() => Boolean)
  async updateDeliveryStatus(
    @Arg('orderId', () => ID) orderId: string,
    @Arg('status', () => OrderStatus) status: OrderStatus,
    // Handover code: the spot's pickup code for PICKED_UP, the customer's
    // 4-digit PIN for DELIVERED. Required for those transitions.
    @Arg('code', () => String, { nullable: true }) code: string | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;

    // Get courier profile
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new Error('Courier profile not found');
    }

    // Get order and verify courier is assigned
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        courierId: true,
        status: true,
        deliveryFee: true,
        orderNumber: true,
        spotId: true,
        pickupCode: true,
        deliveryPin: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.courierId !== profile.id) {
      throw new Error('You are not assigned to this order');
    }

    // Confirm the in-person handover code before advancing.
    const entered = (code ?? '').trim().toUpperCase();
    if (status === OrderStatus.PICKED_UP && order.pickupCode) {
      if (entered !== order.pickupCode.toUpperCase()) {
        throw new Error('Incorrect pickup code');
      }
    }
    if (status === OrderStatus.DELIVERED && order.deliveryPin) {
      if (entered !== order.deliveryPin.toUpperCase()) {
        throw new Error('Incorrect delivery PIN');
      }
    }

    // Update order status with timestamps
    const updateData: any = { status };

    switch (status) {
      case OrderStatus.PICKED_UP:
        updateData.pickedUpAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        // Only pay + count once (guard against a repeated DELIVERED call).
        if (order.status !== OrderStatus.DELIVERED) {
          // The courier earns the order's delivery fee.
          const earning = order.deliveryFee ?? 0;
          await prisma.courierProfile.update({
            where: { id: profile.id },
            data: {
              totalDeliveries: { increment: 1 },
              totalEarnings: { increment: earning },
            },
          });
          if (earning > 0) {
            await prisma.courierEarning.create({
              data: {
                courierId: profile.id,
                amount: earning,
                description: `Delivery ${order.orderNumber}`,
                spotId: order.spotId,
                orderId,
              },
            });
          }
        }
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true },
    });

    // Publish status change
    await PubSubService.publishOrderStatusChanged(updatedOrder);

    console.log(`✅ Order ${orderId} status updated by courier: ${status}`);

    return true;
  }

  /**
   * A courier cancels an active delivery and/or reports an incident (bike
   * damage, lost address, customer unreachable). Optionally attaches a photo
   * (uploaded first via POST /upload/delivery-incident/:orderId → incidentPhotoUrl).
   * Sets the order back so the spot can reassign, and notifies the spot admin.
   */
  @Authorized([Role.COURIER])
  @Mutation(() => Boolean)
  async reportDeliveryIncident(
    @Arg('orderId', () => ID) orderId: string,
    @Arg('incidentType', () => String) incidentType: string,
    @Arg('note', () => String, { nullable: true }) note: string | undefined,
    @Arg('photoUrl', () => String, { nullable: true }) photoUrl: string | undefined,
    @Arg('cancel', () => Boolean, { nullable: true }) cancel: boolean | undefined,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const user = req.user!;
    const profile = await prisma.courierProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new Error('Courier profile not found');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { courierId: true, status: true, orderNumber: true, spotId: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.courierId !== profile.id) throw new Error('You are not assigned to this order');

    const doCancel = cancel !== false; // default: an incident cancels the delivery
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        incidentType,
        incidentNote: note ?? null,
        incidentPhotoUrl: photoUrl ?? null,
        incidentReportedAt: new Date(),
        incidentReportedBy: profile.id, // so this courier can't re-accept it
        ...(doCancel
          ? {
              status: OrderStatus.READY, // hand back to the spot to reassign
              cancelReason: note ?? incidentType,
              // Release the courier assignment.
              courierId: null,
              courierAssignedAt: null,
            }
          : {}),
      },
      include: { items: true },
    });

    await PubSubService.publishOrderStatusChanged(updated);

    // Notify the spot (subscription + push + persisted notification).
    await PubSubService.publishDeliveryIncident(order.spotId, {
      orderId,
      orderNumber: order.orderNumber,
      incidentType,
      note: note ?? null,
      photoUrl: photoUrl ?? null,
      cancelled: doCancel,
    });
    await this.notifySpotOfIncident(
      order.spotId,
      order.orderNumber,
      incidentType,
      note ?? null,
      photoUrl ?? null,
      prisma,
    );

    console.log(`⚠️ Delivery incident on ${order.orderNumber} (${incidentType}, cancel=${doCancel})`);
    return true;
  }

  /**
   * Notify a spot's admins + employees of a courier incident: FCM push + a
   * persisted in-app Notification (with the incident photo, if any).
   */
  private async notifySpotOfIncident(
    spotId: string,
    orderNumber: string,
    incidentType: string,
    note: string | null,
    photoUrl: string | null,
    prisma: any
  ): Promise<void> {
    try {
      const [admins, employees] = await Promise.all([
        prisma.spotAdminProfile.findMany({ where: { spotId }, select: { userId: true } }),
        prisma.employeeProfile.findMany({ where: { spotId }, select: { userId: true } }),
      ]);
      const userIds = Array.from(
        new Set<string>([...admins.map((a: any) => a.userId), ...employees.map((e: any) => e.userId)])
      );
      if (userIds.length === 0) return;

      const title = `Delivery issue · #${orderNumber}`;
      const body = note ? `${incidentType}: ${note}` : incidentType;

      // Persist an in-app notification per recipient (carries the photo).
      await prisma.notification.createMany({
        data: userIds.map((uid) => ({
          userId: uid,
          title,
          body,
          imageUrl: photoUrl ?? undefined,
          type: 'DELIVERY_INCIDENT',
          data: { orderNumber, incidentType },
        })),
      });

      const { FCMService, NotificationType } = await import('../services/FCMService');
      await FCMService.sendToUsers(
        userIds,
        NotificationType.ORDER_CANCELLED,
        { orderNumber },
        { kind: 'DELIVERY_INCIDENT', incidentType },
        prisma
      ).catch(() => {});
    } catch (e) {
      console.error('Failed to notify spot of delivery incident:', e);
    }
  }

  // ==========================================================================
  // DELIVERIES (broadcast → first-to-accept)
  // ==========================================================================

  /**
   * Deliveries currently offered to this courier: READY, unassigned orders at
   * the spots selected in the courier's active work session. Ordered nearest-
   * ready first. Before pickup the customer address/coords are hidden.
   */
  @Authorized([Role.COURIER])
  @Query(() => [CourierDeliveryType])
  async availableDeliveries(
    @Ctx() { req, prisma }: Context
  ): Promise<CourierDeliveryType[]> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return [];

    // Must be online with an active session; only offer from selected spots.
    const session = await prisma.workSession.findFirst({
      where: { courierId: profile.id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!session || session.selectedSpotIds.length === 0) return [];

    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.READY,
        courierId: null,
        spotId: { in: session.selectedSpotIds },
      },
      include: { spot: true, items: true },
      orderBy: { readyAt: 'asc' },
    });

    return orders.map((o) => this.toCourierDelivery(o, false));
  }

  /**
   * The courier's current in-progress delivery (assigned + not yet delivered).
   * Reveals the customer address so the app can navigate + show the map.
   */
  @Authorized([Role.COURIER])
  @Query(() => CourierDeliveryType, { nullable: true })
  async myActiveDelivery(
    @Ctx() { req, prisma }: Context
  ): Promise<CourierDeliveryType | null> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return null;

    const order = await prisma.order.findFirst({
      where: {
        courierId: profile.id,
        status: {
          in: [
            OrderStatus.COURIER_ASSIGNED,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
          ],
        },
      },
      include: { spot: true, items: true },
      orderBy: { courierAssignedAt: 'desc' },
    });

    if (!order) return null;
    // Reveal the address once picked up; before that, only spot info is shown.
    const revealAddress = order.status !== OrderStatus.COURIER_ASSIGNED;
    return this.toCourierDelivery(order, revealAddress);
  }

  /**
   * Accept a broadcast delivery (first-to-accept). Atomically claims the order
   * only if it is still READY + unassigned; otherwise throws "already taken".
   */
  @Authorized([Role.COURIER])
  @Mutation(() => CourierDeliveryType)
  async acceptDelivery(
    @Arg('orderId', () => ID) orderId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierDeliveryType> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) throw new Error('Courier profile not found');

    // One active delivery at a time.
    const existing = await prisma.order.findFirst({
      where: {
        courierId: profile.id,
        status: {
          in: [
            OrderStatus.COURIER_ASSIGNED,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
          ],
        },
      },
      select: { id: true },
    });
    if (existing) throw new Error('You already have an active delivery');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    // A courier who reported an incident on this order can't re-accept it — it
    // must go to a different courier (avoids the same broken bike picking it up).
    if (order.incidentReportedBy === profile.id) {
      throw new Error('You reported an issue on this order — another courier must take it');
    }

    // Must be approved for + selected this spot in the active session.
    const session = await prisma.workSession.findFirst({
      where: { courierId: profile.id, endedAt: null },
    });
    if (!session || !session.selectedSpotIds.includes(order.spotId)) {
      throw new Error('You are not working this spot');
    }

    // Atomic claim: updateMany with the guard in WHERE. count=0 → someone else won.
    const claim = await prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.READY, courierId: null },
      data: {
        courierId: profile.id,
        courierAssignedAt: new Date(),
        status: OrderStatus.COURIER_ASSIGNED,
      },
    });
    if (claim.count === 0) {
      throw new Error('This delivery has already been taken');
    }

    const claimed = await prisma.order.findUnique({
      where: { id: orderId },
      include: { spot: true, items: true, courier: true },
    });

    // Notify subscribers + the client, and tell other couriers it's gone.
    await PubSubService.publishOrderStatusChanged(claimed);
    await PubSubService.publishOrderAssigned(claimed, claimed!.courier);
    await PubSubService.publishDeliveryClaimed(order.spotId, orderId, profile.id);

    console.log(`✅ Courier ${profile.id} accepted delivery ${orderId}`);

    return this.toCourierDelivery(claimed, false);
  }

  /**
   * Map a Prisma order (with spot + items) to the courier delivery view.
   */
  private toCourierDelivery(order: any, revealAddress: boolean): CourierDeliveryType {
    const itemCount = (order.items ?? []).reduce(
      (sum: number, it: any) => sum + (it.quantity ?? 1),
      0
    );
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      itemCount,
      spotId: order.spotId,
      spotName: order.spot?.name ?? '',
      spotAddress: order.spot?.address ?? undefined,
      spotLatitude: order.spot?.latitude ?? 0,
      spotLongitude: order.spot?.longitude ?? 0,
      deliveryAddress: revealAddress ? order.deliveryAddress : undefined,
      deliveryLatitude: revealAddress ? order.deliveryLatitude : undefined,
      deliveryLongitude: revealAddress ? order.deliveryLongitude : undefined,
      apartmentNumber: revealAddress ? order.apartmentNumber ?? undefined : undefined,
      floor: revealAddress ? order.floor ?? undefined : undefined,
      noteForCourier: revealAddress ? order.noteForCourier ?? undefined : undefined,
      readyAt: order.readyAt ?? undefined,
      pickedUpAt: order.pickedUpAt ?? undefined,
      deliveredAt: order.deliveredAt ?? undefined,
      courierRating: order.review?.courierRating ?? undefined,
      reviewComment: order.review?.comment ?? undefined,
    };
  }

  /**
   * The courier's completed deliveries (newest first), with the client's
   * courier rating + comment when available. Powers the Deliveries history tab.
   */
  @Authorized([Role.COURIER])
  @Query(() => [CourierDeliveryType])
  async myDeliveryHistory(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierDeliveryType[]> {
    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return [];

    const orders = await prisma.order.findMany({
      where: { courierId: profile.id, status: OrderStatus.DELIVERED },
      include: { spot: true, items: true, review: true },
      orderBy: { deliveredAt: 'desc' },
      take: limit,
    });

    // Address stays revealed for the courier's own completed deliveries.
    return orders.map((o) => this.toCourierDelivery(o, true));
  }

  /**
   * Earnings dashboard: today + current-month totals, all-time total, and a
   * per-day breakdown over the last `days` (default 30).
   */
  @Authorized([Role.COURIER])
  @Query(() => CourierEarningsSummaryType)
  async myEarnings(
    @Arg('days', () => Int, { defaultValue: 30 }) days: number,
    @Ctx() { req, prisma }: Context
  ): Promise<CourierEarningsSummaryType> {
    const empty: CourierEarningsSummaryType = {
      todayAmount: 0,
      todayDeliveries: 0,
      monthAmount: 0,
      monthDeliveries: 0,
      totalAmount: 0,
      daily: [],
    };

    const profile = await prisma.courierProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) return empty;

    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Pull the window once and aggregate in memory (keeps it DB-agnostic).
    const earnings = await prisma.courierEarning.findMany({
      where: { courierId: profile.id, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    const dayKey = (d: Date) => {
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const byDay = new Map<string, { amount: number; deliveries: number }>();
    let todayAmount = 0;
    let todayDeliveries = 0;
    let monthAmount = 0;
    let monthDeliveries = 0;

    for (const e of earnings) {
      const key = dayKey(e.date);
      const bucket = byDay.get(key) ?? { amount: 0, deliveries: 0 };
      bucket.amount += e.amount;
      bucket.deliveries += 1;
      byDay.set(key, bucket);

      if (e.date >= todayStart) {
        todayAmount += e.amount;
        todayDeliveries += 1;
      }
      if (e.date >= monthStart) {
        monthAmount += e.amount;
        monthDeliveries += 1;
      }
    }

    const daily = Array.from(byDay.entries())
      .map(([date, v]) => ({ date, amount: v.amount, deliveries: v.deliveries }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

    return {
      todayAmount,
      todayDeliveries,
      monthAmount,
      monthDeliveries,
      totalAmount: profile.totalEarnings ?? 0,
      daily,
    };
  }
}
