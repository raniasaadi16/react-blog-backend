const mongoose = require('mongoose'); 
const Comment = require('./Comment');

var postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true,'post must have a title'],
        unique:[true,'the title must be unique'],
    },
    content:{
        type:String,
        required:[true, 'post must have a content']
    },
    likeCount:{
        type: [String]
    },
    picture: {
        type: String,
        required: [true, 'you must add an image']
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref:'User',
        required:[true, 'you must specify the user']
    },
    category:{
        type:mongoose.Schema.ObjectId,
        ref: 'Category',
        required:[true, 'you must specify the category']
    }
},
{ timestamps: true },
{
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
}
);

postSchema.post('remove', async function(doc,next){
    await Comment.deleteMany({post: doc.id});
    next();
});

postSchema.virtual('likes').get(function(){
    return this.likeCount.length;
})

//Export the model
module.exports = mongoose.model('Post', postSchema);