const express = require('express');
const User = require('../models/user')
const Course = require('../models/course')
const Message = require('../models/message')
const auth = require('../middleware/auth');
const moment = require('moment');
const router = new express.Router()

router.get('/chatWithTeacher:id', auth, async (req, res) => {

    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student' && req.user.role != 'teacher')
        return res.status(500).send("you are not STUDENT, Sorry")
    try {
        const from = await User.findById(req.user._id);
        let to;
        let course;
        try {
            to = await User.findById(req.params.id.split(":")[1]);//teacher id 
            course = req.params.id.split(":")[2];//course
        }
        catch (error) {
            return res.status(500).send("Teacher is not provided for this course, try again after some time")
        }

        const messages = await Message.find({ teacher: to._id, student: from._id })
        if (messages.length === 0)
            return res.render('chat', {
                from,
                to,
                course,
                messages,
                teacherId: to._id,
                studentId: from._id,
                myId: req.user._id
            });
        const messageUpdate = new Promise(async (resolve, reject) => {
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
        await messageUpdate;

        res.render('chat', {
            from,
            to,
            course,
            messages,
            teacherId: to._id,
            studentId: from._id,
            myId: req.user._id
        });
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})


router.get('/chatWithStudents:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student' && req.user.role != 'teacher')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        const from = await User.findById(req.user._id);
        let to;
        let course;
        try {
            to = await User.findById(req.params.id.split(":")[1]);//student id 
            course = req.params.id.split(":")[2];//course
        }
        catch (error) {
            return res.status(500).send("something went wrong " + error)
        }

        const messages = await Message.find({ teacher: from._id, student: to._id })
        if (messages.length === 0)
            return res.render('chat', {
                from,
                to,
                course,
                messages,
                teacherId: from._id,
                studentId: to._id,
                myId: req.user._id
            });
        const messageUpdate = new Promise(async (resolve, reject) => {
            await messages.forEach((message, index, messages) => {
                if (from._id.toString() != message.from.toString()) {
                    message.recieved = true;
                    message.sentBy = to.name;
                    message.date = moment(message.createdAt).format('h:mm a, D-M-YYYY')
                }
                else {
                    message.recieved = false;
                    message.sentBy = from.name;
                    message.date = moment(message.createdAt).format('h:mm a, D-M-YYYY')
                }
                if (index === messages.length - 1) {
                    resolve();
                }
            })
        })
        await messageUpdate;

        res.render('chat', {
            from,
            to,
            course,
            messages,
            teacherId: from._id,
            studentId: to._id,
            myId: req.user._id
        });
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})


module.exports = router;