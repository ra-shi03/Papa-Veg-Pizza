import mongoose from 'mongoose';
import { FoodCombo } from '../models/combo.model.js';
// Registers the model used by populate('categoryId') regardless of route load order
import '../models/categoryProduct.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { escapeRegex } from '../../../../utils/helpers.js';
import {
    validateComboUpsert,
    validateComboStatus,
    validateComboBulk
} from '../validators/combo.validator.js';

// Outlets operate in India, so day/time windows are evaluated in IST regardless of server timezone
const BUSINESS_TIMEZONE = 'Asia/Kolkata';
const WEEKDAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

const getBusinessClock = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return {
        day: WEEKDAY_SHORT[get('weekday')],
        minutes: Number(get('hour')) * 60 + Number(get('minute'))
    };
};

const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
};

const formatTime = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return m ? `${hour12}:${String(m).padStart(2, '0')} ${suffix}` : `${hour12} ${suffix}`;
};

const buildAvailability = (combo, now = new Date()) => {
    const clock = getBusinessClock(now);
    const days = combo.weeklyRestrictions || [];
    const hasWindow = Boolean(combo.timeWindowStart && combo.timeWindowEnd);

    const dayOk = days.length === 0 || days.includes(clock.day);
    let timeOk = true;
    if (hasWindow) {
        const start = toMinutes(combo.timeWindowStart);
        const end = toMinutes(combo.timeWindowEnd);
        // Windows such as 22:00-02:00 wrap past midnight
        timeOk = start <= end
            ? clock.minutes >= start && clock.minutes < end
            : clock.minutes >= start || clock.minutes < end;
    }

    const labelParts = [];
    if (hasWindow) labelParts.push(`${formatTime(combo.timeWindowStart)} - ${formatTime(combo.timeWindowEnd)}`);
    if (days.length > 0 && days.length < 7) labelParts.push(days.join(', '));

    return {
        availableNow: dayOk && timeOk,
        availabilityLabel: labelParts.length ? `Available ${labelParts.join(' | ')}` : ''
    };
};

// Moves scheduled combos live once their start date passes and expires ended ones,
// so admin stats and the user menu agree without needing a cron job.
const syncLifecycleStatuses = async () => {
    const now = new Date();
    await Promise.all([
        FoodCombo.updateMany(
            { status: 'scheduled', validFrom: { $ne: null, $lte: now }, $or: [{ validTo: null }, { validTo: { $gt: now } }] },
            { $set: { status: 'active' } }
        ),
        FoodCombo.updateMany(
            { status: { $in: ['active', 'scheduled'] }, validTo: { $ne: null, $lte: now } },
            { $set: { status: 'expired' } }
        )
    ]);
};

const getOrderMetrics = async (comboIds) => {
    const ids = comboIds.map(String);
    if (ids.length === 0) return {};
    const rows = await FoodOrder.aggregate([
        { $match: { 'items.itemId': { $in: ids } } },
        { $unwind: '$items' },
        { $match: { 'items.itemId': { $in: ids } } },
        {
            $group: {
                _id: '$items.itemId',
                orderCount: { $sum: 1 },
                unitsSold: {
                    $sum: { $cond: [{ $regexMatch: { input: '$orderStatus', regex: /^cancelled/ } }, 0, '$items.quantity'] }
                },
                revenue: {
                    $sum: {
                        $cond: [
                            { $regexMatch: { input: '$orderStatus', regex: /^cancelled/ } },
                            0,
                            { $multiply: ['$items.price', '$items.quantity'] }
                        ]
                    }
                }
            }
        }
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r]));
};

const deriveOriginalPrice = (dto) => {
    if (dto.originalPrice > 0) return dto.originalPrice;
    return dto.items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0);
};

const conflictError = (message) => {
    const err = new Error(message);
    err.statusCode = 409;
    return err;
};

const findComboOr404 = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Combo not found');
    const combo = await FoodCombo.findById(id);
    if (!combo) throw new NotFoundError('Combo not found');
    return combo;
};

