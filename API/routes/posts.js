const express = require("express");
const router = express.Router();
const { checkAuthorization } = require("../middleware/checkAuthorization");
const commentsRoutes = require('./comments');

const {
  getAllPosts,
  getPersonalizedFeed,
  getPostByTitle,
  getPostDetails,
  getPostStats,
  getPostImages,
  postBlogPost,
  putPost,
  likePost,
  ratePost,
  gainPostAccess,
  deletePost,
} = require("../controllers/posts");

router.get("/posts", getAllPosts);
router.get("/posts/feed", checkAuthorization, getPersonalizedFeed);
router.get("/stats", checkAuthorization, getPostStats);
router.get("/:postTitle", getPostByTitle);
router.get("/:postId/details", getPostDetails);
router.get("/:postId/images", getPostImages);
router.post("/", checkAuthorization, postBlogPost);
router.put("/:postId", checkAuthorization, putPost);
router.put("/:postId/like", checkAuthorization, likePost);
router.put("/:postId/rate", checkAuthorization, ratePost);
router.put("/:postTitle/access", checkAuthorization, gainPostAccess);
router.delete("/:postId", checkAuthorization, deletePost);

router.use('/:postId/comments', commentsRoutes);

module.exports = router;