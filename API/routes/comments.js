const express = require('express');
const router = express.Router({ mergeParams: true });
const { checkAuthorization } = require("../middleware/checkAuthorization");

const {
  getPostComments,
  getReplies,
  createComment,
  createReply,
  updateComment,
  deleteComment
} = require('../controllers/comments');

router.get('/', getPostComments);
router.get('/:commentId/replies', getReplies);
router.post('/', checkAuthorization, createComment);
router.post('/:commentId/replies', checkAuthorization, createReply);
router.put('/:commentId', checkAuthorization, updateComment);
router.delete('/:commentId', checkAuthorization, deleteComment);

module.exports = router;
