/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>
//######################################################################
//########    Date slider (more complex than it looks)
//######################################################################
var startDate = new Date("2007");
var endDate = new Date("2016");
var selectedDate = new Date("2011");
var selectedDateMin = new Date("2011");
var selectedDateMax = new Date("2011");
//------------------------------------------
var diffY = endDate.getFullYear() - startDate.getFullYear() + 1;
var tickvals = [];
var ticknames = [];
var canvasWidth = $('#chart').width();
var canvasHeight = $('#chart').height();

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

var dateSlider;
function CreateSlider(ranged) {
  if (ranged === undefined) { ranged = false; }
  dateSlider = $("#ex13").slider({
    ticks: tickvals,
    ticks_labels: ticknames,
    ticks_snap_bounds: 0,
    min: 0,
    max: diffY * 12,
    step: 1,
    range: ranged,
    value: (ranged ? [3, 7] : 2),
    formatter: function (value) {
      var dd = new Date(startDate.toUTCString());
      if (ranged) {
        dd.setMonth(dd.getMonth() + value[0]);
        var start = dd.toDateString().slice(4);
        dd = new Date(startDate.toUTCString());
        dd.setMonth(dd.getMonth() + value[1]);
        var end = dd.toDateString().slice(4);
        return start + " - " + end;
      } else {
        dd.setMonth(dd.getMonth() + value);
        return dd.toDateString().slice(4);
      }
    },
  }).on('slide', slided).data('slider');
}

CreateSlider(false);
dateSlider.setValue(48);

var isSliderRanged = false;
$('#rangetoggle').change(function () {
  var val = $(this).prop('checked');
  if (val == isSliderRanged) { return; }
  if (val) {
    //transition form not ranged, to ranged
    dateSlider.destroy();
    CreateSlider(true);
  } else {
    // transition from ranged to not ranged
    dateSlider.destroy();
    CreateSlider(false);
  }
  isSliderRanged = val;
});      

//######################################################################
//########    Main Update functions
//######################################################################

function Update() {
  //Do we have data?
  if (graphdata === undefined) {
    return;
  }

  selected_method.SetData(graphdata);

  selectedDate = new Date(startDate.toUTCString());
  if (isSliderRanged) {
    selectedDateMin = new Date(startDate.toUTCString());
    selectedDateMin.setMonth(selectedDate.getMonth() + dateSlider.getValue()[0]);
    selectedDateMax = new Date(startDate.toUTCString());
    selectedDateMax.setMonth(selectedDate.getMonth() + dateSlider.getValue()[1]);
  } else {
    selectedDateMin = startDate;
    selectedDateMax = new Date(startDate.toUTCString());
    selectedDateMax.setMonth(selectedDate.getMonth() + dateSlider.getValue());
  }
  selected_method.SetDate(selectedDateMax, selectedDateMin);

  selected_method.Update();
}

$(window).resize(resize);

function resize() {
  canvasWidth = $('#chart').width();
  canvasHeight = $('#chart').height();
  selected_method.Redraw(canvasWidth, canvasHeight);
}

//######################################################################
//########    Data Picking, Validating, Loading
//######################################################################
var graphdata;
var stockData = [{ name: "Les Miserables", url: "data/miserables.json" },
  { name: "Napier Publications", url: "data/napierPublications.json" },
  { name: "template", url: "data/template.json" },
  { name: "freeScaleTime-300-1.4", url: "data/freeScaleTime-300-1.4.json" },
  { name: "freeScaleTime-300-1.9", url: "data/freeScaleTime-300-1.9.json" },
];
var loadedData = [];
ChangeData("Les Miserables");
//dropdown selector ------------
$("#datapicker").html("");
for (i = 0; i < stockData.length; i++) {
  $("#datapicker").append("<option>" + stockData[i].name + "</option>");
}

$("#datapicker").on('change', function () {
  ChangeData($("#datapicker").val());
  Update();
});

function ChangeData(dataName) {
  //loaded?
  console.log("changing Data to: " + dataName);
  for (i = 0; i < loadedData.length; i++) {
    if (loadedData[i].displayName == dataName) {
      //yep, set and bail.
      InitChannelMixer(loadedData[i]);
      graphdata = loadedData[i];
      //channelPanel
      Update();
      return;
    }
  }
  //no, load it
  var url = "";
  for (i = 0; i < stockData.length; i++) {
    if (stockData[i].name == dataName) {
      url = stockData[i].url;
      break;
    }
  }
  if (url == "") {
    //this isn't stock data
    console.error("Can't load custom url data yet :(");
    return;
  }

  console.log("Loading Data");
  d3.json(url, function (error, newData) {
    if (error) {
      console.error(error);
    } else {
      console.log("Loaded");
      newData.url = url;
      newData.displayName = dataName;
      ParseData(newData);
      loadedData.push(newData);
      ChangeData(dataName);
    }
  });
}

