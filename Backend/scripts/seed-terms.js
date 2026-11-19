// Publishes the customer Terms & Conditions (the default text) as the "terms" page, the one the customer app
// shows at Account > Terms & Conditions and Super Admin > Content Management > Policies > Terms & Conditions.
//
// Run: node scripts/seed-terms.js          (only when no real customer terms are saved: empty, or the old template text)
//      node scripts/seed-terms.js --force  (replace whatever is saved; the old text is printed first)
// Have the text reviewed by your legal adviser before relying on it.
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { FoodPageContent } from '../src/modules/food/admin/models/pageContent.model.js';
import { DEFAULT_TERMS_CONTENT, upsertLegalPage } from '../src/modules/food/admin/services/pageContent.service.js';
import { plainTextToLegalHtml } from '../../Frontend/src/modules/Food/utils/legalContentFormat.js';

await connectDB();
const force = process.argv.includes('--force');
const current = await FoodPageContent.findOne({ key: 'terms' }).lean();
const saved = String(current?.legal?.content || '');
// The old default was a copy of another brand's terms; the delivery-partner text was saved here by mistake.
const isTemplate = !saved.trim() || /Domino|IRCTC|Large Order Split|Everyday Value/i.test(saved);
if (current && !isTemplate && !force) {
  console.log('Customer terms already written by the admin. Use --force to replace them.');
} else {
  if (current) console.log(`Replacing saved terms (title "${current.legal?.title}", ${saved.length} characters).`);
  await upsertLegalPage('terms', { title: 'Terms & Conditions', content: plainTextToLegalHtml(DEFAULT_TERMS_CONTENT) }, null);
  console.log('Customer Terms & Conditions published.');
}
await mongoose.disconnect();
