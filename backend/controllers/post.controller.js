import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";
import { handleMentions } from "../utils/mentions.js";
export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        if (!text && !img) {
            return res.status(400).json({error: "Please provide either text or image"});
        }

        if(img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        //if (text) {
            //await handleMentions({ text, userId, isComment: false });
        //}

        const newPost = new Post({
            text,
            img,
            user: userId
        });

        await newPost.save();

        
        res.status(201).json(newPost);

    } catch (error) {
        console.log("Error in createPost: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.user.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "You are not authorized to delete this post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in deletePost controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if(!text) {
            return res.status(400).json({error: "Text field is required"});
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Post not found"});
        }

        

        const comment = {user: userId, text};

        post.comments.push(comment);
        await post.save();
        // Handle mentions and notifications
        //await handleMentions({ text, userId, postId, isComment: true });
        res.status(200).json(post);

    } catch (error) {
        console.log("Error in commentOnPost: ", error.message);
        res.status(500).json({error: error.message});
    }
};


export const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const userId = req.user._id; // From protectRoute middleware

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    post.comments.pull({ _id: commentId });
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("user", "-password")
      .populate("comments.user", "-password");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error in deleteComment: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const likeUnlikePost = async (req, res) => {
    try {
        const { id:postId } = req.params
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Post not found"});
        }

        const userLikedPost = post.likes.includes(userId);
        if(userLikedPost) {
            await Post.updateOne({_id:postId}, {$pull: {likes: userId}});
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());

            res.status(200).json(updatedLikes);
        } else {
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like",
            })
            await notification.save();

            const updatedLikes = post.likes;

            res.status(200).json(updatedLikes);
        }

    } catch (error) {
        console.log("Error in likeUnlikePost: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const likeComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const userId = req.user._id;



    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const userLikedComment = comment.likes.includes(userId);

    if (userLikedComment) {
      // Unlike
      await Post.updateOne({ _id: postId, "comments._id": commentId }, { $pull: { "comments.$.likes": userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedComments: commentId } });

      const updatedLikes = comment.likes.filter((id) => id.toString() !== userId.toString());
      res.status(200).json(updatedLikes);
    } else {
      // Like
      comment.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedComments: commentId } });
      await post.save();

      if (comment.user.toString() !== userId.toString()) {
        const notification = new Notification({
          from: userId,
          to: comment.user,
          type: "like"
        });
        await notification.save();
      }

      const updatedLikes = comment.likes;
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in likeComment:", error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};


export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({createdAt: -1}).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        });

        if (posts.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);

    } catch (error) {
        console.log("Error in getAllPosts: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } }).populate({
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        const following = user.following;

        const feedPosts = await Post.find({ user: { $in: following } })
        .sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(feedPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password"
        })
        .populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts: ", error.message);
        res.status(500).json({error: error.message});
    }
};

export const getPostById = async (req, res) => {
  try {
    // Find post and populate user and comment user fields
    const post = await Post.findById(req.params.id)
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in getPostById: ", error.message);
    res.status(500).json({ error: error.message });
  }
};


export const saveUnsavePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadySaved = user.savedPosts.includes(postId);

    if (alreadySaved) {
      await User.updateOne({ _id: userId }, { $pull: { savedPosts: postId } });
    } else {
      await User.updateOne({ _id: userId }, { $push: { savedPosts: postId } });
    }

    const updatedUser = await User.findById(userId);
    res.status(200).json(updatedUser.savedPosts);
  } catch (error) {
    console.log("Error in saveUnsavePost:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSavedPosts = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const savedPosts = await Post.find({ _id: { $in: user.savedPosts } })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });


    // Reorder posts to match the order in user.savedPosts (most recent first)
    const postMap = new Map(savedPosts.map(post => [post._id.toString(), post]));
    const orderedPosts = [...user.savedPosts].reverse() // Most recently saved first
      .map(id => postMap.get(id.toString())) // Reconstruct the correct order
      .filter(Boolean); // Remove any missing posts

    res.status(200).json(orderedPosts);
  } catch (error) {
    console.log("Error in getSavedPosts:", error.message);
    res.status(500).json({ error: error.message });
  }
};


