/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>

//Inheritance from base ojbect
//make sure this is called before any additions to Method_Static.prototype
Method_Static.prototype = Object.create(Base_Method.prototype);
// Important object globals
Method_Static.prototype.prev_currentDateMin;
Method_Static.prototype.prev_currentDateMax;
Method_Static.prototype.svg;
Method_Static.prototype.svgContainer;
Method_Static.prototype.svgContainerR;
Method_Static.prototype.svgTranslation;

//Method constructor
function Method_Static() {
  this.name = "simple";
  this.parameters = [
    { name: "Cumulative Links", ptype: "checkbox", pval: true, func: function () {/*Todo: refilter*/ } },
    { name: "Cumulative Nodes", ptype: "checkbox", pval: true, func: function () {/*Todo: refilter*/ } },
    { name: "Normalize All", ptype: "checkbox", pval: true, func: function () {/*Todo: refilter*/ } },
    { name: "Minimum Radius", ptype: "textbox", pval: this.min_radius, func: function (pval) { this.min_radius = parseFloat(pval); this.RedoNodes(); } },
    { name: "Maximum Radius", ptype: "textbox", pval: this.max_radius, func: function (pval) { this.max_radius = parseFloat(pval); this.RedoNodes(); } },
  ];
}

Method_Static.prototype.Load = function () {

};

Method_Static.prototype.Unload = function () {
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

Method_Static.prototype.SetData = function (d) {
  console.warn("newdata", d);
  Base_Method.prototype.SetData.call(this, d);
  this.data = d;
  if (Exists(d)) {
    this.RedoNodes();
    this.RedoLinks();
    this.ClearVisData();
    this.NewVis();
  } else {
    if (this.forceLayout != undefined) {
      console.log("layout stopped");
      this.forceLayout.stop();
    }
    this.ClearVisData();
    this.ClearVis();
  }
};

//######################################################################
//########    Main Update
//######################################################################

Method_Static.prototype.Update = function () {
  Base_Method.prototype.Update.call(this);
  if (!Exists(this.data)) { return; }
  //force a tick
  this.forceLayout.resume();
  //restart simulation
  //force.stop();
  //console.log("staring force %o, nodes: %o, links:%o",this.forceLayout,this.data.nodes,this.filteredLinks);
  var n = this.data.nodes.filter($.proxy(this.StandardNodeFilter, this));
  var l = this.data.links.filter($.proxy(this.QuickLinkFilter, this));
  console.log("layout started");
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
Method_Static.prototype.Redraw = function (w, h) {
  Base_Method.prototype.Redraw.call(this, w, h);
  
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
  if (refresh) {
    this.NewVis();
    this.Update();
  }
};

//######################################################################

Method_Static.prototype.zoomed = function () {
  this.svgTranslation = d3.event.translate;
  this.scalefactor = d3.event.scale;
  this.svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  if (this.svgR !== undefined) {
    this.svgContainerR.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }
};
Method_Static.prototype.Reset = function () {
  this.svgTranslation = [0, 0];
  this.scalefactor = [1, 1];
  this.svgContainer.attr("transform", "translate(0,0)scale(1,1)");
  if (this.svgR !== undefined) {
    this.svgContainerR.attr("transform", "translate(0,0)scale(1,1)");
  }
  if (!Exists(zoom)) { return; };
  zoom.scale(1);
  zoom.translate([0, 0]);
};

Method_Static.prototype.Tick = function (e) {
  this.data.nodes.forEach($.proxy(function (o, i, array) {
    o.y += o.sx;
    o.x += o.sy;
  }, this));
  this.UpdateVisPositions("", null);
};