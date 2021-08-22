const errorMessage=(e,res,m)=>{
    let message;

            try{
                message=e.errors[Object.keys(e["errors"])[0]].properties.reason.message
            }
            catch(err){
                if(String(e).includes('email_1 dup key'))
                    message="Email already used"
                else
                console.log(err);
                    message=m;
            }

            res.status(400).send(message)
}

module.exports=errorMessage;