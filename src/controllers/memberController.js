import Member from '../models/Member.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Get member profile
 * @route   GET /api/members/profile
 * @access  Private (Member)
 */
export const getMemberProfile = async (req, res) => {
  try {
    const member = await Member.findOne({ userId: req.user._id });

    if (!member) {
      return sendError(res, 404, 'Member profile not found');
    }

    return sendSuccess(res, 200, 'Member profile retrieved successfully', { member });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * @desc    Update member profile
 * @route   PUT /api/members/profile
 * @access  Private (Member)
 */
export const updateMemberProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, address, dateOfBirth, gender } = req.body;

    const member = await Member.findOne({ userId: req.user._id });

    if (!member) {
      return sendError(res, 404, 'Member profile not found');
    }

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if exists
      if (member.profilePicture) {
        const oldImagePath = path.join(__dirname, '../../uploads/profile-images', path.basename(member.profilePicture));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Store the relative path to the uploaded file
      member.profilePicture = `/uploads/profile-images/${req.file.filename}`;
    }

    // Update fields
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (mobileNumber) member.mobileNumber = mobileNumber;
    if (address) member.address = address;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (gender) member.gender = gender;

    await member.save();

    return sendSuccess(res, 200, 'Member profile updated successfully', { member });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
