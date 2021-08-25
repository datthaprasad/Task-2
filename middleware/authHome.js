const jwt=require('jsonwebtoken')
const User=require('../models/user');

const authHome=async (req,res,next)=>{
    try{
        const verify=jwt.verify(req.cookies.authToken,'task');
        const user=await User.findOne({_id:verify._id,'tokens.token':req.cookies.authToken})
        if(!user)
            throw new Error()

        req.user=user;
        req.token=req.cookies.authToken;
        next();
        }
        catch(e){
            req.user={};
            next();
        }
}

module.exports=authHome;    