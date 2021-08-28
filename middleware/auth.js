const jwt=require('jsonwebtoken')
const User=require('../models/user');
const {SECRET}=require('../config/setting')

const auth=async (req,res,next)=>{
    try{
    const verify=jwt.verify(req.cookies.authToken,SECRET);
    const user=await User.findOne({_id:verify._id,'tokens.token':req.cookies.authToken})

    if(!user)
        throw new Error()

    req.user=user;
    req.token=req.cookies.authToken;
    next();
    }
    catch(e){
        // res.status(401).send("Please create or login to account ")//
        req.user={};
        next();
    }
}

module.exports=auth;    