
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

//   if (this.parameters.hasOwnProperty(param)) {

method_simple.prototype.paramChanged = function () {
  for (var i in this.parameters) {
    var param = selected_method.parameters[i];
    console.log("Parameter: " + param.name + " is: " + param.pval);
  }
};
