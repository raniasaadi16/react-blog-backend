const Comment = require('../models/Comment');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllComments = catchAsync(async (req,res,next) =>{
    const comments = await Comment.find({post: req.params.postId}).populate('user', 'firstName lastName picture');
      

    res.status(200).json({
        status: 'success',
        result: comments.length,
        data: {
            comments
        }
    })
});

exports.createComment = catchAsync(async (req,res,next) =>{
    const {content} = req.body;
    const user = req.user.id;
    const post = req.params.postId
    const newcomment = await Comment.create({content,user,post});
    const comment = await Comment.findById(newcomment.id).populate('user', 'firstName lastName picture')

    res.status(201).json({
        status: 'success',
        message: 'comment created succussfully',
        data: {
            comment
        }
    })
});

exports.getComment = catchAsync(async (req,res,next) =>{
    const comment = await Comment.findOne({post: req.params.postId, _id: req.params.commentId});
    if(!comment) return next(new appError('this comment not exist!', 404));

    res.status(200).json({
        status: 'success',
        data: comment
    })
});

exports.updateComment = catchAsync(async (req,res,next) =>{
    const {content} = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if(!comment) return next(new appError('this comment not exist!', 404));
    if(`${comment.user}` !== `${req.user.id}`) return next(new appError('you are not authorize to do that!',401));
    
    const updatedComment = await Comment.findByIdAndUpdate( req.params.commentId, {content},{new: true, runValidators: true});

    res.status(200).json({
        status: 'success',
        message: 'comment updated successffully',
        data: updatedComment
    })
});

exports.deleteComment = catchAsync(async (req,res,next) =>{
    const comment = await Comment.findById(req.params.commentId);
    if(!comment) return next(new appError('this comment not exist!', 404));
    if(`${comment.user}` !== `${req.user.id}` && req.user.role !== 'admin') return next(new appError('you are not authorize to do that!',401));

    await comment.remove();
    res.status(200).json({
        status: 'success',
        message: 'comment deleted succussfully',
        data: {
            comment
        }
    })
});