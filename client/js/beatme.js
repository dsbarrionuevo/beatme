var beatme = (function (io) {
    var myself = {};
    var player;
    var rooms = [];
    var currentRoom;
    var clients = [];
    var socket;

    myself.create = function (options) {
        myself.max = options.max || 5;
        myself.timeToStart = options.timeToStart || 10;
        socket = io.connect("localhost:8080");
        createPlayer(onPlayerCreated);
        socket.on("begin_game", function () {
            startGame();
        });
//        socket.on("new client", function (client) {
//            clients.push(client);
//        });
//        socket.on("client gone", function (client) {
//            for (var i = 0; i < clients.length; i++) {
//                if (clients[i].id === client.id) {
//                    clients.slice(i, 1);
//                    break;
//                }
//            }
//            console.log(clients);
//        });
    };

    myself.joinRoom = function (name) {
        //look for deatils of room and join it
        socket.emit("join_room", {name: name}, function (response) {
            if (response.status === "okay") {
                var roomData = response.data;
                currentRoom = new Room();
                currentRoom.name = roomData.name;
                currentRoom.players = [];
                for (var i = 0; i < roomData.players.length; i++) {
                    var player = new Player();
                    player.id = roomData.players[i].id;
                    player.name = roomData.players[i].name;
                    currentRoom.players.push(player);
                }
                onGetReadyPhase(currentRoom);
            } else {
                console.error("Error when trying to get room data for room id '" + roomId + "'.");
            }
        });
    };

    myself.setReady = function () {
        return myself.changeReadyState(true);
    };

    myself.setNotReady = function () {
        return myself.changeReadyState(false);
    };

    myself.changeReadyState = function (state) {
        socket.emit("change_ready_state", {ready: state}, function (data) {
            if (data.status === "okay") {
                console.log("Now you are ready: " + state + ".");
            } else {
                console.error("You coulnd't change your ready state.");
            }
        });
    };

    function onGetReadyPhase(room) {

    }

    function startGame() {
        //myselft.onEnterGame();
    }

    function onPlayerCreated(player) {
        myself.player = player;
        //ask for rooms
        getRooms();
        createRoom("room 1", 4, function (room) {
            //autojoin
            currentRoom = room;
            console.log(rooms);
        });
    }

    function createPlayer(onPlayerCreated) {
        var name = "Player" + (Math.random() * 100);
        socket.emit("insert_player_data", {name: name}, function (response) {
            if (response.status === "okay") {
                var player = new Player(name);
                onPlayerCreated(player);
            } else {
                console.error("The name '" + name + "' is already in use, try another one.");
            }
        });
    }

    function getRooms() {
        socket.emit("get_rooms", function (response) {
            if (response.status === "okay") {
                var data = response.data;
                rooms = [];
                for (var i = 0; i < data.length; i++) {
                    var dataRoom = data[i];
                    var room = new Room();
                    room.name = dataRoom.name;
                    room.playersCount = dataRoom.playersCount;
                    rooms.push(room);
                }
            } else {
                console.error("Error while trying to get the rooms.");
            }
        });
    }

    function createRoom(name, maxPlayers, onRoomCreated) {
        socket.emit("create_room", {name: name, maxPlayers: maxPlayers}, function (response) {
            if (response.status === "okay") {
                var room = new Room();
                room.name = name;
                room.maxPlayers = maxPlayers;
                room.playersCount = 1;
                room.players = [player];
                room.createdDate = (new Date()).getTime();
                rooms.push(room);
                onRoomCreated(room);
            } else {
                console.error("Error while trying to create the room '" + name + "'. Choose another name for the room.");
            }
        });
    }

    function Room() {
        this.name;
        this.available;
        this.players = [];
        this.createdDate;
        this.playersCount;
        this.maxPlayers;
    }

    function Player(name) {
        this.id;
        this.name = name;
    }

//        var socket = io.connect("localhost:8080");
//        socket.on("connection", function () {
//            console.log(socket);
//        });

    return myself;
})(io);