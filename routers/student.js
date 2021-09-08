const express = require('express');
const User = require('../models/user')
const Course = require('../models/course')
const auth = require('../middleware/auth');
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
                course.module = course.students[0].module;
                if (course.module === 4) course.Completed = true;
                else course.Completed = false;

                course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
                if (course.tests['test' + course.students[0].module]) {
                    course.test = course.tests['test' + course.students[0].module]
                    test = new Date(course.tests['test' + course.students[0].module]);
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
        if (course.questions) {
            course.question = course.questions['test' + course.students[0].module];
            course.module = course.students[0].module;
            if (!course.question)
                return res.status(500).send("Questions are empty, Please contact your teacher to assign test.")

            res.render('testForm', course)
        }

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
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        if (req.body.module != course.students[0].module)
            return res.status(400).send("You already completed this  module test..")
        if (course.questions['test' + course.students[0].module]) {
            let score = 0;
            let module, testAttempt;
            if (course.questions['test' + course.students[0].module].firstAnswer === req.body.firstAnswer)
                score += 20;
            if (course.questions['test' + course.students[0].module].secondAnswer === req.body.secondAnswer)
                score += 20;
            if (course.questions['test' + course.students[0].module].thirdAnswer === req.body.thirdAnswer)
                score += 20;
            if (course.questions['test' + course.students[0].module].fourthAnswer === req.body.fourthAnswer)
                score += 20;
            if (course.questions['test' + course.students[0].module].fifthAnswer === req.body.fifthAnswer)
                score += 20;
            const assignMark = new Promise((async (resolve, reject) => {
                course.students.forEach((student) => {
                    if (student.studentId.toString() === req.user._id.toString()) {
                        if (score > 35) {
                            if (student.module === 1)
                                student.marks = score;
                            else
                                student.marks = (student.marks + score);
                            student.module += 1;
                            student.testAttempt += 1;
                            if (student.testAttempt === 1 && score > 75) {
                                req.user.xp += 50;//frst attempt 50xp
                                if (req.user.xp >= 100) {
                                    req.user.level += parseInt(req.user.xp / 100);
                                    req.user.xp = req.user.xp % 100;
                                }
                            }
                            else if (student.testAttempt === 1 && score > 50) {
                                req.user.xp += 25;
                                if (req.user.xp >= 100) {
                                    req.user.level += parseInt(req.user.xp / 100);
                                    req.user.xp = req.user.xp % 100;
                                }
                            }
                            else {
                                req.user.xp += 5;
                                if (req.user.xp >= 100) {
                                    req.user.level += parseInt(req.user.xp / 100);
                                    req.user.xp = req.user.xp % 100;
                                }
                            }
                            student.testAttempt = 0;


                            module = student.module;

                        }
                        else {
                            student.testAttempt += 1;
                            module = student.module;
                        }
                        testAttempt = student.testAttempt;

                        resolve();
                    }
                })
            }))
            await assignMark;
            await req.user.save();
            await course.save();
            res.render('testResult', { Completed: (module === 4), failed: (score > 35) ? false : true, testResult: true, score, testAttempt, module, id: req.params.id.replace(":", "") })
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
        if (course.students[0].testAttempt === 0 && course.students[0].marks === 0)
            return res.status(400).send("Try a test to view score")
        res.render('testResult', { testCompleted: (course.students[0].module === 4), module: course.students[0].module, score: course.students[0].marks / (course.students[0].module - 1), id: req.params.id.replace(":", ""), testAttempt: course.students[0].testAttempt })
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

        if ((course.students[0].marks / (course.students[0].module - 1)) >= 35 && course.students[0].module === 4 && course.students[0].assignmentCompleted === 3)
            res.render('certificate', { courseName: course.name, marks: course.students[0].marks / (course.students[0].module - 1), name: req.user.name })
        else if (course.students[0].assignmentCompleted != 3)
            res.status(400).send("Your are not eligible to get certificate, Complete all assignments")
        else if (course.students[0].testAttempt === 0)
            res.status(500).send("Your are not eligible to get certificate, Take test on this module then try agian.")
        else
            res.status(500).send("Your are not eligible to get certificate, Complete all the module to get certificate")

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})



//assignmentTest
router.get('/attemptAssignmentTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        if (course.students[0].assignmentCompleted === 3)
            return res.status(200).send("Assignment completed succesfully")
        if (course.questions) {
            course.question = course.questions['assignment' + (course.students[0].assignmentCompleted + 1)];
            course.assignment = course.students[0].assignmentCompleted;
            if (!course.question)
                return res.status(500).send("Questions are empty, Please contact your teacher to assign test.")

            res.render('assignmentForm', course)
        }

        else
            res.status(500).send("Questions are empty, Please contact your teacher to assign test.")

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

router.post('/attemptAssignmentTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'student')
        return res.status(500).send("you are not STUDENT, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
        if (req.body.assignment != course.students[0].assignmentCompleted)
            return res.status(400).send("You already completed this  assignment test..")
        if (course.questions['assignment' + (course.students[0].assignmentCompleted + 1)]) {
            let score = 0;
            let module, testAttempt;
            if (course.questions['assignment' + (course.students[0].assignmentCompleted + 1)].firstAnswer === req.body.firstAnswer)
                score += 20;
            if (course.questions['assignment' + (course.students[0].assignmentCompleted + 1)].secondAnswer === req.body.secondAnswer)
                score += 20;
            if (course.questions['assignment' + (course.students[0].assignmentCompleted + 1)].thirdAnswer === req.body.thirdAnswer)
                score += 20;
            if (course.questions['assignment' + (course.students[0].assignmentCompleted + 1)].fourthAnswer === req.body.fourthAnswer)
                score += 20;
            if (course.questions['assignment' + (course.students[0].assignmentCompleted + 1)].fifthAnswer === req.body.fifthAnswer)
                score += 20;
            const assignMark = new Promise((async (resolve, reject) => {
                course.students.forEach((student) => {
                    if (student.studentId.toString() === req.user._id.toString()) {
                        if (score > 35) {
                            student.assignmentCompleted += 1;
                            console.log(student.assignmentCompleted);
                            if (score > 75) {
                                req.user.xp += 50;//frst attempt 50xp
                                if (req.user.xp >= 100) {
                                    req.user.level += parseInt(req.user.xp / 100);
                                    req.user.xp = req.user.xp % 100;
                                }
                            }
                            else if (score > 50) {
                                req.user.xp += 25;
                                if (req.user.xp >= 100) {
                                    req.user.level += parseInt(req.user.xp / 100);
                                    req.user.xp = req.user.xp % 100;
                                }
                            }
                            else {
                                req.user.xp += 5;
                                if (req.user.xp >= 100) {
                                    req.user.level += parseInt(req.user.xp / 100);
                                    req.user.xp = req.user.xp % 100;
                                }
                            }

                        }
                        assignment = student.assignmentCompleted;
                        resolve();
                    }
                })
            }))
            await assignMark;
            await req.user.save();
            await course.save();
            res.render('testResult', { assignmentCompleted: (assignment === 3), assignment, assignmentResult: true, failed: (score > 35) ? false : true, testResult: true, score, id: req.params.id.replace(":", "") })
        }

        else
            res.status(500).send("Questions are empty, Please contact your teacher to assign test.")

    }
    catch (e) {
        res.status(400).send("error " + e)
    }
})

module.exports = router;