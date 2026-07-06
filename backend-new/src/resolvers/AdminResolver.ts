import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  Authorized,
  ID,
} from 'type-graphql';
import { Role } from '@prisma/client';
import { Context } from '../types/Context';
import { UserType } from '../types/UserType';
import { SpotType } from './SpotResolver';
import { hashPassword } from '../auth/PasswordUtil';
import { CodeGenerator } from '../shared/utils/CodeGenerator';
import { EmailService } from '../services/EmailService';

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

// Email a newly-created admin their initial set-password code.
async function sendInviteCode(email: string, code: string, roleLabel: string) {
  await EmailService.sendEmail({
    to: email,
    subject: 'Your Gelato admin account',
    html: `<div style="font-family:sans-serif;text-align:center;padding:24px">
      <h2 style="color:#EC2828">Welcome to Gelato Admin 🍦</h2>
      <p>An account was created for you as <b>${roleLabel}</b>.</p>
      <p>Use this code on the admin site to set your password:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>
      <p style="color:#888">This code expires in 15 minutes.</p>
    </div>`,
    text: `A Gelato admin account was created for you (${roleLabel}). Your set-password code is ${code}. It expires in 15 minutes.`,
  });
}

/**
 * Admin management (web app).
 *
 * - SUPER_ADMIN creates admin accounts (SPOTS_ADMIN / SPOT_ADMIN).
 * - SUPER_ADMIN / SPOTS_ADMIN invite a spot admin and bind them to a spot.
 * All admin users live in the ADMIN account namespace and receive an emailed
 * code to set their initial password (reusing the reset-code fields).
 */
