import {
  notifyOwnersSafely,
  storeManagerUserIds,
  franchiseAdminUserIds,
  superAdminUserIds,
} from '../../../../core/notifications/firebase.service.js';
import { createInboxNotifications } from '../../../../core/notifications/notification.service.js';
import { logger } from '../../../../utils/logger.js';

// Who hears about each step of a payout. Never throws: a failed notice must not undo a payment.
//   requested -> whoever pays it (store managers / franchise admins / super admins)
//   paid, rejected, reversed, confirmed -> whoever receives it (rider: push + in-app notice)
//   disputed ("not received") -> whoever decides it (franchise admins for rider / staff payouts, else super admins) and the payer

const LINKS = {
  rider: '/food/delivery/pocket/payout',
  staff: '/store-operations/my-salary',
  store: '/store-operations/payouts',
  franchise: '/franchise-admin/payouts',
  platform: '/food/superadmin/payouts',
};
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const KIND_TEXT = { rider_withdrawal: 'withdrawal', staff_salary: 'salary', store_payout: 'payout', franchise_payout: 'payout' };

const users = (ids, ownerType) => ids.map((id) => ({ ownerType, ownerId: id }));

async function payerTargets(p) {
  if (p.payerType === 'store') return { targets: users(await storeManagerUserIds(String(p.storeId)), 'STORE_MANAGER'), link: LINKS.store };
  if (p.payerType === 'franchise') return { targets: users(await franchiseAdminUserIds(String(p.franchiseId)), 'FRANCHISE_ADMIN'), link: LINKS.franchise };
  return { targets: users(await superAdminUserIds(), 'SUPER_ADMIN'), link: LINKS.platform };
}

async function payeeTargets(p) {
  if (p.payeeType === 'rider') return { targets: [{ ownerType: 'DELIVERY_PARTNER', ownerId: String(p.payeeId) }], link: LINKS.rider, rider: true };
  if (p.payeeType === 'staff') return { targets: p.staffUserId ? [{ ownerType: 'KITCHEN_STAFF', ownerId: String(p.staffUserId) }] : [], link: LINKS.staff };
  if (p.payeeType === 'store') return { targets: users(await storeManagerUserIds(String(p.payeeId)), 'STORE_MANAGER'), link: LINKS.store };
  return { targets: users(await franchiseAdminUserIds(String(p.payeeId)), 'FRANCHISE_ADMIN'), link: LINKS.franchise };
}

async function resolverTargets(p) {
  if (p.kind === 'rider_withdrawal' || p.kind === 'staff_salary') {
    return { targets: users(await franchiseAdminUserIds(String(p.franchiseId)), 'FRANCHISE_ADMIN'), link: LINKS.franchise };
  }
  return { targets: users(await superAdminUserIds(), 'SUPER_ADMIN'), link: LINKS.platform };
}

function message(p, event) {
  const what = KIND_TEXT[p.kind] || 'payout';
  const forWhom = p.payeeName ? ` from ${p.payeeName}` : '';
  const month = p.period ? ` for ${p.period}` : '';
  switch (event) {
    case 'requested': return { title: `New ${what} request${forWhom}`, body: `${rupees(p.amount)}${month} is waiting for payment.` };
    case 'paid': return { title: `Your ${what} of ${rupees(p.amount)} is paid`, body: `${p.payment?.method === 'cash' ? 'Receipt' : 'Reference'}: ${p.payment?.reference || ''}${month}. Not received? Report it within 7 days.` };
    case 'rejected': return { title: `Your ${what} request was rejected`, body: `${rupees(p.amount)}${month}: ${p.rejection?.reason || ''}` };
    case 'disputed': return { title: `"Not received" reported${forWhom}`, body: `${rupees(p.amount)}${month} (ref ${p.payment?.reference || '-'}): ${p.dispute?.note || ''}` };
    case 'reversed': return { title: `Your ${what} of ${rupees(p.amount)} was marked not paid`, body: `It is back in your balance. ${p.dispute?.resolution || ''}` };
    case 'confirmed': return { title: `Your "not received" report was checked`, body: `The payment of ${rupees(p.amount)} was confirmed. ${p.dispute?.resolution || ''}` };
    default: return { title: 'Payout update', body: rupees(p.amount) };
  }
}

export async function notifyPayout(payout, event) {
  try {
    const p = typeof payout?.toObject === 'function' ? payout.toObject() : payout;
    const groups = [];
    if (event === 'requested') groups.push(await payerTargets(p));
    else if (event === 'disputed') groups.push(await resolverTargets(p), await payerTargets(p));
    else groups.push(await payeeTargets(p));
    const { title, body } = message(p, event);
    for (const g of groups) {
      if (!g.targets.length) continue;
      const data = { type: 'payout_update', event, payoutId: String(p._id), kind: p.kind, link: g.link, targetUrl: g.link };
      await notifyOwnersSafely(g.targets, { title, body, data });
      if (g.rider) {
        await createInboxNotifications({
          notifications: g.targets.map((t) => ({ ...t, title, message: body, link: g.link, category: 'payout', metadata: { payoutId: String(p._id), event } })),
        });
      }
    }
  } catch (err) {
    logger.warn(`Payout notification failed: ${err.message}`);
  }
}
