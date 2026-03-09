require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConnection() {
    console.log('🔄 Testing SMTP connection...');
    console.log(`📧 User: ${process.env.EMAIL_USER}`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection successful! Your credentials are correct.');

        // Optional: Send a test email
        /*
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'SMTP Test',
            text: 'This is a test email to verify your SMTP configuration.'
        });
        console.log('✉️ Test email sent successfully.');
        */

        process.exit(0);
    } catch (error) {
        console.error('❌ SMTP Connection failed:');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
