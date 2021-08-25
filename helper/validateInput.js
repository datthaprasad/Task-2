const validator=require('validator');

const inputValidation=(req,res)=>{
    if(req.body.name&&!String(req.body.name).match(/^[a-zA-Z_]+$/)){
        return res.status(401).send("Username must have only alphabets and _");
    }
    else if(req.body.phone&&!validator.isMobilePhone(String(req.body.phone),"en-IN")&&(parseFloat(req.body.phone) == parseInt(req.body.phone)) && !isNaN(req.body.phone)){
        return res.status(401).send("Mobile is not valid");

    }
    else if(req.body.age&&req.body.age<0)
            return res.status(401).send("Age is invalid");

    else  if(req.body.gender&&req.body.gender!="male"&&req.body.gender!="female"&&req.body.gender!="other")
            return res.status(401).send("gender is invalid");

    else if(req.body.email&&!validator.isEmail(req.body.email))
            return res.status(401).send("Email is invalid");

    else if(req.body.password&&!validator.isStrongPassword(req.body.password))
            return res.status(401).send("Password is not strong (use Uppercase, Lowercase, Symble, Integer and minimum length of 8")

    else return 1
    
}

module.exports=inputValidation