(function () {
    $(document).ready(function () {
        beatme.create();
        beatme.askForRooms(function (rooms) {
            $("#listRooms").empty();
            for (var i = 0; i < rooms.length; i++) {
                var room = rooms[i];
                var $roomListItem = $('<a href="#" class="list-group-item itemRoom" data-room-name="' + room.name + '">' + room.name + '</a>');
                $("#listRooms").append($roomListItem);
            }
        });
        beatme.onRoomCreated = function (room) {
            var $roomListItem = $('<a href="#" class="list-group-item">' + room.name + '</a>');
            $("#listRooms").append($roomListItem);
        };
        beatme.onJoined = function (room) {
            console.log(room);
            $("#containerRooms").hide();
            $("#containerPlayers").show();
            $("#listPlayers").empty();
            for (var i = 0; i < room.players.length; i++) {
                var player = room.players[i];
                var $playerListItem = $('<a href="#" class="list-group-item">' + player.name + '</a>');
                $("#listPlayers").append($playerListItem);
            }
        };

        //game
        var canvas = $("canvas")[0];
        var ctx = canvas.getContext("2d");

        //ui
        $(document).on("click", "#listRooms .itemRoom", function () {
            var roomName = $(this).attr("data-room-name");
            beatme.joinRoom(roomName);
        });
        $("#containerRooms").show();
        $("#containerPlayers").hide();
        $("#infoPlayer").hide();
        $("#messageForCreatingPlayer").hide();
        $("#modalInsertPlayerName").modal("show");
        $("#modalInsertPlayerName").on("shown.bs.modal", function () {
            $("#txtInsertPlayerName").focus();
        });
        $("#modalInsertPlayerName form").submit(function (evt) {
            evt.preventDefault();
            var name = $("#txtInsertPlayerName").val().trim();
            if (name.length > 0) {
                beatme.createPlayer({name: name},
                function () {
                    $("#infoPlayer").show();
                    $("#infoPlayer").text("Logged as: " + name);
                    $("#modalInsertPlayerName").modal("hide");
                }, function (message) {
                    $("#messageForCreatingPlayer").show();
                    $("#messageForCreatingPlayer").text(message);
                });
            }
        });
        $("#modalCreateRoom").on("shown.bs.modal", function () {
            $("#txtRoomName").val("");
            $("#txtMaxPlayers").val("");
            $("#txtRoomPassword").val("");
        });
        $("#modalCreateRoom form").submit(function (evt) {
            evt.preventDefault();
            var roomData = {
                name: $("#txtRoomName").val().trim(),
                maxPlayersCount: ((!isNaN($("#txtMaxPlayers").val())) ? parseInt($("#txtMaxPlayers").val().trim()) : 3),
                private: ($("#txtRoomPassword").val().trim().length > 0),
                password: ($("#txtRoomPassword").val().trim().length > 0) ? $("#txtRoomPassword").val().trim() : ""
            };
            beatme.createRoom(roomData, function () {
                $("#modalCreateRoom").modal("hide");
            });
        });

        //...
        $('[data-toggle="tooltip"]').tooltip();

    });
})();