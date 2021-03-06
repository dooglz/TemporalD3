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
Method_One.prototype.svgContainerR;
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
Method_One.prototype.localLayoutMaxTicks = 600;
Method_One.prototype.localLayoutMaxTime = 2500; //2.5 seconds
Method_One.prototype.localLayoutAllowSettle = true;

Method_One.prototype.localLayoutGlobalForce = false;

Method_One.prototype.showingGlobal = false;
//Method constructor
function Method_One() {
  this.name = "Method One";
  this.parameters = [
    { name: "Disable rest", ptype: "checkbox", pval: false },
    { name: "Recalculate Layout", ptype: "button", pval: false, func: function () {console.log(this); this.Recalculate(); } },
    { name: "Cumulative Links", ptype: "checkbox", pval: true },
    { name: "Cumulative Nodes", ptype: "checkbox", pval: true },
    { name: "Global: Allow Settle", ptype: "checkbox", pval: false, func: function (val) { this.globalForceLayoutAllowSettle = val; } },
    { name: "Local: Allow Settle", ptype: "checkbox", pval: true, func: function (val) { this.localLayoutAllowSettle = val; } },
    { name: "Global Forces", ptype: "checkbox", pval: false, func: function (val) { this.localLayoutGlobalForce = val; } },
    { name: "Show Global", ptype: "button", pval: false, func: function () {this.SwitchVis();}}
  ];
}

Method_One.prototype.Load = function () { };
Method_One.prototype.Unload = function () {
  this.ClearVisData();
  this.ClearVis();
  this.StopCalculation();
  if (this.svg !== undefined) {
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
  
  // this.svgTranslation = undefined;
  //this.GlobalLayoutPercentDone = undefined;
  //this.LocalLayoutPercentDone = undefined;
  HideLoadingBar();
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
  }
  this.ClearVisData();
  this.NewVis();
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
};

Method_One.prototype.Recalculate = function () {
  this.StopCalculation();
  Method_One.prototype.done = false;
  this.LocalLayoutPercentDone = 0;
  this.loadingtimerfunc = setInterval(this.Loading.bind(this), 100);
  //zero position of all nodes
  this.data.nodes.forEach(function (o, i, array) {
    o.px = o.py = o.x = o.y = 0;
  });
  this.CaluclateGlobalLayout();
};

Method_One.prototype.CalculationDone = function () {
  Method_One.prototype.done = true;
};

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
  if (this.globalForceLayout !== undefined) {
    this.globalForceLayout.stop();
    this.globalForceLayout = undefined;
  }
  if (this.LocalLayouts !== undefined) {
    this.LocalLayouts.forEach(function (o) {
      if (o.ForceLayout !== undefined) {
        o.ForceLayout.stop();
        o.ForceLayout = undefined;
      }
    });
  }
};

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
};

var timeout = true;
Method_One.prototype.CaluclateGlobalLayout = function () {
  SetLoadingBarColour();
  this.GlobalLayoutPercentDone = 0;
  //Update Vis
  this.SwitchVis(true);
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
};

Method_One.prototype.CaluclateGlobalLayoutLoop = function () {
  var elapsedtime = (new Date() - this.globalForceLayoutStartTime);
  //are we out of time?
  if (this.globalForceLayoutMaxTime - elapsedtime <= 0) {
    console.log("Global out of time");
    this.StopGlobalLayoutLoop();
    return;
  }

  if (this.globalForceLayoutTickCount > this.globalForceLayoutMaxTicks || (this.globalForceLayoutAllowSettle && this.globalForceLayout.alpha() == 0)) {
    this.StopGlobalLayoutLoop();
    return;
  }

  this.GlobalLayoutPercentDone = (elapsedtime / this.globalForceLayoutMaxTime) * 100.0;

  for (var i = 0; i < this.globalForceLayoutMaxSubTicks; i++) {
    if (!this.globalForceLayoutAllowSettle) {
      this.globalForceLayout.resume();
    }
    this.globalForceLayout.tick();
  }
  this.globalForceLayoutTickCount += this.globalForceLayoutMaxSubTicks;
};

Method_One.prototype.StopGlobalLayoutLoop = function () {
  clearTimeout(this.globalForceLayoutLoopTimeout);
  this.globalForceLayoutLoopTimeout = undefined;
  this.GlobalLayoutPercentDone = 100;
  this.globalForceLayout.stop();
  this.GlobalLayoutDone();
};

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
  this.UpdateVisPositions("g", null);
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
  if (this.localLayoutGlobalForce) {
    var k1 = .1 * e.alpha;
    this.data.nodes.forEach($.proxy(function (o, i, array) {
      var point = { x: o.gx, y: o.gy };
      o.y += ((this.halfHeight + point.y) - o.y) * k1;
      o.x += ((this.halfWidth + point.x) - o.x) * k1;
    }, this));
  }
};

Method_One.prototype.SwitchVis = function (global) {
  if (global === undefined) {
    global = !this.showingGlobal;
  }
  if(global == this.showingGlobal){return;}
  
  this.ClearVisData();
  if (global) {
    this.UpdateVisData(this.data.nodes, this.data.links);
    this.NewVis();
    this.UpdateVisPositions("g", null);
    this.showingGlobal = true;
     this.RedoNodes();
    this.RedoLinks();
    console.log("back to global");
  } else {
    this.ClearVis();
    this.showingGlobal = false;
    console.log("back to local");
    this.Update();
  }
}
//######################################################################
//########    Main Update
//######################################################################

Method_One.prototype.SetDate = function (higher, lower) {
 $.proxy(Base_Method.prototype.SetDate,this,higher, lower)();
 if(this.showingGlobal){this.SwitchVis(false);}
}

Method_One.prototype.Update = function () {
  Base_Method.prototype.Update.call(this);
  if(this.showingGlobal){return;}
  if(this.data === undefined){return;}
  var discreet = this.getDiscreetfromDate(this.currentDateMin, this.data.date_type);
  if (this.LocalLayouts !== undefined && this.LocalLayouts[discreet] !== undefined
    && this.LocalLayouts[discreet].filteredNodes !== undefined
    && this.LocalLayouts[discreet].filteredLinks !== undefined &&
    (this.prev_currentDateMin != this.currentDateMin || this.prev_currentDateMax != this.currentDateMax)) {
      this.UpdateVisData( this.LocalLayouts[discreet].filteredNodes, this.LocalLayouts[discreet].filteredLinks);
      this.UpdateVis();
      this.UpdateVisPositions("l", discreet);
      this.RedoNodes();
      this.RedoLinks();
  }
  return;
};

//######################################################################
//########    Redraw
//######################################################################

// The page has been resized or some other event that requires a redraw
Method_One.prototype.Redraw = function (w, h) {
 Base_Method.prototype.Redraw.call(this,w,h);
  var zoom = d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", this.zoomed.bind(this));
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

Method_One.prototype.zoomed = function () {
  this.svgTranslation = d3.event.translate;
  this.scalefactor = d3.event.scale;
  this.svgContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
};