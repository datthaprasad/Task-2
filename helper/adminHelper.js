const { MAX_COURSE_COUNT } = require('../global/constants');
const User = require('../models/user');
const { timeConvert } = require('./userAccountHelper');

exports.roleCheck = (req) => {
    if (req.params.id.replace(":", "") != "ADMIN" && req.params.id.replace(":", "") != "TEACHER" && req.params.id.replace(":", "") != "STUDENT" && req.params.id.replace(":", "") != "USER")
        // return res.status(400).send("Wrong users")
        throw new Error("wrong user role")
}

exports.checkTeacherHandlingMaxCourse = (count) => {
    if (count >= MAX_COURSE_COUNT)
        throw new Error("Teacher already handling " + MAX_COURSE_COUNT + " courses, which is max limit.")
}

exports.addTeacherName = (courses) => {
    return new Promise((resolve, reject) => {
        courses.forEach(async (course, index, courses) => {
            let c = await User.findById(course.teacher);
            course.teacherName = c;
            course.hours = timeConvert(course.duration);
            if (index === courses.length - 1) resolve(courses);
        });
    });
}

exports.studentReoprtUpdate = (id,students) => {
    let responseData = [];
    return new Promise((resolve, reject) => {
        if (students.length === 0) resolve({ responseData });
        students.forEach(async (student, index, students) => {
            courseData = student.students;
            if (student.students.length === 0) resolve({ responseData });
            await new Promise((res, rej) => {
                courseData.forEach((data, i, courseData) => {
                    if (data.studentId.toString() === id.toString()) {
                        if (!data.marks) student.score = 0;
                        else student.score = (data.marks / (data.module - 1)).toFixed(2);
                        responseData.push(student);
                    }
                    if (i === courseData.length - 1) res();
                })
            })
            if (index === students.length - 1) resolve({ responseData });

        })
    })
}