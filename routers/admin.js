const express=require('express');

const User=require('../models/user')
const auth=require('../middleware/auth')
const router=new express.Router();

router.get('/users:id',auth,async (req,res)=>{

    if(!req.user.name)
    return res.status(400).send('please login or create account')
    if(req.user.role!='admin')
        return res.status(500).send("you are not ADMIN, Sorry")

    if(req.params.id.replace(":","")!="ADMIN"&&req.params.id.replace(":","")!="TEACHER"&&req.params.id.replace(":","")!="STUDENT"&&req.params.id.replace(":","")!="USER")
        return res.status(400).send("Wrong users")

    
    const users=await User.find({role:String(req.params.id).replace(":","").toLowerCase()});
    res.render('usersList',{users,user:req.user,admin:true,role:(req.params.id).replace(":","").toUpperCase()})
})

router.get('/assignRole:id:role',auth,async (req,res)=>{
    try{

        if(!req.user.name)
            return res.status(400).send('please login or create account')
        if(req.user.role!='admin')
            return res.status(500).send("you are not ADMIN, Sorry");
        
        const id=req.params.role.split(":")[0];
        const role=req.params.role.split(":")[1];
        const user=await User.findById(id)
        user.role=role;
        await user.save();
        res.redirect('/')
    }
    catch(e){
        res.status(400).send(e)
    }
})

module.exports=router