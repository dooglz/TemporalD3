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
Base_Method.prototype.minDate;
Base_Method.prototype.maxDate;
Base_Method.prototype.discreet = false;
///Method constructor
function Base_Method() {
  this.name = "Base_method";
  this.parameters = [];
  this.nodeChannels = [];
  this.linkChannels = [];
}

Base_Method.prototype.SetDateBounds = function (min, max) {
  //console.log("setting mindate to: %o and maxdate to: %o", min, max);
  this.minDate = min;
  this.maxDate = max;
};

Base_Method.prototype.SetDate = function (higher, lower) {
  if (lower === undefined) {
    lower = this.minDate;
  }
  this.discreet = (lower == higher);
  if (this.discreet) {
    var range = this.getRangeFromDiscreet(lower);
    this.currentDateMin = range.min;
    this.currentDateMax = range.max;
  }
  this.currentDateMin = lower;
  this.currentDateMax = higher;
  this.RedoNodes();
  this.RedoLinks();
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
Base_Method.prototype.Update = function () { };
Base_Method.prototype.Load = function () { };
Base_Method.prototype.Unload = function () { };
Base_Method.prototype.Redraw = function (w, h) {
  console.log("baseRedrawing");
  if (w !== undefined && h !== undefined) {
    this.width = w;
    this.height = h;
    this.halfWidth = w * 0.5;
    this.halfHeight = h * 0.5;
  }
  this.RedoNodes();
  this.RedoLinks();
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
      if (this.parameters[i].func !== undefined) {
        this.parameters[i].func.bind(this)(this.parameters[i].pval);
      }
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

Base_Method.prototype.forceLayoutPercentDone = function (force) {
  if (force.alpha() == 0) { return 100; }
  return Math.round(((0.1 - force.alpha()) / 0.1) * 100);
}

Base_Method.prototype.getRangeFromDiscreet = function (discreetTime) {
  if (this.data.date_type == "number" || this.data.date_type == "static") {
    return { min: discreetTime, max: discreetTime };
  }
  //base functionality is to round to the whole month
  var mindate = new Date();
  var maxdate = new Date()
  mindate.setTime(0);
  maxdate.setTime(0);
  mindate.setFullYear(discreetTime.getFullYear());
  maxdate.setFullYear(discreetTime.getFullYear());
  mindate.setMonth(discreetTime.getMonth());
  maxdate.setMonth(discreetTime.getMonth() + 1);
  return { min: mindate, max: maxdate };
};

Base_Method.prototype.getDiscreetfromDate = function (date, date_type) {
  if (date_type === undefined) {
    date_type = "date";
  }
  if (date_type == "date") {
    return ((date.getYear() - this.minDate.getYear()) * 12) + (date.getMonth() - this.minDate.getMonth());
  } else if (date_type == "number") {
    return date;
  } else {
    return null;
  }
}

Base_Method.prototype.getDateRangeFromDiscreet = function (discreet, date_type) {
  if (date_type === undefined) {
    date_type = "date";
  }
  if (date_type == "date") {
    var mind = new Date(this.minDate);
    mind.setDate(1);
    mind.setMonth(mind.getMonth() + discreet);
    var maxd = new Date(mind);
    maxd.setMonth(maxd.getMonth() + 1);
    return { min: mind, max: maxd }
  } else if (date_type == "number") {
    return { min: Math.max(discreet, this.minDate), max: Math.min(discreet + 1, this.maxDate) };
  } else {
    return { min: null, max: null };
  }
}
Base_Method.prototype.getDateFromDiscreet = function (discreet, date_type) {
  if (date_type === undefined) {
    date_type = "date";
  }
  if (date_type == "date") {
    var dd = new Date(this.minDate);
    dd.setDate(1);
    dd.setMonth(dd.getMonth() + discreet);
    return dd;
  } else if (date_type == "number") {
    return discreet;
  } else {
    return null;
  }
}
Base_Method.prototype.CountDiscreetStepsInRange = function (min, max, date_type) {
  if (date_type === undefined) {
    date_type = "date";
  }
  if (date_type == "date") {
    return ((max.getYear() - min.getYear()) * 12) + (max.getMonth() - min.getMonth());
  } else if (date_type == "number") {
    max = Math.min(max, this.maxDate);
    min = Math.max(min, this.minDate);
    return (max - this.minDate) - (min - this.minDate);
  } else {
    return 0;
  }
}

Base_Method.prototype.StandardNodeFilter = function (d) {
  var b;
  if (selected_method.getParam("Cumulative Nodes").pval) {
    b = IsNodeEverAliveInRange(d, this.currentDateMin, this.currentDateMax);
  } else {
    b = NodeCreatedInRange(d, this.currentDateMin, this.currentDateMax);
  }
  if (b !== false && b !== true) {
    console.error(b);
  }
  return b;
}

Base_Method.prototype.StandardLinkFilter = function (d) {
  var b;
  if (selected_method.getParam("Cumulative Links").pval) {
    b = IsLinkEverAliveInRange(d, this.currentDateMin, this.currentDateMax);
  } else {
    b = LinkCreatedInRange(d, this.currentDateMin, this.currentDateMax);
  }
  if (b !== false && b !== true) {
    console.error(b);
  }
  if (b) {
    //check source and target node exists
    var source = IsNumber(d.target) ? this.data.nodes[d.target] : d.target;
    var target = IsNumber(d.source) ? this.data.nodes[d.source] : d.source;
    if ($.inArray(source, this.filteredNodes) == -1 || $.inArray(target, this.filteredNodes) == -1) {
      return false;
    }
    return true;
  }
  return false;
}

// Doesn't check to see if link has nodes to connect to.
Base_Method.prototype.QuickLinkFilter = function (d) {
  var b;
  if (selected_method.getParam("Cumulative Links").pval) {
    b = IsLinkEverAliveInRange(d, this.currentDateMin, this.currentDateMax);
  } else {
    b = LinkCreatedInRange(d, this.currentDateMin, this.currentDateMax);
  }
  if (b !== false && b !== true) {
    console.error(b);
  }
  return b;
}


//######################################################################
//########   Layout visulisations
//######################################################################

//Updates The positions of all nodes and links, does not filter or handle data change. 
Base_Method.prototype.UpdateLocalLayout = function (positionAttribute, positionAttributeOffset) {
  if (this.lastRenderdpositionAttribute != positionAttribute) {
    console.error("Call ShowLocalLayout(" + positionAttribute + ") before UpdateLocalLayout(" + positionAttribute + ")!");
    console.trace();
    return;
  }
  if (positionAttribute === undefined) {
    positionAttribute = "";
  }
  if (positionAttributeOffset === undefined) {
    positionAttributeOffset = null;
  }
  if (this.visLinks === undefined) {
    console.trace();
  }
  //update links
  if (positionAttributeOffset != null) {
    this.visLinks
      .attr("x1", function (d) { return d.source[positionAttribute + "x"][positionAttributeOffset]; })
      .attr("y1", function (d) { return d.source[positionAttribute + "y"][positionAttributeOffset]; })
      .attr("x2", function (d) { return d.target[positionAttribute + "x"][positionAttributeOffset]; })
      .attr("y2", function (d) { return d.target[positionAttribute + "y"][positionAttributeOffset]; })
  } else {
    this.visLinks
      .attr("x1", function (d) { return d.source[positionAttribute + "x"]; })
      .attr("y1", function (d) { return d.source[positionAttribute + "y"]; })
      .attr("x2", function (d) { return d.target[positionAttribute + "x"]; })
      .attr("y2", function (d) { return d.target[positionAttribute + "y"]; })
  }
  //update Nodes
  if (positionAttributeOffset != null) {
    this.visNodes
      .attr("cx", function (d) { return d[positionAttribute + "x"][positionAttributeOffset]; })
      .attr("cy", function (d) { return d[positionAttribute + "y"][positionAttributeOffset]; })
  } else {
    this.visNodes
      .attr("cx", function (d) { return d[positionAttribute + "x"]; })
      .attr("cy", function (d) { return d[positionAttribute + "y"]; })
  }
}

Base_Method.prototype.ShowLocalLayout = function (positionAttribute, positionAttributeOffset, nodes, links) {
  if (positionAttribute === undefined) {
    positionAttribute = "";
  }
  if (positionAttributeOffset === undefined) {
    positionAttributeOffset = null;
  }
  if (nodes === undefined || nodes === null) {
    this.filteredNodes = this.data.nodes;
  }
  if (links === undefined || links === null) {
    this.filteredLinks = this.data.links;
  }
  
  //check if we actually have any data for these parameters
  if (this.currentDateMin === undefined) { this.currentDateMin = 0; }
  if (nodes[0] === undefined || nodes[0][positionAttribute + "x"] === undefined
    || (positionAttributeOffset != null && (nodes[0][positionAttribute + "x"][positionAttributeOffset] === undefined))) {
    return;
  }

  if (this.lastRenderdpositionAttribute != positionAttribute) {
    this.lastRenderdpositionAttribute = positionAttribute;
  }
  
  //Tidy up stale tooltips
  if (this.visNodeTooltip !== undefined) {
    $(".tooltip").remove();
    this.visNodeTooltip = undefined;
  }
  if (this.visLinkTooltip !== undefined) {
    $(".tooltip.link").remove();
    this.visLinkTooltip = undefined;
  }

  //Create Links
  this.visLinks = this.svgContainer.selectAll("line").data(links);
  this.visLinks.enter().append("line").style("stroke", "black");

  //when a link is no longer in the set, remove it from the graph.
  this.visLinks.exit().remove();

  //Create nodes
  this.visNodes = this.svgContainer.selectAll("circle").data(nodes);
  this.visNodes.enter().append("circle");
  
  //Update Poisitions
  this.UpdateLocalLayout(positionAttribute, positionAttributeOffset);

  //add hover tooltips, if there are attributes to display
  if (this.data.link_keys.length > 0) {
    this.visLinkTooltip = d3.select("body").append("div").attr("class", "tooltip link").style("opacity", 0);
    this.visLinks.on("mouseover", $.proxy(function (d) {
      var str = "";
      this.data.link_keys.forEach(function (o) {
        str += o + ": " + getLinkAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
      }, this);
      this.visLinkTooltip.transition().duration(200).style("opacity", .9);
      this.visLinkTooltip.html(str).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
    }, this));
    this.visLinks.on("mouseout", $.proxy(function (d) {
      this.visLinkTooltip.transition().duration(500).style("opacity", 0);
    }, this));
  }
  if (this.data.node_keys.length > 0) {
    this.visNodeTooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    this.visNodes.on("mouseover", $.proxy(function (d) {
      var str = "";
      this.data.node_keys.forEach(function (o) {
        str += o + ": " + getNodeAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
      }, this);
      this.visNodeTooltip.transition().duration(200).style("opacity", .9);
      this.visNodeTooltip.html(str).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
    }, this));
    this.visNodes.on("mouseout", $.proxy(function (d) {
      this.visNodeTooltip.transition().duration(500).style("opacity", 0);
    }, this));
  }
  //when a node is no longer in the set, remove it from the graph.
  this.visNodes.exit().remove();
}

Base_Method.prototype.HideLocalLayout = function () {
  if (this.visNodes !== undefined) {
    this.visNodes.remove();
  }
  if (this.visLinks !== undefined) {
    this.visLinks.remove();
  }
  //Tidy up stale tooltips
  if (this.visNodeTooltip !== undefined) {
    $(".tooltip").remove();
    this.visNodeTooltip = undefined;
  }
  if (this.visLinkTooltip !== undefined) {
    $(".tooltip.link").remove();
    this.visLinkTooltip = undefined;
  }
}


//######################################################################
//########    Default Channel Mapping Functions
//######################################################################


Base_Method.prototype.RedoLinks = function () {
  if (this.visLinks === undefined) { return; }
  // this.UpdateLocalLayout("", null);
  this.visLinks.style("stroke-width", this.LinkWidth.bind(this))
    .style("stroke-width", this.LinkWidth.bind(this))
    .style("stroke-dasharray", this.LinkDash.bind(this));
};

Base_Method.prototype.RedoNodes = function () {
  if (this.visNodes === undefined) { return; }
  // this.UpdateLocalLayout("", null);
  this.visNodes
    .attr("r", this.NodeSize.bind(this))
    .style("fill", this.NodeColour.bind(this))
    .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); });
};

