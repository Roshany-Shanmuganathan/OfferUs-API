import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import connectDB from './src/config/db.js';
import Notification from './src/models/Notification.js';
import User from './src/models/User.js';
import Partner from './src/models/Partner.js';
import Offer from './src/models/Offer.js';
import Member from './src/models/Member.js';
import { notifyPartnerRedemption, notifyExpiringOffers } from './src/utils/notificationService.js';

dotenv.config();

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync('test-output.txt', msg + '\n');
};

const runTest = async () => {
  try {
    fs.writeFileSync('test-output.txt', 'Starting Test\n');
    await connectDB();
    log('Connected to MongoDB via connectDB');

    // 1. Test Partner Redemption Notification
    log('\n--- Testing Partner Redemption Notification ---');
    
    // Find or create a partner and an offer
    let offer = await Offer.findOne({ isActive: true }).populate('partner');
    let createdMockData = false;
    let mockUser, mockPartner, mockOffer;

    if (!offer) {
      log('No active offer found. Creating mock data...');
      
      // Create mock user
      const timestamp = Date.now();
      mockUser = await User.create({
        email: `testpartner${timestamp}@example.com`,
        password: 'password123',
        role: 'partner',
        firstName: 'Test',
        lastName: 'Partner',
        isActive: true
      });

      // Create mock partner
      mockPartner = await Partner.create({
        userId: mockUser._id,
        partnerName: 'Test Partner',
        shopName: 'Test Shop',
        status: 'approved',
        category: 'Food',
        location: {
          address: '123 Test St',
          city: 'Colombo',
          district: 'Colombo',
          street: 'Test Street',
          postalCode: '10000',
          coordinates: [0, 0]
        },
        contactInfo: {
          mobileNumber: '0771234567'
        }
      });

      // Create mock offer
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Expires in 7 days

      mockOffer = await Offer.create({
        partner: mockPartner._id,
        title: 'Test Offer',
        description: 'This is a test offer',
        discount: 10,
        originalPrice: 100,
        discountedPrice: 90,
        category: 'Food',
        expiryDate: expiryDate,
        isActive: true,
        termsAndConditions: 'Test terms'
      });

      offer = await Offer.findById(mockOffer._id).populate('partner');
      createdMockData = true;
      log('Mock data created.');
    }

    if (offer) {
      const partnerUser = await User.findById(offer.partner.userId);
      log(`Testing with Offer: ${offer.title} (ID: ${offer._id})`);
      log(`Partner User ID: ${partnerUser._id}`);

      // Mock a member
      const member = {
        firstName: 'Test',
        lastName: 'Member',
      };

      // Call the function
      await notifyPartnerRedemption(offer, member);

      // Check if notification was created
      const notification = await Notification.findOne({
        user: partnerUser._id,
        type: 'system',
        'relatedEntity.entityId': offer._id,
      }).sort({ createdAt: -1 });

      if (notification) {
        log('SUCCESS: Redemption notification created!');
        log('Title: ' + notification.title);
        log('Message: ' + notification.message);
        
        // Cleanup notification
        await Notification.findByIdAndDelete(notification._id);
        log('Cleanup: Notification deleted.');
      } else {
        log('FAILURE: Redemption notification NOT found.');
      }
    }

    // Cleanup mock data
    if (createdMockData) {
      if (mockOffer) await Offer.findByIdAndDelete(mockOffer._id);
      if (mockPartner) await Partner.findByIdAndDelete(mockPartner._id);
      if (mockUser) await User.findByIdAndDelete(mockUser._id);
      log('Cleanup: Mock data deleted.');
    }

    // 2. Test Expiring Offers Notification
    log('\n--- Testing Expiring Offers Notification ---');
    await notifyExpiringOffers();
    log('notifyExpiringOffers executed successfully.');

  } catch (error) {
    log('Test failed: ' + error.message);
  } finally {
    await mongoose.disconnect();
    log('\nDisconnected from MongoDB');
  }
};

runTest();
