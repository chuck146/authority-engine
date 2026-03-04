import { createPublishWorker } from './queue/publish-worker'
import { createGscSyncWorker } from './queue/gsc-sync-worker'
import { scheduleDailyGscSync } from './queue/gsc-scheduler'

const publishWorker = createPublishWorker()
const gscSyncWorker = createGscSyncWorker()

publishWorker.on('completed', (job) => {
  console.log(`[worker] Publish job ${job.id} completed`)
})

publishWorker.on('failed', (job, error) => {
  console.error(`[worker] Publish job ${job?.id} failed:`, error.message)
})

gscSyncWorker.on('completed', (job) => {
  console.log(`[worker] GSC sync job ${job.id} completed`)
})

gscSyncWorker.on('failed', (job, error) => {
  console.error(`[worker] GSC sync job ${job?.id} failed:`, error.message)
})

console.log('[worker] Content publish worker started')
console.log('[worker] GSC sync worker started')

// Schedule daily GSC sync for all active connections
scheduleDailyGscSync()
  .then(() => console.log('[worker] Daily GSC sync scheduled'))
  .catch((err) => console.error('[worker] Failed to schedule GSC sync:', err.message))

function shutdown() {
  console.log('[worker] Shutting down...')
  Promise.all([publishWorker.close(), gscSyncWorker.close()]).then(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
