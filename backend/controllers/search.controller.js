import User from "../models/user.model.js";
import Post from "../models/post.model.js";

export const searchController = async (req, res) => {
  const { query } = req.query;

  const userSkip = parseInt(req.query.userSkip) || 0;
  const userLimit = parseInt(req.query.userLimit) || 5;

  const postSkip = parseInt(req.query.postSkip) || 0;
  const postLimit = parseInt(req.query.postLimit) || 10;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const regex = new RegExp(query, "i");

    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { fullName: { $regex: regex } },
      ],
    })
      .select("username fullName profileImg")
      .limit(userLimit)
      .skip(userSkip);

    const posts = await Post.find({
      text: { $regex: regex },
    })
      .populate("user", "username fullName profileImg")
      .limit(postLimit)
      .skip(postSkip)
      .sort({ createdAt: -1 });

    return res.status(200).json({ users, posts });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};