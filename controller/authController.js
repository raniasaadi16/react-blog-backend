const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// if user doesnt confirm his email after 20 days the account will be deleted automaticly , good or no???

//*******************PROTECT*****************/
exports.protect = catchAsync(async (req,res,next)=>{
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];   
    }else if(req.cookies.jwt) {
        token = req.cookies.jwt
    };

    // CHECK IF TOKEN EXIST
    if(!token) return next(new appError('you must loggin',401));
    // CHECK IF TOKEN IS CORRECT
    let decoded;
    jwt.verify(token, process.env.JWT_SECRET,(err,user)=>{
        if(err) return res.status(401).json('token not valid !')
        decoded = user
    });

    // CHECK IF USER STILL EXIST
    const user = await User.findById(decoded.id);
    if(!user) return next(new appError('user no longer exist , please login again', 404));
    
    // CHECK IF PASSWORD WAS CHANGED AFTER THE TOKEN WAS ISSUD
    if(user.passwordChangedAfter(decoded.iat)){
        return next(new appError('User recently changed password! please login again ',401));
    }
    
    req.user = user; 

    next();

});
//*******************ADMIN ACTION*****************/
exports.adminAction = (req,res,next) => {
    if(req.user.role !== 'admin') return next(new appError('you are not authorizate to do that !',401));
    next();
};
//*******************LOGIN*****************/
exports.login = catchAsync(async (req,res,next)=>{
    const {email, password} = req.body;
    if(!email || !password) return next(new appError('you must enter all fields', 400));

    const user = await User.findOne({email}).select('+password');
    // CHECK IF USER EXIST
    if(!user || !await user.checkPassword(user.password, password)) return next(new appError('email or password wrong', 400));
    // CHECK IF USER IS ACTIVATED
    if(!user.active) return next(new appError('you must active your account first', 400));
    // REGISTER THE TIME OF LOGIN
    await User.findByIdAndUpdate(user.id,{lastTimeLogedin: Date.now()});
    // LOGIN THE USER WITH NEW TOKEN
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true,
        secure : true
    };
    //if(req.secure || req.headers('x-forwarded-proto')=== 'https') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        }
    })

});
//*******************LOGOUT*****************/
exports.logout = catchAsync(async (req,res,next)=>{
    const cookieOption = {
        expires: new Date(Date.now() + 10*1000),
        httpOnly: true,
        secure : true
    };
    //if(req.secure || req.headers('x-forwarded-proto')=== 'https') cookieOption.secure = true;
    res.cookie('jwt', 'logout', cookieOption);
    res.status(200).json({status: 'success'})
})
//*******************SINGUP*****************/
exports.signup = catchAsync(async (req,res,next)=>{
    const { firstName, lastName, password, passwordConfirm, email} = req.body;
    const newUser = await User.create({
        firstName,lastName,password,passwordConfirm,email
    });

    try{
        // GENERATE EMAIL TOKEN FOR ACTIVATE ACCOUNT
        const emailToken = newUser.generateRandomEmailToken();
        // SENDING EMAIL
        //const resetURL = `${req.protocol}://${req.get('host')}/api/users/activateAccount/${emailToken}`;
        const resetURL = `https://www.raniadev-blog.tk/activateAccount/${emailToken}`;
        //const message = `welcome to your account!,please go to this url to activate your account : ${resetURL}`;
        // sendEmail(newUser.email,'activate your account',message);
        await new sendEmail(newUser,resetURL).sendWelcome();
        await newUser.save({ validateBeforeSave: false });

        res.status(201).json({
            status: 'success',
            message:'token sent to email',
            data: {
                newUser,
                emailToken
            }
        })
    }catch(err){
        console.log(err)
        return next(new appError('There was an error sending the email, try again',500))
    }
    
    
});
//*******************ACTIVATE ACCOUNT*****************/
exports.activateAccount = catchAsync(async (req,res,next)=>{

    const user = await User.findOne({activeToken: req.params.activeToken, activeTokenExpire: {$gt: Date.now()}});
    // CHECK IF USER EXIST
    if(!user) return next(new appError('the token is invalid or expired',400));
    // CHECK IF USER IS ACTIVATED
    if(user.active) return next(new appError('your account is active, please try to login!',400));

    // ACTIVATE THE USER ACCOUNT
    user.active = true;
    user.activeToken = undefined;
    user.activeTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'your account is active! you can login now',
        
    })
});
//*******************RESEND EMAIL TOKEN*****************/
exports.resendEmailToken = catchAsync(async (req,res,next)=>{
    if(!req.body.email) return next(new appError('you must provide your email!',400));
    const user = await User.findOne({email: req.body.email})
    // CHECK IF USER EXIST
    if(!user) return next(new appError('no account with this email!',400));
    // CHECK IF USER IS ACTIVATED
    if(user.active) return next(new appError('you account is already active!,please try to login',400));

    
    try{
        // GENERATE EMAIL TOKEN
        const emailToken = user.generateRandomEmailToken();
        // SEND EMAIL
        const resetURL = `https://www.raniadev-blog.tk/activateAccount/${emailToken}`;
        //const message = `welcome to your account!,please go to this url to activate your account : ${resetURL}`;
        await new sendEmail(user,resetURL).sendWelcome();
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message:'token sent to email',
            data: {
                user,
                emailToken
            }
        })
    }catch(err){
        return next(new AppError('There was an error sending the email, try again',500))
    }
});
//*******************FILTER OBJ FUNCTION*****************/
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj
};
//*******************GET ME*****************/
exports.getMe = catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.user.id);
    res.status(200).json({
        status: 'success',
        data: user
    })
});
//*******************DELETE ME*****************/
exports.deleteMe = catchAsync(async (req,res,next)=>{
    const {password} = req.body;
    if(!password) return next(new appError('you must enter your password!',400));
    const user = await User.findById(req.user.id).select('+password');
    // CHECK IF PASSWORD IS CORRECT
    if(!await user.checkPassword(user.password, password)) return next(new appError('wrong password!',400));
    // DELETE USER
    await user.remove();

    res.status(204).json({
        status: 'success',
        data: null
    });
});
//*******************UPDATE ME*****************/
exports.updateMe = catchAsync(async (req,res,next)=>{
    // ALLOWED FIELDS
    const fields = filterObj(req.body,'firstName', 'lastName','picture','facebook','behance','instagram','about');
    if(req.body.password || req.body.passwordConfirm) return next(new appError('this route is not for updating your password!',400));
    if(req.body.email) return next(new appError('this route is not for updating your email!',400));
    // UPDATE USER DATA
    const user = await User.findByIdAndUpdate(req.user.id, fields, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        message: 'informations updated succussfully',
        data: {
            user
        }
    })
});
//*******************UPDATE EMAIL*****************/
// user must tab the new email and the password,the a confirmation email will be send, if he confirm his email then the email will be chenged and login with new token,if not the email will not be updating!
// resend verification email!
exports.updateEmail = catchAsync(async (req,res,next)=>{
    const {newEmail, password} = req.body;
    if(!newEmail || !password) return next(new appError('missed field!',400));
    const user = await User.findById(req.user.id).select('+password');
    // CHECK IF PASSWORD IS CORRECT
    if(!await user.checkPassword(user.password, password)) return next(new appError('wrong password!',400));
    console.log(user.email);
    // CHECK IF THE USER IS ALREADY CONFIRM HIS NEW ADRESS 
    if(user.email === newEmail) return next(new appError(`you are alredy logged in with this email ${newEmail} please try another one, new email and the old one musnt be the same!`,400));
    // CHECK IF THE NEW EMAIL DOESNT BELONG TO ANOTHER ACCOUNT
    if(await User.findOne({email: newEmail})) return next(new appError('ther is an account with this email!'));


    try{
        // GENERATE NEW EMAIL CONFIRMATION TOKEN
        const token = user.generateRandomNewEmailToken();
        // SAVE THE NEW EMAIL TO A TEMPORARY FIELD IN DATABASE AND SEND TOKEN VIA EMAIL
        user.newEmail = newEmail;
        const resetURL = `https://www.raniadev-blog.tk/confirmNewEmail/${token}`;
        await new sendEmail(user,resetURL).sendConfirmNewEmail();
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: `you need to confirm your new email (token will be expired after 15min),once you confirm the new adress ${newEmail} the data will be updating`,
            data: {user}
        })
    }catch(err){
        return next(new AppError('There was an error sending the email, try again',500))
    }    
});
//*******************CONFIRM NEW EMAIL*****************/
exports.confirmNewEmail = catchAsync(async (req,res,next)=>{
    const emailToken = req.params.token;
    const user = await User.findOne({newEmailToken: emailToken, newEmailTokenExpire: {$gt: Date.now()}});
    // CHECK IF TOKEN IS VALID
    if(!user) return next(new appError('token invalid or expired!',400));

    const newEmail = user.newEmail;
    // UPDATE THE EMAIL
    user.email = newEmail;
    user.newEmailToken = undefined;
    user.newEmailTokenExpire = undefined;
    user.newEmail = undefined;
    await user.save({ validateBeforeSave: false });
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true,
        secure : true
    };
    //if(req.secure || req.headers('x-forwarded-proto')=== 'https') cookieOption.secure = true;
    res.cookie('jwt', token, cookieOption);

    res.status(200).json({
        status: 'success',
        message: 'your email is changed successfully',
        data: {
            user
        }
    })
})
//*******************UPDATE PASSWORD*****************/
exports.updatePass = catchAsync(async (req,res,next)=>{
    const {currentPass, password, passwordConfirm} = req.body;
    if(!currentPass || !password || !passwordConfirm) return next(new appError('missed field!',400))
    const user = await User.findById(req.user.id).select('+password');
    // CHECK IF CURRENT PASSWORD FIELD VALUE IS CORRECT
    if(!await user.checkPassword(user.password, currentPass)) return next(new appError('wrong current password !',400));

    // UPDATE PASSWORD
    user.password = password;
    user.passwordConfirm = passwordConfirm;   
    await user.save();
    // LOGIN THE USER WITH NEW TOKEN
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true,
        secure : true
    };
    //if(req.secure || req.headers('x-forwarded-proto')=== 'https') cookieOption.secure = true;
    res.cookie('jwt', token, cookieOption);

    res.status(200).json({
        status: 'success',
        message: 'password updated successfully',
        data: {
            user
        }
    })
});
//*******************FORGET PASSWORD*****************/
exports.forgetPassword = catchAsync(async (req,res,next)=>{
    if(!req.body.email) return next(new appError('please enter your email!', 400));

    const user = await User.findOne({email: req.body.email});
    // CHECK IF USER EXIST
    if(!user) return next(new appError('no account with this email!'))


    try{
        // GENERATE PASSWORD TOKEN AND SEND EMAIL
        const resetToken = user.generateRandomPassToken();
        const resetURL = `https://www.raniadev-blog.tk/ressetPassword/${resetToken}`;
        await new sendEmail(user,resetURL).sendPasswordReset();
        // by doing : this.passwordResetToken=..... we update the document so we need to save it
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            message:'success',
            message: 'token send to email!',
            data: {
                user: user.email,
            }
        })
    }catch(err){
        return next(new AppError('There was an error sending the email, try again',500))
    } 
});
//*******************RESSET PASSWORD GET*****************/
exports.ressetPasswordGet = catchAsync(async (req,res,next)=>{
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordToken: resetToken, passwordTokenExpire: {$gt: Date.now()}});
    // CHECK IF TOKEN IS VALID
    if(!user) return next(new appError('token invalid or expired!',400));

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
});
//*******************RESSET PASSWORD UPDATE*****************/
exports.ressetPasswordUpdate = catchAsync(async (req,res,next)=>{
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordToken: resetToken, passwordTokenExpire: {$gt: Date.now()}});
    // CHECK IF TOKEN IS VALID
    if(!user) return next(new appError('token invalid or expired!',400));

    // UPDATE PASSWORD
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;   
    user.passwordToken = undefined;
    user.passwordTokenExpire = undefined;
    await user.save();
    // LOGIN USER WITH NEW TOKEN
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
    const cookieOption = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true,
        secure : true
    };
    //if(req.secure || req.headers('x-forwarded-proto')=== 'https') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption);

    res.status(200).json({
        status: 'success',
        message: 'password updated successffuly',
        data: {
            user        
        }
    })
});
//*******************IS LOGGEDIN*****************/
exports.isLoggedin = async (req,res,next)=>{
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            let decoded;
            jwt.verify(req.cookies.jwt, process.env.JWT_SECRET,(err,user)=>{
                if(err) return next();
                decoded = user
            });
            
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.passwordChangedAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            req.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.getCurrentUser = catchAsync(async (req,res,next)=>{
   // console.log(req.user)
    if(req.user){
        res.status(200).json({
            data:{
                user: req.user,
                isAuth: true
            }
        })
    }else{
        res.status(200).json({
            data: {
                user: null,
                isAuth: false
            }
        })
    }
})



