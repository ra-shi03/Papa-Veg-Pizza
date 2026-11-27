import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  History as HistoryIcon,
  Info,
  ListChecks,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@food/api";

/** What each finding means and what the repair button does about it. */
const ISSUE_INFO = {
  captured_payment_on_cancelled_order: {
    title: "Paid order was cancelled but not refunded",
    help: "The customer paid online and the order was cancelled, but no refund was recorded. Repair refunds the amount to the customer's wallet.",
  },
  refund_stuck: {
    title: "Gateway refund stuck",
    help: "A Razorpay refund has been processing for a long time. Check it in the Razorpay dashboard; nothing to repair here.",
  },
  order_transaction_status_mismatch: {
    title: "Order and finance record disagree",
    help: "The order and its finance record show different payment states. Repair brings the finance record in line with the order.",
  },
  transaction_refunded_order_not: {
    title: "Finance record refunded but order still shows paid",
    help: "Needs a person: check Razorpay and the customer's wallet before changing the order.",
  },
  gateway_paid_database_pending: {
    title: "Razorpay says paid, we say unpaid",
    help: "Razorpay captured this payment but the order never recorded it. Repair records the payment, the same way a normal checkout does.",
  },
  gateway_check_failed: {
    title: "Could not ask Razorpay about this order",
    help: "The Razorpay lookup failed. Run the check again; nothing to repair.",
  },
  paid_order_without_transaction: {
    title: "Paid order has no finance record",
    help: "Needs a person: the order says paid but no finance record exists.",
  },
  transaction_without_order: {
    title: "Finance record points at a missing order",
    help: "Needs a person: the order was deleted but its finance record remains.",
  },
  wallet_ledger_mismatch: {
    title: "Wallet balance does not match its ledger",
    help: "Needs a person: money moved outside the ledger. Do not change balances by hand without finding the cause.",
  },
};

const REPAIR_LABEL = { capture: "payment recorded", refund_wallet: "refunded to wallet", resync: "finance record synced" };

const infoFor = (type) => ISSUE_INFO[type] || { title: type.replace(/_/g, " "), help: "" };

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "—");
const timeAgo = (value) => {
  if (!value) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
};
const fmtDuration = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms || 0} ms`);
const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SeverityBadge = ({ severity }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
    }`}
  >
    {severity === "critical" ? "Critical" : "Warning"}
  </span>
);

