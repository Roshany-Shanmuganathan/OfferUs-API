import Member from '../models/Member.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';
import { deleteFromCloudinary, extractPublicId } from '../services/cloudinaryService.js';

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
    const { firstName, lastName, mobileNumber, address, dateOfBirth, gender, profilePicture } = req.body;

    const member = await Member.findOne({ userId: req.user._id });

    if (!member) {
      return sendError(res, 404, 'Member profile not found');
    }

    // Handle profile picture update (Cloudinary URL from req.body or file upload)
    if (req.file) {
      // Delete old profile picture from Cloudinary if exists
      if (member.profilePicture) {
        const oldPublicId = extractPublicId(member.profilePicture);
        if (oldPublicId) {
          try {
            await deleteFromCloudinary(oldPublicId);
          } catch (err) {
            console.error('Error deleting old profile picture from Cloudinary:', err);
            // Continue even if deletion fails
          }
        }
      }
      // Store Cloudinary URL from uploaded file
      member.profilePicture = req.file.secure_url || req.file.path;
    } else if (profilePicture !== undefined) {
      // Handle direct URL update (from frontend Cloudinary upload)
      // Delete old profile picture from Cloudinary if exists
      if (member.profilePicture && member.profilePicture !== profilePicture) {
        const oldPublicId = extractPublicId(member.profilePicture);
        if (oldPublicId) {
          try {
            await deleteFromCloudinary(oldPublicId);
          } catch (err) {
            console.error('Error deleting old profile picture from Cloudinary:', err);
            // Continue even if deletion fails
          }
        }
      }
      member.profilePicture = profilePicture || undefined;
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
