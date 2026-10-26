import mongoose from 'mongoose';
import crypto from 'crypto';

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    // Store SHA-256 hash of the raw JWT — never the raw token itself.
    // If the DB is compromised, attackers cannot directly use these hashes
    // to forge new tokens (they need the signing secret too).
    tokenHash: {
        type: String,
        required: true,
        index: true
    },
    deviceId: {
        type: String,
        default: null
    },
    expiresAt: {
        type: Date,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    },
    // One login = one family. Every rotation inherits the family id, so a reused (already rotated) token
    // can take down the whole session. Tokens issued before this field existed use their own _id.
    familyId: {
        type: String,
        default: () => crypto.randomUUID(),
        index: true
    },
    // Set the first time this token is exchanged for a new one. Using it again after the grace
    // window is replay: the family is revoked.
    rotatedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true,
    collection: 'refreshTokens'
});

// TTL index: MongoDB automatically deletes expired tokens
// No manual cleanup needed — zero maintenance burden
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Static helpers ───────────────────────────────────────────────────────────
// Always use these to ensure consistent hashing across the codebase
refreshTokenSchema.statics.hashToken = function(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
};

refreshTokenSchema.statics.findByRawToken = function(rawToken) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return this.findOne({ tokenHash: hash, revoked: false });
};

// Keeps the newest `keep` live sessions per user (a session = a family). Evicting a session deletes its whole
// family, including the rotated tokens kept for replay detection; those are also capped so they stay bounded.
refreshTokenSchema.statics.trimSessions = async function (userId, keep = 3, keepRotated = 10) {
    const live = await this.find({ userId, rotatedAt: null }).sort({ createdAt: -1 }).select('_id familyId').lean();
    if (live.length > keep) {
        const evicted = live.slice(keep);
        await this.deleteMany({
            userId,
            $or: [{ familyId: { $in: evicted.map((t) => t.familyId).filter(Boolean) } }, { _id: { $in: evicted.map((t) => t._id) } }]
        });
    }
    const rotated = await this.find({ userId, rotatedAt: { $ne: null } }).sort({ rotatedAt: -1 }).select('_id').lean();
    if (rotated.length > keepRotated) {
        await this.deleteMany({ _id: { $in: rotated.slice(keepRotated).map((t) => t._id) } });
    }
};

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
