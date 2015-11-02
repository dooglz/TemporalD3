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

Base_Method.prototype.visNodeData = [];
Base_Method.prototype.visLinkData = [];
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
Base_Method.prototype.max_radius = 8;
Base_Method.prototype.min_radius = 2;

Base_Method.prototype.ColorThemes = [
    {
    LAnodeEdgeBaseColour: "white",
    LAnodeFillBaseColour: "#ef8a62",
    LAnodeEdgeHighlightColour: "black",
    LAnodeFillHighlightColour: "ef8a62",
    LBnodeEdgeBaseColour: "white",
    LBnodeFillBaseColour: "#67a9cf",
    LBnodeEdgeHighlightColour: "black",
    LBnodeFillHighlightColour: "67a9cf",
    //
    RAnodeEdgeBaseColour: "white",
    RAnodeFillBaseColour: "#67a9cf",
    RAnodeEdgeHighlightColour: "black",
    RAnodeFillHighlightColour: "67a9cf",
    RBnodeEdgeBaseColour: "white",
    RBnodeFillBaseColour: "#ef8a62",
    RBnodeEdgeHighlightColour: "black",
    RBnodeFillHighlightColour: "ef8a62",
    //
    LinkStrokeBaseColour: "grey",
    LinkStrokeHighlightColour: "orange",
    BackgroundColour: "white",
    name: "Default"
  },
  {
    LAnodeEdgeBaseColour: "white",
    LAnodeFillBaseColour: "deepskyblue",
    LAnodeEdgeHighlightColour: "black",
    LAnodeFillHighlightColour: "blue",
    LBnodeEdgeBaseColour: "white",
    LBnodeFillBaseColour: "orangered",
    LBnodeEdgeHighlightColour: "black",
    LBnodeFillHighlightColour: "red",
    //
    RAnodeEdgeBaseColour: "white",
    RAnodeFillBaseColour: "deepskyblue",
    RAnodeEdgeHighlightColour: "black",
    RAnodeFillHighlightColour: "blue",
    RBnodeEdgeBaseColour: "white",
    RBnodeFillBaseColour: "orangered",
    RBnodeEdgeHighlightColour: "black",
    RBnodeFillHighlightColour: "red",
    //
    LinkStrokeBaseColour: "grey",
    LinkStrokeHighlightColour: "orange",
    BackgroundColour: "white",
    name: "Default"
  },
  {
    LAnodeEdgeBaseColour: "lemonchiffon",
    LAnodeFillBaseColour: "darkslateblue",
    LAnodeEdgeHighlightColour: "crimson",
    LAnodeFillHighlightColour: "deepskyblue",
    LBnodeEdgeBaseColour: "orangered",
    LBnodeFillBaseColour: "orangered",
    LBnodeEdgeHighlightColour: "black",
    LBnodeFillHighlightColour: "red",
    //
    RAnodeEdgeBaseColour: "deepskyblue",
    RAnodeFillBaseColour: "deepskyblue",
    RAnodeEdgeHighlightColour: "black",
    RAnodeFillHighlightColour: "blue",
    RBnodeEdgeBaseColour: "orangered",
    RBnodeFillBaseColour: "orangered",
    RBnodeEdgeHighlightColour: "black",
    RBnodeFillHighlightColour: "red",
    //
    LinkStrokeBaseColour: "moccasin",
    LinkStrokeHighlightColour: "gold",
    BackgroundColour: "black",
    name: "Dark"
  }
];
Base_Method.prototype.ColorTheme = Base_Method.prototype.ColorThemes[0];

Base_Method.prototype.SetColorTheme = function (a) {
  if (typeof (a) == "string") {
    var s = a.toLocaleUpperCase();
    a = 0;
    for (var i = 0; i < this.ColorThemes.length; i++) {
      if (this.ColorThemes[i].name.toLocaleUpperCase() == s) {
        a = i;
        break;
      }
    }
  }
  a = Math.max(a, 0);
  a = Math.min(a, this.ColorThemes.length);
  this.ColorTheme = this.ColorThemes[a];
  this.Redraw();
}
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
Base_Method.prototype.Update = function () {
  this.CleanupTooltips();
};
Base_Method.prototype.Load = function () { };
Base_Method.prototype.Unload = function () { };
Base_Method.prototype.Redraw = function (w, h) {
  console.log("Base_Method Redrawing",w,h);
  if (w !== undefined && h !== undefined) {
    this.width = w;
    this.height = h;
    this.halfWidth = w * 0.5;
    this.halfHeight = h * 0.5;
  }
  //this.Update();
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
      if (param.func !== undefined) {
        param.func.bind(this)(param.pval);
      }
      console.log("Parameter: %o is: %o", param.name, param.pval);
    }
  }
  this.Update();
};

