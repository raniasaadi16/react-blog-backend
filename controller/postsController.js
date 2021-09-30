const Post = require('../models/Post');
const Category = require('../models/Category');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../utils/cloudinary');

exports.getAllPosts = catchAsync(async (req,res,next) =>{
    let query;
    const queryObj = {...req.query};
    const exludedFields = ['page', 'sort', 'limit'];
    exludedFields.forEach(el => delete queryObj[el]);
    query = Post.find(queryObj);
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    }
    if(req.query.limit){
        query = query.limit(parseInt(req.query.limit))
    }

    const posts = await query.populate('user category','firstName lastName name');
    res.status(200).json({
        status: 'success',
        result: posts.length,
        data: {
            posts
        }
    })
   
});

exports.createPost = catchAsync(async (req,res,next) =>{
    const { title, content, category } = req.body;
    const user = req.user.id;
    if(!title || !content || !category) return next(new appError('missed field!', 400));
    let picture;
    // for creating the post with category name not the id
    const categoryVar = await Category.findOne({name: category});
    if(!categoryVar) return next(new appError('no gategory withthis name!',404));
    const categoryId = categoryVar._id;
    try{
        if(req.file){
            const result = await cloudinary.uploader.upload(req.file.path);
            picture = result.secure_url;
        }        
    }catch(err){
        return next(new appError('something went very wrong',500));
    }
    const post = await Post.create({title,content,category: categoryId,user,picture});

    //const post = await Post.create({title,content,category,user});


    res.status(201).json({
        status: 'success',
        message: 'post created succussfully!',
        data: {
            post
        }
    })
   
});

exports.getPost = catchAsync(async (req,res,next)=>{
    const post = await Post.findById(req.params.id).populate('user','firstName lastName picture about').populate('category', 'name');

    if(!post) return next(new appError('this post not exist!', 404));

    res.status(200).json({
        status: 'success',
        data: {
            post
        }
    })
});
//*******************FILTER OBJ FUNCTION*****************/
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj
};

exports.updatePost = catchAsync(async (req,res,next)=>{
    let fields = filterObj(req.body,'title', 'content','category');
    const findPost = await Post.findById(req.params.id);
    if(!findPost) return next(new appError('this post not exist!', 404));

    // dont foreget to recheck this when you add a populate middleware //  && req.user.role !== 'admin' admin cant update the post of someone else he can just delete post
    if(`${findPost.user}` !== `${req.user.id}`) return next(new appError('you are not authorize to do that!',401));
    try{
        if(req.file){
            const result = await cloudinary.uploader.upload(req.file.path);
            fields.picture = result.secure_url;
        }
    }catch(err){
        console.log(err)
    }
    
    const updatedPost = await Post.findByIdAndUpdate( req.params.id, fields,{new: true, runValidators: true});
    const post = await Post.findById(updatedPost._id).populate('user','firstName lastName picture about').populate('category', 'name');
    res.status(200).json({
        status: 'success',
        message: 'post updated successfully',
        data: {
            post
        }
    })
});

exports.deletePost = catchAsync(async (req,res,next)=>{
    const post = await Post.findById(req.params.id);
    if(!post) return next(new appError('this post not exist!', 404));

    // dont foreget to recheck this when you add a populate middleware
    if(`${post.user}` !== `${req.user.id}` && req.user.role !== 'admin') return next(new appError('you are not authorize to do that!',401));

    await post.remove();
    res.status(200).json({
        status: 'success',
        message: 'post deleted successfully',
        data: {
            post
        }
    })
});

exports.likePost = catchAsync(async (req,res,next)=>{
    const user = req.user;
    const post = await Post.findById(req.params.id).populate('category', 'name').populate('user', 'firstName lastName picture about');
    if(!post) next(new appError('no post found with this id!', 404));


    if(post.likeCount.includes(user.id)){
        // dislike the post
        post.likeCount = post.likeCount.filter(id => id !== user.id)
    }else{
        // like it
        post.likeCount.push(user.id)
    };
    await post.save({ validateBeforeSave: false });

    const likes = post.likeCount.length;

    res.status(200).json({
        status: 'success',
        data: {
            post,
            likes
        }
    })
})