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
method_simple.prototype.nodeChannels = [];
method_simple.prototype.linkChannels = [];
method_simple.prototype.ChannelChanged = function (param) {};
method_simple.prototype.name = "";
method_simple.prototype.SetData = function (d) {};
//######################################################################*/

method_simple.prototype.width = 0;
method_simple.prototype.height = 0;

var m_simple_radius = 6;
var m_simple_minDate,
    m_simple_maxDate,
    m_simple_currentDateMin,
    m_simple_currentDateMax;

function method_simple() {
    this.name = "simple";
    this.parameters = [
        { name: "Test Slider", ptype: "slider", minval: 0, maxval: 10, step: 1, pval: 0 },
        { name: "Disable rest", ptype: "checkbox", pval: false },
        { name: "Test TextBox", ptype: "textbox", pval: "" },
        { name: "Clamp within Canvas", ptype: "checkbox", pval: false }
    ];
    this.nodeChannels = [
        { name: "Node Colour", ctype: "catagory", inUse: false, dataParam: "" },
        { name: "Gravity Point", ctype: "catagory", inUse: false, dataParam: "" },
        { name: "Node Size", ctype: "numeric", inUse: false, dataParam: "" },
    ];
    this.linkChannels = [
        { name: "Link Colour", ctype: "catagory", inUse: false, dataParam: "" },
        { name: "Link Length", ctype: "numeric", inUse: false, dataParam: "" },
        { name: "Link Width", ctype: "numeric", inUse: false, dataParam: "" },
    ];
}
method_simple.prototype.getParam = function (name) {
    for (var i = 0; i < this.parameters.length; i++) {
        if (this.parameters[i].name == name) {
            return this.parameters[i];
        }
    }
};

var m_simple_svg;
var m_simple_force;
var m_simple_container;
var m_simple_circle;
var m_simple_link;
var m_simple_width = 960, m_simple_height = 500;
var m_simple_scalefactor;
var m_simple_translation;

// The page has been resized or some other event that requires a redraw
method_simple.prototype.Redraw = function (w, h) {
    if (w !== undefined && h !== undefined) {
        this.width = w;
        this.height = h;
        m_simple_width = w;
        m_simple_height = h;
    }
    // force = customLayout()
    m_simple_force = d3.layout.force()
        .gravity(.25)
        .charge(-840)
        .friction(0.3)
        .linkDistance(50)
        .size([this.width, this.height]);

    var zoom = d3.behavior.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", zoomed);

    m_simple_svg = d3.select("#chart").append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .call(zoom)
    m_simple_container = m_simple_svg.append("g");
};

// Called when the user changes any of the Parameters
method_simple.prototype.ParamChanged = function (param) {
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
    this.Update();
};

method_simple.prototype.ChannelChanged = function (channel, ctype) {
    if (channel === undefined) {
        //We don't know which Channel Changed, could be more than one. Poll all of them.
        //TODO
        return;
    }
    console.log("method: Channel: " + channel.name + " is now assigned to: " + channel.dataParam);
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
        //TODO Redo Node 
        console.log("method: re-doing nodes");
    } else {
        //TODO Redo Links
        console.log("method: re-doing links");
    }
};

method_simple.prototype.SetDateBounds = function (min, max) {
    m_simple_minDate = min;
    m_simple_maxDate = max;
};

method_simple.prototype.SetDate = function (higher, lower) {
    if (lower === undefined) {
        lower = m_simple_minDate;
    }
    m_simple_currentDateMin = lower;
    m_simple_currentDateMax = higher;
};

method_simple.prototype.SetData = function (d) {
    this.data = d;
};

//######################################################################
//########    Actual Method code Below
//######################################################################

function getScreenCoords(x, y) {
    if (m_simple_translation === undefined || m_simple_scalefactor === undefined) { return { x: x, y: y }; }
    var xn = m_simple_translation[0] + x * m_simple_scalefactor;
    var yn = m_simple_translation[1] + y * m_simple_scalefactor;
    return { x: xn, y: yn };
}

//used as callback, needs reference to 'this'
method_simple.prototype.Tick = function () {
    if (selected_method.getParam("Disable rest").pval) {
        //m_simple_force.resume();
        m_simple_force.alpha(Math.max(m_simple_force.alpha(), 0.1));
    }
    m_simple_circle.attr("cx", function (d) {
        if (selected_method.getParam("Clamp within Canvas").pval) {
            return d.x = Math.max(m_simple_radius, Math.min(canvasWidth - m_simple_radius, d.x));
        } else {
            return d.x;
        }
    })
        .attr("cy", function (d) {
        if (selected_method.getParam("Clamp within Canvas").pval) {
            return d.y = Math.max(m_simple_radius, Math.min(canvasHeight - m_simple_radius, d.y));
        } else {
            return d.y;
        }
    });

    m_simple_link.attr("x1", function (d) {
        return d.source.x;
    })
        .attr("y1", function (d) {
        return d.source.y;
    })
        .attr("x2", function (d) {
        return d.target.x;
    })
        .attr("y2", function (d) {
        return d.target.y;
    });
};

var m_simple_prev_currentDateMin, m_simple_prev_currentDateMax;
var m_simple_filteredLinks;

method_simple.prototype.Update = function () {
    if (m_simple_filteredLinks === undefined || m_simple_prev_currentDateMin != m_simple_currentDateMin || m_simple_prev_currentDateMax != m_simple_currentDateMax) {
        //filter data by date
        m_simple_filteredLinks = this.data.links.filter(
            function (d) {
                return (m_simple_currentDateMax >= new Date(d.date) && m_simple_currentDateMin <= new Date(d.date));
            });
        m_simple_prev_currentDateMin = m_simple_currentDateMin;
        m_simple_prev_currentDateMax = m_simple_currentDateMax;
    }
    var fill = d3.scale.category20();

    //Create Links
    m_simple_link = m_simple_container.selectAll("line").data(m_simple_filteredLinks);
    m_simple_link.enter().append("line")
        .style("stroke", function (d) {
        return d3.rgb(fill(parseInt(d.date.slice(0, 4)) - startDate.getFullYear())).darker();//will break if  > 20 years in scale
    });
    //when a link is no longer in the set, remove it from the graph.
    m_simple_link.exit().remove();

    //Create nodes
    m_simple_circle = m_simple_container.selectAll("circle")
        .data(this.data.nodes);
    m_simple_circle.enter()
        .append("circle")
        .attr("r", m_simple_radius - .75)
        .style("fill", function (d) { return fill(d.group); })
        .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); })
    //  .call(m_simple_force.drag);
    m_simple_circle.exit().remove();

    //force a tick
    m_simple_force.resume();
    //restart simulation
    //force.stop();
    m_simple_force.nodes(this.data.nodes).links(m_simple_filteredLinks).on("tick", method_simple.prototype.Tick).start();
};

function zoomed() {
    m_simple_translation = d3.event.translate;
    m_simple_scalefactor = d3.event.scale;
    m_simple_container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}