//######################################################################
//########    Channel Mapping Functions
//######################################################################
Base_Method.prototype.nodeChannels = [
  { name: "Gravity Point", ctype: "catagory", inUse: false, dataParam: "" },
  { name: "Node Colour LA", ctype: "catagory", inUse: false, dataParam: "", func: function () { this.NodeSplit(); } },
  { name: "Node Colour LB", ctype: "catagory", inUse: false, dataParam: "", func: function () { this.NodeSplit(); }, filter: function () { return this.getNodeChannel("Node Colour LA").inUse } },
  { name: "Node Colour RA", ctype: "catagory", inUse: false, dataParam: "", func: function () { this.NodeSplit(); }, filter: function () { return (displayMode == 2) } },
  { name: "Node Colour RB", ctype: "catagory", inUse: false, dataParam: "", func: function () { this.NodeSplit(); }, filter: function () { return this.getNodeChannel("Node Colour RA").inUse } },
  { name: "Node Size LA", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); } },
  { name: "Node Size LB", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); }, filter: function () { return this.getNodeChannel("Node Size LA").inUse } },
  { name: "Node Size RA", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); }, filter: function () { return (displayMode == 2) } },
  { name: "Node Size RB", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); }, filter: function () { return this.getNodeChannel("Node Size RA").inUse } }
];
Base_Method.prototype.linkChannels = [
  { name: "Link Colour", ctype: "catagory", inUse: false, dataParam: "" },
  { name: "Link Length", ctype: "numeric", inUse: false, dataParam: "" },
  { name: "Link Width", ctype: "numeric", inUse: false, dataParam: "" },
];

Base_Method.prototype.RedoLinks = function () { };
Base_Method.prototype.RedoNodes = function () { };

