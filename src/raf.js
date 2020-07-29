(function () {
    var lastTime = 0;
    self.requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = self.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

    self.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };
}());
