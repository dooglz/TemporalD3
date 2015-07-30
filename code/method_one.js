/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>

//Inheritance from base ojbect
//make sure this is called before any additions to Method_One.prototype
Method_One.prototype = Object.create(Base_Method.prototype);
// Important object globals
Method_One.prototype.default_radius = 6;
Method_One.prototype.prev_currentDateMin;
Method_One.prototype.prev_currentDateMax;
Method_One.prototype.svg;
Method_One.prototype.svgContainer;
Method_One.prototype.svgTranslation;

// Subticks are how many times the graph should tick inbetween page updates.
// High subtick counts will block all JS timers, and can freeze the page.
// A subtick of 1 means yeild to other 'threads' after every tick.
Method_One.prototype.globalForceLayoutMaxSubTicks = 10;
Method_One.prototype.globalForceLayoutMaxTicks = 7000;
Method_One.prototype.globalForceLayoutMaxTime = 4000; //4 seconds
//Allow Settle: Stop if layout reaches a settled state before maxticks are reached
Method_One.prototype.globalForceLayoutAllowSettle = false;

Method_One.prototype.localLayoutMaxSubTicks = 50;
Method_One.prototype.localLayoutMaxTicks = 800;
Method_One.prototype.localLayoutMaxTime = 2500; //2.5 seconds
Method_One.prototype.localLayoutAllowSettle = true;
//Method constructor
function Method_One() {
  this.name = "Method One";
  this.parameters = [
    { name: "Disable rest", ptype: "checkbox", pval: false },
    { name: "Recalculate Layout", ptype: "button", pval: false, func: function () { this.Recalculate(); } },
    { name: "Cumulative Links", ptype: "checkbox", pval: true },
    { name: "Cumulative Nodes", ptype: "checkbox", pval: true },
    { name: "Global: Allow Settle", ptype: "checkbox", pval: false, func: function (val) { this.globalForceLayoutAllowSettle = val; } },
    { name: "Local: Allow Settle", ptype: "checkbox", pval: true, func: function (val) { this.localLayoutAllowSettle = val; } },
    { name: "Show Global", ptype: "button", pval: false, func: function () { this.ShowLocalLayout("g", null, this.data.nodes, this.data.links); } }
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

Method_One.prototype.Load = function () { };
Method_One.prototype.Unload = function () {
  this.HideLocalLayout();
  this.StopCalculation();
  if (this.svg != undefined) {
    this.svg.selectAll("*").remove();
    this.svg.remove();
  }
  // this.svgTranslation = undefined;
  this.GlobalLayoutPercentDone = undefined;
  this.LocalLayoutPercentDone = undefined;
  HideLoadingBar();

  if (this.globalForceLayout !== undefined) {
    this.globalForceLayout.stop();
    this.globalForceLayout = undefined;
  }
  this.LocalLayouts.forEach(function (o) {
    if (o.ForceLayout !== undefined) {
      o.ForceLayout.stop();
      o.ForceLayout = undefined;
    }
  });
};

Method_One.prototype.foci = [
  { x: 400, y: 0 },
  { x: 200, y: - 346 },
  { x: - 200, y: - 346 },
  { x: - 400, y: 0 },
  { x: 200, y: 346 }
];

//######################################################################

Method_One.prototype.SetData = function (d) {
  this.data = d;
  this.filteredLinks = undefined;
  this.filteredNodes = undefined;
  if (this.done) {
    this.RedoNodes();
    this.RedoLinks();
    // this.ShowLocalLayout();
  }
};
Method_One.prototype.done = false;
Method_One.prototype.Loading = function () {
  var gp = this.GlobalLayoutPercentDone;
  var lp = this.LocalLayoutPercentDone;
  var str = "";
  if (gp < 100) {
    ShowLoadingBar(Math.round(gp), "calculating global layout");
  } else if (lp < 100) {
    ShowLoadingBar(Math.round(lp), "calculating Local layout");
  } else {
    clearTimeout(this.loadingtimerfunc);
    this.loadingtimerfunc = undefined;
    HideLoadingBar();
    this.CalculationDone();
  }
  // $('#progressContainer').hide().show(0);
}

Method_One.prototype.Recalculate = function () {
  Method_One.prototype.done = false;
  this.LocalLayoutPercentDone = 0;
  this.loadingtimerfunc = setInterval(this.Loading.bind(this), 100);
  //zero position of all nodes
  this.data.nodes.forEach(function (o, i, array) {
    o.px = o.py = o.x = o.y = 0;
  });
  this.CaluclateGlobalLayout();
}

Method_One.prototype.CalculationDone = function () {
  Method_One.prototype.done = true;
}

Method_One.prototype.StopCalculation = function () {
  console.log("Calculation stopped");
  if (this.loadingtimerfunc !== undefined) {
    clearTimeout(this.loadingtimerfunc);
    this.loadingtimerfunc = undefined;
  }
  if (this.globalForceLayoutLoopTimeout !== undefined) {
    clearTimeout(this.globalForceLayoutLoopTimeout);
    this.globalForceLayoutLoopTimeout = undefined;
  }
  if (this.localLayoutLoopTimeout !== undefined) {
    clearTimeout(this.localLayoutLoopTimeout);
    this.localLayoutLoopTimeout = undefined;
  }
}

//######################################################################
//########    Global Layout
//######################################################################
Method_One.prototype.GlobalLayoutDone = function () {
  console.log("Global force layout done");
  //copy positions
  this.data.nodes.forEach(function (o) {
    CopyAttributes(o, ["x", "y"], ["gx", "gy"]);
  }, this);
  console.log('Global layout Complete!');
  this.CaluclateLocalLayouts();
}

var timeout = true;
Method_One.prototype.CaluclateGlobalLayout = function () {
  SetLoadingBarColour();
  this.GlobalLayoutPercentDone = 0;
  //Update Vis
  this.ShowLocalLayout("g", null, this.data.nodes, this.data.links);
  this.RedoNodes();
  this.RedoLinks();
  //create a new force layout
  this.globalForceLayout = d3.layout.force()
    .gravity(.25)
    .charge(-840)
    .friction(0.3)
    .linkDistance(this.LinkLength.bind(this))
    .size([this.width, this.height])
    .nodes(this.data.nodes)
    .links(this.data.links)
    .on("tick", this.GlobalTick.bind(this));

  console.log("Global force layout running");
  this.globalForceLayout.start();
  this.globalForceLayoutStartTime = new Date();
  this.globalForceLayoutTickCount = 0;
  this.globalForceLayoutLoopTimeout = setInterval(this.CaluclateGlobalLayoutLoop.bind(this), 1);
}

Method_One.prototype.CaluclateGlobalLayoutLoop = function () {
  this.GlobalLayoutPercentDone = ((new Date() - this.globalForceLayoutStartTime) / this.globalForceLayoutMaxTime) * 100.0;
  if (this.globalForceLayoutTickCount > this.globalForceLayoutMaxTicks || this.GlobalLayoutPercentDone >= 100
    || (this.globalForceLayoutAllowSettle && this.globalForceLayout.alpha() == 0)) {
    clearTimeout(this.globalForceLayoutLoopTimeout);
    this.globalForceLayoutLoopTimeout = undefined;
    this.GlobalLayoutPercentDone = 100;
    this.globalForceLayout.stop();
    this.GlobalLayoutDone();
    return;
  }
  for (var i = 0; i < this.globalForceLayoutMaxSubTicks; i++) {
    if (!this.globalForceLayoutAllowSettle) {
      this.globalForceLayout.resume();
    }
    this.globalForceLayout.tick();
  }
  this.globalForceLayoutTickCount += this.globalForceLayoutMaxSubTicks;
}

Method_One.prototype.GlobalTick = function (e) {
  var channel = this.getNodeChannel("Gravity Point");
  if (channel.inUse) {
    var k = .1 * e.alpha;
    this.data.nodes.forEach($.proxy(function (o, i, array) {
      var point = Math.round((this.foci.length - 1) * getAttributeAsPercentage(this.data, o, channel.dataParam));
      o.y += ((this.halfHeight + this.foci[point].y) - o.y) * k;
      o.x += ((this.halfWidth + this.foci[point].x) - o.x) * k;
      o.gx = o.x;
      o.gy = o.y;
    }, this));
  } else {
    this.data.nodes.forEach(function (o) {
      o.gx = o.x;
      o.gy = o.y;
    });
  }
  if (this.lastRenderdpositionAttribute != "g") {
    this.ShowLocalLayout("g", null, this.data.nodes, this.data.links);
    this.RedoNodes();
    this.RedoLinks();
  } else {
    this.UpdateLocalLayout("g", null);
  }
};

//######################################################################
//########    Local Layout calculations
//######################################################################
Method_One.prototype.CaluclateLocalLayouts = function () {
  SetLoadingBarColour("#b233b7");
  //how many layouts are we creating?
  this.LocalLayouts = [];
  var max = this.CountDiscreetStepsInRange(this.minDate, this.maxDate, this.data.date_type);
  console.log("Creating %o local layouts", max);
  this.LocalLayoutPercentDone = 0;
  this.LocalLayoutTickCount = 0;
  for (var i = 0; i < max; i++) {
    var local = {};
    local.discreet = i;
    var dd = this.getDateRangeFromDiscreet(i, this.data.date_type);
    local.minDate = dd.min;
    local.maxDate = dd.max;
    this.LocalLayouts.push(local);
  }
  this.localLayoutLoopTimeout = setInterval(this.CaluclateLocalLayoutLoop.bind(this), 1);
}

Method_One.prototype.CaluclateLocalLayoutLoop = function () {
  this.LocalLayoutPercentDone = (this.LocalLayoutTickCount / this.LocalLayouts.length) * 100.0;
  if (this.LocalLayoutPercentDone >= 100) {
    clearTimeout(this.localLayoutLoopTimeout);
    this.LocalLayoutPercentDone = 100;
    this.LocalLayoutDone();
    return;
  }
  var local = this.LocalLayouts[this.LocalLayoutTickCount];
  if (local.done === true) {
    //copy positions
    this.data.nodes.forEach(function (o) {
      CopyAttributesIntoArray(o, ["x", "y"], ["lx", "ly"], local.discreet);
    }, this);
    //next
    this.LocalLayoutTickCount++;
  } else if (local.done === false) {
    //keep processing this layout
    if (local.TickCount > this.localLayoutMaxTicks || (this.localLayoutAllowSettle && local.ForceLayout.alpha() == 0)
      || (new Date() - local.startTime) > this.localLayoutMaxTime) {
      console.log("Finished Local Layout %o, ticks:%o", this.LocalLayoutTickCount, local.TickCount);
      local.done = true;
      local.ForceLayout.stop();
    } else {
      if (!this.localLayoutAllowSettle) {
        local.ForceLayout.resume();
      }
      for (var i = 0; i < this.localLayoutMaxSubTicks; i++) {
        local.ForceLayout.tick();
      }
      local.TickCount += this.localLayoutMaxSubTicks;
    }
  } else {
    //new layout, set it up
    local.TickCount = 0;
    local.done = false;
    //zero position of all nodes, if this is first run
    /*
    if (this.LocalLayoutTickCount == 0) {
      this.data.nodes.forEach(function (o, i, array) {
        //o.px = o.py = o.x = o.y = 0;
        //use global positions
      });
    }//else, use same positions from last run
    */
    //create a new force layout
    //reqiured to set these for the filters to work
    this.currentDateMin = local.minDate;
    this.currentDateMax = local.maxDate;
    local.filteredNodes = this.data.nodes.filter($.proxy(this.StandardNodeFilter, this));
    local.filteredLinks = this.data.links.filter($.proxy(this.QuickLinkFilter, this));
    local.ForceLayout = d3.layout.force()
      .gravity(.25)
      .charge(-840)
      .friction(0.3)
      .linkDistance(this.LinkLength.bind(this))
      .size([this.width, this.height])
      .nodes(local.filteredNodes)
      .links(local.filteredLinks)
      .on("tick", this.LocalTick.bind(this));
    local.ForceLayout.start();
    local.startTime = new Date();
  }

}

Method_One.prototype.LocalLayoutDone = function () {
  console.log("Local layouts done");
}

Method_One.prototype.LocalTick = function (e) {
  var channel = this.getNodeChannel("Gravity Point");
  if (channel.inUse) {
    var k = .1 * e.alpha;
    this.data.nodes.forEach($.proxy(function (o, i, array) {
      var point = Math.round((this.foci.length - 1) * getAttributeAsPercentage(this.data, o, channel.dataParam));
      o.y += ((this.halfHeight + this.foci[point].y) - o.y) * k;
      o.x += ((this.halfWidth + this.foci[point].x) - o.x) * k;
    }, this));
  }
};

//######################################################################
//########    Main Update
//######################################################################

Method_One.prototype.Update = function () {
  Base_Method.prototype.Update.call(this);
  var discreet = this.getDiscreetfromDate(this.currentDateMin, this.data.date_type);
  if (this.LocalLayouts !== undefined && this.LocalLayouts[discreet] !== undefined
    && this.LocalLayouts[discreet].filteredNodes !== undefined
    && this.LocalLayouts[discreet].filteredLinks !== undefined &&
    (this.prev_currentDateMin != this.currentDateMin || this.prev_currentDateMax != this.currentDateMax)) {
    this.ShowLocalLayout("l", discreet, this.LocalLayouts[discreet].filteredNodes, this.LocalLayouts[discreet].filteredLinks);
  }
  return;
};

//######################################################################
//########    Redraw
//######################################################################

// The page has been resized or some other event that requires a redraw
Method_One.prototype.Redraw = function (w, h) {

  if (w !== undefined && h !== undefined) {
    this.width = w;
    this.height = h;
    this.halfWidth = w * 0.5;
    this.halfHeight = h * 0.5;
  }

  if (this.svg === undefined) {
    this.svg = d3.select("#chart").append("svg");
    this.svgContainer = this.svg.append("g");
  }
  var zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", this.zoomed.bind(this));
  this.svg.attr("width", this.width)
    .attr("height", this.height)
    .call(zoom);

  console.log("Redrawing");
  return;
};

Method_One.prototype.zoomed = function () {
  this.svgTranslation = d3.event.translate;
  this.scalefactor = d3.event.scale;
  this.svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
};