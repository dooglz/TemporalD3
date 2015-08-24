/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>

//Inheritance from base ojbect
//make sure this is called before any additions to Method_Simple.prototype
Method_Simple.prototype = Object.create(Base_Method.prototype);
// Important object globals
Method_Simple.prototype.prev_currentDateMin;
Method_Simple.prototype.prev_currentDateMax;
Method_Simple.prototype.svg;
Method_Simple.prototype.svgContainer;
Method_Simple.prototype.svgContainerR;
Method_Simple.prototype.svgTranslation;
Method_Simple.prototype.forceLayout;

//Method constructor
function Method_Simple() {
  this.name = "simple";
  this.parameters = [
    //{ name: "Test Slider", ptype: "slider", minval: 0, maxval: 10, step: 1, pval: 0 },
    //{ name: "Test TextBox", ptype: "textbox", pval: "" },
    { name: "Disable rest", ptype: "checkbox", pval: false },
    { name: "Cumulative Links", ptype: "checkbox", pval: true, func: function () {/*Todo: refilter*/ } },
    { name: "Cumulative Nodes", ptype: "checkbox", pval: true, func: function () {/*Todo: refilter*/ } },
    { name: "Normalize All", ptype: "checkbox", pval: true, func: function () {/*Todo: refilter*/ } },
    { name: "Minimum Radius", ptype: "textbox", pval: this.min_radius, func: function (pval) {this.min_radius = parseFloat(pval); this.RedoNodes();} },
    { name: "Maximum Radius", ptype: "textbox", pval: this.max_radius, func: function (pval) {this.max_radius = parseFloat(pval); this.RedoNodes();} },
  ];
}

Method_Simple.prototype.Load = function () {

};

Method_Simple.prototype.Unload = function () {
  if (this.svg != undefined) {
    this.svg.selectAll("*").remove();
    this.svg.remove();
  }
  this.svg = undefined;
  this.svgContainer = undefined;
  
  if (this.svgR != undefined) {
    this.svgR.selectAll("*").remove();
    this.svgR.remove();
  }
  this.svgR = undefined;
  this.svgContainerR = undefined;
  
  if (this.forceLayout != undefined) {
    this.forceLayout.stop();
  }
  this.forceLayout = undefined;
};

Method_Simple.prototype.foci = [
  { x: 400, y: 0 },
  { x: 200, y: - 346 },
  { x: - 200, y: - 346 },
  { x: - 400, y: 0 },
  { x: 200, y: 346 }
];

Method_Simple.prototype.SetData = function (d) {
  Base_Method.prototype.SetData.call(this, d);
  this.data = d;
  this.RedoNodes();
  this.RedoLinks();
  this.ClearVisData();
  this.NewVis();
};

//######################################################################
//########    Main Update
//######################################################################

Method_Simple.prototype.Update = function () {
  Base_Method.prototype.Update.call(this);
  if (this.data == null) { return; }
  //force a tick
  this.forceLayout.resume();
  //restart simulation
  //force.stop();
  //console.log("staring force %o, nodes: %o, links:%o",this.forceLayout,this.data.nodes,this.filteredLinks);
  var n = this.data.nodes.filter($.proxy(this.StandardNodeFilter, this));
  var l = this.data.links.filter($.proxy(this.QuickLinkFilter, this));
  this.forceLayout.nodes(n).links(l).on("tick", this.Tick.bind(this)).start();
  
  //Update Vis
  this.UpdateVisData(n, l);
  this.UpdateVis();
  this.UpdateVisPositions("", null);
  this.RedoNodes();
  this.RedoLinks();
};

//######################################################################
var zoom;
// The page has been resized or some other event that requires a redraw
Method_Simple.prototype.Redraw = function (w, h) {
  Base_Method.prototype.Redraw.call(this,w,h);

  //console.log("Redrawing");
  // force = customLayout()
  this.forceLayout = d3.layout.force()
    .gravity(.25)
    .charge(-840)
    .friction(0.3)
    .linkDistance(this.LinkLength.bind(this))
    .size([this.width, this.height]);

  zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", this.zoomed.bind(this));
  var refresh = false;
  if (displayMode == 2) {
    if (this.svgR === undefined) {
      this.svgR = d3.select("#chart2").append("svg");
      refresh = true;
    }
    if (this.svgContainerR === undefined) {
      this.svgContainerR = this.svgR.append("g");
      refresh = true;
    }
    this.svgR.attr("width", this.width).attr("height", this.height).call(zoom);
  } else {
    if (this.svgR !== undefined) {
      this.svgR.remove();
      this.svgR = undefined;
      this.svgContainerR = undefined;
      refresh = true;
    }
  }
  
  if (this.svg === undefined) {
    //todo do this for Right side
    this.svg = d3.select("#chart").append("svg");
    refresh = true;
  }
  if (this.svgContainer === undefined) {
    this.svgContainer = this.svg.append("g");
    refresh = true;
  }
  this.allsvg = $("svg");
  this.svg.attr("width", this.width).attr("height", this.height).call(zoom);
  this.SetupSVGFilters();
  this.RedoNodes();
  this.RedoLinks();
  if(refresh){
      this.NewVis();
      this.Update();
  }
};

//######################################################################

Method_Simple.prototype.zoomed = function () {
  this.svgTranslation = d3.event.translate;
  this.scalefactor = d3.event.scale;
  this.svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  if (this.svgR !== undefined) {
    this.svgContainerR.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
};
Method_Simple.prototype.Reset = function () {
  this.svgTranslation = [0,0];
  this.scalefactor = [1,1];
  this.svgContainer.attr("transform", "translate(0,0)scale(1,1)");
  if (this.svgR !== undefined) {
    this.svgContainerR.attr("transform", "translate(0,0)scale(1,1)");
  }
  if(!Exists(zoom)){return;};
  zoom.scale(1);
  zoom.translate([0,0]);
};
//######################################################################
//########    Force layout tick
//######################################################################

Method_Simple.prototype.Wind = function () {
  this.data.nodes.forEach(function (o) {
    o.y += (20.0 * Math.random()) - 10.0;
    o.x += (20.0 * Math.random()) - 10.0;
  });
}

Method_Simple.prototype.Tick = function (e) {
  if (this.getParam("Disable rest").pval) {
    this.forceLayout.alpha(Math.max(this.forceLayout.alpha(), 0.1));
    this.forceLayout.resume();
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
  this.UpdateVisPositions("", null);
};