var fill = d3.scale.category20().domain(d3.range(0, 20));

//------------------ Link Channels ----------------
Base_Method.prototype.Linkcolour = function (d) {
  var channel = this.getLinkChannel("Link Colour");
  if (channel.inUse) {
    return d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax)))).darker();
  } else {
    return "black";
  }
};

Base_Method.prototype.LinkWidth = function (d) {
  var channel = this.getLinkChannel("Link Width");
  if (channel.inUse) {
    return (3.5 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax)) + "px";
  } else {
    return "1.5px";
  }
};

Base_Method.prototype.LinkLength = function (d) {
  var channel = this.getLinkChannel("Link Length");
  if (channel.inUse) {
    return 100 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
  } else {
    return 50;
  }
};

//------------------ Node Channels ----------------
Base_Method.prototype.NodeColour = function (d) {
  var channel = this.getNodeChannel("Node Colour");
  if (channel.inUse) {
    return d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax)))).darker();
  } else {
    return "black";
  }
};

Base_Method.prototype.NodeSize = function (d) {
  var channel = this.getNodeChannel("Node Size");
  if (channel.inUse) {
    return (this.default_radius - .75) + this.default_radius * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
  } else {
    return this.default_radius - .75;
  }
};

Base_Method.prototype.GravityPoint = function (d) {
  var channel = this.getNodeChannel("Gravity Point");
  if (channel.inUse) {
    return 1;
  } else {
    return 0;
  }
};

Base_Method.prototype.LinkDash = function (d) {
  var channel = this.getLinkChannel("Link Width");
  if (channel.inUse) {
    var q = getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
    if (q == 0) {
      return "10";
    }
  }
  return "0";
};
