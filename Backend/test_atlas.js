import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://papafoodcorporation_db_user:behP8R1Fti77UrVf@papa-veg-pizza.ugrhivy.mongodb.net/test?retryWrites=true&w=majority', { dbName: 'test' })
  .then(async () => {
    const franchises = await mongoose.connection.collection('food_franchises').find({}, { projection: { name: 1, isActive: 1 } }).toArray();
    console.log(JSON.stringify(franchises, null, 2));
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
