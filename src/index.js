const authHome=require('./middleware/authHome')
const userRouter=require('./routers/user')
const coonect=require('./mongoose/connection/connection')

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

app.set('view engine','hbs');
app.set('views',__dirname+'/../templates/views')
hbs.registerPartials(__dirname+'/../templates/partial')



app.get('/',authHome,(req,res)=>{
    console.log(req.user);
    if(req.user)
        res.render('home',{
            user:req.user
        })
    else 
    res.render('home',{
        login:'fail'
    })
})

app.listen(port,()=>{
    console.log("listen on port "+port);
})
