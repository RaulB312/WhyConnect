import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema({
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

const passwordResetToken = mongoose.model("passwordResetToken", passwordResetTokenSchema);

export default passwordResetToken;