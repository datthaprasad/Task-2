const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        default: undefined

    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        required: true

    }
}, {
    timestamps: true
})

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;