//######################################################################
//########    Channel Mixer
//######################################################################

//Creates the UI for channel Mixer
function InitChannelMixer(data) {
  var nodeChannels = {};
  nodeChannels.channels = [];
  for (var i = 0; i < selected_method.nodeChannels.length; i++) {
    nodeChannels.amount = i;
    nodeChannels.channels.push(selected_method.nodeChannels[i].name);
    selected_method.nodeChannels[i].dataParam = "";
    selected_method.nodeChannels[i].inUse = false;
  }
  var linkChannels = {};
  linkChannels.channels = [];
  for (var i = 0; i < selected_method.linkChannels.length; i++) {
    linkChannels.amount = i;
    linkChannels.channels.push(selected_method.linkChannels[i].name);
    selected_method.linkChannels[i].dataParam = "";
    selected_method.linkChannels[i].inUse = false;
  }
  selected_method.ChannelChanged();
  var cp = $("#channelPanel");
  cp.html("");
  $("#channelPanelHeadder").html(
    "<strong>DataSet:</strong> " + data.displayName +
    ", <strong>Nodes / Links:</strong> " + data.nodes.length + " / " + data.links.length
    );
  $('<div>', { 'class': 'row' }).html(
    "<strong>Node Data Attributes:</strong> " + data.node_keys +
    " <strong>Link Data Attributes:</strong> " + data.link_keys +
    "<br><strong>Node Channels:</strong> " + nodeChannels.channels +
    " <strong>Link Channels:</strong> " + linkChannels.channels + "<hr>"
    ).appendTo(cp);
  var lkeydiv = $('<div>', { 'class': 'col-sm-4' })
    .html("<strong>Links</strong>")
    .appendTo(cp);
  var nkeydiv = $('<div>', { 'class': 'col-sm-4' })
    .html("<strong>Nodes</strong>")
    .appendTo(cp);
  var linkDropdown = $();

  for (var key in data.node_keys) {
    $('<div>', { 'class': 'methodParam text-right' }).html(data.node_keys[key] + " - ")
      .append(GetChannelDropdown(selected_method.nodeChannels, data.node_keys[key], "node")).appendTo(nkeydiv);
  }
  for (var key in data.link_keys) {
    $('<div>', { 'class': 'methodParam text-right' }).html(data.link_keys[key] + " - ")
      .append(GetChannelDropdown(selected_method.linkChannels, data.link_keys[key], "link")).appendTo(lkeydiv);
  }
  // Init dropdowns
  $('.selectpicker').selectpicker();
}

// creates and returns a <select> div with all channel options as <option>'s
function GetChannelDropdown(channels, attribute, atype) {
  var str = "<option>Disabled</option>";
  for (var i in channels) {
    str += "<option>" + channels[i].name + "</option>";
  }
  var div = $('<select>', { 'class': 'selectpicker', 'data-width': '50%', 'id': atype + "_" + attribute + "_dropdown" }).html(str);
  div.on('change', function () { ChannelChange(atype, attribute, div.val()); });
  return div;
}

// Handles changing of channels, called when any dropdown selector changes
function ChannelChange(atype, attribute, newChannel) {
  console.log("Data " + atype + " Attribute:'" + attribute + "' reassigned to " + atype + " channel: " + newChannel);
    
  //find the channel that we were previously assigned to and set to Null
  var oldchannel = (atype == "node" ? selected_method.nodeChannels : selected_method.linkChannels).filter(function (obj) {
    return obj.dataParam == attribute;
  });
  if (oldchannel.length == 1) {
    oldchannel[0].dataParam = "";
    oldchannel[0].inUse = false;
    selected_method.ChannelChanged(oldchannel[0]);
  }
  //Assign to new channel
  if (newChannel != "Disabled") {    
    //find the channel
    var channel = (atype == "node" ? selected_method.nodeChannels : selected_method.linkChannels).filter(function (obj) {
      return obj.name == newChannel;
    });
    if (channel.length != 1) {
      console.error("Can't find " + atype + " Channel '" + newChannel + "' in method %o", selected_method.name);
      return;
    }
    channel = channel[0];
    //is this channel already in use?
    if (channel.inUse == true) {
      // console.log("channel already in use by attribute: " + channel.dataParam);
      //Yes, change dropdown of assigned attribute to disabled
      $("#" + atype + "_" + channel.dataParam + "_dropdown").selectpicker('val', "Disabled");
      //unnasign current attribute
      ChannelChange(atype, channel.dataParam, "Disabled");
    }
    //Add attritubute to the channel
    channel.dataParam = attribute;
    channel.inUse = true;
    selected_method.ChannelChanged(channel);
  }
}

