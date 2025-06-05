// src/utils/mentions.js
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";

export const handleMentions = async ({ text, userId, postId, isComment = false }) => {
  try {
    // Validate inputs
    if (!text || !mongoose.isValidObjectId(userId)) {
      return { validMentionIds: [], notifications: [] };
    }
    if (isComment && !mongoose.isValidObjectId(postId)) {
      throw new Error("Invalid post ID for comment");
    }

    // Detect mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentionedUsernames = [...(text.matchAll(mentionRegex) || [])].map((match) => match[1]);
    const uniqueMentions = [...new Set(mentionedUsernames)];

    // Anti-abuse: Max 10 mentions
    if (uniqueMentions.length > 10) {
      throw new Error("Cannot mention more than 10 users");
    }

    // Anti-abuse: 30-second cooldown
    const cooldownQuery = {
      [isComment ? "comments.user" : "user"]: new mongoose.Types.ObjectId(userId),
      [isComment ? "comments.createdAt" : "createdAt"]: { $gte: new Date(Date.now() - 30 * 1000) }
    };
    if (isComment && postId) {
      cooldownQuery._id = new mongoose.Types.ObjectId(postId);
    }
    const recentContent = await Post.findOne(cooldownQuery).lean();
    if (recentContent) {
      throw new Error(`Please wait 30 seconds before ${isComment ? "commenting" : "posting"} again`);
    }

    // Anti-abuse: 100 unique users per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const matchStage = {
      [isComment ? "comments.createdAt" : "createdAt"]: { $gte: startOfDay }
    };
    if (!isComment) {
      matchStage.user = new mongoose.Types.ObjectId(userId);
    }
    const userContentToday = await Post.aggregate([
      { $match: matchStage },
      ...(isComment
        ? [
            { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
            {
              $match: {
                "comments.user": new mongoose.Types.ObjectId(userId),
                "comments.createdAt": { $gte: startOfDay }
              }
            },
            { $project: { text: "$comments.text" } }
          ]
        : [{ $project: { text: "$text" } }])
    ]);

    const todayMentions = userContentToday
      .filter((item) => item.text)
      .flatMap((item) => item.text.match(mentionRegex) || [])
      .map((match) => match.slice(1));
    const uniqueTodayMentions = [...new Set(todayMentions)];
    if (uniqueTodayMentions.length + uniqueMentions.length > 100) {
      throw new Error("Cannot mention more than 100 unique users per day");
    }

    // Validate mentions
    const mentionedUsers = await User.find({ username: { $in: uniqueMentions } })
      .select("_id")
      .lean();
    const validMentionIds = mentionedUsers.map((user) => user._id.toString());

    // Create notifications
    const notifications = [];
    for (const mentionedUserId of validMentionIds) {
      if (mentionedUserId !== userId.toString()) {
        const notification = await Notification.create({
          type: "tag",
          from: new mongoose.Types.ObjectId(userId),
          to: new mongoose.Types.ObjectId(mentionedUserId),
          read: false
        });
        notifications.push(notification);
      }
    }

    return { validMentionIds, notifications };
  } catch (error) {
    console.log("Error in handleMentions:", error.message, error.stack);
    throw new Error(error.message);
  }
};