//user-created modules
const auth = require('./middleware/auth')
const userRouter = require('./routers/user')
const adminRouter = require('./routers/admin');
const teachrRouter = require('./routers/teacher')
const studentRouter = require('./routers/student')
const chatRouter = require('./routers/chatRouter');
const socketHelper = require('./helper/socketHelper')
require('./models/connectDatabase')

//builtin modules
const hbs = require('hbs')
const http = require('http')
const bp = require('body-parser')
const express = require('express');
const CP = require('cookie-parser');
const socketio = require('socket.io')

const app = express();
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(bp.urlencoded({ extended: true }))

const port = process.env.PORT || 5000;

app.use(CP())
app.use(userRouter)
app.use(adminRouter)
app.use(teachrRouter)
app.use(studentRouter)
app.use(chatRouter);
socketHelper(io);

app.set('view engine', 'hbs');

app.set('views', __dirname + '/templates/views');
hbs.registerPartials(__dirname + '/templates/partial');

app.use("/js", express.static(__dirname + '/templates/js'));


app.get('/', auth, async (req, res) => {
    res.render('home', {
        user: req.user,
        admin: req.user.role === "admin" ? true : false,
        teacher: req.user.role === "teacher" ? true : false,
        student: req.user.role === "student" ? true : false
    })
})

app.get('*', (req, res) => {
    res.redirect('/')
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

// admin@example.com Admin@123 is already stored in database.