export async function getCombos(req, res, next) {
    try {
        await syncLifecycleStatuses();
        const { search, status, comboType, categoryId } = req.query;

        const filter = {};
        if (search && search.trim()) filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
        if (status && status !== 'All') filter.status = status;
        if (comboType && comboType !== 'All') filter.comboType = comboType;
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) filter.categoryId = categoryId;

        const combos = await FoodCombo.find(filter)
            .populate('categoryId', 'label icon sort')
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean();

        const metrics = await getOrderMetrics(combos.map((c) => c._id));
        const data = combos.map((c) => ({
            ...c,
            orderCount: metrics[String(c._id)]?.orderCount || 0,
            unitsSold: metrics[String(c._id)]?.unitsSold || 0,
            revenue: metrics[String(c._id)]?.revenue || 0
        }));

        res.status(200).json({ success: true, data, totalCount: data.length });
    } catch (error) {
        next(error);
    }
}

export async function getComboStats(req, res, next) {
    try {
        await syncLifecycleStatuses();
        const combos = await FoodCombo.find({}).select('name status validTo').lean();
        const metrics = await getOrderMetrics(combos.map((c) => c._id));

        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const count = (s) => combos.filter((c) => c.status === s).length;

        let bestSeller = null;
        let totalRevenue = 0;
        combos.forEach((c) => {
            const m = metrics[String(c._id)];
            if (!m) return;
            totalRevenue += m.revenue;
            if (m.unitsSold > 0 && (!bestSeller || m.unitsSold > bestSeller.unitsSold)) {
                bestSeller = { name: c.name, unitsSold: m.unitsSold };
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalCombos: combos.length,
                activeCombos: count('active'),
                scheduledCombos: count('scheduled'),
                expiredCombos: count('expired'),
                draftCombos: count('draft'),
                totalRevenue,
                mostPurchased: bestSeller?.name || '',
                expiringSoon: combos.filter((c) => {
                    if (c.status !== 'active' || !c.validTo) return false;
                    const diff = new Date(c.validTo).getTime() - now;
                    return diff > 0 && diff <= weekMs;
                }).length
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function getComboById(req, res, next) {
    try {
        const combo = await findComboOr404(req.params.id);
        await combo.populate('categoryId', 'label icon sort');
        res.status(200).json({ success: true, data: combo });
    } catch (error) {
        next(error);
    }
}

export async function createCombo(req, res, next) {
    try {
        const dto = validateComboUpsert(req.body);
        const actor = req.user?.userId ? String(req.user.userId) : '';
        const combo = await FoodCombo.create({
            ...dto,
            originalPrice: deriveOriginalPrice(dto),
            createdBy: actor,
            updatedBy: actor
        });
        res.status(201).json({ success: true, data: combo, message: 'Combo created successfully' });
    } catch (error) {
        next(error);
    }
}

export async function updateCombo(req, res, next) {
    try {
        const combo = await findComboOr404(req.params.id);
        const dto = validateComboUpsert(req.body);
        combo.set({
            ...dto,
            originalPrice: deriveOriginalPrice(dto),
            updatedBy: req.user?.userId ? String(req.user.userId) : combo.updatedBy
        });
        await combo.save();
        res.status(200).json({ success: true, data: combo, message: 'Combo updated successfully' });
    } catch (error) {
        next(error);
    }
}

export async function updateComboStatus(req, res, next) {
    try {
        const combo = await findComboOr404(req.params.id);
        const { status } = validateComboStatus(req.body);
        const now = new Date();

        // Without these guards the lifecycle sync would immediately undo the change
        if (status === 'scheduled' && !(combo.validFrom && combo.validFrom > now)) {
            throw new ValidationError('Set a future "Valid From" date via Edit Combo before scheduling.');
        }
        if (status === 'active' && combo.validTo && combo.validTo <= now) {
            throw new ValidationError('This combo\'s "Valid To" date has passed. Extend it via Edit Combo before activating.');
        }
        // Activating before the start date means "go live on Valid From"
        const nextStatus = status === 'active' && combo.validFrom && combo.validFrom > now ? 'scheduled' : status;

        combo.status = nextStatus;
        combo.updatedBy = req.user?.userId ? String(req.user.userId) : combo.updatedBy;
        await combo.save();
        res.status(200).json({ success: true, data: combo, message: `Combo marked ${nextStatus}` });
    } catch (error) {
        next(error);
    }
}

export async function bulkUpdateCombos(req, res, next) {
    try {
        const { ids, action } = validateComboBulk(req.body);
        const actor = req.user?.userId ? String(req.user.userId) : '';

        if (action === 'delete') {
            const metrics = await getOrderMetrics(ids);
            const deletable = ids.filter((id) => !metrics[id]);
            const retained = ids.length - deletable.length;
            if (deletable.length > 0) await FoodCombo.deleteMany({ _id: { $in: deletable } });
            return res.status(200).json({ success: true, data: { deleted: deletable.length, retained } });
        }

        if (action === 'activate') {
            // Same rules as single activation: ended combos are skipped, future-dated ones become scheduled
            const now = new Date();
            const [live, scheduled] = await Promise.all([
                FoodCombo.updateMany(
                    { _id: { $in: ids }, $and: [{ $or: [{ validTo: null }, { validTo: { $gt: now } }] }, { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }] },
                    { $set: { status: 'active', updatedBy: actor } }
                ),
                FoodCombo.updateMany(
                    { _id: { $in: ids }, validFrom: { $gt: now }, $or: [{ validTo: null }, { validTo: { $gt: now } }] },
                    { $set: { status: 'scheduled', updatedBy: actor } }
                )
            ]);
            const updated = live.matchedCount + scheduled.matchedCount;
            return res.status(200).json({ success: true, data: { updated, skipped: ids.length - updated } });
        }

        const statusByAction = { deactivate: 'inactive', archive: 'archived' };
        const result = await FoodCombo.updateMany(
            { _id: { $in: ids } },
            { $set: { status: statusByAction[action], updatedBy: actor } }
        );
        res.status(200).json({ success: true, data: { updated: result.matchedCount } });
    } catch (error) {
        next(error);
    }
}

export async function deleteCombo(req, res, next) {
    try {
        const combo = await findComboOr404(req.params.id);
        const metrics = await getOrderMetrics([combo._id]);
        if (metrics[String(combo._id)]) {
            throw conflictError('This combo is linked to past orders. Archive it instead of deleting.');
        }
        await combo.deleteOne();
        res.status(200).json({ success: true, message: 'Combo deleted successfully' });
    } catch (error) {
        next(error);
    }
}

// User app: combos currently on sale, optionally narrowed to a menu category or store
export async function getPublicCombos(req, res, next) {
    try {
        await syncLifecycleStatuses();
        const { categoryId, storeId } = req.query;
        const now = new Date();

        const filter = {
            status: 'active',
            $and: [
                { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
                { $or: [{ validTo: null }, { validTo: { $gt: now } }] }
            ]
        };
        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) filter.categoryId = categoryId;

        if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
            const store = await FoodStore.findById(storeId).select('franchiseId').lean();
            const scope = [{ applicabilityType: 'all' }, { applicabilityType: 'stores', applicableStores: storeId }];
            if (store?.franchiseId) scope.push({ applicabilityType: 'franchises', applicableFranchises: store.franchiseId });
            filter.$and.push({ $or: scope });
        }

        const combos = await FoodCombo.find(filter)
            .populate('categoryId', 'label icon sort')
            .select('-createdBy -updatedBy -applicableFranchises -applicableStores')
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean();

        const data = combos.map((c) => ({ ...c, ...buildAvailability(c, now) }));
        res.status(200).json({ success: true, data, totalCount: data.length });
    } catch (error) {
        next(error);
    }
}
