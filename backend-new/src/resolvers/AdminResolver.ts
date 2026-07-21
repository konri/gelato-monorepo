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
import { Role } from '@prisma/client';
import { Context } from '../types/Context';
import { UserType } from '../types/UserType';
import { SpotType } from './SpotResolver';
import { hashPassword } from '../auth/PasswordUtil';
import { CodeGenerator } from '../shared/utils/CodeGenerator';
import { EmailService } from '../services/EmailService';

/**
 * A spot's staff member (admin or employee) with login status.
 */
@ObjectType()
class StaffMember {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  role!: string;

  @Field()
  loginDisabled!: boolean;

  @Field()
  createdAt!: Date;
}

/**
 * A staff login event for the session log.
 */
@ObjectType()
class StaffLoginSessionType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  staffName!: string;

  @Field()
  role!: string;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field()
  loginAt!: Date;
}

// Admin invite / set-password codes are valid for 24h (super admin invites
// staff who may not act immediately).
const RESET_CODE_TTL_MS = 24 * 60 * 60 * 1000;

// Email a newly-created admin their initial set-password code.
// Styled to match the Gelato landing page (berry gradient, cream background).
// `target` picks which app the set-password link points at:
//   - 'spot'  → spot app (spot admins manage their spot there)
//   - 'admin' → super-admin / spots-admin web panel
async function sendInviteCode(
  email: string,
  code: string,
  roleLabel: string,
  target: 'admin' | 'spot' = 'admin',
) {
  const baseUrl =
    target === 'spot'
      ? process.env.GELATO_SPOT_URL || 'http://localhost:8083'
      : process.env.GELATO_ADMIN_URL || 'http://localhost:5173';
  // Deep-link straight to the set-password form with the email pre-filled.
  const setPasswordUrl = `${baseUrl}/login?mode=reset&email=${encodeURIComponent(email)}`;

  await EmailService.sendEmail({
    to: email,
    subject: 'Your Gelato admin account',
    html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#fff8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(192,38,163,0.12);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#c026a3 0%,#8a1673 100%);padding:36px 32px;text-align:center;">
                <div style="font-size:40px;line-height:1;">🍦</div>
                <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:800;">Welcome to Gelato Admin</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;text-align:center;color:#3a1526;">
                <p style="margin:0 0 8px;font-size:16px;line-height:1.5;">
                  An account was created for you as <b style="color:#c026a3;">${roleLabel}</b>.
                </p>
                <p style="margin:0 0 24px;font-size:15px;color:#5c2a3d;line-height:1.5;">
                  Use this code on the admin site to set your password:
                </p>
                <!-- Code -->
                <div style="display:inline-block;background:#fff1e6;border:2px dashed rgba(192,38,163,0.3);border-radius:16px;padding:18px 28px;margin-bottom:24px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#8a1673;">${code}</span>
                </div>
                <!-- CTA -->
                <div style="margin:8px 0 20px;">
                  <a href="${setPasswordUrl}" style="display:inline-block;background:#c026a3;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:999px;">
                    Set your password
                  </a>
                </div>
                <p style="margin:0 0 4px;font-size:13px;color:#5c2a3d;">Or copy this link into your browser:</p>
                <p style="margin:0 0 20px;font-size:13px;">
                  <a href="${setPasswordUrl}" style="color:#c026a3;word-break:break-all;">${setPasswordUrl}</a>
                </p>
                <p style="margin:0;font-size:13px;color:#9a8a90;">This code expires in 24 hours.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#fff1e6;padding:20px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9a8a90;">Made with ❤️ for ice cream lovers · Gelato</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `A Gelato admin account was created for you (${roleLabel}). Your set-password code is ${code} (expires in 24 hours). Set your password at ${setPasswordUrl}`,
  });
}

/**
 * Email a newly-invited spot staff member (SPOT_ADMIN / EMPLOYEE) their
 * set-password code, branded for the specific spot: the spot's logo (if it has
 * one) and its name/address/phone, so the invitee recognizes who invited them.
 * The set-password link points at the spot app.
 */
