const express = require('express');

const User = require('../models/user')
const Course = require('../models/course')
const auth = require('../middleware/auth');
const errorMessage = require('../helper/errorHelper')
const validateInput = require('../helper/validateInput')
const courseValidate = require('../helper/courseValidate')
const router = new express.Router();


//list users with id=role
router.get('/users:id', auth, async (req, res) => {

    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry")

    if (req.params.id.replace(":", "") != "ADMIN" && req.params.id.replace(":", "") != "TEACHER" && req.params.id.replace(":", "") != "STUDENT" && req.params.id.replace(":", "") != "USER")
        return res.status(400).send("Wrong users")


    const users = await User.find({ role: String(req.params.id).replace(":", "").toLowerCase() });
    report = (String(req.params.id).replace(":", "").toLowerCase() === 'student')

    res.render('usersList', { users, user: req.user, admin: true, role: (req.params.id).replace(":", "").toUpperCase(), report })
})

//assign role to users
router.get('/assignRole:id:role', auth, async (req, res) => {
    try {

        if (!req.user.name)
            return res.status(400).send('please login or create account')
        if (req.user.role != 'admin')
            return res.status(500).send("you are not ADMIN, Sorry");

        const id = req.params.role.split(":")[0];
        const role = req.params.role.split(":")[1];
        const user = await User.findById(id)
        user.role = role;
        await user.save();
        res.redirect('/users:' + role.toUpperCase())
    }
    catch (e) {
        res.status(400).send(e)
    }
})

//update user profile

router.get('/edit/user:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account');
    const user = await User.findById(req.params.id.replace(":", ""));
    res.render('editUserProfile', { user })
})

router.post('/edit/users:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");


    const user = await User.findById(req.params.id.replace(":", ""));

    const updates = Object.keys(req.body);
    const allowedUpdates = ['userName', 'name', 'password', 'gender', 'phone', 'age', 'confirm_password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    if (validateInput(req, res) == 1)


        try {
            updates.forEach((update) => {
                if (req.body[update] && update != "confirm_password")
                    user[update] = req.body[update]
            })
            await user.save();
            res.redirect('/users:' + user.role.toUpperCase())
        } catch (e) {
            console.log(e);
            errorMessage(e, res, "EDiting profile failed")
        }
})

//Create user
router.get('/createUser', auth, async (req, res) => {

    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");

    res.render('createUser');

})

router.post('/createUser', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");

    try {
        if (validateInput(req, res) != 1) return;

        if (req.body.password != req.body.confirm_password)
            return res.send("Passwords are not matching")

        const user = new User(req.body)
        await user.save()

        res.status(201).redirect('/')
    }
    catch (e) {

        errorMessage(e, res, "User Creation Failed");
    }
})

//delete user
router.get('/deleteUser:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const user = await User.findByIdAndDelete(req.params.id.replace(":", ""));
        res.status(200).redirect('/users:' + user.role.toUpperCase())
    }
    catch (err) {
        res.status(400).send(err)
    }

})

//create course
router.get('/createCourse', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    const users = await User.find({ role: 'teacher', courseCount: { $lt: 4 } });
    res.render('createCourse', { users });
})

router.post('/createCourse', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {

        const { name, duration, teacher } = req.body;
        if (courseValidate(duration) == 1) {
            if (teacher != "assign later") {

                const Teacher = await User.findById(teacher);
                console.log(Teacher);
                if (Teacher.courseCount < 4) {
                    Teacher.courseCount += 1;
                    await Teacher.save();
                    await new Course(req.body).save();
                    return res.redirect('/');
                }
                else
                    return res.status(500).send("Teacher already handling 4 subjects")

            }
            else
                await new Course({ name, duration }).save();
            res.redirect('/')

        }

    }
    catch (err) {
        res.status(400).send("Failed to create course " + err)
    }
})

//view course
router.get('/viewCourse', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    let courses = await Course.find();


    var bar = new Promise((resolve, reject) => {
        courses.forEach(async (course, index, courses) => {
            let c = await User.findById(course.teacher);
            course.teacherName = c;
            if (index === courses.length - 1) resolve();
        });
    });


    if (courses.length > 0)
        bar.then(async () => {
            // const users = await User.find({ role: 'teacher' });
            // courses["users"] = users;
            res.render('courseList', { courses, user: req.user, role: req.user.role, admin: true });
        }).catch((e) => {
            res.status(400).send(e)
        });
    else
        res.render('courseList', { courses, user: req.user, role: req.user.role, admin: true });


})


//assign teacher to course
router.get('/assignTeacher:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const teachers = await User.find({ courseCount: { $lt: 4 }, role: 'teacher' });
        const course = await Course.findById(req.params.id.replace(":", ""))
        res.render('assignTeacher', { teachers, course })
    }
    catch (e) {
        res.status(400).send("error " + e)
    }

})

