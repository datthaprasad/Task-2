const { MIN_MARKS, MARKS_FOR_ONE_QUESTION, FIRST_CLASS_MARK, SECOND_CLASS_MARK, XP_FOR_FIRST_CLASS, XP_FOR_SECOND_CLASS, XP_FOR_THIRD_CLASS, XP_FOR_COURSE_COMPLETION_BY_STUDENT, XP_FOR_ASSIGNMENT_COMPLETION_BY_STUDENT, XP_FOR_TEST_COMPLETION_BY_STUDENT } = require('../global/constants');
const Course = require('../models/course');
const { checkTodayDate, xpUpdate, timeConvert } = require('./userAccountHelper');

exports.findNewCourses = async (user) => {
    let allCourses = await Course.find();
    await user.populate('students').execPopulate();
    const joinedCourses = user.students.map(data => data._id);
    allCourses = allCourses.filter((course) => !joinedCourses.toString().includes(course._id.toString()));
    if (allCourses && allCourses.length > 0)
        await new Promise((resolve, reject) => {
            allCourses.forEach((course, index, allCourses) => {
                course.hours = timeConvert(course.duration);
                course.completedHours = timeConvert(course.completedDuration);
                if (index === allCourses.length - 1)
                    resolve();
            })
        })
    return allCourses;
}

exports.findJoinedCourses = async (req, courses) => {
    return new Promise(async (resolve, reject) => {
        courses.forEach(async (course, index, courses) => {
            course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
            course.hours = timeConvert(course.duration);
            course.completedHours = timeConvert(course.completedDuration);
            course.module = course.students[0].module;
            if (course.module === 4 && course.students[0].assignmentCompleted === 3) course.courseCompleted = true;
            if (course.module === 4) course.testCompleted = true;
            if (course.students[0].assignmentCompleted === 3) course.assignmentTestCompleted = true;

            course.students = course.students.filter((data) => req.user._id.toString() === data.studentId.toString());
            if (course.tests['test' + course.students[0].module]) {
                course.test = course.tests['test' + course.students[0].module]
                test = new Date(course.tests['test' + course.students[0].module]);
                if (checkTodayDate(new Date(test)))
                    course.attemptTest = true;
            }
            if (index === courses.length - 1) resolve(courses);

        });
    })
}

exports.updateRating = async (req, course) => {
    return new Promise((async (resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                if (course.studentsCountForRating.includes(req.user._id))
                    course.totalRating -= student.rating;
                student.rating = parseInt(req.params.idAndRating.split(":")[2])
                if (!course.studentsCountForRating.includes(req.user._id))
                    course.studentsCountForRating.push(req.user._id);
                if (course.totalRating)
                    course.totalRating += parseInt(req.params.idAndRating.split(":")[2]);
                else
                    course.totalRating = parseInt(req.params.idAndRating.split(":")[2]);
                course.rating = course.totalRating / course.studentsCountForRating.length;
                resolve();
            }
        })
    }));
}

exports.isQuestionsAvailable = (course) => {
    if (!course.questions)
        throw new Error("Questions are empty, Please contact your teacher to assign test.");
    course.question = course.questions['test' + course.students[0].module];
    course.module = course.students[0].module;
    if (!course.question)
        throw new Error("Questions are empty, Please contact your teacher to assign test..")
}

exports.isAssignmentAvailable = (course) => {
    if (course.students[0].assignmentCompleted === 3)
        throw new Error("Assignment already completed, no pending assignments !...");

    if ((!course.questions) || course.questions.length === 0)
        throw new Error("Assignment questions are empty, Please contact your teacher to assign test.")

    course.question = course.questions['assignment' + (course.students[0].assignmentCompleted + 1)];
    course.assignment = course.students[0].assignmentCompleted;
    if (!course.question)
        throw new Error("Assignment questions are empty, Please contact your teacher to assign test.")
}

exports.isEligibleForCertificate = (course) => {
    if (course.students[0].assignmentCompleted != 3)
        throw new Error("Your are not eligible to get certificate, Complete all assignments")
    else if (course.students[0].module != 4 && course.students[0].testAttempt === 0)
        throw new Error("Your are not eligible to get certificate, Take test on this module then try agian.")
    else if (course.students[0].module != 4 && course.students[0].testAttempt != 0)
        throw new Error("Your are not eligible to get certificate, Complete all the module to get certificate")
}