Base_Method.prototype.ChannelChanged = function (channel, ctype) {
  //console.log("method: ChannelChanged: " + channel);
  if (channel === undefined) {
    //We don't know which Channel Changed, could be more than one. Poll all of them.
    console.log("B_Method: channel changed, Reprocessing all channels");
    this.nodeChannels.forEach(function (c) {
      if (c.func !== undefined) {
        c.func.bind(this)(c.dataParam);
      }
    }, this);
    this.linkChannels.forEach(function (c) {
      if (c.func !== undefined) {
        c.func.bind(this)(c.dataParam);
      }
    }, this);
    this.RedoNodes();
    this.RedoLinks();
    return;
  }
  if (channel.func !== undefined) {
    channel.func.bind(this)(channel.dataParam);
  }
  console.log("B_Method: Channel: %o is now assigned to: %o", channel.name, channel.dataParam);
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

//Updates The positions of all nodes and links, does not handle data change. 
//Call this when the displaying the same nodes+links, but at different positions.
Base_Method.prototype.UpdateVisPositions = function (positionAttribute, positionAttributeOffset) {
  if (this.visLinks === undefined || this.visNodes === undefined) {
    console.error("Calling UpdateVisPositions(%o,%o), before NewVis()!", positionAttribute, positionAttributeOffset);
    console.trace();
    return;
  }
  if (positionAttribute === undefined) {
    positionAttribute = "";
  }
  if (positionAttributeOffset === undefined) {
    positionAttributeOffset = null;
  }
  //update links
  if (positionAttributeOffset != null) {
    this.visLinks
      .attr("x1", function (d) { return d.source[positionAttribute + "x"][positionAttributeOffset]; })
      .attr("y1", function (d) { return d.source[positionAttribute + "y"][positionAttributeOffset]; })
      .attr("x2", function (d) { return d.target[positionAttribute + "x"][positionAttributeOffset]; })
      .attr("y2", function (d) { return d.target[positionAttribute + "y"][positionAttributeOffset]; })
    if (this.visLinksR !== undefined) {
      this.visLinksR
        .attr("x1", function (d) { return d.source[positionAttribute + "x"]; })
        .attr("y1", function (d) { return d.source[positionAttribute + "y"]; })
        .attr("x2", function (d) { return d.target[positionAttribute + "x"]; })
        .attr("y2", function (d) { return d.target[positionAttribute + "y"]; });
        }
    } else {
    if (!Exists(this.data)) { return; }
    this.visLinks
      .attr("x1", function (d) { if (IsNumber(d.source)) { d.source = graphdata.nodes[d.source]; } return d.source[positionAttribute + "x"]; })
      .attr("y1", function (d) { if (IsNumber(d.source)) { d.source = graphdata.nodes[d.source]; } return d.source[positionAttribute + "y"]; })
      .attr("x2", function (d) { if (IsNumber(d.target)) { d.target = graphdata.nodes[d.target]; } return d.target[positionAttribute + "x"]; })
      .attr("y2", function (d) { if (IsNumber(d.target)) { d.target = graphdata.nodes[d.target]; } return d.target[positionAttribute + "y"]; });
    if (this.visLinksR !== undefined) {
      this.visLinksR
        .attr("x1", function (d) { if (IsNumber(d.source)) { d.source = graphdata.nodes[d.source]; } return d.source[positionAttribute + "x"]; })
        .attr("y1", function (d) { if (IsNumber(d.source)) { d.source = graphdata.nodes[d.source]; } return d.source[positionAttribute + "y"]; })
        .attr("x2", function (d) { if (IsNumber(d.target)) { d.target = graphdata.nodes[d.target]; } return d.target[positionAttribute + "x"]; })
        .attr("y2", function (d) { if (IsNumber(d.target)) { d.target = graphdata.nodes[d.target]; } return d.target[positionAttribute + "y"]; });
    }
  }
  
  //update Nodes
  if (positionAttributeOffset != null) {
    this.visNodes.attr("transform",function (d) {
        return "translate("
          +d[positionAttribute + "x"][positionAttributeOffset]
          +","+d[positionAttribute + "y"][positionAttributeOffset]
          +")"; });
     if (this.visNodesR !== undefined) {
        this.visNodesR.attr("transform",function (d) {
        return "translate("
          +d[positionAttribute + "x"][positionAttributeOffset]
          +","+d[positionAttribute + "y"][positionAttributeOffset]
          +")"; });
     }
  } else {
        
    this.visNodes
      .attr("transform",function (d) {
        if(isNaN(d[positionAttribute + "x"])){
       ///   console.log(d,positionAttribute,d[positionAttribute + "x"]);
         // debugger;
        }
        return "translate("
          +d[positionAttribute + "x"]
          +","+d[positionAttribute + "y"]
          +")"; 
         });
    if (this.visNodesR !== undefined) {
        this.visNodesR
          .attr("transform",function (d) {
          return "translate("
            +d[positionAttribute + "x"]
            +","+d[positionAttribute + "y"]
            +")"; 
           });
     }
  }
}
var lol = false;
//Add and remove nodes/links to the scene (Normally called after UpdateVisData(), and before UpdateVisPositions())
Base_Method.prototype.UpdateVis = function () {
  if (this.data === undefined || this.data === null) {
    console.warn("Creating/Updating vis, while this.data = undefined/null, bailing out.")
    return;
  }
  //Create Links
  this.visLinks = this.svgContainer.selectAll("line").data(this.visLinkData);
  this.visLinks.enter().insert("line", ":first-child").style("stroke", "black");
    //when a link is no longer in the set, remove it from the graph.
  this.visLinks.exit().remove();
  if(this.visLinks === undefined){
    console.warn("yoyoyoy");
      }
  if (displayMode == 2) {
    this.visLinksR = this.svgContainerR.selectAll("line").data(this.visLinkData);
    this.visLinksR.enter().insert("line", ":first-child").style("stroke", "black");
    this.visLinksR.exit().remove();
  } else {
    if (this.visLinksR !== undefined) {
      this.visLinksR.remove();
      this.visLinksR = undefined;
    }
  }

  //Create nodes
  this.visNodes = this.svgContainer.selectAll("g").data(this.visNodeData);
  var g = this.visNodes.enter().append("g")
    .on("click", Nodeclick)
    .on("dblclick", NodedblClick);
  g.append("circle");
  
  this.visNodesT = g.append("text")
      .attr("dx", 12)
      .attr("class", "nodeLabel")
      .attr("dy", ".35em")
      .text(function(d) { return d.label });
   //when a node is no longer in the set, remove it from the graph.
  this.visNodes.exit().remove();
  
  if (displayMode == 2) {
    this.visNodesR = this.svgContainerR.selectAll("g").data(this.visNodeData);
    var gR = this.visNodesR.enter().append("g")
      .on("click", Nodeclick)
      .on("dblclick", NodedblClick);
    gR.append("circle");
      gR.append("text")
      .attr("dx", 12)
      .attr("class", "nodeLabel")
      .attr("dy", ".35em")
      .text(function(d) { return d.label });
    this.visNodesR.exit().remove();
  } else {
    if (this.visNodesR !== undefined) {
      this.visNodesR.remove();
      this.visNodesR = undefined;
    }
  }
  
  //add hover tooltips, if there are attributes to display
  if (this.data.link_keys.length > 0) {
    this.visLinkTooltip = d3.select("body").append("div").attr("class", "tooltip link").style("opacity", 0);
    this.visLinks.on("mouseover", $.proxy(function (d) {
      var str = "";
      this.data.link_keys.forEach(function (o) {
        str += o + ": " + getLinkAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
      }, this);
      this.visLinkTooltip.transition().duration(200).style("opacity", .9);
      this.visLinkTooltip.html(str).style("left",(d3.event.pageX) + "px").style("top",(d3.event.pageY - 28) + "px");
    }, this));
    this.visLinks.on("mouseout", $.proxy(function (d) {
      this.visLinkTooltip.transition().duration(500).style("opacity", 0);
    }, this));
    //Right vis
    if (displayMode == 2) {
      this.visLinksR.on("mouseover", $.proxy(function (d) {
        var str = "";
        this.data.link_keys.forEach(function (o) {
          str += o + ": " + getLinkAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
        }, this);
        this.visLinkTooltip.transition().duration(200).style("opacity", .9);
        this.visLinkTooltip.html(str).style("left",(d3.event.pageX) + "px").style("top",(d3.event.pageY - 28) + "px");
      }, this));
      this.visLinksR.on("mouseout", $.proxy(function (d) {
        this.visLinkTooltip.transition().duration(500).style("opacity", 0);
      }, this));
    }
  }
  //
  if (this.data.node_keys.length > 0) {
    this.visNodeTooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    this.visNodes.on("mouseover", $.proxy(function (d) {
      var str = "";
      this.data.node_keys.forEach(function (o) {
        str += o + ": " + getNodeAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
      }, this);
      this.visNodeTooltip.transition().duration(200).style("opacity", .9);
      this.visNodeTooltip.html(str).style("left",(d3.event.pageX) + "px").style("top",(d3.event.pageY - 28) + "px");
    }, this));
    this.visNodes.on("mouseout", $.proxy(function (d) {
      this.visNodeTooltip.transition().duration(500).style("opacity", 0);
    }, this));
    //Right vis
    if (displayMode == 2) {
      this.visNodesR.on("mouseover", $.proxy(function (d) {
        var str = "";
        this.data.node_keys.forEach(function (o) {
          str += o + ": " + getNodeAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
        }, this);
        this.visNodeTooltip.transition().duration(200).style("opacity", .9);
        this.visNodeTooltip.html(str).style("left",(d3.event.pageX) + "px").style("top",(d3.event.pageY - 28) + "px");
      }, this));
      this.visNodesR.on("mouseout", $.proxy(function (d) {
        this.visNodeTooltip.transition().duration(500).style("opacity", 0);
      }, this));
    }
  }

}

//shortcut to ClearVis and UpdateVis
Base_Method.prototype.NewVis = function () {
  this.ClearVis();
  this.UpdateVis();
  this.LAttributesPerVisNode = 0;
  this.RAttributesPerVisNode = 0;
  this.NodeSplit(); 
  console.info("Vis created");
}

//removes any vis from the page.
Base_Method.prototype.ClearVis = function () {
  //this.ClearVisData();
  if (this.visNodes !== undefined) {
    this.visNodes.remove();
    this.visNodes = undefined;
  }
  if (this.visLinks !== undefined) {
    this.visLinks.remove();
    this.visLinks = undefined;
  }
  if (this.visNodesR !== undefined) {
    this.visNodesR.remove();
    this.visNodesR = undefined;
  }
  if (this.visLinksR !== undefined) {
    this.visLinksR.remove();
    this.visLinksR = undefined;
  }
  this.CleanupTooltips();
  console.info("Vis cleared");
}

Base_Method.prototype.ClearVisData = function () {
  this.visNodeData = [];
  this.visLinkData = [];
  console.info("Cleared vis data");
}

Base_Method.prototype.UpdateVisData = function (newNodeData, newLinkData) {
  var nodeRems = 0;
  var nodeAdds = 0;
  var linkRems = 0;
  var linkAdds = 0;
  //remove dead
  this.visNodeData.forEach(function (o) {
    if ($.inArray(o, newNodeData) == -1) {
      RemoveFromArray(this.visNodeData, o);
      nodeRems++;
    }
  }, this);
  //add new
  newNodeData.forEach(function (o) {
    if ($.inArray(o, this.visNodeData) == -1) {
      this.visNodeData.push(o);
      nodeAdds++;
    }
  }, this);
  
  //remove dead
  this.visLinkData.forEach(function (o) {
    if ($.inArray(o, newLinkData) == -1) {
      RemoveFromArray(this.visLinkData, o);
      linkRems++;
    }
  }, this);
  //add new
  newLinkData.forEach(function (o) {
    if ($.inArray(o, this.visLinkData) == -1) {
      this.visLinkData.push(o);
      linkAdds++;
    }
  }, this);
  //  console.info("Updated vis data, node -:%o, +:%o, link -:%o, +:%o, length N:%o, L:%o", nodeRems, nodeAdds, linkRems, linkAdds, this.visNodeData.length, this.visLinkData.length);
}


// action to take on mouse click
function Nodeclick(d) {
  if(!selected_method.isHighlightingEnabled){return;}
  if (d.highlight) {
    d.highlight = false;
  } else {
    d.highlight = true;
  }
  //such a hack
  selected_method.RedoNodes();
}
// action to take on mouse double click
function NodedblClick(d) { }

Base_Method.prototype.LAttributesPerVisNode = 0;
Base_Method.prototype.RAttributesPerVisNode = 0;

Base_Method.prototype.NodeSplit = function () {
  if(!Exists(this.visNodes) || this.visNodes.length ==0 ){
    console.error("No visnodes");
    return;
  }
  this.NodeSplitL();
  this.NodeSplitR();
}
Base_Method.prototype.NodeSplitL = function () {
  var channelLA = this.getNodeChannel("Node Size LA").inUse || this.getNodeChannel("Node Colour LA").inUse;
  var channelLB = this.getNodeChannel("Node Size LB").inUse || this.getNodeChannel("Node Colour LB").inUse;
  
  if(this.LAttributesPerVisNode ==0 && !channelLA && !channelLB){
    return;
  }
  if(this.LAttributesPerVisNode ==1 && channelLA && !channelLB){
    return;
  }
  if(this.LAttributesPerVisNode ==2 && channelLA && channelLB){
    return;
  }
  
  //cleanup any stale circles first
  
  this.visNodes.selectAll("#secondary").remove();
  //only chan A
  if (channelLA && !channelLB) {
    this.LAttributesPerVisNode = 1;
    return;
  }
  //chan A + B
  if (channelLA && channelLB) {
    if(this.LAttributesPerVisNode < 2){
      //add extra nodes
      this.visNodes.append("circle").attr("id","secondary");
    }else{
      //remove extra nodes
      this.visNodes.selectAll("#secondary").remove();
    }
    this.LAttributesPerVisNode = 2;
    return;
  }
};
Base_Method.prototype.NodeSplitR = function () {
  
  var channelRA = this.getNodeChannel("Node Size RA").inUse || this.getNodeChannel("Node Colour RA").inUse;
  var channelRB = this.getNodeChannel("Node Size RB").inUse || this.getNodeChannel("Node Colour RB").inUse;
  
  if(this.RAttributesPerVisNode == 0 && !channelRA && !channelRB){
    return;
  }
  if(this.RAttributesPerVisNode == 1 && channelRA && !channelRB){
    return;
  }
  if(this.RAttributesPerVisNode == 2 && channelRA && channelRB){
    return;
  }
  
  //cleanup any stale circles first
  if (this.visNodesR) {
    this.visNodesR.selectAll("#secondaryR").remove();
  }
  //only chan A
  if (channelRA && !channelRB) {
    this.RAttributesPerVisNode = 1;
    return;
  }
  //chan A + B
  if (channelRA && channelRB) {
    if(this.RAttributesPerVisNode < 2){
      //add extra nodes
      if(this.visNodesR !== undefined){
        this.visNodesR.append("circle").attr("id","secondaryR");
      }
    }else{
      //remove extra nodes
      if(this.visNodesR !== undefined){
        this.visNodesR.selectAll("#secondaryR").remove();
      }
    }
    this.RAttributesPerVisNode = 2;
    return;
  }
};

//######################################################################
//########    Default Channel Mapping Functions
//######################################################################
Base_Method.prototype.RedoLinks = function () {
  if (this.visLinks === undefined) { return; }
  this.visLinks
    .style("stroke-width", this.LinkWidth.bind(this))
    .style("stroke", this.Linkcolour.bind(this));
  //  .style("stroke-dasharray", this.LinkDash.bind(this));
  if (this.visLinksR !== undefined) {
    this.visLinksR
      .style("stroke-width", this.LinkWidth.bind(this))
      .style("stroke", this.Linkcolour.bind(this));
  }
};

Base_Method.prototype.RedoNodes = function () {
  if (this.visNodes === undefined) { return; }
  this.visNodes.selectAll("circle")
    .attr("r", this.NodeSize.bind(this,"left"))
    .style("fill", this.NodeColour.bind(this,"left"))
    .style("stroke", this.NodeStrokeColour.bind(this,"left"))
    .style("filter", this.NodeFilter.bind(this,"left"))
    .attr("clip-path", this.NodeClip.bind(this,"left"));
  if (this.visNodesR !== undefined) {
    this.visNodesR.selectAll("circle")
      .attr("r", this.NodeSize.bind(this,"right"))
      .style("fill", this.NodeColour.bind(this,"right"))
      .style("stroke", this.NodeStrokeColour.bind(this,"right"))
      .style("filter", this.NodeFilter.bind(this,"right"))
      .attr("clip-path", this.NodeClip.bind(this,"right"));
  }
};

var fill = d3.scale.category20().domain(d3.range(0, 20));

//------------------ Link Channels ----------------
Base_Method.prototype.Linkcolour = function (d) {

  var channel = this.getLinkChannel("Link Colour");
  if (channel.inUse) {
    var rgb = d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax))));
    if (d.highlight) {
      return rgb.darker();
    } else {
      return rgb;
    }
  } else {
    if (d.highlight) {
      return this.ColorTheme.LinkStrokeHighlightColour;
    } else {
      return this.ColorTheme.LinkStrokeBaseColour;
    }
  }
};