router.get('/assignTeacher/:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const uid = req.params.id.split(":")[1]; //user id
        const cid = req.params.id.split(":")[2]; //course id
        const Teacher = await User.findById(uid);
        const course = await Course.findById(cid);


        if (course.teacher && course.teacher != uid) {

            const oldTeacher = await User.findById(course.teacher);
            oldTeacher.courseCount -= 1;
            await oldTeacher.save();
        }
        Teacher.courseCount += 1;
        await Teacher.save();
        course.teacher = uid;
        await course.save();
        return res.redirect('/viewCourse');
    }
    catch (e) {
        res.status(400).send(e);
    }
})

//delete course
router.get('/deleteCourse:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (course.teacher) {
            const user = await User.findById(course.teacher);
            user.courseCount -= 1;
            await user.save();
        }
        course.delete()

        res.redirect('/viewCourse')
    }
    catch (e) {
        res.status(400).send("error" + e)
    }
})

//update course
router.get('/updateCourse:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        course.teacherName = await User.findById(course.teacher);
        const users = await User.find({ role: 'teacher', courseCount: { $lt: 4 } });
        res.render('updateCourse', { course, users });
    }
    catch (e) {
        res.status(400).send("error " + e);
    }
})

router.post('/updateCourse:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {

        const { name, duration, teacher } = req.body;
        const course = await Course.findById(req.params.id.replace(":", ""));
        if (courseValidate(duration) == 1) {
            if (teacher != "assign later") {
                if (course.teacher && course.teacher == teacher) { //same teacher
                    course.name = name;
                    course.duration = duration;
                    await course.save();
                }
                else {
                    if (course.teacher) {
                        const Teacher = await User.findById(teacher);
                        const oldTeacher = await User.findById(course.teacher);
                        if (Teacher.courseCount < 4) {
                            Teacher.courseCount += 1;
                            oldTeacher.courseCount -= 1;
                            await oldTeacher.save();
                            console.log(oldTeacher, Teacher);
                            await Teacher.save();
                            course.teacher = teacher;
                            course.name = name;
                            course.duration = duration;
                            await course.save();
                            return res.redirect('/viewCourse');
                        }
                        else
                            return res.status(500).send("Teacher already handling 4 subjects")
                    }
                    else {
                        const Teacher = await User.findById(teacher);
                        if (Teacher.courseCount < 4) {
                            Teacher.courseCount += 1;
                            await Teacher.save();
                            course.teacher = teacher;
                            course.name = name;
                            course.duration = duration;
                            await course.save();
                            return res.redirect('/viewCourse');
                        }
                        else
                            return res.status(500).send("Teacher already handling 4 subjects")

                    }

                }
            }
            else
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
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const course = await Course.findById(req.params.id.replace(":", ""));
        const remaining = parseFloat(course.duration) - parseFloat(course.completedDuration);

        res.render('courseReport', { course, count: course.students.length, ratingCount: course.studentsCountForRating.length, remaining: remaining.toFixed(2) });
    }
    catch (e) {
        res.status(400).send("error " + e);
    }
})

//student Report
router.get('/studentReport:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin')
        return res.status(500).send("you are not ADMIN, Sorry");
    try {
        const student = await User.findById(req.params.id.replace(":", ""));
        await student.populate('students').execPopulate();
        if (student.role === 'student')
            res.render('studentReport', { student, courseCount: student.students.length, courses: student.students })
        else
            res.status(500).send("Only students report available now.")
    }
    catch (e) {
        res.status(400).send("error " + e);
    }
})

//schedule test
router.post('/scheduleTest:id', auth, async (req, res) => {
    if (!req.user.name)
        return res.status(400).send('please login or create account')
    if (req.user.role != 'admin' && req.user.role != 'teacher')
        return res.status(500).send("you are not ADMIN / TEACHER, Sorry");
    try {
        const { time } = req.body;

        const course = await Course.findById(req.params.id.replace(":", ""));
        if (!time) {
            course.test = undefined;
            await course.save();
            if (req.user.role === 'teacher')
                return res.redirect('/viewMyCourses')
            res.redirect('/viewCourse')

        }
        else if ((new Date(time).getTime() / 100000000) > (new Date().getTime() / 100000000)) {
            course.test = time;
            await course.save();
            if (req.user.role === 'teacher')
                return res.redirect('/viewMyCourses')
            res.redirect('/viewCourse')
        }
        else {
            res.status(400).send("Date is not valid (It is in past)")
        }
    }
    catch (e) {
        res.status(400).send("error " + e);
    }
})

module.exports = router