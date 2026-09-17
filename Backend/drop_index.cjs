const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const collection = mongoose.connection.collection('food_stores');
    await collection.dropIndex('storeCode_1');
    console.log('Index storeCode_1 dropped successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

dropIndex();