Base_Method.prototype.LinkWidth = function (d) {
  var channel = this.getLinkChannel("Link Width");
  if (channel.inUse) {
    var a = getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax,selected_method.getParam("Normalize All").pval);
    a = Math.max(a,0.1);
    return (3.5 * a) + "px";
  } else {
    return "1.5px";
  }
};

Base_Method.prototype.LinkLength = function (d) {
  var channel = this.getLinkChannel("Link Length");
  if (channel.inUse) {
    return 100 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax,selected_method.getParam("Normalize All").pval);
  } else {
    return 50;
  }
};

//------------------ Node Channels ----------------
Base_Method.prototype.NodeFilter = function (side, d, half, i) {
  if (d.highlight) {
    return "url(#glow)";
  }
  return "";
};

Base_Method.prototype.NodeColour = function (side, d, half, i) {
  // console.log("side: %o, data: %o, q: %o, index: %o,",side,d,q,i);
  //side  = "leftright"
  var channel;
  if (half == 0) {
    if (side == "left") {
      channel = this.getNodeChannel("Node Colour LA");
    } else {
      channel = this.getNodeChannel("Node Colour RA");
    }
  } else {
    if (side == "left") {
      channel = this.getNodeChannel("Node Colour LB");
    } else {
      channel = this.getNodeChannel("Node Colour RB");
    }
  }
  if (channel.inUse) {
    var rgb = d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax))));
    if (d.highlight) {
      return rgb.darker();
    } else {
      return rgb;
    }
  } else {
    //not in use, use defaults
    if (d.highlight) {
      if (side == "left") {
        if (half == 0) {
          return this.ColorTheme.LAnodeFillHighlightColour;
        } else {
          return this.ColorTheme.LBnodeFillHighlightColour;
        }
      } else {
        if (half == 0) {
          return this.ColorTheme.RAnodeFillHighlightColour;
        } else {
          return this.ColorTheme.RBnodeFillHighlightColour;
        }
      }
    } else {
      if (side == "left") {
        if (half == 0) {
          return this.ColorTheme.LAnodeFillBaseColour;
        } else {
          return this.ColorTheme.LBnodeFillBaseColour;
        }
      } else {
        if (half == 0) {
          return this.ColorTheme.RAnodeFillBaseColour;
        } else {
          return this.ColorTheme.RBnodeFillBaseColour;
        }
      }
    }
  }
  console.error("01212");
  return;
};

