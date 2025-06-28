import rateLimit from 'express-rate-limit';

export const tagRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each user to 30 tags per window
  skip: (req) => {
    // Skip rate limiting if:
    // 1. The request has no text content
    // 2. The text contains no mentions
    // 3. User is admin (optional)
    const { text } = req.body;
    return !text || !text.includes('@');
  },
  keyGenerator: (req) => req.user._id.toString(),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many tagging attempts. Please try again later.",
      limit: 30,
      window: "15 minutes"
    });
  }
});