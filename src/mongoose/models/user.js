const mongoose=require('mongoose');
const validator=require('validator')
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        validate(value){
            if(!String(value).match(/^[a-zA-Z_]+$/))
                throw new Error("Username must have only alphabets and _")
        }
    },
    phone:{
        type:Number,
        required:true,
        validate(value){
            if(!validator.isMobilePhone(String(value),"en-IN"))
                throw new Error("Mobile is not valid");
        }
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value))
                throw new Error("Email is invalid");
        }
    },
    password:{
        type:String,
        required:true,
        validate(value){
            if(!validator.isStrongPassword(value))
                throw new Error("Password is not strong (use Uppercase, Lowercase, Symble, Integer and minimum length of 8")
        }
    },
    gender:{
        type:String,
        lowercase:true,
        required:true,
        validate(value){
            if(value!="male"&&value!="female"&&value!="other")
                throw new Error("gender is invalid")
        }
    },
    age:{
        type:Number,
        required:true,
        validate(value){
            if(value<0)
                throw new Error("Age is invalid")
        }
    },
    role:{
        type:String,
        default:'user',
        lowercase:true,
        validate(value){
            if(value!="student"&&value!="teacher"&&value!="admin"&&value!="user")
                throw new Error("Role is invalid")
        }
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
    const token = jwt.sign({ _id: user._id.toString() }, 'task')

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



// userSchema.pre('remove', async function (next) {
//     const user = this
//     await Task.deleteMany({ author: user._id })
//     next()
// })

userSchema.pre("save",async function (){
    const user=this;
    if(user.isModified('password')){
        const hash=await bcrypt.hash(user.password,8);
        user.password=hash;
    }
})

const User=mongoose.model("User",userSchema)



module.exports=User;