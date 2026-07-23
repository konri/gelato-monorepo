import { authGql } from "./api";
import { setTokens, clearTokens, getAccessToken } from "./auth-storage";
import type {
  AuthResponse,
  User,
  PointBalance,
  PointTransaction,
  ReferralCode,
  ReferralStats,
  Prize,
  UserPrize,
  MyOrder,
  Complaint,
} from "./types";

const USER_FIELDS = `
  id
  email
  phone
  name
  firstName
  surname
  loyaltyCode
  birthDate
  birthdayCompleted
  profilePicture
  language
  roles
  preferredCityId
  preferredCity { id name nameLocal }
  emailVerified
  phoneVerified
  locationPermission
  notificationPermission
`;

/* --------------------------------- Auth --------------------------------- */

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await authGql<{ login: AuthResponse }>(
    `mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        accessToken
        refreshToken
        user { ${USER_FIELDS} }
      }
    }`,
    { email, password },
  );
  setTokens(data.login.accessToken, data.login.refreshToken);
  return data.login;
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}): Promise<AuthResponse> {
  const data = await authGql<{ register: AuthResponse }>(
    `mutation Register($email: String!, $password: String!, $name: String, $phone: String) {
      register(email: $email, password: $password, name: $name, phone: $phone) {
        accessToken
        refreshToken
        user { ${USER_FIELDS} }
      }
    }`,
    input,
  );
  setTokens(data.register.accessToken, data.register.refreshToken);
  return data.register;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const data = await authGql<{ loginWithGoogle: AuthResponse }>(
    `mutation LoginWithGoogle($idToken: String!) {
      loginWithGoogle(idToken: $idToken) {
        accessToken
        refreshToken
        user { ${USER_FIELDS} }
      }
    }`,
    { idToken },
  );
  setTokens(data.loginWithGoogle.accessToken, data.loginWithGoogle.refreshToken);
  return data.loginWithGoogle;
}

export async function sendOTP(phone: string, language = "pl"): Promise<boolean> {
  const data = await authGql<{ sendOTP: boolean }>(
    `mutation SendOTP($phone: String!, $language: String) {
      sendOTP(phone: $phone, language: $language)
    }`,
    { phone, language },
  );
  return data.sendOTP;
}

export async function verifyOTP(phone: string, code: string): Promise<AuthResponse> {
  const data = await authGql<{ verifyOTP: AuthResponse }>(
    `mutation VerifyOTP($phone: String!, $code: String!) {
      verifyOTP(phone: $phone, code: $code) {
        accessToken
        refreshToken
        user { ${USER_FIELDS} }
      }
    }`,
    { phone, code },
  );
  setTokens(data.verifyOTP.accessToken, data.verifyOTP.refreshToken);
  return data.verifyOTP;
}

export async function fetchMe(): Promise<User> {
  const data = await authGql<{ me: User }>(`query Me { me { ${USER_FIELDS} } }`);
  return data.me;
}

export async function logout(): Promise<void> {
  try {
    if (getAccessToken()) {
      await authGql<{ logout: boolean }>(`mutation Logout { logout }`);
    }
  } catch {
    // Best-effort; clear local tokens regardless.
  } finally {
    clearTokens();
  }
}

/* -------------------------------- Profile -------------------------------- */

export async function updateProfile(data: Record<string, unknown>): Promise<User> {
  const res = await authGql<{ updateProfile: User }>(
    `mutation UpdateProfile($data: UserChangeInput!) {
      updateProfile(data: $data) { ${USER_FIELDS} }
    }`,
    { data },
  );
  return res.updateProfile;
}

/* --------------------------------- Points --------------------------------- */

export async function fetchPointBalance(): Promise<PointBalance | null> {
  const data = await authGql<{ myPointBalance: PointBalance | null }>(
    `query MyPointBalance {
      myPointBalance { totalPoints availablePoints lockedPoints }
    }`,
  );
  return data.myPointBalance;
}

export async function fetchPointTransactions(limit = 50): Promise<PointTransaction[]> {
  const data = await authGql<{ myPointTransactions: PointTransaction[] }>(
    `query MyPointTransactions($limit: Int) {
      myPointTransactions(limit: $limit) {
        id type amount balanceBefore balanceAfter description referenceId referenceType createdAt
      }
    }`,
    { limit },
  );
  return data.myPointTransactions;
}

/* -------------------------------- Referral -------------------------------- */

export async function fetchReferralCode(): Promise<ReferralCode> {
  const data = await authGql<{ myReferralCode: ReferralCode }>(
    `query MyReferralCode { myReferralCode { id code createdAt } }`,
  );
  return data.myReferralCode;
}

export async function fetchReferralStats(): Promise<ReferralStats> {
  const data = await authGql<{ myReferralStats: ReferralStats }>(
    `query MyReferralStats {
      myReferralStats { totalReferrals completedReferrals pendingReferrals totalPointsEarned }
    }`,
  );
  return data.myReferralStats;
}

export async function applyReferralCode(code: string): Promise<boolean> {
  const data = await authGql<{ applyReferralCode: boolean }>(
    `mutation ApplyReferralCode($code: String!) { applyReferralCode(code: $code) }`,
    { code },
  );
  return data.applyReferralCode;
}

/* --------------------------------- Prizes --------------------------------- */

const PRIZE_FIELDS = `
  id title titleLocal description descriptionLocal imageUrl pointsCost quantity claimed isActive
`;

export async function fetchPrizes(): Promise<Prize[]> {
  const data = await authGql<{ prizes: Prize[] }>(
    `query Prizes { prizes { ${PRIZE_FIELDS} } }`,
  );
  return data.prizes;
}

export async function fetchPrize(id: string): Promise<Prize | null> {
  const data = await authGql<{ prize: Prize | null }>(
    `query Prize($id: ID!) { prize(id: $id) { ${PRIZE_FIELDS} } }`,
    { id },
  );
  return data.prize;
}

export async function fetchMyPrizes(): Promise<UserPrize[]> {
  const data = await authGql<{ myPrizes: UserPrize[] }>(
    `query MyPrizes {
      myPrizes(includeRedeemed: true) {
        id qrCode isRedeemed redeemedAt claimedAt validUntil
        prize { id title titleLocal imageUrl pointsCost }
      }
    }`,
  );
  return data.myPrizes;
}

export async function redeemPrize(prizeId: string): Promise<UserPrize> {
  const data = await authGql<{ redeemPrize: UserPrize }>(
    `mutation RedeemPrize($prizeId: ID!) {
      redeemPrize(prizeId: $prizeId) {
        id qrCode isRedeemed claimedAt validUntil
        prize { id title titleLocal imageUrl pointsCost }
      }
    }`,
    { prizeId },
  );
  return data.redeemPrize;
}

/* --------------------------- Orders & complaints --------------------------- */

export async function fetchMyOrders(): Promise<MyOrder[]> {
  const data = await authGql<{ myOrders: MyOrder[] }>(
    `query MyOrders {
      myOrders {
        id orderNumber status total createdAt deliveryAddress
        spot { id name }
      }
    }`,
  );
  return data.myOrders;
}

export async function createComplaint(
  orderId: string,
  subject: string,
  message: string,
): Promise<Complaint> {
  const data = await authGql<{ createComplaint: Complaint }>(
    `mutation CreateComplaint($orderId: ID!, $subject: String!, $message: String!) {
      createComplaint(orderId: $orderId, subject: $subject, message: $message) {
        id orderId subject message status createdAt
      }
    }`,
    { orderId, subject, message },
  );
  return data.createComplaint;
}
