import { reconcileOrders, reconcileWallets } from './reconciliation.service.js';
import { PaymentReconciliationReport } from './models/reconciliationReport.model.js';
import { logger } from '../../utils/logger.js';

// Payment reconciliation runs: hourly on the job worker (server.js) and on "Run now". A run only CHECKS and records a
// report; nothing is repaired automatically (an admin repairs orders one at a time from the page).

let running = false;

/** Runs every check (including the Razorpay lookup) and saves the report. Null when a run is already in progress. */
export async function runFullReconciliation(kind = 'full') {
  if (running) return null;
  running = true;
  const startedAt = new Date();
  const report = { kind, startedAt };
  try {
    // minAgeMinutes: skip payments still in flight
    const [orders, wallets] = await Promise.all([
      reconcileOrders({ limit: 2000, checkGateway: true, minAgeMinutes: 5 }),
      reconcileWallets({}),
    ]);
    const critical = orders.issues.filter((i) => i.severity === 'critical');
    Object.assign(report, {
      ok: true,
      issueTotal: orders.total,
      criticalTotal: critical.length,
      counts: orders.counts,
      walletMismatches: wallets.mismatched,
      remaining: orders.issues.slice(0, 200),
      remainingCritical: critical.length,
    });
    if (critical.length || wallets.mismatched) {
      logger.warn(`Payment reconciliation: ${critical.length} critical issue(s), ${wallets.mismatched} wallet mismatch(es)`);
    }
  } catch (err) {
    Object.assign(report, { ok: false, error: err.message });
    logger.error(`Payment reconciliation failed: ${err.message}`);
  } finally {
    running = false;
  }
  report.finishedAt = new Date();
  report.durationMs = report.finishedAt - startedAt;
  return (await PaymentReconciliationReport.create(report)).toObject();
}

export const getLatestReport = (kind) =>
  PaymentReconciliationReport.findOne(kind ? { kind } : {}).sort({ createdAt: -1 }).lean();

export const getReportHistory = (limit = 20) =>
  PaymentReconciliationReport.find({})
    .select('-remaining')
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 20, 1), 100))
    .lean();