const StatCard = ({ label, value, sub, tone = "slate" }) => {
  const tones = {
    slate: "text-slate-900",
    red: "text-red-600",
    green: "text-emerald-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
};

export default function PaymentReconciliation() {
  const [tab, setTab] = useState("issues");
  const [loading, setLoading] = useState(true);
  const [latestFull, setLatestFull] = useState(null);
  const [latestManual, setLatestManual] = useState(null);
  const [history, setHistory] = useState([]);
  const [live, setLive] = useState(null);
  const [wallets, setWallets] = useState(null);
  const [includeGateway, setIncludeGateway] = useState(false);
  const [busy, setBusy] = useState({ run: false, check: false, wallets: false });
  const [repairing, setRepairing] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const [full, manual, list] = await Promise.all([
        adminAPI.getReconciliationLatest("full"),
        adminAPI.getReconciliationLatest("manual"),
        adminAPI.getReconciliationReports(25),
      ]);
      setLatestFull(full?.data?.data || null);
      setLatestManual(manual?.data?.data || null);
      setHistory(list?.data?.data || []);
      setForbidden(false);
    } catch (err) {
      if (err?.response?.status === 403) setForbidden(true);
      else toast.error(apiError(err, "Could not load reconciliation reports"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const runLiveCheck = useCallback(async () => {
    setBusy((b) => ({ ...b, check: true }));
    try {
      const res = await adminAPI.getOrderReconciliation(includeGateway ? { checkGateway: true } : {});
      setLive(res?.data?.data || null);
      toast.success("Check finished");
    } catch (err) {
      toast.error(apiError(err, "Check failed"));
    } finally {
      setBusy((b) => ({ ...b, check: false }));
    }
  }, [includeGateway]);

  const runFullNow = async () => {
    setBusy((b) => ({ ...b, run: true }));
    try {
      const res = await adminAPI.runReconciliationNow();
      const report = res?.data?.data;
      toast.success(
        report?.remainingCritical
          ? `Run finished: ${report.remainingCritical} critical issue(s) need attention`
          : "Run finished: all clear",
      );
      setLive(null);
      await loadReports();
    } catch (err) {
      toast.error(apiError(err, "Run failed"));
    } finally {
      setBusy((b) => ({ ...b, run: false }));
    }
  };

  const checkWallets = async () => {
    setBusy((b) => ({ ...b, wallets: true }));
    try {
      const res = await adminAPI.getWalletReconciliation();
      setWallets(res?.data?.data || null);
    } catch (err) {
      toast.error(apiError(err, "Wallet check failed"));
    } finally {
      setBusy((b) => ({ ...b, wallets: false }));
    }
  };

  const repair = async (issue) => {
    setRepairing(issue.orderId);
    try {
      const res = await adminAPI.repairOrderPayment(issue.orderId);
      const all = res?.data?.data?.actions || [];
      const applied = all.filter((a) => a.applied).map((a) => REPAIR_LABEL[a.action] || a.action);
      const problem = all.find((a) => !a.applied && a.detail);
      if (applied.length) toast.success(`Repaired: ${applied.join(", ")}`);
      else if (problem) toast.error(problem.detail);
      else toast.info("Checked: nothing needed fixing");
      if (live) await runLiveCheck();
      await loadReports();
    } catch (err) {
      toast.error(apiError(err, "Repair failed"));
    } finally {
      setRepairing("");
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  };

  // The issues shown: a live check if one was run, otherwise what the newest scheduled run left over
  const source = useMemo(() => {
    if (live) return { label: `Live check · ${fmtDate(live.checkedAt)}`, issues: live.issues || [] };
    const newest = [latestFull, latestManual].filter(Boolean).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];
    if (!newest) return { label: "No run yet: press “Check now”", issues: [] };
    return {
      label: `Found by the ${newest.kind === "full" ? "hourly" : "manual"} run · ${fmtDate(newest.startedAt)}`,
      issues: newest.remaining || [],
    };
  }, [live, latestFull, latestManual]);

  const issues = useMemo(
    () => [...source.issues].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1)),
    [source],
  );
  const criticalNow = issues.filter((i) => i.severity === "critical").length;
  const warningsNow = issues.length - criticalNow;
  const healthy = criticalNow === 0;
  const lastRun = [latestFull, latestManual].filter(Boolean).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen p-4 lg:p-6">
        <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-amber-600" />
          <h1 className="mt-3 text-lg font-semibold text-slate-900">Super admin only</h1>
          <p className="mt-1 text-sm text-slate-600">Payment reconciliation can only be opened by a super admin account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Payment Reconciliation</h1>
            <p className="mt-0.5 text-xs text-slate-500 lg:text-sm">
              Checks that orders, finance records, customer wallets and Razorpay all agree. Repairs are made one order at a time.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadReports}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={runFullNow}
            disabled={busy.run}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy.run ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {busy.run ? "Running…" : "Run full check now"}
          </button>
        </div>
      </div>

      {/* Health banner */}
      <div
        className={`mb-4 flex items-start gap-3 rounded-xl border p-4 ${
          healthy ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
        }`}
      >
        {healthy ? (
          <ShieldCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
        ) : (
          <ShieldAlert className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
        )}
        <div>
          <p className={`text-sm font-semibold ${healthy ? "text-emerald-800" : "text-red-800"}`}>
            {healthy
              ? warningsNow
                ? `No critical issues · ${warningsNow} warning${warningsNow > 1 ? "s" : ""} to look at`
                : "All clear: payments and records agree"
              : `${criticalNow} critical issue${criticalNow > 1 ? "s" : ""} need attention`}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">{source.label}</p>
        </div>
      </div>

      {/* Numbers */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Critical issues"
          value={criticalNow}
          tone={criticalNow ? "red" : "green"}
          sub={warningsNow ? `${warningsNow} warning${warningsNow > 1 ? "s" : ""}` : "no warnings"}
        />
        <StatCard
          label="Last hourly check"
          value={timeAgo(latestFull?.startedAt)}
          sub={latestFull ? `took ${fmtDuration(latestFull.durationMs)} · found ${latestFull.issueTotal}` : "runs every hour"}
        />
        <StatCard
          label="Last manual run"
          value={timeAgo(latestManual?.startedAt)}
          sub={latestManual ? `took ${fmtDuration(latestManual.durationMs)} · found ${latestManual.issueTotal}` : "press “Run full check now”"}
        />
        <StatCard
          label="Wallet mismatches (last run)"
          value={lastRun?.walletMismatches || 0}
          tone={lastRun?.walletMismatches ? "red" : "slate"}
          sub="see the Wallets tab"
        />
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-1 border-b border-slate-200">
        {[
          ["issues", "Issues", ListChecks],
          ["wallets", "Wallets", Wallet],
          ["history", "Run history", HistoryIcon],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              tab === key ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
            {key === "issues" && issues.length > 0 && (
              <span className="rounded-full bg-slate-200 px-1.5 text-[11px] text-slate-700">{issues.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ISSUES */}
      {tab === "issues" && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeGateway}
                onChange={(e) => setIncludeGateway(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Also ask Razorpay if any “unpaid” online order was actually paid
            </label>
            <button
              type="button"
              onClick={runLiveCheck}
              disabled={busy.check}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy.check ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {busy.check ? "Checking…" : "Check now"}
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm font-medium text-slate-700">Nothing to fix</p>
              <p className="text-xs text-slate-500">{source.label}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {issues.map((issue, idx) => {
                const info = infoFor(issue.type);
                return (
                  <li key={`${issue.type}-${issue.orderId}-${idx}`} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={issue.severity} />
                        <p className="text-sm font-semibold text-slate-900">{info.title}</p>
                      </div>
                      <p className="mt-1 break-words text-xs text-slate-600">{issue.detail}</p>
                      {info.help && <p className="mt-1 text-xs text-slate-400">{info.help}</p>}
                      {issue.orderId && (
                        <button
                          type="button"
                          onClick={() => copy(issue.orderRef || issue.orderId)}
                          className="mt-2 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-slate-200"
                          title="Copy order id"
                        >
                          {issue.orderRef ? `#${issue.orderRef}` : issue.orderId.slice(-8).toUpperCase()} <Copy className="h-3 w-3" />
                        </button>
                      )}
                      {issue.type === "wallet_ledger_mismatch" && (
                        <p className="mt-2 text-xs text-slate-500">
                          {issue.entityType} {issue.entityId} · wallet {rupees(issue.walletBalance)} vs ledger {rupees(issue.ledgerBalance)} (difference {rupees(issue.delta)})
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {issue.repairable ? (
                        <button
                          type="button"
                          onClick={() => repair(issue)}
                          disabled={repairing === issue.orderId}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {repairing === issue.orderId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
                          Repair
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
                          <Info className="h-3.5 w-3.5" /> Needs a person
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* WALLETS */}
      {tab === "wallets" && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Each customer wallet balance must equal the sum of its ledger entries. A difference means money moved outside the ledger.
            </p>
            <button
              type="button"
              onClick={checkWallets}
              disabled={busy.wallets}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy.wallets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {busy.wallets ? "Checking…" : "Check wallets"}
            </button>
          </div>

          {!wallets ? (
            <div className="p-10 text-center text-sm text-slate-500">Press “Check wallets” to compare every wallet with its ledger.</div>
          ) : (
            <div className="p-4">
              <div className="mb-3 grid grid-cols-2 gap-3">
                <StatCard label="Wallets checked" value={wallets.checked} sub={fmtDate(wallets.checkedAt)} />
                <StatCard label="Mismatches" value={wallets.mismatched} tone={wallets.mismatched ? "red" : "green"} />
              </div>
              {wallets.mismatches?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">User</th>
                        <th className="px-3 py-2 text-right font-medium">Wallet balance</th>
                        <th className="px-3 py-2 text-right font-medium">Ledger total</th>
                        <th className="px-3 py-2 text-right font-medium">Difference</th>
                        <th className="px-3 py-2 text-right font-medium">Ledger entries</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {wallets.mismatches.map((m) => (
                        <tr key={`${m.entityType}-${m.entityId}`}>
                          <td className="px-3 py-2 font-mono text-slate-600">{m.entityId}</td>
                          <td className="px-3 py-2 text-right">{rupees(m.walletBalance)}</td>
                          <td className="px-3 py-2 text-right">{rupees(m.ledgerBalance)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-red-600">{rupees(m.delta)}</td>
                          <td className="px-3 py-2 text-right">{m.ledgerTransactionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" /> Every wallet matches its ledger.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="rounded-xl border border-slate-200 bg-white">
          {history.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No runs recorded yet. A full check runs every hour; you can also press “Run full check now”.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((r) => {
                const open = expanded === r._id;
                return (
                  <li key={r._id}>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : r._id)}
                      className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
                    >
                      {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          r.kind === "full" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {r.kind === "full" ? "hourly" : "manual"}
                      </span>
                      <span className="flex-1 text-sm text-slate-700">{fmtDate(r.startedAt)}</span>
                      <span className="hidden text-xs text-slate-400 sm:inline">{fmtDuration(r.durationMs)}</span>
                      {!r.ok ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">failed</span>
                      ) : r.remainingCritical > 0 ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">{r.remainingCritical} critical left</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">clean</span>
                      )}
                    </button>
                    {open && (
                      <div className="bg-slate-50 px-4 pb-4 pl-11 text-xs text-slate-600">
                        {r.error && <p className="mb-2 text-red-600">Error: {r.error}</p>}
                        <p>
                          Found {r.issueTotal} issue(s), {r.criticalTotal} critical
                          {r.walletMismatches ? ` · ${r.walletMismatches} wallet mismatch(es)` : ""}
                        </p>
                        {r.counts && Object.keys(r.counts).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(r.counts).map(([type, n]) => (
                              <span key={type} className="rounded bg-white px-2 py-0.5 ring-1 ring-slate-200">
                                {infoFor(type).title} × {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-slate-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <p>
          The hourly check only reports; it never changes anything. “Repair” only does safe, repeatable things: recording a payment Razorpay already captured,
          refunding a cancelled paid order to the customer's wallet, and bringing a finance record in line with its order. It never edits balances by hand. Anything marked “Needs a person” must be looked at before changing anything.
        </p>
      </div>
    </div>
  );
}