Base_Method.prototype.NodeStrokeColour = function (side, d, half, i) {
  if (d.highlight) {
    if (side == "left") {
      if (half == 0) {
        return this.ColorTheme.LAnodeEdgeHighlightColour;
      } else {
        return this.ColorTheme.LBnodeEdgeHighlightColour;
      }
    } else {
      if (half == 0) {
        return this.ColorTheme.RAnodeEdgeHighlightColour;
      } else {
        return this.ColorTheme.RBnodeEdgeHighlightColour;
      }
    }
  } else {
    if (side == "left") {
      if (half == 0) {
        return this.ColorTheme.LAnodeEdgeBaseColour;
      } else {
        return this.ColorTheme.LBnodeEdgeBaseColour;
      }
    } else {
      if (half == 0) {
        return this.ColorTheme.RAnodeEdgeBaseColour;
      } else {
        return this.ColorTheme.RBnodeEdgeBaseColour;
      }
    }
  }
};

Base_Method.prototype.NodeSize = function (side, d, half, i) {
  var channel;
  var channel2;
  var isSplit = false;
  if (half == 0) { //A side
    if (side == "left") {
      isSplit = this.LAttributesPerVisNode > 1;
      if(isSplit){
       channel2 = this.getNodeChannel("Node Size LB");
      }
      channel = this.getNodeChannel("Node Size LA");
    } else {
      isSplit = this.RAttributesPerVisNode > 1;
      if(isSplit){
       channel2 = this.getNodeChannel("Node Size RB");
      }
      channel = this.getNodeChannel("Node Size RA");
    }
  } else {  //B Side
    if (side == "left") {
      isSplit = this.LAttributesPerVisNode > 1;
      if(isSplit){
       channel2 = this.getNodeChannel("Node Size LA");
      }
      channel = this.getNodeChannel("Node Size LB");
    } else {
      isSplit = this.RAttributesPerVisNode > 1;
      if(isSplit){
       channel2 = this.getNodeChannel("Node Size RA");
      }
      channel = this.getNodeChannel("Node Size RB");
    }
  }
  if (channel.inUse) {
  //  if(isSplit){
      //we are going to have to normalise both channles.
    //   return ((this.default_radius - .75) + this.default_radius * getAttributeAsPercentage(this.data, d, [channel.dataParam,channel2.dataParam], this.currentDateMin, this.currentDateMax));
   // }else{
   var a = getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax,selected_method.getParam("Normalize All").pval);
 //  a = this.default_radius;
   a = a * (this.min_radius * (this.max_radius - this.min_radius));
   a = Math.min(this.max_radius, a);
   a = Math.max(this.min_radius, a);
   return a;
  // return ((this.default_radius - .75) + this.default_radius * a);
   // }
  } else {
    return (this.max_radius + this.min_radius) * 0.5;
  }
};

