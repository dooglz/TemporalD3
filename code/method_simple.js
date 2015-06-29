
function method_simple() {
  // Add object properties like this
  this.name = "simple";
  this.parameters = [
    { name: "Test Slider", ptype: "slider", minval: 0, maxval: 10, step: 1, pval: 0 },
    { name: "Test Checkbox", ptype: "checkbox", pval: false },
    { name: "Test TextBox", ptype: "textbox", pval: "" },
    { name: "Test Checkbox2", ptype: "checkbox", pval: true }
  ];
}

method_simple.prototype.get = function () {
  alert("Howdy, my name is" + this.name);
};

//the page has been resized or some other event that requires a redraw
method_simple.prototype.redraw = function () {
  alert("Howdy, my name is" + this.name);
};

//called when the user changes any of the Parameters
method_simple.prototype.paramChanged = function (param) {
  if (param !== undefined) {
    var i = this.parameters.indexOf(param);
    if (i != -1) {
      console.log("Parameter: " + this.parameters[i].name + " is now: " + this.parameters[i].pval);
    } else {
      console.error("Unkown parameter changed!");
      console.error(param);
    }
  } else {
    //We don't know what parmeter changed, could be more than one, poll all of them
    for (var i in this.parameters) {
      param = this.parameters[i];
      console.log("Parameter: " + param.name + " is: " + param.pval);
    }
  }
};

method_simple.prototype.minDate;
method_simple.prototype.maxDate;
method_simple.prototype.currentDateMin;
method_simple.prototype.currentDateMax;

method_simple.prototype.setDateBounds = function (min, max) {
  this.minDate = min;
  this.maxDate = max;
};

method_simple.prototype.setDate = function (lower, higher) {
  this.currentDateMin = lower;
  if(higher === undefined){
    higher = lower;
  }
  this.currentDateMax = higher;
};