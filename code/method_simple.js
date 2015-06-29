//######################################################################
//########  Interface code, All methods should have this
/*######################################################################
method_simple.prototype.Redraw = function (w,h) {};
method_simple.prototype.ParamChanged = function (param) {};
method_simple.prototype.SetDateBounds = function (min, max) {};
method_simple.prototype.SetDate = function (higher,lower) {};
method_simple.prototype.Update = function () {};
method_simple.prototype.parameters = [];
method_simple.prototype.name = "";
method_simple.prototype.SetData = function (d) {};
//######################################################################*/

method_simple.prototype.force;
method_simple.prototype.svg;
method_simple.prototype.radius = 6;
method_simple.prototype.link;
method_simple.prototype.node;
method_simple.prototype.width = 0;
method_simple.prototype.height = 0;

method_simple.prototype.minDate;
method_simple.prototype.maxDate;
method_simple.prototype.currentDateMin;
method_simple.prototype.currentDateMax;

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
method_simple.prototype.get = function() {
    alert("Howdy, my name is" + this.name);
};

// The page has been resized or some other event that requires a redraw
method_simple.prototype.Redraw = function(w, h) {
    if (w !== undefined && h !== undefined) {
        this.width = w;
        this.height = h;
    }
    //Hate how these are here, move them.
    // force = customLayout()
    this.force = d3.layout.force()
        .gravity(.28)
        .charge(-640)
        .linkDistance(50)
        .size([this.width, this.height]);

   this.svg = d3.select("#chart").append("svg")
        .attr("width", this.width)
        .attr("height", this.height);
};

// Called when the user changes any of the Parameters
method_simple.prototype.ParamChanged = function(param) {
    if (param !== undefined) {
        var i = this.parameters.indexOf(param);
        if (i != -1) {
            console.log("Parameter: " + this.parameters[i].name + " is now: " + this.parameters[i].pval);
        } else {
            console.error("Unkown parameter changed!");
            console.error(param);
        }
    } else {
        //We don't know which parmeter changed, could be more than one. Poll all of them.
        for (var i in this.parameters) {
            param = this.parameters[i];
            console.log("Parameter: " + param.name + " is: " + param.pval);
        }
    }
};

method_simple.prototype.SetDateBounds = function(min, max) {
    this.minDate = min;
    this.maxDate = max;
};

method_simple.prototype.SetDate = function(higher, lower) {
    if (lower === undefined) {
        lower = this.minDate;
    }
    this.currentDateMin = lower;
    this.currentDateMax = higher;
};

method_simple.prototype.SetData = function(d) {
    this.data = d;
};

//######################################################################
//########    Actual Method code Below
//######################################################################

//used as callback, needs reference to 'this'
method_simple.prototype.Tick = function() {
        selected_method.node.attr("cx", function(d) {
            return d.x = Math.max(selected_method.radius, Math.min(canvasWidth - selected_method.radius, d.x));
        })
        .attr("cy", function(d) {
            return d.y = Math.max(selected_method.radius, Math.min(canvasHeight - selected_method.radius, d.y));
        });

        selected_method.link.attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        });
};

method_simple.prototype.Update = function() {

    //filter data by date
    var instance = this; //callback nonsence
    var filteredLinks = this.data.links.filter(
        function(d) {
            return (instance.currentDateMax >= new Date(d.date) && instance.currentDateMin <= new Date(d.date));
        });

    var fill = d3.scale.category20();

    //Create Links
    this.link = this.svg.selectAll("line").data(filteredLinks);
    this.link.enter().append("line")
        .style("stroke", function(d) {
            //will break if  > 20 years in scale
            return d3.rgb(fill(parseInt(d.date.slice(0, 4)) - startDate.getFullYear())).darker();
        });
    //when a link is no longer in the set, remove it from the graph.
    this.link.exit().remove();

    //Create nodes
    this.node = this.svg.selectAll("circle").data(this.data.nodes);
    this.node.enter().append("circle")
        .attr("r", this.radius - .75)
        .style("fill", function(d) {
            return fill(d.group);
        })
        .style("stroke", function(d) {
            return d3.rgb(fill(d.group)).darker();
        })
        .call(this.force.drag);
    this.node.exit().remove();

    //restart simulation
    //force.stop();
    this.force.nodes(this.data.nodes).links(filteredLinks).on("tick", method_simple.prototype.Tick).start();
};