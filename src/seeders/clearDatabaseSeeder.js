import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Partner from "../models/Partner.js";
import Member from "../models/Member.js";
import Offer from "../models/Offer.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import SavedOffer from "../models/SavedOffer.js";
import connectDB from "../config/db.js";

const clearDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('⚠️  WARNING: Starting database cleanup...');
    console.log('This will delete all data from collections but keep the database structure.');
    console.log('');

    // List of collections to clear (using models to ensure we get all)
    const collectionsToClear = [
      { name: "users", model: User },
      { name: "partners", model: Partner },
      { name: "members", model: Member },
      { name: "offers", model: Offer },
      { name: "reviews", model: Review },
      { name: "notifications", model: Notification },
      { name: "savedoffers", model: SavedOffer },
    ];

    // Delete all documents from each collection
    const deletePromises = collectionsToClear.map(async ({ name, model }) => {
      try {
        const count = await model.countDocuments();
        if (count > 0) {
          await model.deleteMany({});
          console.log(`✓ Cleared collection: ${name} (${count} documents deleted)`);
        } else {
          console.log(`○ Collection ${name} is already empty`);
        }
      } catch (error) {
        console.error(`✗ Error clearing collection ${name}:`, error.message);
      }
    });

    await Promise.all(deletePromises);

    // Also clear any other collections that might exist
    const allCollections = mongoose.connection.collections;
    const modelCollectionNames = collectionsToClear.map(c => c.name.toLowerCase());
    
    for (const collectionName of Object.keys(allCollections)) {
      if (!modelCollectionNames.includes(collectionName.toLowerCase())) {
        try {
          const count = await allCollections[collectionName].countDocuments();
          if (count > 0) {
            await allCollections[collectionName].deleteMany({});
            console.log(`✓ Cleared collection: ${collectionName} (${count} documents deleted)`);
          }
        } catch (error) {
          // Ignore errors for collections we don't manage
        }
      }
    }

    console.log('');
    console.log('✓ Database cleanup completed successfully!');
    console.log('All collections have been cleared.');
    console.log('Database structure is intact.');
    console.log('');
    console.log('💡 Tip: Run "npm run seed:admin" to create an admin user.');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

// Run seeder
clearDatabase();
