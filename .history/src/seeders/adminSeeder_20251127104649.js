import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import connectDB from "../config/db.js";

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@offerapp.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        console.log("Admin user already exists with email:", adminEmail);
        console.log("");
        console.log("Options:");
        console.log(
          "1. Delete the existing admin user from database and run this seeder again"
        );
        console.log("2. Update the password manually through the admin panel");
        console.log(
          "3. Set ADMIN_PASSWORD in .env and this seeder will update it"
        );

        // Check if password should be updated
        const updatePassword = process.env.UPDATE_ADMIN_PASSWORD === "true";
        if (updatePassword) {
          console.log("");
          console.log("Updating admin password...");
          existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
          existingAdmin.isActive = true;
          await existingAdmin.save();
          console.log("✓ Admin password updated successfully!");
          console.log("Email:", adminEmail);
        }

        process.exit(0);
      } else {
        console.log(
          "User with this email exists but is not an admin. Updating role to admin..."
        );
        existingAdmin.role = "admin";
        existingAdmin.isActive = true;
        existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
        await existingAdmin.save();
        console.log("✓ User role updated to admin successfully!");
        console.log("Email:", adminEmail);
        console.log("Password:", adminPassword);
        process.exit(0);
      }
    }

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isActive: true,
    });

    console.log("✓ Admin user created successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Please change the admin password after first login!");
    console.log(
      "Update ADMIN_EMAIL and ADMIN_PASSWORD in .env file for custom credentials"
    );

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    process.exit(1);
  }
};

// Run seeder
seedAdmin();
