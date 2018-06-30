const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const cors=require('cors');
const bodyParser = require('body-parser');

const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
var router = express.Router();
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(publicPath));
io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', (params, callback) => {
    if (!isRealString(params.name) || !isRealString(params.room)) {
      return callback('Name and room name are required.');
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the Trade app'));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined.`));
    callback();
  });
      router.route('/publicdata')
      // create a bear (accessed at POST http://localhost:8080/api/bears)
      .post(function(req, res) {
      console.log(req.body.data);  // set the bears name (comes from the request)
      // save the bear and check for errors
      var user = users.getuserbyroom(req.body.id);
      // console.log(req.body.text)
      if(user){
        io.to(user.room).emit('publicdata', {
          responsedata:req.body.data
          });
      }
     
      //  res.send({'done':'working'});
      res.json({ 
      message: 'Success created!',
      status:'200' 
      });


      });
    router.route('/privatedata')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {

    // create a new instance of the Bear model
    console.log(req.body.id);  // set the bears name (comes from the request)

    // save the bear and check for errors
    var user = users.getuserbyroom(req.body.id);
    if(user){
      console.log(user.room)
      io.to(user.room).emit('privatedata', {
      responsedata:req.body.data
      });
    }else{

    }
    
    //  res.send({'done':'working'});

    res.json({ 


    message: 'Success created!',
    status:'200'



    });


    });

    app.use('/api', router);

  socket.on('createMessage', (message, callback) => {
    var user = users.getUser(socket.id);

    if (user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
    }

    callback();
  });

  

  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left.`));
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
