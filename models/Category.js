const mongoose = require('mongoose'); 
const Post = require('./Post');
const Comment = require('./Comment');


// Declare the Schema of the Mongo model
var categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'you must enter a name'],
        unique:[true,'the name must be unique']
    }
});

categorySchema.post('remove', async function(doc,next){
    const posts = await Post.find({category: doc.id});
    posts.map(async post => await Comment.deleteMany({post: post.id}));
    await Post.deleteMany({category: doc.id});
    next();
})

//Export the model
module.exports = mongoose.model('Category', categorySchema);