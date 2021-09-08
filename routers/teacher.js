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
            req.user.xp += 25;
            if (req.user.xp >= 100) {
                req.user.level += parseInt(req.user.xp / 100);
                req.user.xp = req.user.xp % 100;
            }
            await req.user.save();
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
        if (req.body.type.includes('test')&&!course.tests[req.body.type])
            return res.send('Test is not scheduled');
        course.questions[req.body.type] = req.body;
        await course.save();
        req.user.xp += 25;
        if (req.user.xp >= 100) {
            req.user.level += parseInt(req.user.xp / 100);
            req.user.xp = req.user.xp % 100;
        }
        await req.user.save();
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
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        //get students list as students
        let students = [];
        let studentsInCourse = await Course.findById(req.params.id.replace(":", ""), { _id: 0, students: 1 });
        const courseName = await Course.findById(req.params.id.replace(":", ""), { _id: 0, name: 1 });
        studentsInCourse = studentsInCourse.students;
        var bar = new Promise((resolve, reject) => {
            studentsInCourse.forEach(async (data, index, studentsInCourse) => {
                let tempStudent = await User.findById(data.studentId);
                tempStudent.marks = data.marks;
                tempStudent.testAttempt = data.testAttempt;
                tempStudent.course = courseName.name;
                students.push(tempStudent);
                if (index === studentsInCourse.length - 1) resolve()
            })
        });
        if (studentsInCourse.length > 0)
            await bar;
        res.render('studentsList', { students })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

router.get('/leaveCourse:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'teacher' && req.user.role != 'admin')
        return res.status(500).send("you are not TEACHER, Sorry")
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.teacher = null;
        req.user.courseCount -= 1;
        await req.user.save();
        await course.save();
        res.redirect('/viewMyCourses')

    }
    catch (error) {
        res.status(400).send("error " + error)
    }

})

module.exports = router;