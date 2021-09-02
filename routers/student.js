const express = require('express');
const User = require('../models/user')
const Course = require('../models/course')
const auth = require('../middleware/auth');
const courseValidate = require('../helper/courseValidate')
const router = new express.Router();

router.get('/viewNewCourse', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        let allCourses = await Course.find({});
        await req.user.populate('students').execPopulate();
        const joinedCourses = req.user.students.map(data => data._id);
        allCourses = allCourses.filter((course) => !joinedCourses.toString().includes(course._id.toString()))
        res.render('viewNewCourses', { courses: allCourses, user: req.user, student: true })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//view joined courses
router.get('/viewJoinedCourses', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {

        await req.user.populate('students').execPopulate();
        let courses = req.user.students;


        const bar = new Promise(async (resolve, reject) => {
            courses.forEach(async (course, index, courses) => {
                if (course.test) {
                    test = new Date(course.test);
                    today = new Date();
                    if (test.getFullYear() === today.getFullYear() && test.getDate() === today.getDate() && test.getMonth() === today.getMonth())
                        course.attemptTest = true;
                }
                if (index === courses.length - 1) resolve()

            });
        })

        if (!courses || courses.length != 0)
            await bar;
        else
            courses = undefined;

        return res.render('joinedCourses', { courses, user: req.user, student: true })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//join new course
router.post('/joinCourse:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {

        const course = await Course.findById(req.params.id.replace(":", ""));

        course.students.push({ studentId: req.user._id })
        await course.save();
        res.redirect('/viewJoinedCourses')
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//give ratings
router.get('/giveRating:idAndRating', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        const course = await Course.findById(req.params.idAndRating.split(":")[1]);


        const updateRating = new Promise((async (resolve, reject) => {
            course.students.forEach((student) => {
                if (student.studentId.toString() === req.user._id.toString()) {
                    if (course.studentsCountForRating.includes(req.user._id))
                        course.totalRating -= student.rating;
                    student.rating = parseInt(req.params.idAndRating.split(":")[2])
                    resolve();
                }
            })
        }));

        await updateRating;
        if (!course.studentsCountForRating.includes(req.user._id))
            course.studentsCountForRating.push(req.user._id);
        course.totalRating += parseInt(req.params.idAndRating.split(":")[2]);
        course.rating = course.totalRating / course.studentsCountForRating.length;
        await course.save();




        res.redirect('/viewJoinedCourses')

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//attempt test
router.get('/attemptTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        if (course.students[0].testAttempt === 3)
            return res.status(400).send("You already attemptd test 3 Times")
        if (course.questions)
            res.render('testForm', course)
        else
            res.status(500).send("Questions are empty, Please contact your teacher to assign test.")

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

router.post('/attemptTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (course.questions) {
            let score = 0;
            let attemptLeft = 3;
            if (course.questions.firstAnswer === req.body.firstAnswer)
                score += 20;
            if (course.questions.secondAnswer === req.body.secondAnswer)
                score += 20;
            if (course.questions.thirdAnswer === req.body.thirdAnswer)
                score += 20;
            if (course.questions.fourthAnswer === req.body.fourthAnswer)
                score += 20;
            if (course.questions.fifthAnswer === req.body.fifthAnswer)
                score += 20;
            const assignMark = new Promise((async (resolve, reject) => {
                course.students.forEach((student) => {
                    if (student.studentId.toString() === req.user._id.toString()) {
                        student.marks = score;
                        student.testAttempt += 1;
                        attemptLeft -= student.testAttempt;
                        resolve();
                    }
                })
            }))
            await assignMark;
            await course.save();
            res.render('testResult', { score, attemptLeft, id: req.params.id.replace(":", "") })
        }

        else
            res.status(500).send("Questions are empty, Please contact your teacher to assign test.")

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

router.get('/testResult:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {

        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        if (course.students[0].testAttempt === 0)
            return res.status(400).send("Try a test to view score")
        res.render('testResult', { score: course.students[0].marks, id: req.params.id.replace(":", ""), attemptLeft: 3 - course.students[0].testAttempt })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

//certificate

router.get('/downloadCertificate:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());

        if (course.students[0].marks > 35)
            res.render('certificate', { courseName: course.name, marks: course.students[0].marks, name: req.user.name })
        else if (course.students[0].testAttempt === 0)
            res.status(500).send("Your are not eligible to get certificate, Take test on given date then try agian.")
        else
            res.status(500).send("Your are not eligible to get certificate, Marks is below 35")

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

module.exports = router;