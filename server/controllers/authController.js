const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dns = require('dns').promises;
const { sendOTP } = require('../utils/emailService');

// Generate JWT
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Basic email regex for backend validation
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// @desc  Register user
// @route POST /api/auth/register
const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        console.log(`📝 [AUTH] Register attempt for: ${email}`);

        // 1. Format Validation
        if (!email || !emailRegex.test(email)) {
            console.log('❌ [AUTH] Validation Failed: Invalid format');
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // 2. Domain/DNS Validation (Check for MX records)
        const domain = email.split('@')[1];
        try {
            const mxRecords = await dns.resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                console.log(`❌ [AUTH] DNS Failed: No MX records for ${domain}`);
                return res.status(400).json({ message: 'Email domain does not exist or cannot receive mail' });
            }
        } catch (dnsErr) {
            console.log(`❌ [AUTH] DNS Error for ${domain}:`, dnsErr.message);
            return res.status(400).json({ message: 'Invalid email domain' });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            console.log('❌ [AUTH] Registration Failed: Email exists');
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'guest',
            otp,
            otpExpires,
            isVerified: false
        });

        // Send Email
        await sendOTP(email, otp);

        res.status(201).json({
            message: 'Registration successful. Please check your email for verification code.',
            email: user.email
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Verify OTP
// @route POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            message: 'Email verified successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
    const { email, password, role: attemptedRole } = req.body;
    try {
        // Strict Lookup: Only find the user if they match the email AND the role they're trying to login as
        const user = await User.findOne({ email, role: attemptedRole || 'guest' });

        if (!user) {
            return res.status(401).json({
                message: `This email is not registered as a ${attemptedRole || 'guest'}.`
            });
        }

        const match = await user.matchPassword(password);
        if (!match) return res.status(401).json({ message: 'Invalid password' });

        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Your email is not verified. Please verify your account before logging in.',
                unverified: true,
                email: user.email
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.language,
            token: generateToken(user._id),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get current user profile
// @route GET /api/auth/me
const getMe = async (req, res) => {
    res.json(req.user);
};

module.exports = { register, login, getMe, verifyOTP };
