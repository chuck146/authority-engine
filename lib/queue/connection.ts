import IORedis from 'ioredis'
import type { ConnectionOptions } from 'bullmq'

let connectionInstance: IORedis | null = null

export function getRedisConnection(): ConnectionOptions {
  if (!connectionInstance) {
    connectionInstance = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null, // Required by BullMQ
    })
  }
  // Cast needed: top-level ioredis vs BullMQ's bundled ioredis have incompatible types
  return connectionInstance as unknown as ConnectionOptions
}
