import { createPublishWorker } from './queue/publish-worker'
import { createGscSyncWorker } from './queue/gsc-sync-worker'
import { scheduleDailyGscSync } from './queue/gsc-scheduler'
import { createGa4SyncWorker } from './queue/ga4-sync-worker'
import { scheduleDailyGa4Sync } from './queue/ga4-scheduler'
import { createGbpSyncWorker } from './queue/gbp-sync-worker'
import { scheduleDailyGbpSync } from './queue/gbp-scheduler'
import { createSmsWorker } from './queue/sms-worker'
import { createVideoWorker } from './queue/video-worker'
import { createRemotionWorker } from './queue/remotion-worker'
import { createCompositeWorker } from './queue/composite-worker'
import { createPremiumWorker } from './queue/premium-worker'

const publishWorker = createPublishWorker()
const gscSyncWorker = createGscSyncWorker()
const ga4SyncWorker = createGa4SyncWorker()
const gbpSyncWorker = createGbpSyncWorker()
const smsWorker = createSmsWorker()
const videoWorker = createVideoWorker()
const remotionWorker = createRemotionWorker()
const compositeWorker = createCompositeWorker()
const premiumWorker = createPremiumWorker()

publishWorker.on('completed', (job) => {
  console.warn(`[worker] Publish job ${job.id} completed`)
})

publishWorker.on('failed', (job, error) => {
  console.error(`[worker] Publish job ${job?.id} failed:`, error.message)
})

gscSyncWorker.on('completed', (job) => {
  console.warn(`[worker] GSC sync job ${job.id} completed`)
})

gscSyncWorker.on('failed', (job, error) => {
  console.error(`[worker] GSC sync job ${job?.id} failed:`, error.message)
})

ga4SyncWorker.on('completed', (job) => {
  console.warn(`[worker] GA4 sync job ${job.id} completed`)
})

ga4SyncWorker.on('failed', (job, error) => {
  console.error(`[worker] GA4 sync job ${job?.id} failed:`, error.message)
})

gbpSyncWorker.on('completed', (job) => {
  console.warn(`[worker] GBP sync job ${job.id} completed`)
})

gbpSyncWorker.on('failed', (job, error) => {
  console.error(`[worker] GBP sync job ${job?.id} failed:`, error.message)
})

smsWorker.on('completed', (job) => {
  console.warn(`[worker] SMS job ${job.id} completed`)
})

smsWorker.on('failed', (job, error) => {
  console.error(`[worker] SMS job ${job?.id} failed:`, error.message)
})

console.warn('[worker] Content publish worker started')
console.warn('[worker] GSC sync worker started')
console.warn('[worker] GA4 sync worker started')
console.warn('[worker] GBP sync worker started')
console.warn('[worker] SMS send worker started')
console.warn('[worker] Video generation worker started')
console.warn('[worker] Remotion rendering worker started')
console.warn('[worker] Composite rendering worker started')
console.warn('[worker] Premium rendering worker started')

videoWorker.on('completed', (job) => {
  console.warn(`[worker] Video job ${job.id} completed`)
})

videoWorker.on('failed', (job, error) => {
  console.error(`[worker] Video job ${job?.id} failed:`, error.message)
})

remotionWorker.on('completed', (job) => {
  console.warn(`[worker] Remotion job ${job.id} completed`)
})

remotionWorker.on('failed', (job, error) => {
  console.error(`[worker] Remotion job ${job?.id} failed:`, error.message)
})

compositeWorker.on('completed', (job) => {
  console.warn(`[worker] Composite job ${job.id} completed`)
})

compositeWorker.on('failed', (job, error) => {
  console.error(`[worker] Composite job ${job?.id} failed:`, error.message)
})

premiumWorker.on('completed', (job) => {
  console.warn(`[worker] Premium job ${job.id} completed`)
})

premiumWorker.on('failed', (job, error) => {
  console.error(`[worker] Premium job ${job?.id} failed:`, error.message)
})

// Schedule daily syncs for all active connections
scheduleDailyGscSync()
  .then(() => console.warn('[worker] Daily GSC sync scheduled'))
  .catch((err) => console.error('[worker] Failed to schedule GSC sync:', err.message))

scheduleDailyGa4Sync()
  .then(() => console.warn('[worker] Daily GA4 sync scheduled'))
  .catch((err) => console.error('[worker] Failed to schedule GA4 sync:', err.message))

scheduleDailyGbpSync()
  .then(() => console.warn('[worker] Daily GBP sync scheduled'))
  .catch((err) => console.error('[worker] Failed to schedule GBP sync:', err.message))

function shutdown() {
  console.warn('[worker] Shutting down...')
  Promise.all([
    publishWorker.close(),
    gscSyncWorker.close(),
    ga4SyncWorker.close(),
    gbpSyncWorker.close(),
    smsWorker.close(),
    videoWorker.close(),
    remotionWorker.close(),
    compositeWorker.close(),
    premiumWorker.close(),
  ]).then(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
