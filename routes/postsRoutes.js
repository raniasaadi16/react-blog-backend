const express = require('express');
const postsController = require('../controller/postsController');
const authController = require('../controller/authController');
const commentsRoutes = require('./CommentsRoutes');
const { uploadPhoto } = require('../utils/uploadPhotos');
const router = express.Router();

router.use('/:postId/comments', commentsRoutes);
router.route('/').get(postsController.getAllPosts).post(authController.protect, uploadPhoto, postsController.createPost);
router.route('/:id').get(postsController.getPost).patch(authController.protect, uploadPhoto, postsController.updatePost).delete(authController.protect, postsController.deletePost);
router.patch('/:id/likePost',authController.protect, postsController.likePost);


module.exports = router