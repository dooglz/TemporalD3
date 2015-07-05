/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>
//######################################################################
//########  Interface code, All methods should have this
/*######################################################################
Method_Simple.prototype.Redraw = function (w,h) {};
Method_Simple.prototype.ParamChanged = function (param) {};
Method_Simple.prototype.SetDateBounds = function (min, max) {};
Method_Simple.prototype.SetDate = function (higher,lower) {};
Method_Simple.prototype.Update = function () {};
Method_Simple.prototype.parameters = [];
Method_Simple.prototype.nodeChannels = [];
Method_Simple.prototype.linkChannels = [];
Method_Simple.prototype.ChannelChanged = function (param) {};
Method_Simple.prototype.name = "";
Method_Simple.prototype.SetData = function (d) {};
//######################################################################*/

Method_Simple.prototype.width = 0;
Method_Simple.prototype.height = 0;

var m_simple_radius = 6;
var m_simple_minDate,
  m_simple_maxDate,
  m_simple_currentDateMin,
  m_simple_currentDateMax;

function Method_Simple() {
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


var m_simple_svg;
var m_simple_force;
var m_simple_container;
var m_simple_circle;
var m_simple_link;
var m_simple_width = 960, m_simple_height = 500;
var m_simple_scalefactor;
var m_simple_translation;
var m_simple_prev_currentDateMin, m_simple_prev_currentDateMax;
var m_simple_filteredLinks;

Method_Simple.prototype.SetDateBounds = function (min, max) {
  m_simple_minDate = min;
  m_simple_maxDate = max;
};

Method_Simple.prototype.SetDate = function (higher, lower) {
  if (lower === undefined) {
    lower = m_simple_minDate;
  }
  m_simple_currentDateMin = lower;
  m_simple_currentDateMax = higher;
};

Method_Simple.prototype.SetData = function (d) {
  this.data = d;
};

function getScreenCoords(x, y) {
  if (m_simple_translation === undefined || m_simple_scalefactor === undefined) { return { x: x, y: y }; }
  var xn = m_simple_translation[0] + x * m_simple_scalefactor;
  var yn = m_simple_translation[1] + y * m_simple_scalefactor;
  return { x: xn, y: yn };
}

var foci = [{ x: (m_simple_width / 2), y: (m_simple_height / 2) },
  { x: (m_simple_width / 2) + 400, y: (m_simple_height / 2) + 400 },
  { x: (m_simple_width / 2) + 400, y: (m_simple_height / 2) - 400 },
  { x: (m_simple_width / 2) - 400, y: (m_simple_height / 2) + 400 },
  { x: (m_simple_width / 2) - 400, y: (m_simple_height / 2) - 400 }];

//######################################################################
//########    Main Update and Tick
//######################################################################

Method_Simple.prototype.Update = function () {
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
    .style("stroke", this.Linkcolour.bind(this))
    .style("stroke-width", this.LinkWidth.bind(this));
        
  //when a link is no longer in the set, remove it from the graph.
  m_simple_link.exit().remove();

  //Create nodes
  m_simple_circle = m_simple_container.selectAll("circle")
    .data(this.data.nodes);
  m_simple_circle.enter()
    .append("circle")
    .attr("r", this.NodeSize.bind(this))
    .style("fill", this.NodeColour.bind(this))
    .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); });
  //  .call(m_simple_force.drag);
  m_simple_circle.exit().remove();

  //force a tick
  m_simple_force.resume();
  //restart simulation
  //force.stop();
  m_simple_force.nodes(this.data.nodes).links(m_simple_filteredLinks).on("tick", this.Tick.bind(this)).start();
};

// The page has been resized or some other event that requires a redraw
Method_Simple.prototype.Redraw = function (w, h) {
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
    .linkDistance(this.LinkLength.bind(this))
    .size([this.width, this.height]);

  var zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", zoomed);

  m_simple_svg = d3.select("#chart").append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .call(zoom);
  m_simple_container = m_simple_svg.append("g");
};


function zoomed() {
  m_simple_translation = d3.event.translate;
  m_simple_scalefactor = d3.event.scale;
  m_simple_container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  //m_simple_circle.style("fill", "red");
  // m_simple_link.style("stroke", "black");
}

