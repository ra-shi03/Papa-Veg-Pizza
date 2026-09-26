import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://REDACTED:REDACTED@papa-veg-pizza.ugrhivy.mongodb.net/test?retryWrites=true&w=majority', { dbName: 'test' })
  .then(async () => {
    const res = await mongoose.connection.collection('food_franchises').deleteMany({ name: "Papa Veg Pizza" });
    console.log(`Deleted ${res.deletedCount} franchises`);
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
