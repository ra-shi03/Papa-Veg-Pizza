/**
 * Which process runs the singleton background work.
 *
 * Several server processes can run side by side (cluster.js, or several machines behind a load balancer). Anything that must
 * run once for the whole system, not once per process, runs only where isJobWorker() is true: the order event stream (it
 * announces each order change to the panels through the Redis socket adapter), the scheduled-order dispatch that runs every
 * minute, and the start-up recovery of stuck orders. cluster.js gives PVP_JOB_WORKER=1 to exactly one worker; on a
 * separate machine, set PVP_JOB_WORKER=1 on one machine and 0 on the others. A single plain process is always the job worker.
 */
export const isJobWorker = () => process.env.PVP_JOB_WORKER === undefined || process.env.PVP_JOB_WORKER === '1';