exports.getCertificate = (course, req, res) => {
    if ((course.students[0].marks / (course.students[0].module - 1)) >= MIN_MARKS && course.students[0].module === 4 && course.students[0].assignmentCompleted === 3)
        res.render('certificate', { courseName: course.name, marks: (course.students[0].marks / (course.students[0].module - 1)).toFixed(2), name: req.user.name })
    else throw new Error("You are not eligible to get Certificate");
}

exports.isTestAttempted = (req, course) => {
    return new Promise((resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                if (student.testAttempt === 0 && student.marks === 0)
                    throw new Error("Try a test to view score");
                resolve();
            }
        });
    })
}

exports.checkModule = (req, course) => {
    return new Promise((resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                if (req.body.module != student.module)
                    throw new Error("You already completed this  module test..")
                resolve();
            }
        });
    })
}

exports.checkAssignmentCompleted = (req, course) => {
    return new Promise((resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                if (req.body.assignment != student.assignmentCompleted)
                    throw new Error("You already completed this  assignment test..")
                resolve();
            }
        });
    })
}

exports.calculateTestScore = (req, course) => {
    return new Promise((resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                let score = 0;
                if (course.questions['test' + course.students[0].module].firstAnswer === req.body.firstAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['test' + course.students[0].module].secondAnswer === req.body.secondAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['test' + course.students[0].module].thirdAnswer === req.body.thirdAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['test' + course.students[0].module].fourthAnswer === req.body.fourthAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['test' + course.students[0].module].fifthAnswer === req.body.fifthAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                resolve({ score });
            }
        });
    })
}

exports.testMarksUpdate = (req, course, score) => {
    let module, testAttempt;
    return new Promise(async (resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                if (score > MIN_MARKS) {
                    if (student.module === 1)
                        student.marks = score;
                    else
                        student.marks = (student.marks + score);
                    student.module += 1;
                    student.testAttempt += 1;
                    if (student.testAttempt === 1 && score > FIRST_CLASS_MARK) {
                        xpUpdate(req.user, XP_FOR_FIRST_CLASS);
                    }
                    else if (student.testAttempt === 1 && score > SECOND_CLASS_MARK) {
                        xpUpdate(req.user, XP_FOR_SECOND_CLASS);
                    }
                    else
                        xpUpdate(req.user, XP_FOR_THIRD_CLASS);
                    student.testAttempt = 0;
                    module = student.module;
                    if (module === 4)
                        xpUpdate(req.user, XP_FOR_TEST_COMPLETION_BY_STUDENT);
                }

                else {
                    student.testAttempt += 1;
                    module = student.module;
                }

                testAttempt = student.testAttempt;
                resolve({ module, testAttempt });
            }
        })
    })
}

exports.calculateAssignmentScore = (req, course) => {
    return new Promise((resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                let score = 0;
                if (course.questions['assignment' + (student.assignmentCompleted + 1)].firstAnswer === req.body.firstAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['assignment' + (student.assignmentCompleted + 1)].secondAnswer === req.body.secondAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['assignment' + (student.assignmentCompleted + 1)].thirdAnswer === req.body.thirdAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['assignment' + (student.assignmentCompleted + 1)].fourthAnswer === req.body.fourthAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                if (course.questions['assignment' + (student.assignmentCompleted + 1)].fifthAnswer === req.body.fifthAnswer)
                    score += MARKS_FOR_ONE_QUESTION;
                resolve({ score });
            }
        });
    })

}

exports.assignmentUpdate = (req, course, score) => {
    return new Promise(async (resolve, reject) => {
        course.students.forEach((student) => {
            if (student.studentId.toString() === req.user._id.toString()) {
                if (score > MIN_MARKS) {
                    student.assignmentCompleted += 1;
                    if (score > FIRST_CLASS_MARK) {
                        xpUpdate(req.user, XP_FOR_FIRST_CLASS);
                    }
                    else if (score > SECOND_CLASS_MARK) {
                        xpUpdate(req.user, XP_FOR_SECOND_CLASS);
                    }
                    else {
                        xpUpdate(req.user, XP_FOR_THIRD_CLASS);
                    }
                }
                const assignment = student.assignmentCompleted;
                if (assignment === 3)
                    xpUpdate(req.user, XP_FOR_ASSIGNMENT_COMPLETION_BY_STUDENT);
                resolve({ assignment });
            }
        })
    })
}