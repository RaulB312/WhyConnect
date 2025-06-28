import User from "../models/user.model.js";
import Post from "../models/post.model.js";

export const searchController = async (req, res) => {
  const { query, userPage = 1, postPage = 1 } = req.query;

  if (!query?.trim()) {
    return res.status(400).json({ error: "Search query required" });
  }

  try {
    // Users still via regex (users are small dataset)
    const userLimit = 5;
    const userSkip = (userPage - 1) * userLimit;

    const userRegex = new RegExp(query, "i");

    const users = await User.find({ 
      $or: [
        { username: userRegex },
        { fullName: userRegex }
      ]
    })
    .select("username fullName profileImg")
    .skip(userSkip)
    .limit(userLimit);

    // Posts via Atlas Search
    const postLimit = 10;
    const postSkip = (postPage - 1) * postLimit;

    const posts = await Post.aggregate([
      {
        $search: {
          index: "default",
          text: {
            query: query,
            path: "text"
          }
        }
      },
      { $sort: { score: { $meta: "textScore" }, createdAt: -1 } },  // sort by recency
      { $skip: postSkip },
      { $limit: postLimit },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          text: 1,
          createdAt: 1,
          comments: 1,
          likes: 1,
          user: { username: 1, fullName: 1, profileImg: 1 }
        }
      }
    ]);

    res.status(200).json({
      users,
      posts,
      pagination: {
        nextUserPage: users.length === userLimit ? parseInt(userPage) + 1 : null,
        nextPostPage: posts.length === postLimit ? parseInt(postPage) + 1 : null
      }
    });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};