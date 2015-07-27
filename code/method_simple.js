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
    //{ name: "Test Slider", ptype: "slider", minval: 0, maxval: 10, step: 1, pval: 0 },
    //{ name: "Test TextBox", ptype: "textbox", pval: "" },
    { name: "Disable rest", ptype: "checkbox", pval: false },
    { name: "Clamp within Canvas", ptype: "checkbox", pval: false },
    { name: "Cumulative Links", ptype: "checkbox", pval: true, func: function () { this.filteredLinks = undefined; this.filteredNodes = undefined; } },
    { name: "Cumulative Nodes", ptype: "checkbox", pval: true, func: function () { this.filteredLinks = undefined; this.filteredNodes = undefined; } }
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

Method_Simple.prototype.SetData = function (d) {
  this.data = d;
  this.filteredLinks = undefined;
  this.filteredNodes = undefined;
  this.RedoNodes();
  this.RedoLinks();
};

//######################################################################
//########    Main Update
//######################################################################

Method_Simple.prototype.Update = function () {
  Base_Method.prototype.Update.call(this);
  if (this.data == null) { return; }
  if (this.filteredNodes === undefined || this.filteredLinks === undefined || this.prev_currentDateMin != this.currentDateMin || this.prev_currentDateMax != this.currentDateMax) {
    //filter nodes by date
    this.filteredNodes = this.data.nodes.filter(
      $.proxy(function (d) {
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
      }, this));
    //filter links by date
    this.filteredLinks = this.data.links.filter(
      $.proxy(function (d) {
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
          //check node exists
          var source = IsNumber(d.target) ? this.data.nodes[d.target] : d.target;
          var target = IsNumber(d.source) ? this.data.nodes[d.source] : d.source;
          if ($.inArray(source, this.filteredNodes) == -1 || $.inArray(target, this.filteredNodes) == -1) {
            //console.warn("Link with no node! ",this.data.nodes[d.target]);
            return false;
          }
          return true;
        }
        return false;
      }, this));

    this.prev_currentDateMin = this.currentDateMin;
    this.prev_currentDateMax = this.currentDateMax;
  }

  //Tidy up stale tooltips
  if (this.nodeTooltip !== undefined) {
    $(".tooltip").remove();
    this.nodeTooltip = undefined;
  }
  if (this.graphLinkTooltip !== undefined) {
    $(".tooltip.link").remove();
    this.graphLinkTooltip = undefined;
  }

  //Create Links
  this.graphLink = this.svgContainer.selectAll("line").data(this.filteredLinks);
  this.graphLink.enter().append("line")
    .style("stroke", this.Linkcolour.bind(this))
    .style("stroke-width", this.LinkWidth.bind(this))
    .style("stroke-dasharray", this.LinkDash.bind(this));
    
  //add hover tooltip, if there are attributes to display
  if (this.data.link_keys.length > 0) {
    this.graphLinkTooltip = d3.select("body").append("div").attr("class", "tooltip link").style("opacity", 0);
    this.graphLink.on("mouseover", $.proxy(function (d) {
      var str = "";
      this.data.link_keys.forEach(function (o) {
        str += o + ": " + getLinkAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
      }, this);
      this.graphLinkTooltip.transition().duration(200).style("opacity", .9);
      this.graphLinkTooltip.html(str).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
    }, this));
    this.graphLink.on("mouseout", $.proxy(function (d) {
      this.graphLinkTooltip.transition().duration(500).style("opacity", 0);
    }, this));
  }
  //when a link is no longer in the set, remove it from the graph.
  this.graphLink.exit().remove();

  //Create nodes
  this.graphNode = this.svgContainer.selectAll("circle")
    .data(this.filteredNodes);
  this.graphNode.enter()
    .append("circle")
    .attr("r", this.NodeSize.bind(this))
    .style("fill", this.NodeColour.bind(this))
    .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); });
    
  //add hover tooltip, if there are attributes to display
  if (this.data.node_keys.length > 0) {
    this.nodeTooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    this.graphNode.on("mouseover", $.proxy(function (d) {
      var str = "";
      this.data.node_keys.forEach(function (o) {
        str += o + ": " + getNodeAttributeValue(this.data, d, o, this.currentDateMin, this.currentDateMax) + "<br/>";
      }, this);
      this.nodeTooltip.transition().duration(200).style("opacity", .9);
      this.nodeTooltip.html(str).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
    }, this));
    this.graphNode.on("mouseout", $.proxy(function (d) {
      this.nodeTooltip.transition().duration(500).style("opacity", 0);
    }, this));
  }
  
  // .call(forceLayout.drag);
  this.graphNode.exit().remove();

  //force a tick
  this.forceLayout.resume();
  //restart simulation
  //force.stop();
  //console.log("staring force %o, nodes: %o, links:%o",this.forceLayout,this.data.nodes,this.filteredLinks);
  this.forceLayout.nodes(this.filteredNodes).links(this.filteredLinks).on("tick", this.Tick.bind(this)).start();
};

