const express = require('express');
const User = require('../models/user')
const Course = require('../models/course')
const auth = require('../middleware/auth');
const courseValidate = require('../helper/courseValidate')
const router = new express.Router();


router.get('/viewMyCourses', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        await req.user.populate({ path: 'courses' }).execPopulate();
        res.render('myCourses', { courses: req.user.courses, user: req.user, teacher: true });
    }
    catch (e) {
        res.status(400).send("error " + e)
    }

})

//report update on daily completion
router.get('/submitReport:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        res.render('submitReport', course)
    } catch (e) {
        res.status(400).send("error " + e)
    }
})

router.post('/submitReport:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        if (courseValidate(req.body.completed) === 1) {
            const course = await Course.findById(req.params.id.replace(":", ""));
            course.completedDuration = parseFloat(course.completedDuration) + parseFloat(req.body.completed);

            if (parseFloat(course.completedDuration) > parseFloat(course.duration))
                return res.status(400).send("error : completed time is more than duration");
            course.save();
            res.redirect('/viewMyCourses')
        }
    }
    catch (e) {
        res.status(400).send("error " + e)
    }

})

//create test

router.get('/createTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));

        res.render('createTest', course)
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})


router.post('/createTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (!course.test)
            return res.send('Test is not scheduled');
        course.questions = req.body;
        await course.save();
        res.redirect('/viewMyCourses')

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//students list yet to update
router.get('/studentsList:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher' && req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN/TEACHER, Sorry")
    try {
        //get students list as students
        let students = [];
        let studentsInCourse = await Course.findById(req.params.id.replace(":", ""), { _id: 0, students: 1 });
        studentsInCourse = studentsInCourse.students;
        var bar = new Promise((resolve, reject) => {
            studentsInCourse.forEach(async (data, index, studentsInCourse) => {
                let tempStudent = await User.findById(data.studentId);
                tempStudent.marks = data.marks;
                tempStudent.testAttempt = data.testAttempt;
                students.push(tempStudent);
                if (index === studentsInCourse.length - 1) resolve()
            })
        });
        await bar;
        console.log(students);
        res.render('studentsList', { students })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

module.exports = router;