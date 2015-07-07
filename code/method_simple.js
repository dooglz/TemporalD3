/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>

//Inheritance from base ojbect
//make sure this is called before any additions to Method_Simple.prototype
Method_Simple.prototype = Object.create(Base_Method.prototype);
// Important object globals
Method_Simple.prototype.default_radius = 6;
Method_Simple.prototype.prev_currentDateMin;
Method_Simple.prototype.prev_currentDateMax;
Method_Simple.prototype.filteredLinks;
Method_Simple.prototype.svg;
Method_Simple.prototype.svgContainer;
Method_Simple.prototype.svgTranslation;
Method_Simple.prototype.forceLayout;
Method_Simple.prototype.graphLink;
Method_Simple.prototype.graphNode;

//Method constructor
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

Method_Simple.prototype.Load = function () { };

Method_Simple.prototype.Unload = function () {
  if (this.svg != undefined) {
    this.svg.selectAll("*").remove();
    this.svg.remove();
  }
  this.svg = undefined;
  if (this.forceLayout != undefined) {
    this.forceLayout.stop();
  }
  this.forceLayout = undefined;
  this.svgContainer = undefined;
  this.svgTranslation = undefined;
  this.graphLink = undefined;
  this.graphNode = undefined;
};

Method_Simple.prototype.foci = [
  { x: 400, y: 0 },
  { x: 200, y: - 346 },
  { x: - 200, y: - 346 },
  { x: - 400, y: 0 },
  { x: 200, y: 346 }
];

//######################################################################
//########    Main Update
//######################################################################

Method_Simple.prototype.Update = function () {
  Base_Method.prototype.Update.call(this);
  if (this.filteredLinks === undefined || this.prev_currentDateMin != this.currentDateMin || this.prev_currentDateMax != this.currentDateMax) {
    //filter data by date
    this.filteredLinks = this.data.links.filter(
      $.proxy(function (d) {
        if(this.discreet){
         var range = this.getRangeFromDiscreet(this.currentDateMin);
         return IsLinkEverAliveInRange(d,range.min,range.max);
        }else{
          return IsLinkEverAliveInRange(d,this.currentDateMin,this.currentDateMax )
          //return (this.currentDateMax >= new Date(d.date) && this.currentDateMin <= new Date(d.date));
        }
      }, this));
    this.prev_currentDateMin = this.currentDateMin;
    this.prev_currentDateMax = this.currentDateMax;
  }

  this.nodeTooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
  this.graphLinkTooltip = d3.select("body").append("div").attr("class", "tooltip link").style("opacity", 0);
  

  //Create Links
  this.graphLink = this.svgContainer.selectAll("line").data(this.filteredLinks);
  this.graphLink.enter().append("line")
    .style("stroke", this.Linkcolour.bind(this))
    .style("stroke-width", this.LinkWidth.bind(this));
  //add hover tooltip
  this.graphLink.on("mouseover", $.proxy(function (d) {
    var str = "";
    this.data.link_keys.forEach(function (o) {
      str += o + ": " + d[o] + "<br/>";
    });
    this.graphLinkTooltip.transition().duration(200).style("opacity", .9);
    this.graphLinkTooltip.html(str)
      .style("left",(d3.event.pageX) + "px")
      .style("top",(d3.event.pageY - 28) + "px");
  }, this));
  this.graphLink.on("mouseout", $.proxy(function (d) {
    this.graphLinkTooltip.transition().duration(500).style("opacity", 0);
  }, this));    
  //when a link is no longer in the set, remove it from the graph.
  this.graphLink.exit().remove();

  //Create nodes
  this.graphNode = this.svgContainer.selectAll("circle")
    .data(this.data.nodes);
  this.graphNode.enter()
    .append("circle")
    .attr("r", this.NodeSize.bind(this))
    .style("fill", this.NodeColour.bind(this))
    .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); });
  //add hover tooltip
  this.graphNode.on("mouseover", $.proxy(function (d) {
    var str = "";
    this.data.node_keys.forEach(function (o) {
      str += o + ": " + d[o] + "<br/>";
    });
    this.nodeTooltip.transition().duration(200).style("opacity", .9);
    this.nodeTooltip.html(str)
      .style("left",(d3.event.pageX) + "px")
      .style("top",(d3.event.pageY - 28) + "px");
  }, this));
  this.graphNode.on("mouseout", $.proxy(function (d) {
    this.nodeTooltip.transition().duration(500).style("opacity", 0);
  }, this)); 
    
  //  .call(forceLayout.drag);
  this.graphNode.exit().remove();

  //force a tick
  this.forceLayout.resume();
  //restart simulation
  //force.stop();
  this.forceLayout.nodes(this.data.nodes).links(this.filteredLinks).on("tick", this.Tick.bind(this)).start();
};

