const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const Post = require('./Post');
const Comment = require('./Comment');


// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:[true,'you must enter a your first name']
    },
    lastName:{
        type:String,
        required:[true,'you must enter a your last name']
    },
    email:{
        type:String,
        required:[true, 'you must enter your email'],
        unique:[true, 'there is another account with this email'],
        validate: [validator.isEmail, 'you must enter a valid email']
    },
    picture:{
        type:String,
        default: 'https://res.cloudinary.com/ddu6qxlpy/image/upload/v1627168233/iafh6yj3q0bdpthswtu3.jpg'
    },
    about:{
        type:String,
        default: ''
    },
    facebook:{
        type:String,
        default: ''
        //validate: [validator.isURL, 'this url is not valid']
    },
    instagram:{
        type:String,
        default: ''
        //validate: [validator.isURL, 'this url is not valid']
    },
    behance:{
        type:String,
        default: ''
        //validate: [validator.isURL, 'this url is not valid']
    },
    role:{
        type: String,
        default: 'user',
        enum : ['user', 'admin']
    },
    password:{
        type:String,
        required:[true,'you must enter the password'],
        select: false
    },
    passwordConfirm:{
        type:String,
        required:[true,'you must enter the password confirm field'],
    },
    active:{
        type: Boolean,
        default: false
    },
    lastTimeLogedin: Date, // in the frontend check if this field is empty redirect user to addprofile 
    passwordChangedAt: Date,
    passwordToken: String,
    passwordTokenExpire: Date,
    activeToken: String,
    activeTokenExpire: Date,
    newEmailToken: String,
    newEmailTokenExpire: Date,
    newEmail: String // we must add validation email?
});

// CHECK IF PASSWORD CONFIRM IS THE SAME WITH PASSWORD
userSchema.path('passwordConfirm').validate(function(el) {
    return el === this.password
},'Passwords are not the same')
// PRE MIDDLEWARE FOR CRYPTYNG PASS BEFORE SAVE IT
userSchema.pre('save', async function(next){
    // if we modifie other data , is not neccesary to crypt the password again
    if(!this.isModified('password')) return next(); 
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
})
// PRE MIDDLEWARE FOR ADD PASSWORDCHANGEDAT IN CASE OF UPDATYNG PASS
userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
})
// POST MIDDLEWARE FOR DELETING COMMENTS AND POSTS WHEN DELETING A USER ACCOUNT
userSchema.post('remove', async function(doc,next){
    await Comment.deleteMany({user: doc.id});
    const posts = await Post.find({user: doc.id});
    posts.map(async post => await Comment.deleteMany({post: post.id}));
    await Post.deleteMany({user: doc.id});
    next();
});
// INSTENSE METHOD FOR CHECK IF PASS IS CORRECT (I USE IT IN LOGIN CONTROLLER)
userSchema.methods.checkPassword = async (realPass, userPass)=>{
    return await bcrypt.compare(userPass, realPass)
}
// CHECK IF PASSWORD CHANGED AFTER THE TOKEN ISSUED
// jwt iat : Issued at , Identifies the time at which the JWT was issued
userSchema.methods.passwordChangedAfter = function(JWTiat){
    if(this.passwordChangedAt){
        const userpaswordchangedat = parseInt(this.passwordChangedAt.getTime() / 1000,10);
        return userpaswordchangedat > JWTiat;
    }
    return false;
}
// INSTENSE METHOD TO GENERATE A RANDOM TOKEN (I USE IT IN FORGETPASSWORD CONTROLLER)
userSchema.methods.generateRandomPassToken = function(){
    // create randome hexdicimal string
    const resetToken = crypto.randomBytes(32).toString('hex');

    // cryptded resetToken to store it to database (we should not store sensative data in crybted form)
    this.passwordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordTokenExpire = Date.now() + 10*60*1000; // will expired after 10 min
    return resetToken
}
// INSTENSE METHOD TO GENERATE A RANDOM TOKEN (I USE IT IN SINGUP CONTROLLER)
userSchema.methods.generateRandomEmailToken = function(){
    // create randome hexdicimal string
  const randomToken = crypto.randomBytes(30).toString('hex');

  this.activeToken = randomToken;
  this.activeTokenExpire = Date.now() + 10*60*1000; // will expired after 10 min
  return randomToken
}
// INSTENSE METHOD TO GENERATE A RANDOM TOKEN (I USE IT IN UPDATE EMAIL CONTROLLER)
userSchema.methods.generateRandomNewEmailToken = function(){
    // create randome hexdicimal string
  const randomToken = crypto.randomBytes(30).toString('hex');

  this.newEmailToken = randomToken;
  this.newEmailTokenExpire = Date.now() + 10*60*1000; // will expired after 10 min
  return randomToken
}

module.exports = mongoose.model('User', userSchema);