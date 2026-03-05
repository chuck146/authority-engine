import { createPublishWorker } from './queue/publish-worker'
import { createGscSyncWorker } from './queue/gsc-sync-worker'
import { scheduleDailyGscSync } from './queue/gsc-scheduler'
import { createGa4SyncWorker } from './queue/ga4-sync-worker'
import { scheduleDailyGa4Sync } from './queue/ga4-scheduler'

const publishWorker = createPublishWorker()
const gscSyncWorker = createGscSyncWorker()
const ga4SyncWorker = createGa4SyncWorker()

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

console.warn('[worker] Content publish worker started')
console.warn('[worker] GSC sync worker started')
console.warn('[worker] GA4 sync worker started')

// Schedule daily syncs for all active connections
scheduleDailyGscSync()
  .then(() => console.warn('[worker] Daily GSC sync scheduled'))
  .catch((err) => console.error('[worker] Failed to schedule GSC sync:', err.message))

scheduleDailyGa4Sync()
  .then(() => console.warn('[worker] Daily GA4 sync scheduled'))
  .catch((err) => console.error('[worker] Failed to schedule GA4 sync:', err.message))

function shutdown() {
  console.warn('[worker] Shutting down...')
  Promise.all([publishWorker.close(), gscSyncWorker.close(), ga4SyncWorker.close()]).then(() =>
    process.exit(0),
  )
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