@Resolver()
export class AdminResolver {
  /**
   * List admin-namespace accounts (SUPER_ADMIN only).
   */
  @Authorized([Role.SUPER_ADMIN])
  @Query(() => [UserType])
  async adminAccounts(@Ctx() { prisma }: Context): Promise<UserType[]> {
    return prisma.user.findMany({
      where: { accountType: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
    }) as Promise<UserType[]>;
  }

  /**
   * Spots the current admin manages. SUPER_ADMIN/SPOTS_ADMIN see all; a
   * SPOT_ADMIN sees only spots bound to them via SpotAdminProfile.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => [SpotType])
  async myAdminSpots(@Ctx() { req, prisma }: Context): Promise<SpotType[]> {
    const user = req.user!;
    if (
      user.roles.includes(Role.SUPER_ADMIN) ||
      user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      return prisma.spot.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<SpotType[]>;
    }
    const profiles = await prisma.spotAdminProfile.findMany({
      where: { userId: user.id },
      include: { spot: true },
    });
    return profiles.map((p) => p.spot) as unknown as SpotType[];
  }

  /**
   * SUPER_ADMIN creates a new admin account (SPOTS_ADMIN or SPOT_ADMIN).
   * The account is created in the ADMIN namespace with a random password and
   * an emailed set-password code.
   */
  @Authorized([Role.SUPER_ADMIN])
  @Mutation(() => UserType)
  async createAdminAccount(
    @Arg('email') email: string,
    @Arg('name') name: string,
    @Arg('role', () => String) role: string,
    @Ctx() { prisma }: Context
  ): Promise<UserType> {
    const normalized = email.toLowerCase();
    const allowed: Role[] = [Role.SPOTS_ADMIN, Role.SPOT_ADMIN, Role.EMPLOYEE];
    if (!allowed.includes(role as Role)) {
      throw new Error('Role must be SPOTS_ADMIN, SPOT_ADMIN or EMPLOYEE');
    }

    const existing = await prisma.user.findUnique({
      where: { email_accountType: { email: normalized, accountType: 'ADMIN' } },
    });
    if (existing) throw new Error('An admin with this email already exists');

    const code = CodeGenerator.generateOTP();
    const user = await prisma.user.create({
      data: {
        email: normalized,
        name,
        accountType: 'ADMIN',
        password: await hashPassword(CodeGenerator.generateRandomString(32)),
        roles: [role as Role],
        registrationSource: 'ADMIN_WEB',
        emailVerified: true,
        emailVerificationCode: code,
        emailVerificationExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
      },
    });

    await sendInviteCode(normalized, code, role);
    console.log(`✅ Admin account created: ${normalized} (${role})`);
    return user as UserType;
  }

  /**
   * Invite a spot admin: create (or reuse) an ADMIN-namespace SPOT_ADMIN and
   * bind them to a spot via SpotAdminProfile. SUPER_ADMIN / SPOTS_ADMIN only.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => UserType)
  async inviteSpotAdmin(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('email') email: string,
    @Arg('name') name: string,
    @Ctx() { prisma }: Context
  ): Promise<UserType> {
    const normalized = email.toLowerCase();

    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) throw new Error('Spot not found');

    // Reuse an existing admin account with this email, else create one.
    let user = await prisma.user.findUnique({
      where: { email_accountType: { email: normalized, accountType: 'ADMIN' } },
    });

    let inviteCode: string | null = null;
    if (!user) {
      inviteCode = CodeGenerator.generateOTP();
      user = await prisma.user.create({
        data: {
          email: normalized,
          name,
          accountType: 'ADMIN',
          password: await hashPassword(CodeGenerator.generateRandomString(32)),
          roles: [Role.SPOT_ADMIN],
          registrationSource: 'ADMIN_WEB',
          emailVerified: true,
          emailVerificationCode: inviteCode,
          emailVerificationExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
        },
      });
    } else if (!user.roles.includes(Role.SPOT_ADMIN)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { roles: { push: Role.SPOT_ADMIN } },
      });
    }

    // Bind to the spot (SpotAdminProfile.userId is unique → upsert). This is
    // the record the permission checks in other resolvers look up.
    await prisma.spotAdminProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, spotId },
      update: { spotId },
    });

    if (inviteCode) {
      await sendInviteCode(normalized, inviteCode, 'Spot Admin');
    }
    console.log(`✅ Spot admin invited: ${normalized} -> spot ${spotId}`);
    return user as UserType;
  }

  /**
   * Spot admin creates an employee with a login + initial password (no email
   * invite — per spec the admin hands over credentials, and the employee is
   * forced to change the password on first login via EmployeeProfile.isFirstLogin).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => UserType)
  async createEmployee(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('email') email: string,
    @Arg('name') name: string,
    @Arg('password') password: string,
    @Ctx() { req, prisma }: Context
  ): Promise<UserType> {
    const user = req.user!;
    const normalized = email.toLowerCase();

    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) throw new Error('Spot not found');

    // A SPOT_ADMIN may only add employees to spots they manage.
    if (
      !user.roles.includes(Role.SUPER_ADMIN) &&
      !user.roles.includes(Role.SPOTS_ADMIN)
    ) {
      const manages = await prisma.spotAdminProfile.findFirst({
        where: { userId: user.id, spotId },
      });
      if (!manages) throw new Error('You can only add employees to your spot');
    }

    const existing = await prisma.user.findUnique({
      where: { email_accountType: { email: normalized, accountType: 'ADMIN' } },
    });
    if (existing) throw new Error('An admin/employee with this email already exists');

    let hashed: string;
    try {
      hashed = await hashPassword(password);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Invalid password');
    }

    const employee = await prisma.user.create({
      data: {
        email: normalized,
        name,
        accountType: 'ADMIN',
        password: hashed,
        roles: [Role.EMPLOYEE],
        registrationSource: 'ADMIN_WEB',
        emailVerified: true,
        employeeProfile: {
          create: { spotId, isFirstLogin: true },
        },
      },
    });

    console.log(`✅ Employee created: ${normalized} -> spot ${spotId}`);
    return employee as UserType;
  }

  /**
   * Employees the current admin can manage (all for a given spot).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => [UserType])
  async spotEmployees(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { prisma }: Context
  ): Promise<UserType[]> {
    const profiles = await prisma.employeeProfile.findMany({
      where: { spotId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return profiles.map((p) => p.user) as UserType[];
  }
}
