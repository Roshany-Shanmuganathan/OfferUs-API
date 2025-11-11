import Member from '../models/Member.js';
import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Get member profile
 * @route   GET /api/members/profile
 * @access  Private (Member)
 */
export const getMemberProfile = async (req, res) => {
  try {
    const member = await Member.findOne({ user: req.user._id });

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

    const member = await Member.findOne({ user: req.user._id });

    if (!member) {
      return sendError(res, 404, 'Member profile not found');
    }

    // Update fields
    if (firstName) member.firstName = firstName;
    if (lastName) member.lastName = lastName;
    if (mobileNumber) member.mobileNumber = mobileNumber;
    if (address) {
      member.address = {
        ...member.address,
        ...address,
      };
    }
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (gender) member.gender = gender;

    await member.save();

    return sendSuccess(res, 200, 'Member profile updated successfully', { member });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
