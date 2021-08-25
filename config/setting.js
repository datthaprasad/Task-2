const mongoose=require('mongoose');

mongoose.connect('mongodb+srv://admin:admin123@cluster0.nv7qr.mongodb.net/management-system',
        {
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useFindAndModify:false,
            useCreateIndex:true
    }).then(()=>{
        console.log("database connected");
    }).catch((e)=>{
        console.log("error"+e);
});


module.exports=mongoose;