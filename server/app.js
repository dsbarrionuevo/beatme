var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//app.use(express.static(__dirname + '/public'));
//app.get('/', function (req, res) {
//    res.sendFile(__dirname + '/public/index.html');
//});

var clients = [];//array of players

io.on('connection', function (socket) {
    var newPlayer = new Player();
    newPlayer.id = socket.client.id;
    newPlayer.socket = socket;
    newPlayer.name = undefined;
    clients.push(newPlayer);
    socket.on("insert_player_data", function (data, callback) {
        if (!isPlayerNameTaken(data.name)) {
            for (var i = 0; i < clients.length; i++) {
                if (clients[i].equals(socket.client.id)) {
                    clients[i].name = data.name;
                    break;
                }
            }
            callback({status: "okay"});
        } else {
            callback({status: "fail"});
        }
    });
    socket.on("get_rooms", function (callback) {
        var roomNames = io.sockets.adapter.rooms;
        var rooms = [];
        for (var roomName in roomNames) {
            //exclude default room for socket
            if (roomName !== socket.id) {
                var room = {};
                room.name = roomName;
                room.playersCount = roomNames[roomName].length;
                rooms.push(room);
            }
        }
        var response = {data: rooms};
        response.status = "okay";
        callback(response);
    });
    socket.on("create_room", function (data, callback) {
        //create room only if the name isn't taken
        if (io.sockets.adapter.rooms[data.name] === undefined) {
            socket.join(data.name, function () {
                callback({status: "okay"});
            });
        } else {
            callback({status: "fail"});
        }
    });
    socket.on("join_room", function (data, callback) {
        var playersInRoom = io.sockets.adapter.rooms[data.name].sockets;
        if (playersInRoom !== undefined) {
            var room = new Room();
            room.name = data.name;
            room.players = [];
            for (var socketId in playersInRoom) {
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].socket.id === socketId) {
                        var player = {};
                        player.id = clients[i].id;
                        player.name = clients[i].name;
                        room.players.push(player);
                        break;
                    }
                }
            }
            room.playersCount = room.players.length;
            socket.join(data.name, function () {
                getPlayerByNameId(socket.client.id).currentRoom = room;
                callback({status: "okay", data: room});
            });
        } else {
            callback({status: "fail"});
        }
    });
    socket.on("change_ready_state", function (data, callback) {
        if (getPlayerByNameId(socket.client.id) !== null) {
            getPlayerByNameId(socket.client.id).ready = data.ready;
            callback({status: "okay"});
            //now check if the game can start or not
            var room = getPlayerByNameId(socket.client.id).currentRoom;
            var playersInRoom = getPlayersFromRoom(room.name);
            var allReady = true;
            for (var i = 0; i < playersInRoom.length; i++) {
                allReady &= playersInRoom[i].ready;
            }
            if (allReady && playersInRoom.length === room.maxPlayersCount) {
                //now start!
                io.to(room.name).emit("begin_game");
            }
        } else {
            callback({status: "fail"});
        }
    });
    socket.on('disconnect', function () {
//        for (var i = 0; i < clients.length; i++) {
//            if (clients[i].client.id === socket.client.id) {
//                console.log("lo elimino del array");
//                clients.slice(i, 1);
//                break;
//            }
//        }
//        socket.broadcast.emit("client gone", {id: socket.client.id});
    });
    //io.emit("new client", {id: socket.client.id});

});

//functions
function isPlayerNameTaken(name) {
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].name !== undefined && clients[i].name.toLowerCase().trim() === name.toLowerCase().trim()) {
            return true;
        }
    }
    return false;
}

function getPlayerByNameId(id) {
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].equals(id)) {
            return clients[i];
        }
    }
    return null;
}

function getPlayersFromRoom(roomName) {
    var players = [];
    return players;
}

//classes
function Room() {
    this.name;
    this.players = [];
    this.createdDate;
    this.playersCount;
    this.maxPlayersCount = 3;
}

function Player(name) {
    var instance = this;
    this.id;//socket  client id
    this.name = name;
    this.socket;
    this.ready;
    this.currentRoom;
    this.equals = function (other) {
        return (instance.id === other.id);
    };
}

http.listen(8080, function () {
    console.log("listening...");
});