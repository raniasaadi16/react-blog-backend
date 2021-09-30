const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const cloudinary = require('../utils/cloudinary');

exports.getAllUsers = catchAsync(async (req,res,next) =>{
  
    const users = await User.find();

    res.status(200).json({
        status: 'success',
        data: {
            users
        }
    })   
});

exports.getUser = catchAsync(async (req,res,next) =>{
  
    const user = await User.findById(req.params.id);
    if(!user) return next(new appError('no user found with this id!',404));

    res.status(200).json({
        status: 'success',
        data: {user}
    })   
});

// exports.createUser = catchAsync(async (req,res,next) =>{
  
//     const newUser = await User.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: newUser
//     })
// });

//*******************FILTER OBJ FUNCTION*****************/
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj
};

exports.profile = catchAsync(async (req,res,next)=>{
    const filterBody = filterObj(req.body, 'about', 'facebook', 'instagram', 'behance');
    //if(req.file) picture = req.file.filename;
    //console.log(req.file)
    if(req.body.email || req.body.password || req.body.lastName || req.body.firstName) return next(new appError('this route is not for update email,password,last name,first name'));
    try{
        if(req.file){
            const result = await cloudinary.uploader.upload(req.file.path);
            filterBody.picture = result.secure_url;
        }
    }catch(err){
        console.log(err)
    }
    const profilData = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        message: 'profile updated succussfully',
        data: {
            profilData
        }
    })
});

exports.deleteUser = catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.params.id);
    if(!user) return next(new appError('no user found with this id!',404));

    await user.remove();
    // send email to the user saying that your account was deleted !

    res.status(200).json({
        status: 'success',
        message: 'user deleted successfully',
        data: {
            user
        }
    })
});