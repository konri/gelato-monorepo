import IORedis from 'ioredis'
import { SseRegistry } from './SseRegistry'
import { REDIS_ENABLED } from '../../Config/redis'
import { dispatchVenueOrderWebPush } from '../webPush/venueOrderWebPushService'

function createRedisConnection(): IORedis {
  return process.env.REDIS_SOCKET
    ? new IORedis({
        path: process.env.REDIS_SOCKET,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      })
    : new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      })
}

const redisPublisher = REDIS_ENABLED ? createRedisConnection() : null
const redisSubscriber = REDIS_ENABLED ? createRedisConnection() : null

if (REDIS_ENABLED && redisPublisher && redisSubscriber) {
  redisPublisher.connect().catch((err) => console.error('SSE publisher Redis error:', err))
  redisSubscriber
    .connect()
    .then(() => {
      redisSubscriber.psubscribe('order:session:*', 'order:queue:*', 'order:user:*', (err) => {
        if (err) console.error('SSE subscriber psubscribe error:', err)
        else console.log('✅ SSE Redis subscriber ready')
      })
    })
    .catch((err) => console.error('SSE subscriber Redis error:', err))

  redisSubscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
    if (channel.startsWith('order:session:')) {
      const sessionToken = channel.replace('order:session:', '')
      SseRegistry.broadcastToSession(sessionToken, message)
    } else if (channel.startsWith('order:queue:')) {
      const storeId = channel.replace('order:queue:', '')
      SseRegistry.broadcastToQueue(storeId, message)
    } else if (channel.startsWith('order:user:')) {
      const userId = channel.replace('order:user:', '')
      SseRegistry.broadcastToUser(userId, message)
    }
  })
}

function sessionChannel(token: string): string {
  return `order:session:${token}`
}

function queueChannel(storeId: string): string {
  return `order:queue:${storeId}`
}

function userChannel(userId: string): string {
  return `order:user:${userId}`
}

export async function publishSessionEvent(sessionToken: string, payload: object): Promise<void> {
  const body = JSON.stringify(payload)
  if (process.env.LOG_VENUE_PUSH === '1') {
    console.info('[venue sse] publishSessionEvent', {
      session: `${sessionToken.slice(0, 8)}…(len=${sessionToken.length})`,
      payload,
    })
  }
  if (redisPublisher) {
    await redisPublisher.publish(sessionChannel(sessionToken), body)
  } else {
    SseRegistry.broadcastToSession(sessionToken, body)
  }
  const record = payload as Record<string, unknown>
  void dispatchVenueOrderWebPush(sessionToken, record).catch((err) => {
    console.warn('Venue order web push dispatch error:', err)
  })
}

export async function publishQueueEvent(storeId: string, payload: object): Promise<void> {
  const body = JSON.stringify(payload)
  console.log(`📡 [SSE] Publishing queue event for store ${storeId}:`, body)
  if (redisPublisher) {
    await redisPublisher.publish(queueChannel(storeId), body)
    console.log(`📡 [SSE] Published via Redis to ${queueChannel(storeId)}`)
    return
  }
  console.log(
    `📡 [SSE] Broadcasting directly (no Redis) to ${SseRegistry.getQueueConnectionCount(storeId)} connections`
  )
  SseRegistry.broadcastToQueue(storeId, body)
}

export async function publishUserEvent(userId: string, payload: object): Promise<void> {
  const body = JSON.stringify(payload)
  if (redisPublisher) {
    await redisPublisher.publish(userChannel(userId), body)
    return
  }
  SseRegistry.broadcastToUser(userId, body)
}
