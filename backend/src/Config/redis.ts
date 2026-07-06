import IORedis from 'ioredis'

export const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'

// Only create Redis connection if enabled
export const redis = REDIS_ENABLED
  ? process.env.REDIS_SOCKET
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
  : null

if (REDIS_ENABLED && redis) {
  redis
    .connect()
    .then(() => {
      console.log('✅ Redis connected')
    })
    .catch((err) => {
      console.error('❌ Redis connection error:', err)
    })

  redis.on('error', (err) => {
    console.error('Redis error:', err)
  })
} else {
  console.log('⚠️  Redis disabled (REDIS_ENABLED=false)')
}
