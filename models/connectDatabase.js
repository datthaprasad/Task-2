const mongoose=require('mongoose');
const {MONGODB_URL}=require('../config/setting')

mongoose.connect(MONGODB_URL,
        {
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useFindAndModify:false,
            useCreateIndex:true
    }).then(()=>{
        console.log("database connected");
    }).catch((e)=>{
        console.log("database disconnected, Check your internet");
});


module.exports=mongoose;