import mongoose from "mongoose";

// Define a subdocument schema for comments with timestamps
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    likes:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
  },
  {
    timestamps: true // This adds createdAt and updatedAt to each comment
  }
);

// Define the main post schema
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String
    },
    img: {
      type: String
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    comments: [commentSchema] // Use the subdocument schema here
  },
  {
    timestamps: true // Adds createdAt and updatedAt to posts
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
