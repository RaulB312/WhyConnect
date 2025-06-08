import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import nodemailer from "nodemailer";
import EmailVerificationToken from "../models/email-verification-token.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const requestVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.BREVO_SMTP_HOST,
                pass: process.env.BREVO_API_KEY,
            },
        });
        console.log("SMTP Host:", process.env.BREVO_SMTP_HOST);
        console.log("EMAIL:", process.env.BREVO_EMAIL);
        console.log("SMTP_KEY:", process.env.BREVO_API_KEY ? "Loaded" : "Missing");

        const htmlContent = `
        <!DOCTYPE html>
        <html>
            <body style="font-family: 'Times New Roman', serif; text-align: center; padding: 20px;">
            <a href="https://why-connect.com" target="_blank">
                <img src="https://img.mailinblue.com/9357905/images/content_library/original/684052741512a9821e862dca.png" alt="WhyConnect Logo" style="margin-bottom: 20px; max-width: 200px;" />
            </a>
            <hr style="max-width: 500px; margin: 20px auto;">
            <h2 style="font-weight: bold;">Verify your WhyConnect account</h2>
            <p style="text-align: left; max-width: 500px; margin: 0 auto; font-size: 16px;">
                Thanks for registering your WhyConnect account with the email address <strong>${email}</strong>. Please verify your account with the code below:
            </p>
            <h3 style="margin: 20px 0;">${verificationCode}</h3>
            <p style="text-align: left; max-width: 500px; margin: 0 auto; font-size: 16px;">
                This code will expire in 10 minutes. If you did not request this, please ignore this email.
            </p>
            <hr style="max-width: 500px; margin: 20px auto;">
            <p style="text-align: left; max-width: 500px; margin: 0 auto; margin-top: 30px; font-size: 16px;">
                Thanks,<br />WhyConnect team
            </p>
            </body>
        </html>`;


        const mailOptions = {
            from: `"Why Connect" <${process.env.BREVO_EMAIL}>`,
            to: email,
            subject: "Your Verification Code",
            html: htmlContent,
            text: `Verify your Why Connect account with the code: ${verificationCode}`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);

        await EmailVerificationToken.create({ email, verificationCode });

        res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error) {
        console.error("Error in requestVerificationCode controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password, verificationCode } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(0).json({ error: "Invalid email format" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }


        const emailVerificationToken = await EmailVerificationToken.findOne({ email, verificationCode });
        if (!emailVerificationToken) {
            return res.status(400).json({ error: "Invalid or expired verification code" });
        }
        else {
            await EmailVerificationToken.deleteOne({ email, verificationCode });
        }

        if(password.length < 8){
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }

        // make sure the password is strong capital, small letters, numbers, and special characters

        //hash the password

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
        })

        if (newUser){
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.following,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
             });
        }else{
            res.status(400).json({ error: "Invalid user data" });
        }

    } catch (error) {
        console.log("Error in signup controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }
        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
        });

    } catch (error) {
        console.log("Error in login controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }  
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getMe controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
}