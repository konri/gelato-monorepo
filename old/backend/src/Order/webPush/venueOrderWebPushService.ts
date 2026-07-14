import webpush from 'web-push'
import prisma from '../../shared/prisma'
import { ErrorWithStatus } from '../../shared/interface/ErrorWithStatus'

const LOG = process.env.LOG_VENUE_PUSH === '1'

let vapidConfigured = false

function ensureWebPushVapid(): boolean {
  if (vapidConfigured) return true
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.WEB_PUSH_SUBJECT?.trim() || 'https://app.easybons.com'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

type ParsedPushSubscription = {
  endpoint: string
  expirationTime: number | null
  keys: { p256dh: string; auth: string }
}

export function parsePushSubscriptionBody(raw: unknown): ParsedPushSubscription | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (typeof o.endpoint !== 'string' || !o.endpoint.trim()) return null
  const keys = o.keys
  if (!keys || typeof keys !== 'object' || Array.isArray(keys)) return null
  const k = keys as Record<string, unknown>
  if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string') return null
  const exp = o.expirationTime
  const expirationTime =
    typeof exp === 'number' && Number.isFinite(exp) ? Math.trunc(exp) : exp === null ? null : undefined
  return {
    endpoint: o.endpoint.trim(),
    expirationTime: expirationTime === undefined ? null : expirationTime,
    keys: { p256dh: k.p256dh, auth: k.auth },
  }
}

export async function upsertWebOrderSessionWebPushSubscription(
  sessionToken: string,
  body: ParsedPushSubscription
): Promise<void> {
  const session = await prisma.webOrderSession.findUnique({
    where: { sessionToken },
    select: { sessionToken: true, expiresAt: true },
  })
  if (!session || session.expiresAt < new Date()) {
    throw new ErrorWithStatus(404, 'Session not found or expired')
  }

  await prisma.webOrderSessionWebPushSubscription.upsert({
    where: { sessionToken },
    create: {
      sessionToken,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      expirationTime: body.expirationTime ?? null,
    },
    update: {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      expirationTime: body.expirationTime ?? null,
    },
  })

  if (LOG) {
    console.info('[venue web push] upserted subscription', {
      session: `${sessionToken.slice(0, 8)}…`,
      endpoint: body.endpoint.slice(0, 60),
    })
  }
}

export async function deleteWebOrderSessionWebPushSubscription(sessionToken: string): Promise<void> {
  await prisma.webOrderSessionWebPushSubscription.deleteMany({ where: { sessionToken } })
  if (LOG) {
    console.info('[venue web push] deleted subscription', { session: `${sessionToken.slice(0, 8)}…` })
  }
}

function orderTrackUrl(merchantStoreId: string): string {
  const origin = (process.env.WEB_ORDER_PUBLIC_ORIGIN ?? process.env.ORDER_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
  const lng = process.env.WEB_ORDER_DEFAULT_LNG?.trim() || 'pl'
  return `${origin}/${lng}/order/${encodeURIComponent(merchantStoreId)}`
}

function pushBodyForStatus(status: string, orderNumber: number): { title: string; body: string } {
  switch (status) {
    case 'PREPARING':
      return { title: 'bonAPKA', body: `Order #${orderNumber} is being prepared.` }
    case 'READY':
      return { title: 'bonAPKA', body: `Order #${orderNumber} is ready for pickup.` }
    case 'DELAYED':
      return { title: 'bonAPKA', body: `Order #${orderNumber} is delayed.` }
    case 'CANCELLED':
      return { title: 'bonAPKA', body: `Order #${orderNumber} was cancelled.` }
    case 'PICKED_UP':
      return { title: 'bonAPKA', body: `Order #${orderNumber} was picked up.` }
    default:
      return { title: 'bonAPKA', body: `Order #${orderNumber} — status updated.` }
  }
}

export async function dispatchVenueOrderWebPush(sessionToken: string, payload: Record<string, unknown>): Promise<void> {
  if (!ensureWebPushVapid()) return

  const session = await prisma.webOrderSession.findUnique({
    where: { sessionToken },
    select: { merchantStoreId: true },
  })
  if (!session) return

  const status = typeof payload.status === 'string' ? payload.status : ''
  const orderNumberRaw = payload.orderNumber
  const orderNumber = typeof orderNumberRaw === 'number' ? orderNumberRaw : Number(orderNumberRaw)
  if (!status || !Number.isFinite(orderNumber)) return

  const sub = await prisma.webOrderSessionWebPushSubscription.findUnique({
    where: { sessionToken },
    select: { endpoint: true, p256dh: true, auth: true },
  })
  if (!sub) return

  const { title, body } = pushBodyForStatus(status, orderNumber)
  const origin = (process.env.WEB_ORDER_PUBLIC_ORIGIN ?? process.env.ORDER_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  )

  const swPayload = JSON.stringify({
    title,
    body,
    url: orderTrackUrl(session.merchantStoreId),
    tag: `venue-order-status-${orderNumber}`,
    icon: `${origin}/logo.svg`,
  })

  if (LOG) {
    console.info('[venue web push] sending', {
      session: `${sessionToken.slice(0, 8)}…`,
      status,
      endpoint: sub.endpoint.slice(0, 60),
    })
  }

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      swPayload,
      { TTL: 86400 }
    )
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err ? (err as { statusCode: number }).statusCode : undefined
    if (statusCode === 410 || statusCode === 404) {
      await prisma.webOrderSessionWebPushSubscription.deleteMany({ where: { sessionToken } })
    }
    console.warn('Venue web push send failed:', err)
  }
}
