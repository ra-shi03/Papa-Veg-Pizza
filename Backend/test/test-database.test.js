// N6: tests run on their own in-memory MongoDB and can never be pointed at Atlas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, assertTestDatabaseUri, mongoose } from './helpers/fixture.js';

test('the guard refuses hosted MongoDB connection strings', () => {
    for (const uri of [
        'mongodb+srv://user:pass@cluster0.abcd.mongodb.net/app',
        'mongodb://user:pass@ac-123-shard-00-00.abcd.mongodb.net:27017/app?ssl=true',
        'MONGODB+SRV://X@Y.MONGODB.NET/z',
    ]) {
        assert.throws(() => assertTestDatabaseUri(uri), /Refusing to run tests against a hosted MongoDB/, uri);
    }
    assert.equal(assertTestDatabaseUri('mongodb://127.0.0.1:27017/?replicaSet=rs0'), 'mongodb://127.0.0.1:27017/?replicaSet=rs0');
});

test('the app and the fixture use the local in-memory server, never the URI in .env', async () => {
    const fx = await createFixture();
    try {
        const { config } = await import('../src/config/env.js');
        assert.match(config.mongodbUri, /^mongodb:\/\/127\.0\.0\.1:\d+\//);
        assert.equal(process.env.MONGO_URI, config.mongodbUri);
        assert.equal(process.env.MONGODB_URI, config.mongodbUri);
        assert.match(mongoose.connection.host, /^(127\.0\.0\.1|localhost)$/);
        assert.match(mongoose.connection.name, /^pvp_test_/);
        // transactions work (the app uses them), i.e. it is a replica set
        const session = await mongoose.startSession();
        await session.withTransaction(async () => { await mongoose.connection.db.collection('tx_probe').insertOne({ ok: 1 }, { session }); });
        await session.endSession();
        assert.equal(await mongoose.connection.db.collection('tx_probe').countDocuments(), 1);
    } finally {
        await fx.teardown();
    }
});
