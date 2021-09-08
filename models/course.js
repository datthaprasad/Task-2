const mongoose = require('mongoose');
const User = require('./user');



const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0,
        max: 5,
        min: 0
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: User
    },
    completedDuration: {
        default: "00.00",
        type: String
    },
    tests: {
        test1: {
            type: String,
            default: undefined
        },
        test2: {
            type: String,
            default: undefined
        },
        test3: {
            type: String,
            default: undefined
        }

    },
    questions: {
        test1: {
            type: Object,
            default: undefined
        },
        test2: {
            type: Object,
            default: undefined,
        },
        test3: {
            type: Object,
            default: undefined
        },
        assignment1: {
            type: Object,
            default: undefined
        },
        assignment2: {
            type: Object,
            default: undefined
        },
        assignment3: {
            type: Object,
            default: undefined
        }
    },
    totalRating: {
        type: Number,
        default: 0
    },
    studentsCountForRating: [{
        type: mongoose.Schema.Types.ObjectId,
        default: null

    }],
    students: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: User
        },
        marks: {
            type: Number,
            default: 0
        },
        module: {
            type: Number,
            max: 4,
            default: 1
        },
        rating: {
            type: Number,
            max: 5,
            min: 0,
            default: undefined
        },
        testAttempt:{
            type:Number,
            default:0
        },
        assignmentCompleted:{
            max:3,
            default:0,
            type:Number
        }
    }]
})


const Course = mongoose.model('Course', courseSchema);

module.exports = Course
