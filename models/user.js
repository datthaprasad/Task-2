const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {SECRET}=require('../config/setting')



const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,     
    },
    userName:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
    },
    gender:{
        type:String,
        lowercase:true,
        required:true,
    },
    age:{
        type:Number,
        required:true,
    },
    role:{
        type:String,
        default:'user',
        lowercase:true,
    },
    tokens:[{
        token:{
            type:String
        }
    }]
})


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('You have entered wrong credentials')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Email and Password are not matching')
    }

    return user
}

userSchema.methods.generateAuthToken=async function(){
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, SECRET,{expiresIn:"30d"})

    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token;
}


userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}



userSchema.pre("save",async function (){
    const user=this;
    if(user.isModified('password')){
        const hash=await bcrypt.hash(user.password,8);
        user.password=hash;
    }
})

const User=mongoose.model("User",userSchema)



module.exports=User;