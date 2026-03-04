import { createPublishWorker } from './queue/publish-worker'

const worker = createPublishWorker()

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed`)
})

worker.on('failed', (job, error) => {
  console.error(`[worker] Job ${job?.id} failed:`, error.message)
})

console.log('[worker] Content publish worker started')

function shutdown() {
  console.log('[worker] Shutting down...')
  worker.close().then(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
