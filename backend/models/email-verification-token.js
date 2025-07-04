import mongoose from "mongoose";

const emailVerificationTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    verificationCode: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: "10m",
    },
});

const EmailVerificationToken = mongoose.model("EmailVerificationToken", emailVerificationTokenSchema);

export default EmailVerificationToken;