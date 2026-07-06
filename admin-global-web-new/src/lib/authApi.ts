import { API_ORIGIN } from './config';

export type AdminUser = {
  id: string;
  email: string;
  name?: string;
  roles: string[];
};

type LoginResult =
  | { ok: true; token: string; user: AdminUser }
  | { ok: false; error: string };

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// Admin login against the ADMIN account namespace.
export async function adminLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const { data } = await post('/authorization/login', {
    email,
    password,
    loginContext: 'ADMIN_WEB',
  });
  if (data?.error || !data?.token?.access_token) {
    return { ok: false, error: data?.error || 'Login failed' };
  }
  return { ok: true, token: data.token.access_token, user: data.user };
}

export async function adminForgotPassword(email: string) {
  const { data } = await post('/authorization/admin/forgot-password', { email });
  return data;
}

export async function adminResetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, status } = await post('/authorization/admin/reset-password', {
    email,
    code,
    newPassword,
  });
  if (status >= 400 || data?.error) {
    return { ok: false, error: data?.error || 'Reset failed' };
  }
  return { ok: true };
}
