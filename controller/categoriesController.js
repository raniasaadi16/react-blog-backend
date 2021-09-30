const Category = require('../models/Category');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllCategories = catchAsync(async (req,res,next) =>{

    const categories = await Category.find();

    res.status(200).json({
        status: 'success',
        data: {
            categories
        }
    })
});

exports.getCategory = catchAsync(async (req,res,next)=>{
    const category = await Category.findById(req.params.id);
    if(!category) return next(new appError('no category with this id !',404));

    res.status(200).json({
        status: 'success',
        data: category
    })
});

exports.createCategory = catchAsync(async (req,res,next) =>{
    const category = await Category.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            category
        }
    })
});

exports.updateCategory = catchAsync(async (req,res,next)=>{
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if(!category) return next(new appError('no category with this id !',404));

    res.status(200).json({
        status: 'success',
        message: 'category updated succussfully',
        data: category
    })
});

exports.deleteCategory = catchAsync(async (req,res,next)=>{
    const category = await Category.findById(req.params.id);
    if(!category) return next(new appError('no category with this id !',404));
    await category.remove();

    res.status(200).json({
        status: 'success',
        message: 'category deleted succussfully',
        data: {
            category
        }
    })
})