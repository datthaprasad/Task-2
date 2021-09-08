const express = require('express');

const User = require('../models/user')
const auth = require('../middleware/auth')
const errorMessage = require('../helper/errorHelper')
const validateInput = require('../helper/validateInput');
const inputValidation = require('../helper/validateInput');

const router = new express.Router();

router.post('/signup', async (req, res) => {
    try {
        if (validateInput(req, res) != 1) return;

        if (req.body.password != req.body.confirm_password)
            return res.send("Passwords are not matching")

        const user = new User(req.body)
        const token = await user.generateAuthToken();
        await res.cookie(`authToken`, token, {
            maxAge: 30 * 24 * 60 * 60 * 1000,//to store 30 days
            secure: true,
            httpOnly: true,
            sameSite: 'lax'
        });

        res.status(201).redirect('/')
    }
    catch (e) {

        errorMessage(e, res, "signup failed");
    }

})

router.get('/login', async (req, res) => {
    const { email, password } = req.query;
    debugger
    try {
        const user = await User.findByCredentials(email, password)

        const token = await user.generateAuthToken();

        if (user.role!='admin'&&(!user.loginDate||!(user.loginDate.getFullYear() === new Date().getFullYear() && user.loginDate.getDate() === new Date().getDate() && user.loginDate.getMonth() === new Date().getMonth()))) {
            user.xp += 1;
            if (user.xp >= 100) {
                user.level += user.xp / 100;
                user.xp = user.xp % 100;
                
            }
            user.loginDate = new Date();
        }
        await user.save();
        res.cookie(`authToken`, token, {
            maxAge: 30 * 24 * 60 * 60 * 1000,//to store 30 days
            secure: true,
            httpOnly: true,
            sameSite: 'lax'
        });
        res.redirect('/')

    } catch (e) {
        res.status(400).send(String(e).split(": ")[1])
        // errorMessage(e,res,"Login Failed")
    }
})

router.get('/logout', auth, async (req, res) => {
    try {
        if (!req.user.name)
            return res.status(400).send('please login or create account')
        req.user.tokens = req.user.tokens.filter((token) => req.token != token.token);
        req.user.save();
        res.clearCookie();
        res.redirect('/');

    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.get('/logout/all', auth, async (req, res) => {
    try {
        if (!req.user.name)
            return res.status(400).send('please login or create account')
        req.user.tokens = [];
        req.user.save();
        res.clearCookie();
        res.redirect('/')
    }
    catch (e) {
        res.status(400).send(e)
    }
})

router.post('/edit', auth, async (req, res) => {

    if (!req.user.name)
        return res.status(400).send('please login or create account')
    const updates = Object.keys(req.body)
    const allowedUpdates = ['userName', 'name', 'email', 'password', 'gender', 'phone', 'age', 'confirm_password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    if (validateInput(req, res) == 1)


        try {
            updates.forEach((update) => {
                if (req.body[update] && update != "confirm_password")
                    req.user[update] = req.body[update]
            })
            await req.user.save()

            res.redirect('/')
        } catch (e) {
            errorMessage(e, res, "EDiting profile failed")
        }
})


router.post('/reset', auth, async (req, res) => {

    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.body.password != req.body.confirm_password)
        return res.status(400).send("Passwords are not matching")
    else {
        try {
            if (inputValidation(req, res) == 1) {
                const user = req.user;
                user.password = req.body.password;
                await user.save();

                res.redirect('/')
            }
        } catch (e) {
            errorMessage(e, res, "password reset failed")
        }
    }
})


router.post('/forgotPassword', async (req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'confirm_password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    if (req.body.password != req.body.confirm_password)
        return res.status(401).send({ error: "Password is not matching with confirm password" })

    const { email, name } = req.body;

    try {
        const user = await User.findOne({ email })

        if (user.name === name) {
            user.password = req.body.password;
            await user.save();
            const token = await user.generateAuthToken();
            res.cookie(`authToken`, token, {
                maxAge: 30 * 24 * 60 * 60 * 1000,//to store 30 days
                secure: true,
                httpOnly: true,
                sameSite: 'lax'
            });
        }
        else {
            return res.status(400).send("wrong name")
        }
        res.redirect('/')
    } catch (e) {
        errorMessage(e, res, "User Verification Failed")
    }

})

//delete account
router.get('/deleteAccount', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    try {
        const user = await User.findByIdAndDelete(req.user._id);

        await res.clearCookie();
        res.redirect('/')
    }
    catch (err) {
        res.status(400).send(err)
    }

})

module.exports = router;