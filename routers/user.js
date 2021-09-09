const express = require('express');

const Course = require('../models/course')
const User = require('../models/user');
const auth = require('../middleware/auth');
const {
    updateData,
    updateValidate,
    checkTodayDate,
    passwordAndConfirmPasswordMatching,
    isLogedIn,
    errorMessage,
    inputValidation,
    xpUpdate,
    checkFutureDate
} = require('../helper/userAccountHelper');
const { LOGIN_XP, COOKIE_VALIDITY } = require('../global/constants');



const router = new express.Router();

//signup route
router.post('/signup', async (req, res) => {
    try {
        inputValidation(req);
        passwordAndConfirmPasswordMatching(req);
        const user = new User(req.body)
        const token = await user.generateAuthToken();
        await res.cookie(`authToken`, token, {
            maxAge: COOKIE_VALIDITY,//to store 30 days
            secure: true,
            httpOnly: true,
            sameSite: 'lax'
        });
        res.status(201).redirect('/')
    }
    catch (e) {
        errorMessage(e, res, "signup failed, " + e);
    }

})

//login route
router.get('/login', async (req, res) => {
    try {
        const { email, password } = req.query;
        const user = await User.findByCredentials(email, password)
        const token = await user.generateAuthToken();
        if (user.role != 'admin' && (!user.loginDate || !checkTodayDate(new Date(user.loginDate)))) {
            xpUpdate(user, LOGIN_XP);
        }
        await user.save();
        res.cookie(`authToken`, token, {
            maxAge: COOKIE_VALIDITY,//to store 30 days
            secure: true,
            httpOnly: true,
            sameSite: 'lax'
        });
        res.redirect('/');
    } catch (e) {
        errorMessage(e, res, "Login Failed, " + String(e).split(": ")[1]);
    }
})

//logut route
router.get('/logout', auth, async (req, res) => {
    try {
        isLogedIn(req)
        req.user.tokens = req.user.tokens.filter((token) => req.token != token.token);
        req.user.save();
        res.clearCookie();
        res.redirect('/');
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//logout from all devices
router.get('/logout/all', auth, async (req, res) => {
    try {
        isLogedIn(req)
        req.user.tokens = [];
        await req.user.save();
        await res.clearCookie();
        res.redirect('/')
    }
    catch (e) {
        res.status(400).send(e)
    }
})

//edit profile
router.post('/edit', auth, async (req, res) => {
    try {
        isLogedIn(req)
        const updates = updateValidate(req);
        inputValidation(req);
        await updateData(req, updates, req.user);
        await req.user.save()
        res.redirect('/')
    } catch (e) {
        errorMessage(e, res, "Editing profile failed, " + e)
    }
})

//reset password
router.post('/reset', auth, async (req, res) => {
    try {
        isLogedIn(req);
        passwordAndConfirmPasswordMatching(req);
        inputValidation(req);
        req.user.password = req.body.password;
        await req.user.save();
        res.redirect('/');
    } catch (e) {
        errorMessage(e, res, "password reset failed, " + e);
    }
})

//forgot password
router.post('/forgotPassword', async (req, res) => {
    try {
        updateValidate(req);
        passwordAndConfirmPasswordMatching(req);
        const { email, name } = req.body;
        const user = await User.findOne({ email })
        if (!user)
            throw new Error("User Not Found")

        if (user.name === name) { //question asked was name of user who forgot password
            inputValidation(req);
            user.password = req.body.password;
            await user.save();
            const token = await user.generateAuthToken();
            res.cookie(`authToken`, token, { //setting cookie
                maxAge: COOKIE_VALIDITY,//to store 30 days
                secure: true,
                httpOnly: true,
                sameSite: 'lax'
            });
        }
        else {
            return res.status(400).send("Answer for Full name is wrong !...")
        }
        res.redirect('/')
    } catch (e) {
        errorMessage(e, res, e);
    }

})

//delete account
router.get('/deleteAccount', auth, async (req, res) => {
    try {
        isLogedIn(req);
        await User.findByIdAndDelete(req.user._id);
        await res.clearCookie();
        res.redirect('/')
    }
    catch (err) {
        res.status(400).send("Bad Request, " + err);
    }
})

//schedule test
router.post('/scheduleTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin' && req.user.role != 'teacher')
        return res.status(500).send("you are not ADMIN / TEACHER, Sorry");
    try {
        const { time, type } = req.body;
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (!time) {
            course.test = undefined;
            await course.save();
            if (req.user.role === 'teacher')
                return res.redirect('/viewMyCourses')
            res.redirect('/viewCourse');
        }
        else if (checkFutureDate(new Date(time)) || checkTodayDate(new Date(time))) {
            course.tests[type] = time;
            await course.save();
            if (req.user.role === 'teacher')
                return res.redirect('/viewMyCourses')
            res.redirect('/viewCourse')
        }
        else {
            res.status(400).send("Date is not valid (It is in past)")
        }
    }
    catch (e) {
        res.status(400).send("error " + e);
    }
})

module.exports = router;