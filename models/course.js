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
    test: {
        type: String,
        default: undefined
    },
    questions: {
        type: Object,
        default: undefined
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
            ref: User,
            unique: true
        },
        marks: {
            type: Number,
            max: 100,
            min: 0,
            default: 0
        },
        testAttempt: {
            type: Number,
            max: 3,
            default: 0
        },
        rating:{
            type:Number,
            max:5,
            min:0,
            default:undefined
        }
    }]
})


const Course = mongoose.model('Course', courseSchema);

module.exports = Course
