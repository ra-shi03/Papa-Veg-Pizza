// Runs the API as several processes on one machine, so every CPU core serves requests.  Start it with: npm run start:cluster
//
//   WEB_CONCURRENCY   number of server processes (default: one per CPU core, at most 8). 1 = a single plain server.
//   Needs REDIS_ENABLED=true: sockets (live order tracking) and the rate limits are shared between processes through Redis.
//                     Without Redis this launcher runs ONE process and says so, because several processes would each count
//                     their own rate limits and miss each other's socket events.
//   One worker (PVP_JOB_WORKER=1) also runs the once-only background work (order event stream, scheduled dispatch, start-up
//   recovery). If that worker dies, the replacement takes the role.
//   Crashed workers are restarted (with a growing pause if one keeps crashing); SIGTERM / SIGINT stop everything cleanly.
//
// For several MACHINES instead, run `npm start` on each (set PVP_JOB_WORKER=1 on one, 0 on the others) behind a load balancer:
// see deploy/nginx.conf.example.
import 'dotenv/config';
import cluster from 'node:cluster';
import os from 'node:os';

const MAX_WORKERS = 8;
const SHUTDOWN_MS = 20_000;

const wanted = () => {
    const n = Number(process.env.WEB_CONCURRENCY);
    return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), MAX_WORKERS) : Math.min(os.availableParallelism(), MAX_WORKERS);
};

if (cluster.isPrimary) {
    let count = wanted();
    if (count > 1 && process.env.REDIS_ENABLED !== 'true') {
        console.warn(`[cluster] REDIS_ENABLED is not true: running 1 process instead of ${count}. Sockets and rate limits need Redis to be shared between processes.`);
        count = 1;
    }
    console.log(`[cluster] starting ${count} server process${count === 1 ? '' : 'es'}`);

    let stopping = false;
    let jobWorkerId = null;
    const crashes = new Map();   // slot -> recent crash count

    const start = (slot) => {
        const needsJobRole = jobWorkerId === null;
        const worker = cluster.fork({ PVP_JOB_WORKER: needsJobRole ? '1' : '0', PVP_WORKER_SLOT: String(slot) });
        worker.slot = slot;
        worker.startedAt = Date.now();
        if (needsJobRole) jobWorkerId = worker.id;
    };

    cluster.on('exit', (worker, code, signal) => {
        if (worker.id === jobWorkerId) jobWorkerId = null;
        if (stopping) return;
        const lived = Date.now() - worker.startedAt;
        const n = lived < 10_000 ? (crashes.get(worker.slot) || 0) + 1 : 0;
        crashes.set(worker.slot, n);
        const pause = Math.min(30_000, 500 * 2 ** Math.min(n, 6));
        console.error(`[cluster] worker ${worker.process.pid} stopped (${signal || `code ${code}`}) after ${Math.round(lived / 1000)}s; restarting in ${pause} ms`);
        setTimeout(() => !stopping && start(worker.slot), pause);
    });

    const stop = (signal) => {
        if (stopping) return;
        stopping = true;
        console.log(`[cluster] ${signal}: stopping workers`);
        for (const w of Object.values(cluster.workers)) w?.process.kill('SIGTERM');
        const timer = setInterval(() => {
            if (Object.keys(cluster.workers).length === 0) { clearInterval(timer); process.exit(0); }
        }, 200);
        setTimeout(() => process.exit(1), SHUTDOWN_MS).unref();
    };
    process.on('SIGTERM', () => stop('SIGTERM'));
    process.on('SIGINT', () => stop('SIGINT'));

    for (let slot = 0; slot < count; slot++) start(slot);
} else {
    await import('./server.js');
}
