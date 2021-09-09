const validator = require('validator');
const moment = require('moment');
const { MAX_XP } = require('../global/constants');

exports.isLogedIn = (req, role) => {
    if (!req.user.name)
        throw new Error('please login or create account')
    if (role && req.user.role != role)
        throw new Error("you are not " + role.toUpperCase() + ", Sorry")
}

exports.errorMessage = (e, res, m) => {
    let message;
    try {
        if (String(e).includes('email_1'))
            message = "Email already used";
        else
            message = e.errors[Object.keys(e["errors"])[0]].properties.reason.message;
    }
    catch (err) {
        message = m;
    }
    res.status(400).send("Bad Request, " + message)
}

exports.passwordAndConfirmPasswordMatching = (req) => {
    if (req.body.password != req.body.confirm_password)
        throw new Error("Passwords are not matching")
}

exports.inputValidation = (req) => {
    if (req.body.name && !String(req.body.name).match(/^[a-zA-Z ]+$/)) {
        throw new Error("Full Name contains non alphabets");
    }
    else if (req.body.userName && !String(req.body.userName).match(/^[a-zA-Z_]+$/)) {
        throw new Error("Username must have only alphabets and _");
    }
    else if (req.body.phone && !validator.isMobilePhone(String(req.body.phone), "en-IN") && (parseFloat(req.body.phone) == parseInt(req.body.phone)) && !isNaN(req.body.phone)) {
        throw new Error("Mobile is not valid");
    }
    else if (req.body.age && req.body.age < 0)
        throw new Error("Age is invalid");
    else if (req.body.gender && req.body.gender != "male" && req.body.gender != "female" && req.body.gender != "other")
        throw new Error("gender is invalid");
    else if (req.body.email && !validator.isEmail(req.body.email))
        throw new Error("Email is invalid");
    else if (req.body.password && !validator.isStrongPassword(req.body.password))
        throw new Error("Password is not strong (use Uppercase, Lowercase, Symble, Integer and minimum length of 8")
}

exports.checkTodayDate = (date) => {
    if (new Date().getFullYear() === date.getFullYear() && new Date().getDate() === date.getDate() && new Date().getMonth() === date.getMonth())
        return true;
    else return false;
}

exports.xpUpdate = (user, reward) => {
    user.xp += reward;
    if (user.xp >= MAX_XP) {
        user.level += parseInt(user.xp / MAX_XP);
        user.xp = user.xp % MAX_XP;
    }
    user.loginDate = new Date();
}

exports.updateValidate = (req) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['userName', 'name', 'gender', 'phone', 'age', 'email', 'password', 'confirm_password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        throw new Error("Invalid Updates!..");
    }
    return updates;
}

exports.updateData = async (req, updates, user) => {
    return new Promise((resolve, reject) => {
        updates.forEach((update, index, updates) => {
            if (req.body[update] && update != "confirm_password")
                user[update] = req.body[update];
            if (index === updates.length - 1) resolve()
        })
    })
}

exports.courseValidate = (duration) => {
    if (parseInt(duration) != duration)
        throw new Error('Duration contains wrong values');
}

exports.messageUpdate = (messages, from, to) => {
    return new Promise(async (resolve, reject) => {
        await messages.forEach((message, index, messages) => {
            if (from._id.toString() != message.from.toString()) {
                message.recieved = true;
                message.date = moment(message.createdAt).format('h:mm a, D-M-YYYY');
                message.sentBy = to.name;
            }
            else {
                message.recieved = false;
                message.sentBy = from.name;
                message.date = moment(message.createdAt).format('h:mm a, D-M-YYYY');
            }
            if (index === messages.length - 1) {
                resolve();
            }
        })
    })
}

exports.timeConvert = (n) => {
    var num = n;
    var hours = (num / 60);
    var rhours = Math.floor(hours);
    var minutes = (hours - rhours) * 60;
    var rminutes = Math.round(minutes);
    return rhours + " hour(s) and " + rminutes + " minute(s).";
}

exports.checkFutureDate = (date) => {
    if (parseInt(new Date(date).getTime()) >= parseInt(new Date().getTime()))
        return true;
    else return false;
}