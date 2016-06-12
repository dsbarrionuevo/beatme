(function () {
    $(document).ready(function () {
        beatme.create();
        
        var canvas = $("canvas")[0];
        var ctx = canvas.getContext("2d");
        ctx.fillStyle="red";
        ctx.fillRect(10,10,20,20);
    });
})();