const express = require('express');
const categoriesController = require('../controller/categoriesController');
const authController = require('../controller/authController');
const router = express.Router();

router.route('/').get(categoriesController.getAllCategories).post(authController.protect, authController.adminAction, categoriesController.createCategory);
router.route('/:id').get(categoriesController.getCategory).patch(authController.protect, authController.adminAction, categoriesController.updateCategory).delete(authController.protect, authController.adminAction, categoriesController.deleteCategory);

module.exports = router