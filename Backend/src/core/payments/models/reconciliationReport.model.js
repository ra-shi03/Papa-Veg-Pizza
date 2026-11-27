import mongoose from 'mongoose';

/** One row per reconciliation run (hourly or "Run now"): what was found. Repairs are separate, per order, by an admin. */
const reconciliationReportSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['full', 'manual'], required: true, index: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
    ok: { type: Boolean, default: true },
    error: { type: String, default: '' },
    issueTotal: { type: Number, default: 0 },
    criticalTotal: { type: Number, default: 0 },
    counts: { type: mongoose.Schema.Types.Mixed, default: {} },
    walletMismatches: { type: Number, default: 0 },
    /** Issues found (capped sample) */
    remaining: { type: [mongoose.Schema.Types.Mixed], default: [] },
    remainingCritical: { type: Number, default: 0 },
  },
  { collection: 'payment_reconciliation_reports', timestamps: true }
);
reconciliationReportSchema.index({ kind: 1, createdAt: -1 });

export const PaymentReconciliationReport =
  mongoose.models.PaymentReconciliationReport || mongoose.model('PaymentReconciliationReport', reconciliationReportSchema);
