export default {
    Now: function() {
        var performance = self ? self.performance : window.performance;
        return performance
            ? performance.now() / 1000
            : Date.now() / 1000;
    },

    Fill: function(array, value) {
        if (array.fill) {
            array.fill(value);
        }
        else {
            for (var i = 0; i < array.length; i++) {
                array[i] = value;
            }
        }
    },

    Base64ToArrayBuffer: function(base64) {
        var atob = self ? self.atob : window.atob;
        var binary = atob(base64);
        var length = binary.length;
        var bytes = new Uint8Array(length);
        for (var i = 0; i < length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

};