async function sendSpotStaffInvite(opts: {
  email: string;
  code: string;
  roleLabel: string;
  spot: { name: string; address?: string | null; phone?: string | null; logoUrl?: string | null };
  // 'invite' = brand-new member; 'reset' = existing member resetting password.
  variant?: 'invite' | 'reset';
}) {
  const { email, code, roleLabel, spot, variant = 'invite' } = opts;
  const isReset = variant === 'reset';
  const baseUrl = process.env.GELATO_SPOT_URL || 'http://localhost:8083';
  const setPasswordUrl = `${baseUrl}/login?mode=reset&email=${encodeURIComponent(email)}`;
  const subject = isReset
    ? `Reset your password for ${spot.name} on Gelato`
    : `You've been invited to ${spot.name} on Gelato`;
  const introHtml = isReset
    ? `A password reset was requested for your <b style="color:#c026a3;">${spot.name}</b> account (<b style="color:#c026a3;">${roleLabel}</b>).`
    : `You've been invited to join <b style="color:#c026a3;">${spot.name}</b> as <b style="color:#c026a3;">${roleLabel}</b>.`;
  const codeIntro = isReset
    ? 'Use this code in the Gelato Spot app to set a new password:'
    : 'Use this code in the Gelato Spot app to set your password:';
  const introText = isReset
    ? `A password reset was requested for your ${spot.name} account (${roleLabel}).`
    : `You've been invited to ${spot.name} as ${roleLabel}.`;

  // Logo if the spot has one, else the ice-cream glyph (matches admin invite).
  const brandMark = spot.logoUrl
    ? `<img src="${spot.logoUrl}" alt="${spot.name}" width="64" height="64" style="width:64px;height:64px;border-radius:16px;object-fit:cover;display:block;margin:0 auto;" />`
    : `<div style="font-size:40px;line-height:1;">🍦</div>`;

  const detailRow = (label: string, value: string) =>
    `<tr><td style="padding:2px 0;font-size:13px;color:#9a8a90;">${label}</td>` +
    `<td style="padding:2px 0 2px 12px;font-size:13px;color:#3a1526;text-align:right;">${value}</td></tr>`;
  const detailRows = [
    detailRow('Spot', spot.name),
    spot.address ? detailRow('Address', spot.address) : '',
    spot.phone ? detailRow('Phone', spot.phone) : '',
  ].join('');

  await EmailService.sendEmail({
    to: email,
    subject,
    html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#fff8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(192,38,163,0.12);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#c026a3 0%,#8a1673 100%);padding:36px 32px;text-align:center;">
                ${brandMark}
                <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:800;">${spot.name}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;text-align:center;color:#3a1526;">
                <p style="margin:0 0 8px;font-size:16px;line-height:1.5;">
                  ${introHtml}
                </p>
                <!-- Spot details -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0 20px;background:#fff8f0;border-radius:12px;padding:12px 16px;">
                  ${detailRows}
                </table>
                <p style="margin:0 0 24px;font-size:15px;color:#5c2a3d;line-height:1.5;">
                  ${codeIntro}
                </p>
                <!-- Code -->
                <div style="display:inline-block;background:#fff1e6;border:2px dashed rgba(192,38,163,0.3);border-radius:16px;padding:18px 28px;margin-bottom:24px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#8a1673;">${code}</span>
                </div>
                <!-- CTA -->
                <div style="margin:8px 0 20px;">
                  <a href="${setPasswordUrl}" style="display:inline-block;background:#c026a3;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:999px;">
                    Set your password
                  </a>
                </div>
                <p style="margin:0 0 4px;font-size:13px;color:#5c2a3d;">Or copy this link into your browser:</p>
                <p style="margin:0 0 20px;font-size:13px;">
                  <a href="${setPasswordUrl}" style="color:#c026a3;word-break:break-all;">${setPasswordUrl}</a>
                </p>
                <p style="margin:0;font-size:13px;color:#9a8a90;">This code expires in 24 hours.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#fff1e6;padding:20px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9a8a90;">Made with ❤️ for ice cream lovers · Gelato</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `${introText} Use code ${code} in the Gelato Spot app to set ${isReset ? 'a new' : 'your'} password (expires in 24 hours). Set it at ${setPasswordUrl}`,
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
      await sendInviteCode(normalized, inviteCode, 'Spot Admin', 'spot');
    }
    console.log(`✅ Spot admin invited: ${normalized} -> spot ${spotId}`);
    return user as UserType;
  }

  /**
   * Resend a fresh set-password code to an admin (SUPER_ADMIN / SPOTS_ADMIN).
   * Used when the invite code expired or was lost. Generates a new 24h code
   * and re-emails it.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
  @Mutation(() => Boolean)
  async resendAdminInvite(
    @Arg('userId', () => ID) userId: string,
    @Ctx() { prisma }: Context
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.accountType !== 'ADMIN') {
      throw new Error('Admin account not found');
    }

    const code = CodeGenerator.generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: code,
        emailVerificationExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
      },
    });

    // A plain SPOT_ADMIN manages their spot in the spot app; global admins use
    // the admin panel — link the resend to whichever they belong to.
    const isGlobalAdmin =
      user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN);
    const roleLabel = user.roles.includes(Role.SUPER_ADMIN)
      ? 'Super Admin'
      : user.roles.includes(Role.SPOTS_ADMIN)
        ? 'Spots Admin'
        : 'Spot Admin';
    await sendInviteCode(user.email, code, roleLabel, isGlobalAdmin ? 'admin' : 'spot');

    console.log(`✅ Resent invite code to ${user.email}`);
    return true;
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
    @Ctx() { req, prisma }: Context
  ): Promise<UserType[]> {
    await assertManagesSpot(req.user!, spotId, prisma);
    const profiles = await prisma.employeeProfile.findMany({
      where: { spotId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return profiles.map((p) => p.user) as UserType[];
  }

  /**
   * Admins (SpotAdminProfile) bound to a spot, with login status. A SPOT_ADMIN
   * of the spot can view them too (so the spot app can list co-admins).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => [StaffMember])
  async spotStaffAdmins(
    @Arg('spotId', () => ID) spotId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<StaffMember[]> {
    await assertManagesSpot(req.user!, spotId, prisma);
    const profiles = await prisma.spotAdminProfile.findMany({
      where: { spotId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return profiles.map((p) => ({
      id: p.user.id,
      email: p.user.email,
      name: p.user.name ?? undefined,
      role: 'SPOT_ADMIN',
      loginDisabled: p.user.loginDisabled,
      createdAt: p.user.createdAt,
    }));
  }

  /**
   * Create a staff member (SPOT_ADMIN or EMPLOYEE) for a spot, with an initial
   * password the admin hands over. Works for a spot's own admin (not just
   * global admins) — a spot can have multiple admins. Forced password change
   * on first login for employees.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => UserType)
  async createSpotStaff(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('email') email: string,
    @Arg('name') name: string,
    @Arg('password') password: string,
    @Arg('role') role: string,
    @Ctx() { req, prisma }: Context
  ): Promise<UserType> {
    const normalized = email.toLowerCase();
    const wantAdmin = role === 'SPOT_ADMIN';
    if (role !== 'SPOT_ADMIN' && role !== 'EMPLOYEE') {
      throw new Error('Role must be SPOT_ADMIN or EMPLOYEE');
    }

    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) throw new Error('Spot not found');

    await assertManagesSpot(req.user!, spotId, prisma);

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

    const created = await prisma.user.create({
      data: {
        email: normalized,
        name,
        accountType: 'ADMIN',
        password: hashed,
        roles: [wantAdmin ? Role.SPOT_ADMIN : Role.EMPLOYEE],
        registrationSource: 'ADMIN_WEB',
        emailVerified: true,
        ...(wantAdmin
          ? { spotAdminProfile: { create: { spotId } } }
          : { employeeProfile: { create: { spotId, isFirstLogin: true } } }),
      },
    });

    console.log(`✅ Spot staff created: ${normalized} (${role}) -> spot ${spotId}`);
    return created as UserType;
  }

  /**
   * Invite a staff member (SPOT_ADMIN or EMPLOYEE) to a spot by email instead of
   * handing over a temp password. Creates the account with a random unusable
   * password + a 24h set-password code, then emails a spot-branded invite (spot
   * logo + name/address/phone) so they can set their own password in the spot
   * app. Works for a spot's own admin (not just global admins).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => UserType)
  async inviteSpotStaff(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('email') email: string,
    @Arg('name') name: string,
    @Arg('role') role: string,
    @Ctx() { req, prisma }: Context
  ): Promise<UserType> {
    const normalized = email.toLowerCase();
    const wantAdmin = role === 'SPOT_ADMIN';
    if (role !== 'SPOT_ADMIN' && role !== 'EMPLOYEE') {
      throw new Error('Role must be SPOT_ADMIN or EMPLOYEE');
    }

    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) throw new Error('Spot not found');

    await assertManagesSpot(req.user!, spotId, prisma);

    const existing = await prisma.user.findUnique({
      where: { email_accountType: { email: normalized, accountType: 'ADMIN' } },
    });
    if (existing) throw new Error('An admin/employee with this email already exists');

    const inviteCode = CodeGenerator.generateOTP();
    const created = await prisma.user.create({
      data: {
        email: normalized,
        name,
        accountType: 'ADMIN',
        // Unusable random password until they set their own via the emailed code.
        password: await hashPassword(CodeGenerator.generateRandomString(32)),
        roles: [wantAdmin ? Role.SPOT_ADMIN : Role.EMPLOYEE],
        registrationSource: 'ADMIN_WEB',
        emailVerified: true,
        emailVerificationCode: inviteCode,
        emailVerificationExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
        ...(wantAdmin
          ? { spotAdminProfile: { create: { spotId } } }
          : // Invited employees set their own password via the emailed code, so
            // don't force another change on first login.
            { employeeProfile: { create: { spotId, isFirstLogin: false } } }),
      },
    });

    await sendSpotStaffInvite({
      email: normalized,
      code: inviteCode,
      roleLabel: wantAdmin ? 'Spot Admin' : 'Employee',
      spot: { name: spot.name, address: spot.address, phone: spot.phone, logoUrl: spot.logoUrl },
    });

    console.log(`✅ Spot staff invited: ${normalized} (${role}) -> spot ${spotId}`);
    return created as UserType;
  }

  /**
   * Admin-initiated password reset for a staff member of a spot the caller
   * manages. Instead of setting a password directly, this emails the staff
   * member a set-password code (branded for their spot) so THEY choose their
   * own password via the Gelato Spot app (same flow as the invite). Existing
   * sessions are invalidated immediately (tokenVersion bump) so the old
   * password can't be used while they set a new one.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => Boolean)
  async adminResetStaffPassword(
    @Arg('userId', () => ID) targetUserId: string,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { employeeProfile: true, spotAdminProfile: true },
    });
    if (!target || target.accountType !== 'ADMIN') {
      throw new Error('Staff member not found');
    }

    // The caller must manage a spot this staff member belongs to.
    const targetSpotIds = [
      ...target.employeeProfile.map((e) => e.spotId),
      ...(target.spotAdminProfile ? [target.spotAdminProfile.spotId] : []),
    ];
    if (targetSpotIds.length === 0) throw new Error('This user is not spot staff');
    const caller = req.user!;
    const isGlobalAdmin =
      caller.roles.includes(Role.SUPER_ADMIN) || caller.roles.includes(Role.SPOTS_ADMIN);
    if (!isGlobalAdmin) {
      const managed = await prisma.spotAdminProfile.findFirst({
        where: { userId: caller.id, spotId: { in: targetSpotIds } },
      });
      if (!managed) throw new Error('You can only reset passwords for your spot staff');
    }

    // Pick the spot to brand the email with (the managed one for a spot admin,
    // else the staff member's first spot).
    let brandSpotId = targetSpotIds[0];
    if (!isGlobalAdmin) {
      const managed = await prisma.spotAdminProfile.findFirst({
        where: { userId: caller.id, spotId: { in: targetSpotIds } },
      });
      if (managed) brandSpotId = managed.spotId;
    }
    const spot = await prisma.spot.findUnique({ where: { id: brandSpotId } });

    // Generate a set-password code (reuses the emailVerification* fields) and
    // invalidate current sessions so the old password stops working now.
    const code = CodeGenerator.generateOTP();
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        emailVerificationCode: code,
        emailVerificationExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
        tokenVersion: { increment: 1 },
      },
    });
    // Employees must set a fresh password (clear any forced-first-login state;
    // they'll set the password themselves via the code, no double prompt).
    if (target.employeeProfile.length) {
      await prisma.employeeProfile.updateMany({
        where: { userId: targetUserId },
        data: { isFirstLogin: false },
      });
    }

    const isAdminRole = target.roles.includes(Role.SPOT_ADMIN);
    await sendSpotStaffInvite({
      email: target.email,
      code,
      roleLabel: isAdminRole ? 'Spot Admin' : 'Employee',
      spot: spot
        ? { name: spot.name, address: spot.address, phone: spot.phone, logoUrl: spot.logoUrl }
        : { name: 'Gelato' },
      variant: 'reset',
    });

    console.log(`✅ Admin ${caller.id} emailed password-reset code to staff ${targetUserId}`);
    return true;
  }

  /**
   * Enable/disable a staff member's login, scoped to a spot the caller manages.
   * Disabling bumps tokenVersion to invalidate active sessions.
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Mutation(() => Boolean)
  async setStaffLoginDisabled(
    @Arg('userId', () => ID) targetUserId: string,
    @Arg('disabled') disabled: boolean,
    @Ctx() { req, prisma }: Context
  ): Promise<boolean> {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { employeeProfile: true, spotAdminProfile: true },
    });
    if (!target || target.accountType !== 'ADMIN') throw new Error('Staff member not found');

    const targetSpotIds = [
      ...target.employeeProfile.map((e) => e.spotId),
      ...(target.spotAdminProfile ? [target.spotAdminProfile.spotId] : []),
    ];
    if (targetSpotIds.length === 0) throw new Error('This user is not spot staff');

    const caller = req.user!;
    const isGlobalAdmin =
      caller.roles.includes(Role.SUPER_ADMIN) || caller.roles.includes(Role.SPOTS_ADMIN);
    if (!isGlobalAdmin) {
      if (caller.id === targetUserId) throw new Error('You cannot disable your own login');
      const managed = await prisma.spotAdminProfile.findFirst({
        where: { userId: caller.id, spotId: { in: targetSpotIds } },
      });
      if (!managed) throw new Error('You can only manage your own spot staff');
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        loginDisabled: disabled,
        ...(disabled ? { tokenVersion: { increment: 1 } } : {}),
      },
    });
    console.log(`✅ Staff ${targetUserId} login ${disabled ? 'disabled' : 'enabled'}`);
    return true;
  }

  /**
   * Recent login sessions for a spot's staff (for the session log + report).
   */
  @Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN, Role.SPOT_ADMIN])
  @Query(() => [StaffLoginSessionType])
  async spotStaffSessions(
    @Arg('spotId', () => ID) spotId: string,
    @Arg('limit', () => Int, { defaultValue: 100 }) limit: number = 100,
    @Ctx() { req, prisma }: Context
  ): Promise<StaffLoginSessionType[]> {
    await assertManagesSpot(req.user!, spotId, prisma);
    const sessions = await prisma.staffLoginSession.findMany({
      where: { spotId },
      include: { user: { select: { name: true, firstName: true, surname: true, email: true } } },
      orderBy: { loginAt: 'desc' },
      take: limit,
    });
    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      staffName:
        s.user.name ||
        [s.user.firstName, s.user.surname].filter(Boolean).join(' ') ||
        s.user.email,
      role: s.role,
      ipAddress: s.ipAddress ?? undefined,
      loginAt: s.loginAt,
    }));
  }
}

/**
 * Global admins pass; a SPOT_ADMIN must manage the given spot.
 */
async function assertManagesSpot(user: any, spotId: string, prisma: any): Promise<void> {
  if (user.roles.includes(Role.SUPER_ADMIN) || user.roles.includes(Role.SPOTS_ADMIN)) return;
  const manages = await prisma.spotAdminProfile.findFirst({
    where: { userId: user.id, spotId },
  });
  if (!manages) throw new Error('You can only manage your own spot');
}