Method_Simple.prototype.Tick = function (e) {
  if (selected_method.getParam("Disable rest").pval) {
    //m_simple_force.resume();
    m_simple_force.alpha(Math.max(m_simple_force.alpha(), 0.1));
  }
  var channel = this.getNodeChannel("Gravity Point");
  if (channel.inUse) {
    var k = .1 * e.alpha;

    this.data.nodes.forEach($.proxy(function (o, i, array) {
      var point = Math.round((foci.length - 1) * getAttributeAsPercentage(this.data, o, channel.dataParam));
      o.y += (foci[point].y - o.y) * k;
      o.x += (foci[point].x - o.x) * k;
    }, this));
  }

  m_simple_circle.attr("cx", $.proxy(function (d) {
    if (this.getParam("Clamp within Canvas").pval) {
      return d.x = Math.max(m_simple_radius, Math.min(canvasWidth - m_simple_radius, d.x));
    } else {
      return d.x;
    }
  }, this))
    .attr("cy", $.proxy(function (d) {
    if (this.getParam("Clamp within Canvas").pval) {
      return d.y = Math.max(m_simple_radius, Math.min(canvasHeight - m_simple_radius, d.y));
    } else {
      return d.y;
    }
  }, this));

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


//######################################################################
//########    Parameter handeling
//######################################################################

Method_Simple.prototype.getParam = function (name) {
  for (var i = 0; i < this.parameters.length; i++) {
    if (this.parameters[i].name == name) {
      return this.parameters[i];
    }
  }
};

// Called when the user changes any of the Parameters
Method_Simple.prototype.ParamChanged = function (param) {
  if (param !== undefined) {
    var i = this.parameters.indexOf(param);
    if (i != -1) {
      console.log("Parameter:%o is now:%o", + this.parameters[i].name, this.parameters[i].pval);
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

Method_Simple.prototype.ChannelChanged = function (channel, ctype) {
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

Method_Simple.prototype.getLinkChannel = function (name) {
  for (var i = 0; i < this.linkChannels.length; i++) {
    if (this.linkChannels[i].name == name) {
      return this.linkChannels[i];
    }
  }
};

Method_Simple.prototype.getNodeChannel = function (name) {
  for (var i = 0; i < this.nodeChannels.length; i++) {
    if (this.nodeChannels[i].name == name) {
      return this.nodeChannels[i];
    }
  }
};

Method_Simple.prototype.RedoLinks = function () {
  if (m_simple_link === undefined) { return; }
  console.log("method: re-doing links");
  m_simple_link.style("stroke", this.Linkcolour.bind(this)).style("stroke-width", this.LinkWidth.bind(this));
  m_simple_force.start();
};

Method_Simple.prototype.RedoNodes = function () {
  if (m_simple_link === undefined) { return; }
  console.log("method: re-doing nodes");
  m_simple_circle.style("fill", this.NodeColour.bind(this)).attr("r", this.NodeSize.bind(this));
};

var fill = d3.scale.category20();

//------------------ Link Channels ----------------
Method_Simple.prototype.Linkcolour = function (d) {
  var channel = this.getLinkChannel("Link Colour");
  if (channel.inUse) {
    //just convert everythign to a scale of maxium of 20 for now
    var val;
    if (channel.dataParam == "date") {
      val = parseInt(d.date.slice(0, 4)) - startDate.getFullYear();//will break if  > 20 years in scale
    } else {
      val = d[channel.dataParam]; //who knows what type this is, needtype hint, //TODO
    }
    return d3.rgb(fill(val)).darker();
  } else {
    return "black";
  }
};

Method_Simple.prototype.LinkWidth = function (d) {
  var channel = this.getLinkChannel("Link Width");
  if (channel.inUse) {
    return (3.5 * getAttributeAsPercentage(this.data, d, channel.dataParam)) + "px";
  } else {
    return "1.5px";
  }
};

Method_Simple.prototype.LinkLength = function (d) {
  var channel = this.getLinkChannel("Link Length");
  if (channel.inUse) {
    return 100 * getAttributeAsPercentage(this.data, d, channel.dataParam);
  } else {
    return 50;
  }
};
//------------------ Node Channels ----------------
Method_Simple.prototype.NodeColour = function (d) {
  var channel = this.getNodeChannel("Node Colour");
  if (channel.inUse) {
    return "red";
  } else {
    return "black";
  }
};

Method_Simple.prototype.NodeSize = function (d) {
  var channel = this.getNodeChannel("Node Size");
  if (channel.inUse) {
    return (m_simple_radius - .75) + m_simple_radius * getAttributeAsPercentage(this.data, d, channel.dataParam);
  } else {
    return m_simple_radius - .75;
  }
};

Method_Simple.prototype.GravityPoint = function (d) {
  var channel = this.getNodeChannel("Gravity Point");
  if (channel.inUse) {
    return 1;
  } else {
    return 0;
  }
};

//######################################################################
//########    
//######################################################################
