var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var clients = [];//array of players
var rooms = [];

io.on('connection', function (socket) {
    var newPlayer = new Player();
    newPlayer.id = socket.client.id;
    //newPlayer.socket = socket;
    newPlayer.name = undefined;
    clients.push(newPlayer);
    socket.on("insert_player_data", function (data, callback) {
        if (!isPlayerNameTaken(data.name) && getPlayerById(socket.client.id) !== null) {
            getPlayerById(socket.client.id).name = data.name;
            //>>> notice new player (with name assigned)
            //io.emit("new_player_enter", {data: getPlayerById(socket.client.id)});
            callback({status: "okay"});
        } else {
            callback({status: "fail", message: "The name '" + data.name + "' is already token by another player"});
        }
    });
    socket.on("get_rooms", function (callback) {
//        var roomNames = io.sockets.adapter.rooms;
//        for (var roomName in roomNames) {
//            //exclude default room for socket
//            if (roomName !== socket.id) {
//                var room = {};
//                //>>>retrieve all data from each room, including state!
//                room.name = roomName;
//                room.playersCount = roomNames[roomName].length;
//                rooms.push(room);
//            }
//        }
        var response = {data: rooms};
        response.status = "okay";
        callback(response);
    });
    //create and join the creator to the room
    socket.on("create_room", function (data, callback) {
        //create room only if the name isn't taken
        if (io.sockets.adapter.rooms[data.name] === undefined) {
            socket.join(data.name, function () {
                var room = new Room();
                room.name = data.name;
                room.available = true;//it's supposed
                room.private = data.private || false;//hardcode, default is false
                room.phase = "prepare";
                room.maxPlayersCount = data.maxPlayersCount || 4;//default
                room.createdDate = (new Date()).getTime();
                room.addPlayer(getPlayerById(socket.client.id));
                rooms.push(room);
                //>>> notice that a new room has been created
                io.emit("room_created", {data: room});
                callback({status: "okay", data: room});
            });
        } else {
            //try another room name
            callback({status: "fail"});
        }
    });
    socket.on("join_room", function (data, callback) {
        if (io.sockets.adapter.rooms[data.name] !== undefined) {
            //must verify that players isnt already in room
//            var room = new Room();
//            room.name = data.name;
//            room.players = [];
//            for (var socketId in playersInRoom) {
//                for (var i = 0; i < clients.length; i++) {
//                    if (clients[i].socket.id === socketId) {
//                        var player = {};
//                        player.id = clients[i].id;
//                        player.name = clients[i].name;
//                        room.players.push(player);
//                        break;
//                    }
//                }
//            }
//            room.playersCount = room.players.length;
            socket.join(data.name, function () {
                var room = getRoomByName(data.name);
                console.log(room);
                var player = getPlayerById(socket.client.id);
                console.log(player);
                room.addPlayer(player);
                //>>> notice that a room has been changed
                //io.emit("room_data_changes", {data: room});
                callback({status: "okay", data: room});
            });
        } else {
            callback({status: "fail"});
        }
    });
    socket.on("change_ready_state", function (data, callback) {
        if (getPlayerById(socket.client.id) !== null) {
            getPlayerById(socket.client.id).ready = data.ready;
            //>>> notice that a room has been changed
            //io.emit("room_data_changes", {data: });
            callback({status: "okay"});
            //now check if the game can start or not
            var room = getPlayerById(socket.client.id).currentRoom;
            var playersInRoom = getPlayersFromRoom(room.name);
            var allReady = true;
            for (var i = 0; i < playersInRoom.length; i++) {
                allReady &= playersInRoom[i].ready;
            }
            if (allReady && playersInRoom.length === room.maxPlayersCount) {
                //now start!
                //>>> notice that a room has been changed
                //io.emit("room_data_changes", {data: });
                io.to(room.name).emit("begin_game");
            }
        } else {
            callback({status: "fail"});
        }
    });
    socket.on('disconnect', function () {
    });
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

function getPlayerById(id) {
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].id === id) {
            return clients[i];
        }
    }
    return null;
}

function getPlayersFromRoom(roomName) {
    var players = [];
    return players;
}

function getRoomByName(name) {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].name.toLowerCase().trim() === name.trim().toLowerCase()) {
            return rooms[i];
        }
    }
    return null;
//    var playersInRoom = io.sockets.adapter.rooms[name].sockets;
//    if (playersInRoom !== undefined) {
//        var room = new Room();
//        room.name = name;
//        room.players = [];
//        for (var socketId in playersInRoom) {
//            for (var i = 0; i < clients.length; i++) {
//                if (clients[i].socket.id === socketId) {
//                    var player = {};
//                    player.id = clients[i].id;
//                    player.name = clients[i].name;
//                    room.players.push(player);
//                    break;
//                }
//            }
//        }
//        room.playersCount = room.players.length;
//    }
}

//classes
function Room() {
    var instance = this;
    this.name;
    this.available;
    this.private;
    this.password;
    this.phase = undefined;//prepare, game, results
    this.players = [];
    this.createdDate;
    this.playersCount;
    this.maxPlayersCount = 3;
    this.addPlayer = function (player) {
        if (!instance.isPlayerInRoom(player)) {
            instance.players.push(player);
            instance.playersCount = instance.players.length;
            player.currentRoomName = instance.name;
        }
    };
    this.isPlayerInRoom = function (player) {
        for (var i = 0; i < instance.players.length; i++) {
            if (instance.players[i].equals(player)) {
                return true;
            }
        }
        return false;
    };
    this.isAvailable = function () {
        return (instance.phase === "prepare" && instance.private === false && instance.playersCount < instance.maxPlayersCount);
    };
}

function Player(name) {
    var instance = this;
    this.id;//socket  client id
    this.name = name;
    //this.socket;
    this.ready;
    this.currentRoomName;
    this.equals = function (other) {
        return (instance.id === other.id);
    };
}

http.listen(8080, function () {
    console.log("Listening on port 8080...");
});