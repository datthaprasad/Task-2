const express = require('express');

const User = require('../models/user')
const Course = require('../models/course')
const auth = require('../middleware/auth');
const {
    checkTeacherHandlingMaxCourse,
    roleCheck,
    addTeacherName,
    studentReoprtUpdate } = require('../helper/adminHelper');
const {
    isLogedIn,
    inputValidation,
    errorMessage,
    courseValidate,
    updateData,
    updateValidate,
    passwordAndConfirmPasswordMatching,
    timeConvert
} = require('../helper/userAccountHelper');
const { MAX_COURSE_COUNT } = require('../global/constants');


const router = new express.Router();

//list users with id=role
router.get('/users:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');

        roleCheck(req); //check for default 3 roles

        const users = await User.find({ role: String(req.params.id).replace(":", "").toLowerCase() });
        report = (String(req.params.id).replace(":", "").toLowerCase() === 'student')  //report for only students
        res.render('usersList', { users, user: req.user, admin: true, role: (req.params.id).replace(":", "").toUpperCase(), report })
    }
    catch (e) {
        res.status(400).send("Bad Request,  " + e);
    }
})

//assign role to users
router.get('/assignRole:id:role', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const id = req.params.role.split(":")[0];
        const role = req.params.role.split(":")[1];
        const user = await User.findById(id)
        user.role = role;
        await user.save();
        res.redirect('/users:' + role.toUpperCase())
    }
    catch (e) {
        res.status(400).send('Bad Request, ' + e)
    }
})

//update user profile page render
router.get('/edit/user:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const user = await User.findById(req.params.id.replace(":", ""));
        res.render('editUserProfile', { user })
    }
    catch (error) {
        res.status(400).send("Bad Request, " + error);
    }
})

//update user profile 
router.post('/edit/users:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const user = await User.findById(req.params.id.replace(":", ""));
        const updates = updateValidate(req);
        inputValidation(req);
        await updateData(req, updates, user);
        await user.save();
        res.redirect('/users:' + user.role.toUpperCase());
    } catch (e) {
        errorMessage(e, res, e); //just to specify proper reason of error
    }
})

//Create user page render
router.get('/createUser', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin')
        res.render('createUser')
    }
    catch (error) {
        res.status(400).send("Bad Request, " + error)
    }
})

//create user data handling
router.post('/createUser', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        inputValidation(req);
        passwordAndConfirmPasswordMatching(req);
        const user = new User(req.body)
        await user.save()
        res.status(201).redirect('/')
    }
    catch (e) {
        errorMessage(e, res, e);
    }
})

//delete user
router.get('/deleteUser:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const user = await User.findByIdAndDelete(req.params.id.replace(":", ""));
        res.status(200).redirect('/users:' + user.role.toUpperCase())
    }
    catch (error) {
        res.status(400).send("Bad Request, " + error);
    }

})

//create course render page
router.get('/createCourse', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const users = await User.find({ role: 'teacher', courseCount: { $lt: MAX_COURSE_COUNT } });
        res.render('createCourse', { users });
    }
    catch (error) {
        res.status(400).send("Bad Request, " + error);
    }
})

//handle courrse creation data
router.post('/createCourse', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const { name, duration, teacher } = req.body;
        courseValidate(duration);
        if (teacher != "assign later") {
            const Teacher = await User.findById(teacher);
            checkTeacherHandlingMaxCourse(Teacher.courseCount)
            Teacher.courseCount += 1;
            await Teacher.save();
            await new Course(req.body).save();
            return res.redirect('/viewCourse');
        }
        else
            await new Course({ name, duration }).save();
        res.redirect('/viewCourse');
    }
    catch (err) {
        res.status(400).send("Failed to create course " + err)
    }
})

//view course
router.get('/viewCourse', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        let courses = await Course.find();
        if (courses.length > 0) {
            courses = await addTeacherName(courses);
            res.render('courseList', { courses, user: req.user, role: req.user.role, admin: true });
        }
        else
            res.render('courseList', { courses, user: req.user, role: req.user.role, admin: true });
    }
    catch (error) {
        res.status(400).send("Bad Request, " + error);
    }
})