//######################################################################
//########    Redraw
//######################################################################

// The page has been resized or some other event that requires a redraw
Method_Simple.prototype.Redraw = function (w, h) {
  Base_Method.prototype.Redraw.call(this);
  // force = customLayout()
  this.forceLayout = d3.layout.force()
    .gravity(.25)
    .charge(-840)
    .friction(0.3)
    .linkDistance(this.LinkLength.bind(this))
    .size([this.width, this.height]);

  var zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", this.zoomed.bind(this));

  this.svg = d3.select("#chart").append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .call(zoom);
  this.svgContainer = this.svg.append("g");
};

Method_Simple.prototype.zoomed = function () {
  this.svgTranslation = d3.event.translate;
  this.scalefactor = d3.event.scale;
  this.svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
};

//######################################################################
//########    Force layout tick
//######################################################################

Method_Simple.prototype.Tick = function (e) {
  if (selected_method.getParam("Disable rest").pval) {
    //forceLayout.resume();
    this.forceLayout.alpha(Math.max(this.forceLayout.alpha(), 0.1));
  }
  var channel = this.getNodeChannel("Gravity Point");
  if (channel.inUse) {
    var k = .1 * e.alpha;

    this.data.nodes.forEach($.proxy(function (o, i, array) {
      var point = Math.round((this.foci.length - 1) * getAttributeAsPercentage(this.data, o, channel.dataParam));
      o.y += ((this.halfHeight + this.foci[point].y) - o.y) * k;
      o.x += ((this.halfWidth + this.foci[point].x) - o.x) * k;
    }, this));
  }

  this.graphNode.attr("cx", $.proxy(function (d) {
    if (this.getParam("Clamp within Canvas").pval) {
      return d.x = Math.max(this.default_radius, Math.min(canvasWidth - this.default_radius, d.x));
    } else {
      return d.x;
    }
  }, this))
    .attr("cy", $.proxy(function (d) {
    if (this.getParam("Clamp within Canvas").pval) {
      return d.y = Math.max(this.default_radius, Math.min(canvasHeight - this.default_radius, d.y));
    } else {
      return d.y;
    }
  }, this));

  this.graphLink.attr("x1", function (d) {
    //  console.log("d: %o,",d);
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
//########    Channel Mapping Functions
//######################################################################

Method_Simple.prototype.RedoLinks = function () {
  if (this.graphLink === undefined) { return; }
  console.log("method: re-doing links");
  this.graphLink.style("stroke", this.Linkcolour.bind(this)).style("stroke-width", this.LinkWidth.bind(this));
  this.forceLayout.start();
};

Method_Simple.prototype.RedoNodes = function () {
  if (this.graphLink === undefined) { return; }
  console.log("method: re-doing nodes");
  this.graphNode.style("fill", this.NodeColour.bind(this)).attr("r", this.NodeSize.bind(this));
};

var fill = d3.scale.category20().domain(d3.range(0, 20));

//------------------ Link Channels ----------------
Method_Simple.prototype.Linkcolour = function (d) {
  var channel = this.getLinkChannel("Link Colour");
  if (channel.inUse) {
    return d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam)))).darker();
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
    return d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam)))).darker();
  } else {
    return "black";
  }
};

Method_Simple.prototype.NodeSize = function (d) {
  var channel = this.getNodeChannel("Node Size");
  if (channel.inUse) {
    return (this.default_radius - .75) + this.default_radius * getAttributeAsPercentage(this.data, d, channel.dataParam);
  } else {
    return this.default_radius - .75;
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