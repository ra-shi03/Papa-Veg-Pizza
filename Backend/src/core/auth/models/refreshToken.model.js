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

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