Base_Method.prototype.NodeClip = function (side, d, half, i) {
  var channelA;
  var channelB;
  if (side == "left") {
    channelA = this.getNodeChannel("Node Size LA").inUse || this.getNodeChannel("Node Colour LA").inUse;
    channelB = this.getNodeChannel("Node Size LB").inUse || this.getNodeChannel("Node Colour LB").inUse;
  } else {
    channelA = this.getNodeChannel("Node Size RA").inUse || this.getNodeChannel("Node Colour RA").inUse;
    channelB = this.getNodeChannel("Node Size RB").inUse || this.getNodeChannel("Node Colour RB").inUse;
  }
  
  if (channelA && channelB) {
    if (half == 0) {
      return "url(#cut-off-left)";
    } else if (half == 1) {
      return "url(#cut-off-right)";
    }
  } else if (channelA && channelB) {
    if (half == 0) {
      return "url(#cut-off-mid3)";
    } else if (half == 1) {
      return "url(#cut-off-left3)";
    }else if (half == 2) {
      return "url(#cut-off-right3)";
    }
  }
  return "";
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

Base_Method.prototype.SetupSVGFilters = function () {
  d3.selectAll("svg").attr("style","stroke-width: 0px; background-color: "+this.ColorTheme.BackgroundColour+";");
  // this.svg.attr("fill-opacity",1.0);
  if(d3.selectAll("defs")[0].length == d3.selectAll("svg")[0].length){
    //return;
  }
  d3.selectAll("defs").remove();
  var defs = d3.selectAll("svg").append("defs");
  var clipB = defs.append("clipPath");
   clipB.attr("id", "cut-off-left");
   clipB.append("rect")
     .attr("x", "-50%")
     .attr("y", "-50%")
     .attr("width", "50%")
     .attr("height", "100%");
   var clipT = defs.append("clipPath");
   clipT.attr("id", "cut-off-right");
   clipT.append("rect")
     .attr("x", "0")
     .attr("y", "-50%")
     .attr("width", "50%")
     .attr("height", "100%");
  
  var filter = defs.append("filter")
    .attr("id", "glow")
    .attr("height", "400%")
    .attr("width", "400%")
    .attr("x", "-80%")
    .attr("y", "-80%");
  filter.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 4)
    .attr("result", "coloredBlur");
  var feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
};

