//------------------------------------------
var startDate = new Date("2007");
var endDate = new Date("2016");
var diffY = endDate.getFullYear() - startDate.getFullYear() +1;
var tickvals = [];
var ticknames = [];
for (var i = 0; i < diffY; i++) {
  tickvals[i] = i*12;
  ticknames[i] = ""+(startDate.getFullYear() + i);
}

$('#ex1').slider({
	formatter: function(value) {
		return 'Current value: ' + value;
	}
});

var selectedDate = new Date();
function slided(){
  selectedDate = new Date(startDate.toUTCString());
  selectedDate.setMonth(selectedDate.getMonth() + dateSlider.getValue());
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
}).on('slide',  slided).data('slider');

//------------------------------------------

$( window ).resize(function() {
  width = $('#chart').width();
  height = $('#chart').height();
});

var width = $('#chart').width(),
  height = $('#chart').height(),
  radius = 6;

var fill = d3.scale.category20();

var force = customLayout()
  .gravity(.05)
  .charge(-240)
  .linkDistance(50)
  .size([width, height]);

var svg = d3.select("#chart").append("svg")
  .attr("width", width)
  .attr("height", height);

d3.json("graph.json", function (error, graph) {
  if (error) return console.error(error);

  var link = svg.selectAll("line")
    .data(graph.links)
    .enter().append("line");

  var node = svg.selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", radius - .75)
    .style("fill", function (d) { return fill(d.group); })
    .style("stroke", function (d) { return d3.rgb(fill(d.group)).darker(); })
    .call(force.drag);

  force
    .nodes(graph.nodes)
    .links(graph.links)
    .on("tick", tick)
    .start();

  function tick() {
    node.attr("cx", function (d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
      .attr("cy", function (d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });

    link.attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; });
  }
});
