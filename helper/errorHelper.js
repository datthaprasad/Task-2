const errorMessage=(e,res,m)=>{
    let message;

            try{
                // console.log(e);

                if(String(e).includes('email_1'))
                    message="Email already used";
                else
                    message=e.errors[Object.keys(e["errors"])[0]].properties.reason.message;
            }
            catch(err){
                 message=m;
            }

            res.status(400).send(message)
}


module.exports=errorMessage;