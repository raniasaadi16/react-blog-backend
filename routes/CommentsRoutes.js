const express = require('express');
const commentsController = require('../controller/commentsController');
const authController = require('../controller/authController');
const router = express.Router({ mergeParams: true });

router.route('/').get(commentsController.getAllComments).post(authController.protect, commentsController.createComment);
router.route('/:commentId').get(commentsController.getComment).patch(authController.protect, commentsController.updateComment).delete(authController.protect, commentsController.deleteComment)


module.exports = router