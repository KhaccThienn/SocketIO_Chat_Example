// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3001;

server.listen(port, "127.0.0.1", () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log("Chat App is Listening at http://%s:%s", host, port);
})

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

let numUsers = 0;

io.on('connection', (socket) => {
    let addedUser = false;

    // when the client emits 'new_message', this listens and executes
    socket.on('new_message', (data) => {
        // we tell the client to execute 'new_message'
        socket.broadcast.emit('new_message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add_user', this listens and executes
    socket.on('add_user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user_joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop_typing', we broadcast it to others
    socket.on('stop_typing', () => {
        socket.broadcast.emit('stop_typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user_left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});