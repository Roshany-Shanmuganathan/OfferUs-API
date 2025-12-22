import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a QR code data URL from coupon token
 * @param {string} qrToken - The secure token to encode in QR
 * @returns {Promise<string>} Data URL of the QR code image
 */
export const generateQRCode = async (qrToken) => {
    try {
        // Create QR code data URL
        const qrDataUrl = await QRCode.toDataURL(qrToken, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 400,
            margin: 2,
            color: {
                dark: '#0f1d18', // Primary color from theme
                light: '#ffffff',
            },
        });

        return qrDataUrl;
    } catch (error) {
        throw new Error(`Failed to generate QR code: ${error.message}`);
    }
};

/**
 * Generate a secure token for QR code
 * @returns {string} Secure random token
 */
export const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate token format
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid format
 */
export const isValidToken = (token) => {
    // Token should be 64 character hex string
    return /^[a-f0-9]{64}$/i.test(token);
};