//assign teacher to course render page
router.get('/assignTeacher:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const teachers = await User.find({ courseCount: { $lt: MAX_COURSE_COUNT }, role: 'teacher' });
        const course = await Course.findById(req.params.id.replace(":", ""))
        res.render('assignTeacher', { teachers, course })
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }

})

//assign teacher to course data handling
router.get('/assignTeacher/:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const uid = req.params.id.split(":")[1]; //user id
        const cid = req.params.id.split(":")[2]; //course id
        const Teacher = await User.findById(uid);
        const course = await Course.findById(cid);

        if (course.teacher && course.teacher != uid) { //old teacher id and new teacher id, if not same
            const oldTeacher = await User.findById(course.teacher);
            if (oldTeacher) {
                oldTeacher.courseCount -= 1;
                await oldTeacher.save();
            }
            Teacher.courseCount += 1;
            await Teacher.save();
        }
        else if (!course.teacher) { //course teacher is empty then 
            Teacher.courseCount += 1;
            await Teacher.save();
        }
        course.teacher = uid;
        await course.save();
        return res.redirect('/viewCourse');
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e);
    }
})

//delete course
router.get('/deleteCourse:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (course.teacher) {
            const user = await User.findById(course.teacher);
            if (user) {
                user.courseCount -= 1;
                await user.save();
            }
        }
        await course.delete();
        res.redirect('/viewCourse')
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e)
    }
})

//update course render page
router.get('/updateCourse:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.teacherName = await User.findById(course.teacher);
        const users = await User.find({ role: 'teacher', courseCount: { $lt: MAX_COURSE_COUNT } });
        res.render('updateCourse', { course, users });
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e);
    }
})

//update course handle data
router.post('/updateCourse:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const { name, duration, teacher } = req.body;
        const course = await Course.findById(req.params.id.replace(":", ""));
        courseValidate(duration);
        if (teacher != "assign later") {
            if (course.teacher && course.teacher == teacher) { //same teacher
                course.name = name;
                course.duration = duration;
                await course.save();
            }
            else if (course.teacher) { //different teacher
                const Teacher = await User.findById(teacher);
                checkTeacherHandlingMaxCourse(Teacher.courseCount);
                Teacher.courseCount += 1;
                const oldTeacher = await User.findById(course.teacher);
                if (oldTeacher) {
                    oldTeacher.courseCount -= 1;
                    await oldTeacher.save();
                }
                await Teacher.save();
                course.teacher = teacher;
                course.name = name;
                course.duration = duration;
                await course.save();
                return res.redirect('/viewCourse');

            }
            else { //no teacher
                const Teacher = await User.findById(teacher);
                checkTeacherHandlingMaxCourse(Teacher.courseCount);
                Teacher.courseCount += 1;
                await Teacher.save();
                course.teacher = teacher;
                course.name = name;
                course.duration = duration;
                await course.save();
                return res.redirect('/viewCourse');

            }
        }
        else {
            course.name = name;
            course.duration = duration;
            await course.save();
            res.redirect('/viewCourse')
        }
    }
    catch (err) {
        res.status(400).send("Failed to update course " + err);
    }
})

//course report
router.get('/courseReport:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.hours = timeConvert(course.duration);
        course.completedHours = timeConvert(course.completedDuration);
        const remaining = timeConvert(course.duration - course.completedDuration);
        res.render('courseReport', { course, count: course.students.length, ratingCount: course.studentsCountForRating.length, remaining });
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e);
    }
})

//student Report
router.get('/studentReport:id', auth, async (req, res) => {
    try {
        isLogedIn(req, 'admin');
        const student = await User.findById(req.params.id.replace(":", ""));
        if (student.role != 'student')
            return res.status(500).send("Only students report available now.");
        await student.populate('students').execPopulate();
        const { responseData } = await studentReoprtUpdate(req.params.id.replace(":", ""), student.students);
        res.render('studentReport', { student, courseCount: student.students.length, courses: responseData })
    }
    catch (e) {
        res.status(400).send("Bad Request, " + e);
    }
})

module.exports = router;