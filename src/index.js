const authHome=require('./middleware/authHome')
const userRouter=require('./routers/user')
const adminRouter=require('./routers/admin')
const connect=require('./mongoose/connection/connection')

const hbs=require('hbs')
const bp=require('body-parser')
const express=require('express');
const CP=require('cookie-parser');

const app=express();
app.use(express.json())
app.use(bp.urlencoded({extended:true}))

const port=process.env.PORT || 5000;

app.use(CP())
app.use(express.static(__dirname+'/../public'))
app.use(userRouter)
app.use(adminRouter)

app.set('view engine','hbs');
app.set('views',__dirname+'/../templates/views')
hbs.registerPartials(__dirname+'/../templates/partial')



app.get('/',authHome,(req,res)=>{
    if(req.user)
        res.render('home',{
            user:req.user,
            admin:req.user.role==="admin"?true:false
        })
    else 
    res.render('home')
})

app.listen(port,()=>{
    console.log("listen on port "+port);
})




//Uncomment the following code once to register admin

// const User=require('./mongoose/models/user')

// new User({
//     name:"Admin",
//     email:"admin@example.com",
//     phone:9087654321,
//     age:22,
//     gender:"male",
//     password:"Admin@123"
// }).save();
// admin@example.com Admin@123 is already stored in databse