//######################################################################
//########    Redraw
//######################################################################

// The page has been resized or some other event that requires a redraw
Method_Simple.prototype.Redraw = function (w, h) {
  if (w !== undefined && h !== undefined) {
    this.width = w;
    this.height = h;
    this.halfWidth = w * 0.5;
    this.halfHeight = h * 0.5;
  }

  console.log("Redrawing");
  // force = customLayout()
  this.forceLayout = d3.layout.force()
    .gravity(.25)
    .charge(-840)
    .friction(0.3)
    .linkDistance(this.LinkLength.bind(this))
    .size([this.width, this.height]);

  var zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", this.zoomed.bind(this));

  if (this.svg === undefined) {
    this.svg = d3.select("#chart").append("svg");
    this.svgContainer = this.svg.append("g");
  }
  this.svg.attr("width", this.width)
    .attr("height", this.height)
    .call(zoom);

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
      var point = Math.round((this.foci.length - 1) * getAttributeAsPercentage(this.data, o, channel.dataParam, this.currentDateMin, this.currentDateMax));
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
  // console.log("method: re-doing links");
  this.graphLink.style("stroke", this.Linkcolour.bind(this))
    .style("stroke-width", this.LinkWidth.bind(this))
    .style("stroke-dasharray", this.LinkDash.bind(this));

  this.forceLayout.start();
};

Method_Simple.prototype.RedoNodes = function () {
  if (this.graphLink === undefined) { return; }
  //console.log("method: re-doing nodes");
  this.graphNode.style("fill", this.NodeColour.bind(this)).attr("r", this.NodeSize.bind(this));
};

var fill = d3.scale.category20().domain(d3.range(0, 20));

//------------------ Link Channels ----------------
Method_Simple.prototype.Linkcolour = function (d) {
  var channel = this.getLinkChannel("Link Colour");
  if (channel.inUse) {
    return d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax)))).darker();
  } else {
    return "black";
  }
};

Method_Simple.prototype.LinkWidth = function (d) {
  var channel = this.getLinkChannel("Link Width");
  if (channel.inUse) {
    var q = (3.5 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax))
    if (q == 0) {
      q = "0.5";
    }
    return q + "px";
  } else {
    return "1.5px";
  }
};

Method_Simple.prototype.LinkDash = function (d) {
  var channel = this.getLinkChannel("Link Width");
  if (channel.inUse) {
    var q = getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
    if (q == 0) {
      return "10";
    }
  }
  return "0";
};


Method_Simple.prototype.LinkLength = function (d) {
  var channel = this.getLinkChannel("Link Length");
  if (channel.inUse) {
    return 100 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
  } else {
    return 50;
  }
};
//------------------ Node Channels ----------------
Method_Simple.prototype.NodeColour = function (d) {
  var channel = this.getNodeChannel("Node Colour");
  if (channel.inUse) {
    return d3.rgb(fill(Math.round(20.0 * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax)))).darker();
  } else {
    return "black";
  }
};

Method_Simple.prototype.NodeSize = function (d) {
  var channel = this.getNodeChannel("Node Size");
  if (channel.inUse) {
    return (this.default_radius - .75) + this.default_radius * getAttributeAsPercentage(this.data, d, channel.dataParam, this.currentDateMin, this.currentDateMax);
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