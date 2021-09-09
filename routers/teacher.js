const express = require('express');
const Course = require('../models/course')
const auth = require('../middleware/auth');
const { isLogedIn, courseValidate, xpUpdate } = require('../helper/userAccountHelper');
const { checkCourseCompletion, isTestScheduled, studentsList, converDurationToHours } = require('../helper/teacherHelper');
const { XP_FOR_COURSE_COMPLETION_BY_TEACHER, XP_FOR_DAILY_TEACHING, XP_FOR_CREATE_TEST } = require('../global/constants');

const router = new express.Router();

//view teaching courses
router.get('/viewMyCourses', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        await req.user.populate({ path: 'courses' }).execPopulate();
        if (req.user.courses&&req.user.courses.length>0)
            await converDurationToHours(req.user.courses);
        res.render('myCourses', { courses: req.user.courses, user: req.user, teacher: true });
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//report update on daily completion page render
router.get('/submitReport:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        const course = await Course.findById(req.params.id.replace(":", ""));
        res.render('submitReport', course)
    } catch (e) {
        res.status(400).send("Bad Request " + e)
    }
})

//report update on daily completion data handling
router.post('/submitReport:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        courseValidate(req.body.completed);
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (checkCourseCompletion(req, course))
            xpUpdate(req.user, XP_FOR_COURSE_COMPLETION_BY_TEACHER);
        else xpUpdate(req.user, XP_FOR_DAILY_TEACHING);
        await req.user.save();
        await course.save();
        res.redirect('/viewMyCourses')
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e);
    }

})

//create test page render
router.get('/createTest:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        const course = await Course.findById(req.params.id.replace(":", ""));
        res.render('createTest', course)
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//create test data handling
router.post('/createTest:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        const course = await Course.findById(req.params.id.replace(":", ""));
        isTestScheduled(req, course);
        course.questions[req.body.type] = req.body;
        await course.save();
        xpUpdate(req.user, XP_FOR_CREATE_TEST);
        await req.user.save();
        res.redirect('/viewMyCourses');
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//students list 
router.get('/studentsList:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        const students = await studentsList(req);
        res.render('studentsList', { students })
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//leave course from teaching
router.get('/leaveCourse:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'teacher');
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.teacher = null;
        req.user.courseCount -= 1;
        await req.user.save();
        await course.save();
        res.redirect('/viewMyCourses')
    }
    catch (error) {
        res.status(400).send("Bad Request, " + error)
    }
})

module.exports = router;