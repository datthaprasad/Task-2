const express=require('express');

const User=require('../mongoose/models/user')
const auth=require('../middleware/auth')
const errorMessage=require('../utils/errorMessage')
const router=new express.Router();

router.post('/signup',auth,async (req,res)=>{

    if(req.body.password!=req.body.cpassword)
        return res.send("Passwords are not matching")

    try{
        const user = new User(req.body)
        const token = await user.generateAuthToken();
        res.cookie(`authToken`,token,{
            maxAge: 30*24*60*60*1000,//to store 30 days
            secure: true,
            httpOnly: true,
            sameSite: 'lax'
        });

        res.status(201).send({ user})
    }
    catch(e){
            errorMessage(e,res);
    }

    
})

router.get('/login',async (req,res)=>{
    const {email,password}=req.query;
    try {
        const user = await User.findByCredentials(email, password)
        
        const token=await user.generateAuthToken();
        res.cookie(`authToken`,token,{
            maxAge: 30*24*60*60*1000,//to store 30 days
            secure: true,
            httpOnly: true,
            sameSite: 'lax'
        });
        // res.send({user})
        
        res.render('home',{user})
    } catch (e) {
        res.status(400).send(String(e).split(": ")[1])
        // errorMessage(e,res,"Login Failed")
    }
})

router.get('/logout',auth,async (req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>req.token!=token.token);
        req.user.save();
        res.clearCookie();
        res.render('home')
    }
    catch(e){
        res.status(400).send(e)
    }
})

// router.get('/',auth,(req,res)=>{
//     console.log(req.user);
//     res.render('home',{
//         name:req.user.name
//     })
// })


module.exports=router;