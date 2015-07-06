/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>
//######################################################################
//########  Interface code, All methods should have this
/*######################################################################
Base_Method.prototype.Redraw = function (w,h) {};
Base_Method.prototype.ParamChanged = function (param) {};
Base_Method.prototype.SetDateBounds = function (min, max) {};
Base_Method.prototype.SetDate = function (higher,lower) {};
Base_Method.prototype.Update = function () {};
Base_Method.prototype.parameters = [];
Base_Method.prototype.nodeChannels = [];
Base_Method.prototype.linkChannels = [];
Base_Method.prototype.ChannelChanged = function (param) {};
Base_Method.prototype.name = "";
Base_Method.prototype.SetData = function (d) {};
//######################################################################*/

Base_Method.prototype.data;
Base_Method.prototype.width = 1013;
Base_Method.prototype.height = 568;
Base_Method.prototype.halfWidth = 506.5;
Base_Method.prototype.halfHeight = 284;
Base_Method.prototype.currentDateMax;
Base_Method.prototype.currentDateMin;
///Method constructor
function Base_Method() {
  this.name = "Base_method";
  this.parameters = [];
  this.nodeChannels = [];
  this.linkChannels = [];
}

Base_Method.prototype.SetDateBounds = function (min, max) {
  this.minDate = min;
  this.maxDate = max;
};

Base_Method.prototype.SetDate = function (higher, lower) {
  if (lower === undefined) {
    lower = this.minDate;
  }
  this.currentDateMin = lower;
  this.currentDateMax = higher;
};

Base_Method.prototype.SetData = function (d) {
  this.data = d;
};
/*
function getScreenCoords(x, y) {
  if (this.svgTranslation === undefined || this.scalefactor === undefined) { return { x: x, y: y }; }
  var xn = this.svgTranslation[0] + x * this.scalefactor;
  var yn = this.svgTranslation[1] + y * this.scalefactor;
  return { x: xn, y: yn };
}
*/
Base_Method.prototype.Update = function () {

};

Base_Method.prototype.Redraw = function (w, h) {
  if (w !== undefined && h !== undefined) {
    this.width = w;
    this.height = h;
    this.halfWidth = w * 0.5;
    this.halfHeight = h * 0.5;
  }
};


//######################################################################
//########    Parameter handeling
//######################################################################

Base_Method.prototype.getParam = function (name) {
  for (var i = 0; i < this.parameters.length; i++) {
    if (this.parameters[i].name == name) {
      return this.parameters[i];
    }
  }
};

// Called when the user changes any of the Parameters
Base_Method.prototype.ParamChanged = function (param) {
  if (param !== undefined) {
    var i = this.parameters.indexOf(param);
    if (i != -1) {
      console.log("Parameter:%o is now:%o", this.parameters[i].name, this.parameters[i].pval);
    } else {
      console.error("Unkown parameter changed! %o", param);
    }
  } else {
    //We don't know which parmeter changed, could be more than one. Poll all of them.
    for (var i in this.parameters) {
      param = this.parameters[i];
      console.log("Parameter: %o is: %o", param.name, param.pval);
    }
  }
  this.Update();
};

//######################################################################
//########    Channel Mapping Functions
//######################################################################
Base_Method.prototype.RedoLinks = function () { };
Base_Method.prototype.RedoNodes = function () { };

Base_Method.prototype.ChannelChanged = function (channel, ctype) {
  //console.log("method: ChannelChanged: " + channel);
  if (channel === undefined) {
    //We don't know which Channel Changed, could be more than one. Poll all of them.
    this.RedoNodes();
    this.RedoLinks();
    return;
  }
  console.log("method: Channel: %o is now assigned to: %o", channel.name, channel.dataParam);
  if (ctype === undefined || !(ctype == "node" || ctype == "link")) {
    if ($.inArray(channel, this.nodeChannels) != -1) {
      ctype = "node";
    } else if ($.inArray(channel, this.linkChannels) != -1) {
      ctype = "link";
    } else {
      console.error("error");
      return;
    }
  }
  if (ctype == "node") {
    this.RedoNodes();
  } else {
    this.RedoLinks();
  }
};

Base_Method.prototype.getLinkChannel = function (name) {
  for (var i = 0; i < this.linkChannels.length; i++) {
    if (this.linkChannels[i].name == name) {
      return this.linkChannels[i];
    }
  }
};

Base_Method.prototype.getNodeChannel = function (name) {
  for (var i = 0; i < this.nodeChannels.length; i++) {
    if (this.nodeChannels[i].name == name) {
      return this.nodeChannels[i];
    }
  }
};