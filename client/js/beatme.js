var beatme = (function (io) {
    var myself = {};
    //current connected player
    var player = null;
    //all rooms in the game, the data for each room could be not complete
    var rooms = [];
    //it's the client socket used
    var socket;

    myself.create = function () {
        socket = io.connect("localhost:8080");
        socket.on("connect", function () {
            //ask for name
            var playerData = {name: "Player" + (Math.random() * 100)};
            createPlayer(playerData, onPlayerCreated);
        });
        socket.on("begin_game", function () {
            startGame();
        });
    };

    function createPlayer(playerData, onPlayerCreated) {
        socket.emit("insert_player_data", {name: playerData.name}, function (response) {
            if (response.status === "okay") {
                var player = new Player(name);
                onPlayerCreated(player);
            } else {
                console.error("The name '" + name + "' is already in use, try another one.");
            }
        });
    }

    function onPlayerCreated(player) {
        myself.player = player;
        //ask for rooms
        getRooms(function (rooms) {
            if (rooms.length === 0) {
                createRoom({name: "Room 1", maxPlayersCount: 2}, function (room) {
                    //autojoin
                    player.currentRoom = room;
                });
            }
        });
    }

    function getRooms(onRoomsReceived) {
        socket.emit("get_rooms", function (response) {
            if (response.status === "okay") {
                var data = response.data;
                rooms = [];
                for (var i = 0; i < data.length; i++) {
                    var roomData = data[i];
                    var room = new Room();
                    room.name = roomData.name;
                    room.private = roomData.private;
                    room.phase = roomData.phase;
                    room.createdDate = roomData.createdDate;
                    //it's no necessary to load the players info in this instance
                    //room.players = dataRoom.players;
                    room.playersCount = roomData.playersCount;
                    room.maxPlayersCount = roomData.maxPlayersCount;
                    room.available = room.isAvailable();
                    rooms.push(room);
                }
                onRoomsReceived(rooms);
            } else {
                console.error("Error while trying to get the rooms.");
            }
        });
    }

    function createRoom(roomData, onRoomCreated) {
        socket.emit("create_room", roomData, function (response) {
            if (response.status === "okay") {
                //take parameters from server instead of the user setted ones becuase of the security and the server knows how to limit those
                var roomData = response.data;
                var room = new Room();
                room.name = roomData.name;
                room.private = roomData.private;
                room.phase = roomData.phase;
                room.createdDate = roomData.createdDate;
                room.maxPlayersCount = roomData.maxPlayersCount;
                room.addPlayer(player);
                room.available = room.isAvailable();
                rooms.push(room);
                onRoomCreated(room);
            } else {
                console.error("Error while trying to create the room '" + name + "'. Choose another name for the room.");
            }
        });
    }

    myself.joinRoom = function (name) {
        //look for deatils of room and join it
        socket.emit("join_room", {name: name}, function (response) {
            if (response.status === "okay") {
                var roomData = response.data;
                var currentRoom = new Room();
                currentRoom.name = roomData.name;
                currentRoom.players = [];
                for (var i = 0; i < roomData.players.length; i++) {
                    var player = new Player();
                    player.id = roomData.players[i].id;
                    player.name = roomData.players[i].name;
                    currentRoom.players.push(player);
                }
                player.currentRoom = currentRoom;
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
                console.log("Now you are ready state is: " + state + ".");
            } else {
                console.error("You coulnd't change your ready state.");
            }
        });
    };

    function onGetReadyPhase(room) {

    }

    function startGame() {
        //myselft.onEnterGame();
        console.log("Let's play!");
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
                player.currentRoom = instance;
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
        this.id = null;//socket client id
        this.name = name;
        this.ready = false;
        //the current room where the player is, the data must be complete: other players, etc.
        this.currentRoom = null;
        this.equals = function (other) {
            return (instance.id === other.id);
        };
    }

    return myself;
})(io);