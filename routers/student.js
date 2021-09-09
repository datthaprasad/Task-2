const express = require('express');

const Course = require('../models/course')
const auth = require('../middleware/auth');
const { isLogedIn } = require('../helper/userAccountHelper');
const {
    findNewCourses,
    findJoinedCourses,
    updateRating,
    isQuestionsAvailable,
    isAssignmentAvailable,
    isEligibleForCertificate,
    getCertificate,
    isTestAttempted,
    checkModule,
    calculateTestScore,
    testMarksUpdate,
    calculateAssignmentScore,
    assignmentUpdate,
    checkAssignmentCompleted
} = require('../helper/studentHelper');
const { MIN_MARKS } = require('../global/constants');

const router = new express.Router();

//view not joined/ new courses
router.get('/viewNewCourse', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const allCourses = await findNewCourses(req.user);
        res.render('viewNewCourses', { courses: allCourses, user: req.user, student: true })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//view joined courses
router.get('/viewJoinedCourses', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        await req.user.populate('students').execPopulate();
        let courses = req.user.students;
        if (!courses || courses.length != 0)
            findJoinedCourses(req, courses);
        else
            courses = undefined;
        return res.render('joinedCourses', { courses, user: req.user, student: true })
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//join new course
router.post('/joinCourse:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (course)
            course.students.push({ studentId: req.user._id })
        else
            throw new Error("Course Not Found")
        await course.save();
        res.redirect('/viewJoinedCourses')
    }
    catch (e) {
        res.status(400).send("Bad Request " + e)
    }
})

//give ratings
router.get('/giveRating:idAndRating', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.idAndRating.split(":")[1]);
        if (!course)
            throw new Error("Course Not Found");
        await updateRating(req, course);
        await course.save();
        res.redirect('/viewJoinedCourses')
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//attempt test page render
router.get('/attemptTest:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students=await course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        isQuestionsAvailable(course);
        res.render('testForm', course);
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//handle test answers
router.post('/attemptTest:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        await checkModule(req, course);
        const {score} = await calculateTestScore(req, course);
        const { module, testAttempt } = await testMarksUpdate(req, course, score);
        await req.user.save();
        await course.save();
        res.render('testResult', { testCompleted: (module === 4) ? true : false, failed: (score > MIN_MARKS) ? false : true, testResult: true, score, testAttempt, module, id: req.params.id.replace(":", "") })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//test result
router.get('/testResult:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        await isTestAttempted(req,course);
        res.render('testResult', {normalResult:true,assignmentCompleted:(course.students[0].assignmentCompleted===3), testCompleted: (course.students[0].module === 4), module: course.students[0].module, score: (course.students[0].marks / (course.students[0].module - 1)).toFixed(2), id: req.params.id.replace(":", ""), testAttempt: course.students[0].testAttempt })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//certificate handling
router.get('/downloadCertificate:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        isEligibleForCertificate(course);
        getCertificate(course, req, res);
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//assignmentTest page render
router.get('/attemptAssignmentTest:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (!course)
            throw new Error("Course Not Found");
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        isAssignmentAvailable(course);
        res.render('assignmentForm', course)
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//assignment test data handle
router.post('/attemptAssignmentTest:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'student');
        const course = await Course.findById(req.params.id.replace(":", ""));
        // course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        await checkAssignmentCompleted(req, course);
        const {score} = await calculateAssignmentScore(req, course);
        const { assignment } = await assignmentUpdate(req, course, score);
        await req.user.save();
        await course.save();
        res.render('testResult', { assignmentCompleted: (assignment === 3), assignment, assignmentResult: true, failed: (score > MIN_MARKS) ? false : true, testResult: true, score, id: req.params.id.replace(":", "") })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

module.exports = router;