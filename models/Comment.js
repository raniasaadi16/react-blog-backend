const mongoose = require('mongoose'); 

// Declare the Schema of the Mongo model
var commentSchema = new mongoose.Schema({
    content:{
        type:String,
        required:[true,'you must write something!']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref: 'User',
        required:[true,'you must specify the user']
    },
    post:{
        type:mongoose.Schema.ObjectId,
        ref: 'Post',
        required:[true,'you must specify the post']
    }
},{ timestamps: true }
);

//Export the model
module.exports = mongoose.model('Comment', commentSchema);