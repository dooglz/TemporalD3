/// <reference path="../typings/d3/d3.d.ts"/>
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



method_simple.prototype.width = 0;
method_simple.prototype.height = 0;

var method_simple_radius = 6;
var method_simple_minDate,
method_simple_maxDate,
method_simple_currentDateMin,
method_simple_currentDateMax;

function method_simple() {
  // Add object properties like this
  this.name = "simple";
  this.parameters = [
    { name: "Test Slider", ptype: "slider", minval: 0, maxval: 10, step: 1, pval: 0 },
    { name: "Test Checkbox", ptype: "checkbox", pval: false },
    { name: "Test TextBox", ptype: "textbox", pval: "" },
    { name: "Clamp within Canvas", ptype: "checkbox", pval: true }
  ];
}
method_simple.prototype.getParam = function(name) {
   for (var i=0; i<this.parameters.length; i++) {
        if(this.parameters[i].name == name){
            return this.parameters[i];
        }
    }
};

var method_simple_svg;
var method_simple_force;
var method_simple_container;
var m_simple_width = 960,m_simple_height = 500;

// The page has been resized or some other event that requires a redraw
method_simple.prototype.Redraw = function(w, h) {
    if (w !== undefined && h !== undefined) {
        this.width = w;
        this.height = h;
        m_simple_width = w;
        m_simple_height = h;
    }
    // force = customLayout()
    method_simple_force = d3.layout.force()
        .gravity(.28)
        .charge(-640)
        .linkDistance(10)
        .size([this.width, this.height]);
        
   method_simple_svg = d3.select("#chart").append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        
   method_simple_container = method_simple_svg.append("g");
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
   method_simple_minDate = min;
   method_simple_maxDate = max;
};

method_simple.prototype.SetDate = function(higher, lower) {
    if (lower === undefined) {
        lower = method_simple_minDate;
    }
    method_simple_currentDateMin = lower;
    method_simple_currentDateMax = higher;
};

method_simple.prototype.SetData = function(d) {
    this.data = d;
};

//######################################################################
//########    Actual Method code Below
//######################################################################

//used as callback, needs reference to 'this'
method_simple.prototype.Tick = function() {
   method_simple_force.resume();

        method_simple_circle.attr("cx", function(d) {
           if(selected_method.getParam("Clamp within Canvas").pval){
                return d.x = Math.max(method_simple_radius, Math.min(canvasWidth - method_simple_radius, d.x));
           }else{
                return d.x;
           }
        })
        .attr("cy", function(d) {
            if(selected_method.getParam("Clamp within Canvas").pval){
                return d.y = Math.max(method_simple_radius, Math.min(canvasHeight - method_simple_radius, d.y));
            }else{
                return d.y;
            }
        });

       method_simple_link.attr("x1", function(d) {
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

var method_simple_circle;
var method_simple_link;
method_simple.prototype.Update = function() {

    //filter data by date
    var filteredLinks = this.data.links.filter(
        function(d) {
            return (method_simple_currentDateMax >= new Date(d.date) && method_simple_currentDateMin <= new Date(d.date));
        });
    var fill = d3.scale.category20();

    //Create Links
    method_simple_link = method_simple_container.selectAll("line").data(filteredLinks);
    method_simple_link.enter().append("line")
        .style("stroke", function(d) {
            //will break if  > 20 years in scale
            return d3.rgb(fill(parseInt(d.date.slice(0, 4)) - startDate.getFullYear())).darker();
        });
    //when a link is no longer in the set, remove it from the graph.
    method_simple_link.exit().remove();

    //Create nodes
    method_simple_circle = method_simple_container.selectAll("circle").data(this.data.nodes);
    method_simple_circle.enter().append("circle")
        .attr("r", method_simple_radius - .75)
        .style("fill", function (d) {return fill(d.group);})
        .style("stroke", function (d) {return d3.rgb(fill(d.group)).darker();})
        .call(method_simple_force.drag);
    method_simple_circle.exit().remove();

    //restart simulation
    //force.stop();
    method_simple_force.nodes(this.data.nodes).links(filteredLinks).on("tick", method_simple.prototype.Tick).start();
};