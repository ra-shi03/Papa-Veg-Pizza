// Every schema `ref` must name a registered model. A dangling ref (e.g. 'FoodUser') makes any
// populate() on that path throw at runtime, which surfaced as 500s on admin order pages.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx;
before(async () => { fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

test('no schema references a model that is not registered', async () => {
    // Load every model file so the registry is complete
    const { readdirSync, statSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const walk = (dir) => readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : /\.model\.js$/.test(n) ? [p] : [];
    });
    for (const file of walk(resolve('src'))) {
        // a few files define a model another file already registers (duplicates): ignore those
        await import(file).catch((e) => { if (e.name !== 'OverwriteModelError') throw e; });
    }

    // Mongoose creates each newly loaded model's collection in the background; wait for that to finish so
    // it cannot land after teardown has dropped the database (which would leak an empty database).
    await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init().catch(() => {})));

    const registered = new Set(mongoose.modelNames());
    const dangling = [];
    for (const name of registered) {
        mongoose.model(name).schema.eachPath((path, type) => {
            const ref = type.options?.ref ?? type.caster?.options?.ref;
            if (typeof ref === 'string' && !registered.has(ref)) dangling.push(`${name}.${path} -> '${ref}'`);
        });
    }
    assert.deepEqual(dangling, []);
});
