const courseValidate=(duration)=>{
    if(!duration.match(/^([0-9]+[.])?[0-9][0-9]$/))
        throw new Error('Hours contains wrong values')
    else return 1
}

module.exports=courseValidate;