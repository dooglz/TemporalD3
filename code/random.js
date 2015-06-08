var clamp = function(num, min, max) {
    return num < min ? min : (num > max ? max : num);
};

// Linear Congruential Generator Variant of a Lehman Generator 
var lcg = (function () {
  var m = 4294967296, a = 1664525, c = 1013904223, seed, z;
  return {
    setSeed: function (val) {
      z = seed = val; //|| Math.round(Math.random() * m);
    },
    getSeed: function () {
      return seed;
    },
    rand: function () {
      z = (a * z + c) % m;
      return z / m;   // return a float in [0, 1) 
    }
  };
} ());

function Rfs(val) {
  val = Math.abs(val);
  if(val == 0){val = 505.505;}
  return ((1664525 * (val * 1123.011 * 4294967296) + 1013904223) % 4294967296) / 4294967296;
}

function Rf(min, max) {
  var f = lcg.rand();
  if (typeof min !== "undefined" || typeof min !== "undefined") {
    return min + (f * (max - min));
  }
  return f;
}

function Ri(min, max, align) {
  var f = lcg.rand();
  if (typeof min !== "undefined" || typeof min !== "undefined") {
    if (typeof align !== "undefined") {
      return Math.round(((min + (f * (max - min))) / align) + .5) * align; 
    }
    return Math.round(min + (f * (max - min)));
  }
  return Math.round(f);
}

function RfsColour(val) {
  var rint = Math.round(0xffffff *Rfs(val));
  return ('#0' + rint.toString(16)).replace(/^#0([0-9a-f]{6})$/i, '#$1');
}

function RfColour() {
  var rint = Math.round(0xffffff *lcg.rand());
  return ('#0' + rint.toString(16)).replace(/^#0([0-9a-f]{6})$/i, '#$1');
}