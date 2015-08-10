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

Base_Method.prototype.ColorThemes = [
  {
    nodeEdgeBaseColour: "darkblue",
    nodeFillBaseColour: "darkgrey",
    nodeEdgeHighlightColour: "crimson",
    nodeFillHighlightColour: "lightsteelblue",
    LinkStrokeBaseColour: "black",
    LinkStrokeHighlightColour: "black",
    BackgroundColour: "mintcream"
  },
  {
    nodeEdgeBaseColour: "lemonchiffon",
    nodeFillBaseColour: "darkslateblue",
    nodeEdgeHighlightColour: "crimson",
    nodeFillHighlightColour: "deepskyblue",
    LinkStrokeBaseColour: "moccasin",
    LinkStrokeHighlightColour: "gold",
    BackgroundColour: "black"
  }
];
Base_Method.prototype.ColorTheme = Base_Method.prototype.ColorThemes[0];

Base_Method.prototype.SetColorTheme = function (a) {
 a = Math.max(a,0);
 a = Math.min(a,this.ColorThemes.length);
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

Base_Method.prototype.nodeChannels = [
  { name: "Node Colour", ctype: "catagory", inUse: false, dataParam: "" },
  { name: "Gravity Point", ctype: "catagory", inUse: false, dataParam: "" },
  { name: "Node Size A", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); } },
  { name: "Node Size B", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); } },
  { name: "Node Size C", ctype: "numeric", inUse: false, dataParam: "", func: function () { this.NodeSplit(); } },
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
    this.RedoNodes();
    this.RedoLinks();
    return;
  }
  if (channel.func !== undefined) {
    channel.func.bind(this)(channel.dataParam);
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
      this.visLinks
        .attr("x1", function (d) { return d.source[positionAttribute + "x"]; })
        .attr("y1", function (d) { return d.source[positionAttribute + "y"]; })
        .attr("x2", function (d) { return d.target[positionAttribute + "x"]; })
        .attr("y2", function (d) { return d.target[positionAttribute + "y"]; });
      if (this.visLinksR !== undefined) {
        this.visLinksR
          .attr("x1", function (d) { return d.source[positionAttribute + "x"]; })
          .attr("y1", function (d) { return d.source[positionAttribute + "y"]; })
          .attr("x2", function (d) { return d.target[positionAttribute + "x"]; })
          .attr("y2", function (d) { return d.target[positionAttribute + "y"]; });
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
      .attr("fire",11)
      .attr("transform",function (d) {
        return "translate("
          +d[positionAttribute + "x"]
          +","+d[positionAttribute + "y"]
          +")"; 
         });
    if (this.visNodesR !== undefined) {
        this.visNodesR
          .attr("fire",11)
          .attr("transform",function (d) {
          return "translate("
            +d[positionAttribute + "x"]
            +","+d[positionAttribute + "y"]
            +")"; 
           });
     }
  }
}

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
   //when a node is no longer in the set, remove it from the graph.
  this.visNodes.exit().remove();
  
  if (displayMode == 2) {
    this.visNodesR = this.svgContainerR.selectAll("g").data(this.visNodeData);
    var gR = this.visNodesR.enter().append("g");
    gR.append("circle");
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
 
}

//shortcut to ClearVis and UpdateVis
Base_Method.prototype.NewVis = function () {
  this.ClearVis();
  this.UpdateVis();
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

Base_Method.prototype.AttributesPerVisNode = 0;
Base_Method.prototype.NodeSplit = function () {
  console.log("Node split")
  var channelA = this.getNodeChannel("Node Size A");
  var channelB = this.getNodeChannel("Node Size B");
  var channelC = this.getNodeChannel("Node Size C");
  if(this.AttributesPerVisNode ==0 && !channelA.inUse && !channelB.inUse && !channelC.inUse){
    return;
  }
  if(this.AttributesPerVisNode ==1 && channelA.inUse && !channelB.inUse && !channelC.inUse){
    return;
  }
  if(this.AttributesPerVisNode ==2 && channelA.inUse && channelB.inUse && !channelC.inUse){
    return;
  }
  //only chan A
  if (channelA.inUse && !channelB.inUse && !channelC.inUse) {
    //clean any extra nodes
    this.visNodes.selectAll("#secondary").remove();
    this.AttributesPerVisNode = 1;
  }
  //chan A + B
  if (channelA.inUse && channelB.inUse && !channelC.inUse) {
    if(this.AttributesPerVisNode < 2){
      //add extra nodes
      this.visNodes.append("circle").attr("id","secondary");
    }else{
      //remove extra nodes
      this.visNodes.selectAll("#secondary").remove();
    }
    this.AttributesPerVisNode = 2;
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
    .attr("r", this.NodeSize.bind(this))
    .style("fill", this.NodeColour.bind(this))
    .style("stroke", this.NodeStrokeColour.bind(this))
    .style("filter", this.NodeFilter.bind(this))
    .attr("clip-path", this.NodeClip.bind(this));
    if (this.visNodesR !== undefined) {
       this.visNodesR.selectAll("circle")
    .attr("r", this.NodeSize.bind(this))
    .style("fill", this.NodeColour.bind(this))
    .style("stroke", this.NodeStrokeColour.bind(this))
    .style("filter", this.NodeFilter.bind(this))
    .attr("clip-path", this.NodeClip.bind(this));
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
    var a = getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
    a = Math.max(a,0.1);
    return (3.5 * a) + "px";
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
Base_Method.prototype.NodeFilter = function (d) {
  if (d.highlight) {
    return "url(#glow)";
  }
  return "";
};

Base_Method.prototype.NodeColour = function (d) {
  var channel = this.getNodeChannel("Node Colour");
  if (channel.inUse) {
    var rgb = d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax))));
    if (d.highlight) {
      return rgb.darker();
    } else {
      return rgb;
    }
  } else {
    if (d.highlight) {
      return this.ColorTheme.nodeFillHighlightColour;
    } else {
      return this.ColorTheme.nodeFillBaseColour;
    }
  }
};

Base_Method.prototype.NodeStrokeColour = function (d) {
  if (d.highlight) {
    return this.ColorTheme.nodeEdgeHighlightColour;
  }
  return this.ColorTheme.nodeEdgeBaseColour;
};

Base_Method.prototype.NodeSize = function (d,i) {
  var channel ;
  if(i==0){
    channel = this.getNodeChannel("Node Size A");
  }else if(i==1){
    channel = this.getNodeChannel("Node Size B");
  }
  if (channel.inUse) {
    return ((this.default_radius - .75) + this.default_radius * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax));
  } else {
    return (this.default_radius - .75);
  }
};

Base_Method.prototype.NodeClip = function (d, i) {
  var channelA = this.getNodeChannel("Node Size A");
  var channelB = this.getNodeChannel("Node Size B");
  var channelC = this.getNodeChannel("Node Size C");
  if (channelA.inUse && channelB.inUse && !channelC.inUse) {
    if (i == 0) {
      return "url(#cut-off-left)";
    } else if (i == 1) {
      return "url(#cut-off-right)";
    }
  } else if (channelA.inUse && channelB.inUse && channelC.inUse) {
    if (i == 0) {
      return "url(#cut-off-mid3)";
    } else if (i == 1) {
      return "url(#cut-off-left3)";
    }else if (i == 2) {
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
  // Todo: don't append if already have filters
  d3.selectAll("svg").attr("style","stroke-width: 0px; background-color: "+this.ColorTheme.BackgroundColour+";");
  // this.svg.attr("fill-opacity",1.0);
  
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