Base_Method.prototype.CleanupTooltips= function () {
  if (this.visNodeTooltip !== undefined) {
    $(".tooltip").remove();
    this.visNodeTooltip = undefined;
  }
  if (this.visLinkTooltip !== undefined) {
    $(".tooltip.link").remove();
    this.visLinkTooltip = undefined;
  }
}

Base_Method.prototype.isHighlightingEnabled = true;
Base_Method.prototype.EnableHighlighting = function (bool) {
  if (bool == undefined) { bool = !this.isHighlightingEnabled };
  if (this.isHighlightingEnabled == bool) {
    return;
  }
  this.isHighlightingEnabled = bool;
}

Base_Method.prototype.Highlight = function (id,bool) {
  if(!Exists(this.data) || !Exists(this.data.nodes)){
    console.error("Highlight, Data is null");
    return ;
  }
  //console.log("High1 ",this.GetHighlightedNodes());
  //console.log("High1 ",this.data);
  //console.log("00000000 ",id,bool);
  if(!Exists(bool)){bool = true;}
  if (!Exists(id)) {
    this.data.nodes.forEach(function (n) {
      n.highlight = false;
    }, this);
  } else {
    if ($.isArray(id)) {
      id.forEach(function (n) {
        this.data.nodes[n].highlight = bool;
      }, this);
    } else {
      this.data.nodes[id].highlight = bool;
    }
  }
  this.RedoNodes();
  console.log("High2 ",this.GetHighlightedNodes());
}

