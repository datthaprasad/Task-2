const User = require('../models/user')
const Course = require('../models/course');
const { timeConvert } = require('./userAccountHelper');

exports.checkCourseCompletion = (req, course) => {
    course.completedDuration = parseInt(course.completedDuration) + parseInt(req.body.completed);
    if (course.completedDuration > course.duration)
        throw new Error("completed time is more than allowed duration");
    else if (course.completedDuration === course.duration)
        return true;
    else return false;
}

exports.isTestScheduled = (req, course) => {
    if (req.body.type.includes('test') && !course.tests[req.body.type])
        throw new Error('Test is not scheduled');
}

exports.studentsList = async (req) => {
    let students = [];
    let studentsObject = await Course.findById(req.params.id.replace(":", ""), { _id: 0, students: 1 });
    const courseName = await Course.findById(req.params.id.replace(":", ""), { _id: 0, name: 1 });
    const studentsInCourse = studentsObject.students;

    if (studentsInCourse.length === 0) return [];
    return new Promise((resolve, reject) => {
        studentsInCourse.forEach(async (data, index, studentsInCourse) => {
            let tempStudent = await User.findById(data.studentId);
            tempStudent.marks = (!data.marks) ? 0 : (data.marks / (data.module - 1)).toFixed(2);
            tempStudent.testAttempt = data.testAttempt;
            tempStudent.course = courseName.name;
            tempStudent.completed = (data.module === 4) && (data.assignmentCompleted === 3);
            tempStudent.testCompleted = (data.module === 4);
            tempStudent.assignmentCompleted = (data.assignmentCompleted === 3);
            students.push(tempStudent);
            if (index === studentsInCourse.length - 1) resolve(students)
        })
    });
}

exports.converDurationToHours = (courses) => {
    return new Promise((resolve, reject) => {
        courses.forEach((course, index, courses) => {
            course.hours = timeConvert(course.duration);
            course.completedHours = timeConvert(course.completedDuration);
            if (index === courses.length - 1) resolve(courses);
        });
    });
}