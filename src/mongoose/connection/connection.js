const mongoose=require('mongoose');

mongoose.connect('mongodb://127.0.0.1/management-system',
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