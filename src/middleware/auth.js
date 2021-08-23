const jwt=require('jsonwebtoken')
const User=require('../mongoose/models/user');

const auth=async (req,res,next)=>{
    try{
    console.log(req.cookies.authToken);
    
    const verify=jwt.verify(req.cookies.authToken,'task');
    console.log(verify);
    const user=await User.findOne({_id:verify._id,'tokens.token':req.cookies.authToken})

    if(!user)
        throw new Error()

    req.user=user;
    req.token=req.cookies.authToken;
    next();
    }
    catch(e){
        res.status(401).send("Please create or login to account "+e)
    }
}

module.exports=auth;    