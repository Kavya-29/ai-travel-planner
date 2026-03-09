const nodemailer = require('nodemailer');

const sendOTP = async (email, otp) => {
    // Placeholder transporter - User needs to provide real credentials in .env
    // For development, we can use a service like Mailtrap or Ethereal
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your preferred service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Travel Planner" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code',
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb;">Verify Your Email</h2>
                <p>Thank you for registering. Use the following code to complete your signup:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ [EMAIL] OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ [EMAIL] Send Error:', error);
        // In local dev without credentials, we just log the OTP for the user to copy
        console.log(`⚠️ [DEV_ONLY] Use this OTP to verify: ${otp}`);
        return false;
    }
};

module.exports = { sendOTP };
