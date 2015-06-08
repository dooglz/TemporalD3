var startDate = new Date("2007");
var endDate = new Date("2016");
var selectedDate = new Date("2011");

var filteredLinks = [];
var unfilteredLinks = [];
var data;
var node;
var link;

//------------------------------------------
var diffY = endDate.getFullYear() - startDate.getFullYear() + 1;
var tickvals = [];
var ticknames = [];
for (var i = 0; i < diffY; i++) {
  tickvals[i] = i * 12;
  ticknames[i] = "" + (startDate.getFullYear() + i);
}

$('#ex1').slider({
  formatter: function (value) {
    return 'Current value: ' + value;
  }
});

function slided() {
  Update();
}

var dateSlider = $("#ex13").slider({
  ticks: tickvals,
  ticks_labels: ticknames,
  ticks_snap_bounds: 0,
  min: 0,
  max: diffY * 12,
  step: 1,
  value: 2,
  formatter: function (value) {
    var dd = new Date(startDate.toUTCString());
    dd.setMonth(dd.getMonth() + value);
    return dd.toDateString().slice(4);
  },
}).on('slide', slided).data('slider');
dateSlider.setValue(48);
Update();
//------------------------------------------

function Update() {
  selectedDate = new Date(startDate.toUTCString());
  selectedDate.setMonth(selectedDate.getMonth() + dateSlider.getValue());
  //Do we have data?
  if (data === undefined) {
    console.log("Loading Data");
    //No, load it and bail out
    d3.json("graph-byyear.json", function (error, graph) {
      data = graph;
      if (error) {
        console.error(error);
      } else {
        Update();
      }
    });
    return;
  }
  
  //we have data, filter it.
  unfilteredLinks = data.links;
  filteredLinks = data.links.filter(
    function (d) {
      //console.log(d.date);
      //return true;
      return selectedDate >= new Date(d.date);
    });
    
  //Create Graph
  link = svg.selectAll("line").data(filteredLinks);
  link.enter().append("line")
    .style("stroke", function (d) {
    //will break if  > 20 years in scale
    return d3.rgb(fill(parseInt(d.date.slice(0, 4)) - startDate.getFullYear())).darker();
  });
  link.exit().remove();

  node = svg.selectAll("circle").data(data.nodes);
  node.enter().append("circle")
    .attr("r", radius - .75)
    .style("fill", function (d) { return fill(d.group); })
    .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); })
    .call(force.drag);
  node.exit().remove();

  //restart simulation
  //  force.stop();
  force
    .nodes(data.nodes)
    .links(filteredLinks)
    .on("tick", tick)
    .start();
}

$(window).resize(function () {
  width = $('#chart').width();
  height = $('#chart').height();
});

var width = $('#chart').width(),
  height = $('#chart').height(),
  radius = 6;

var fill = d3.scale.category20();

var force = customLayout()
  .gravity(.28)
  .charge(-640)
  .linkDistance(50)
  .size([width, height]);

var svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height);

function tick() {
  node.attr("cx", function (d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
    .attr("cy", function (d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });

  link.attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });
}