const express = require('express');
const usersController = require('../controller/usersController');
const authController = require('../controller/authController');
const { uploadPhoto } = require('../utils/uploadPhotos');
const router = express.Router();


router.post('/login', authController.login); //
router.get('/logout', authController.logout);//
router.route('/signup').post(authController.signup);//
router.route('/profile').patch(authController.protect, uploadPhoto, usersController.profile);//
router.get('/getMe',authController.protect, authController.getMe);
router.patch('/updateMe',authController.protect, authController.updateMe);// 
router.delete('/deleteMe',authController.protect, authController.deleteMe);
router.patch('/updatePassword',authController.protect, authController.updatePass);// 
router.post('/forgetPassword', authController.forgetPassword);//
router.get('/ressetPassword/:token', authController.ressetPasswordGet);// 
router.patch('/ressetPassword/:token', authController.ressetPasswordUpdate);// 
router.get('/activateAccount/:activeToken', authController.activateAccount);//
router.post('/resendEmailToken', authController.resendEmailToken);// -
router.patch('/updateEmail',authController.protect, authController.updateEmail);// 
router.patch('/confirmNewEmail/:token', authController.confirmNewEmail);//

router.route('/isLoggedin').get(authController.isLoggedin, authController.getCurrentUser);//

router.route('/').get(authController.protect,authController.adminAction,usersController.getAllUsers)//.post(usersController.createUser);
router.route('/:id').get(usersController.getUser).delete(authController.protect,authController.adminAction, usersController.deleteUser);




module.exports = router