Base_Method.prototype.SetLabel = function (id,str) {
  if(!Exists(this.data) || !Exists(this.data.nodes)){
    console.error("SetText, Data is null");
    return ;
  }
  if(!Exists(id)){
    this.data.nodes.forEach(function (n) {
      n.label = "";
    }, this);
  }else{
    this.data.nodes[id].label = str;
  }
  selected_method.visNodes.selectAll("text").text(function(d) { return d.label });
}

Base_Method.prototype.GetHighlightedNodes = function () {
  if(!Exists(this.data) || !Exists(this.data.nodes)){
    console.error("GetHighlightedNodes, Data is null");
    return [];
  }
  var a = [];
  this.data.nodes.forEach(function (n) {
    if (n.highlight) {
      a.push(n);
    }
  }, this);
  return a;
}

Base_Method.prototype.GetChannelAssignments = function () {
  var a = { node: [], link: [] };
  this.nodeChannels.forEach(function (c) {
    if (c.inUse) {
      a.node.push({ name:c.name, nicename:this.ChannelNameToNiceName(c.name), attribute: c.dataParam, id: EscapeID(c.name) });
    }
  }, this);
  this.linkChannels.forEach(function (c) {
    if (c.inUse) {
      a.link.push({ name:c.name, nicename:this.ChannelNameToNiceName(c.name), attribute: c.dataParam, id: EscapeID(c.name) });
    }
  }, this);
  return a;
}


Base_Method.prototype.ChannelNameToNiceName = function (name) {
  var prefix = "";
  var slice = name.slice(-2,-1);
  var slice2 = name.slice(-1);
  if (displayMode == 2){
    //split view, show prefix
    prefix = (slice == "L" ? "Left " : "Right ");
  }
  var postfix = "";
  if ((slice == "L" && this.LAttributesPerVisNode > 1) || (slice == "R" && this.LAttributesPerVisNode > 1)){
    //split view, show prefix
    postfix = (slice2 == "A" ? ", Left Half" : ", Right Half");
  }
  return prefix + name.slice(0,-3) + postfix;
}

Base_Method.prototype.PrintPositions = function (name) {
  var positions = [];
  this.data.nodes.forEach(function (e) {
    positions.push({ x: e.x, y: e.y });
  }, this);
  return positions;
}