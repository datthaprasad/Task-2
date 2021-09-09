const express = require('express');

const User = require('../models/user')
const Message = require('../models/message')
const auth = require('../middleware/auth');
const { isLogedIn, messageUpdate } = require('../helper/userAccountHelper');

const router = new express.Router()

//student chat with course teacher
router.get('/chatWithTeacher:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student')
        const from = await User.findById(req.user._id);
        const to = await User.findById(req.params.id.split(":")[1]);//teacher id 
        const course = req.params.id.split(":")[2];//course

        if (!to)
            throw new Error("Teacher is not provided for this course, try again after some time");

        const messages = await Message.find({ teacher: to._id, student: from._id })

        if (messages.length === 0) //empty messages
            return res.render('chat', {
                from,
                to,
                course,
                messages,
                teacherId: to._id,
                studentId: from._id,
                myId: req.user._id
            });

        await messageUpdate(messages, from, to);

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
        res.status(400).send("Bad Request, " + e)
    }
})

//For teacher chat with their students
router.get('/chatWithStudents:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        const from = await User.findById(req.user._id);

        const to = await User.findById(req.params.id.split(":")[1]);//student id 
        const course = req.params.id.split(":")[2];//course

        if (!to) throw new Error("Students Not found")

        const messages = await Message.find({ teacher: from._id, student: to._id })

        if (messages.length === 0) //empty messages
            return res.render('chat', {
                from,
                to,
                course,
                messages,
                teacherId: from._id,
                studentId: to._id,
                myId: req.user._id
            });

        await messageUpdate(messages, from, to);

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
        res.status(400).send("Bad Request, " + e)
    }
})

module.exports = router;