//######################################################################
//########    Method Picking, Validating, Loading
//######################################################################
var methods = [];
var m_simple = new Method_Simple();
methods.push(m_simple);
var selected_method;
changeMethod(m_simple);

//dropdown selector ------------
$("#methodpicker").html("");
for (i = 0; i < methods.length; i++) {
  $("#methodpicker").append("<option>" + methods[i].name + "</option>");
}
$("#methodpicker").on('change', function () {
  changeMethod($("#methodpicker").val());
});

function VerifyMethodParmeters(method) {
  var mustHaveParams = ["name", "ptype", "pval"];
  var acceptedParams = ["slider", "checkbox", "textbox"];

  for (var i in method.parameters) {
    var param = method.parameters[i];
    if ($.inArray(param.ptype, acceptedParams) == -1) {
      console.error("Method %o Unkown parameter type %o - %o ", method, param.name, param.ptype);
      break;
    }
    for (var j in mustHaveParams) {
      var str = mustHaveParams[j];
      if (!param.hasOwnProperty(str)) {
        console.error("Method %o parameter %o, must have a %o member!", method, param, str);
        return false;
      }
    }
  }
  return true;
}

function changeMethod(methodName) {
  if (typeof (methodName) === "string") {
    var find = $.grep(methods, function (e) {
      return e.name == methodName
    });
    if (find.length == 1) {
      selected_method = find[0];
    } else if (find.length > 1) {
      console.error("Multiple methods registered with the name:" + methodName);
      return;
    } else {
      console.error("Can't find method with name: " + methodName);
      return;
    }
  } else {
    if (!methodName.hasOwnProperty("name")) {
      console.error("Unkown object type passed to changeMethod");
      return;
    }
    selected_method = methodName;
  }
  resize();
  selected_method.SetDateBounds(startDate, endDate);

  //clear param div
  var pdiv1 = $('#paramDiv1').html("");
  var pdiv2 = $('#paramDiv2').html("");
  var pdiv;

  console.log("Loading Method: " + selected_method.name);
  if (!selected_method.hasOwnProperty("parameters")) {
    console.log("Method: %o has no parameters", selected_method);
    return;
  }

  //verify parameters
  if (!VerifyMethodParmeters(selected_method)) {
    return;
  }

  for (var i in selected_method.parameters) {
    //toggle placement div
    if (pdiv == pdiv1) {
      pdiv = pdiv2;
    } else {
      pdiv = pdiv1;
    }
    var param = selected_method.parameters[i];
    var newdiv = $("<div class='methodParam'/>");
    switch (param.ptype) {

      case "slider":
        newdiv.append("<p>" + param.name + "</p>");
        var sliderDiv = $("<input id=" + param.name + " data-slider-id='ex1Slider' type='text' data-slider-min=" + param.minval + " data-slider-max=" + param.maxval + " data-slider-step=" + param.step + " data-slider-value=" + param.pval + " />");
        newdiv.append(sliderDiv);
        sliderDiv.slider();
        //register calback using some legit hax
        ! function outer(pp) {
          sliderDiv.change('slide', function inner(e) {
            pp.pval = e.value.newValue;
            selected_method.ParamChanged(pp);
          });
        } (param);
        break;

      case "checkbox":
        var boxDiv = $("<input  id=" + param.name + " type='checkbox' " + (param.pval ? "checked" : "") + " data-toggle='toggle' data-size='small'>");
        newdiv.append(boxDiv).append("  " + param.name);
        ! function outer(pp, bb) {
          boxDiv.change(function inner() {
            pp.pval = bb.is(":checked");
            selected_method.ParamChanged(pp);
          });
        } (param, boxDiv);
        break;

      case "textbox":
        newdiv.append("<p>" + param.name + "</p>");
        var igroup = $("<div class='input-group'></div>");
        var input = $("<input type='text class='form-control'>");
        igroup.append(input);
        var span = $("<span class=input-group-btn'/>");
        var btn = $("<button class='btn btn-default btn-sm' type='button'>Go!</button>");
        newdiv.append(igroup.append(span.append(btn)));
        ! function outer(pp, bb) {
          btn.click(function inner() {
            pp.pval = bb.val();
            selected_method.ParamChanged(pp);
          });
        } (param, input);
        break;

      default:
        console.error("Unkown method parameter type : " + param.name + " - " + param.ptype);
        break;
    }
    pdiv.append(newdiv);
  }
  pdiv.hide().show(0);
}