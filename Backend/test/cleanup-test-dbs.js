// Drops leftover pvp_test_* databases (created by test runs that were killed before teardown).
// Run by hand: npm run test:cleanup. It only ever touches databases whose name starts with pvp_test_.
import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
const { databases } = await mongoose.connection.db.admin().listDatabases();
const leftovers = databases.map((d) => d.name).filter((n) => /^pvp_test_/.test(n));
for (const name of leftovers) {
    await mongoose.connection.client.db(name).dropDatabase();
    console.log(`dropped ${name}`);
}
console.log(leftovers.length ? `done (${leftovers.length} dropped)` : 'nothing to clean up');
await mongoose.disconnect();
