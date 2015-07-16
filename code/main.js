/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>
//######################################################################
//########    Date slider (more complex than it looks)
//######################################################################
var startDate;
var endDate;
var selectedDate;
var selectedDateMin;
var selectedDateMax;
//------------------------------------------
var canvasWidth = $('#chart').width();
var canvasHeight = $('#chart').height();
var selected_method;
//-----
var slider_num_ticks = 10;
var slider_num_steps = 12;
//-----
$(document).ready(function(){
  ChangeData("Les Miserables");
  changeMethod(m_simple);
 }) 



$('#dateSliderInput').slider({
  formatter: function (value) {
    return 'Current value: ' + value;
  }
});

function SliderVarToDate(value){
   var dd = new Date(startDate.toUTCString());
   dd.setMonth(dd.getMonth() + value);
   return dd;
}

function slided() {
  if (graphdata.date_type == "static") {
    selectedDateMin = -Infinity;
    selectedDateMax = Infinity;
    selectedDate = 0;
  } else if (graphdata.date_type == "date") {
    selectedDate = new Date(startDate.toUTCString());
    if (isSliderRanged) {
      selectedDateMin = new Date(startDate.toUTCString());
      selectedDateMin.setMonth(selectedDate.getMonth() + dateSlider.getValue()[0]);
      selectedDateMax = new Date(startDate.toUTCString());
      selectedDateMax.setMonth(selectedDate.getMonth() + dateSlider.getValue()[1]);
    } else {
      selectedDateMax = new Date(startDate.toUTCString());
      selectedDateMax.setMonth(selectedDate.getMonth() + dateSlider.getValue());
      selectedDateMin = selectedDateMax;
    }
    selectedDate = selectedDateMin;
  } else if (graphdata.date_type == "number") {
    if (isSliderRanged) {
      selectedDateMin = dateSlider.getValue()[0]
      selectedDateMax = dateSlider.getValue()[1]
    } else {
      selectedDateMax = dateSlider.getValue();
      selectedDateMin = selectedDateMax;
    }
    selectedDate = selectedDateMin;
  }
  if(selected_method !== null){
    selected_method.SetDate(selectedDateMax, selectedDateMin);
  }
  Update();
}

var dateSlider;
function CreateSlider(ranged) {
      if (ranged === undefined) { ranged = false; }
  var tickvals = [];
  var ticknames = [];
  var year_diff = 0;
  var spread = 0;
  if (graphdata.date_type == "static") {
    dateSlider = $("#ex13").slider({ enabled: false, min: 0, max: 0, value: 0 }).data('slider');
  } else if (graphdata.date_type == "number") {
    spread = (endDate - startDate) / slider_num_ticks;
    spread = Math.ceil((spread) / 1.0) * 1.0;
    for (var i = 0; i < (slider_num_ticks); i++) {
      tickvals[i] = i * spread;
      ticknames[i] = "" + tickvals[i];
    }
    dateSlider = $("#ex13").slider({
      ticks: tickvals,
      ticks_labels: ticknames,
      ticks_snap_bounds: 0,
      min: startDate,
      max: endDate,
      step: 1,
      range: ranged,
      value: 0 }
      ).on('change', slided).data('slider');
  } else {
    year_diff = endDate.getFullYear() - startDate.getFullYear();
    spread = ((year_diff + 1) * 12.0) / (slider_num_ticks * 1.0);
    //round to the nearest multiple of slider_num_steps
    //Because of ceil, the last node may be > maxdate. (by 1x spread months)
    spread = Math.ceil((spread) / slider_num_steps) * slider_num_steps;
    for (var i = 0; i < (slider_num_ticks); i++) {
      tickvals[i] = i * spread;
      ticknames[i] = SliderVarToDate((i * spread)).toDateString().slice(-4);
    }
    dateSlider = $("#ex13").slider({
      ticks: tickvals,
      ticks_labels: ticknames,
      ticks_snap_bounds: 0,
      min: 0,
      max: (year_diff + 1) * 12,
      step: 1,
      range: ranged,
      value: (ranged ? [3, 7] : 2),//This actually toggles range mode
      formatter: function (value) {
       // var dd = new Date(startDate.toUTCString());
        if (ranged) {
          var start = SliderVarToDate(value[0]).toDateString().slice(4);
          var end = SliderVarToDate(value[1]).toDateString().slice(4);
         return start + " - " + end;
        } else {
          return SliderVarToDate(value).toDateString().slice(4);
        }
      },
    }).on('change', slided).data('slider');
  }
      //this is just for styling
    if (ranged) {
      $("#ex13Slider").addClass("ranged");
    } else {
      $("#ex13Slider").addClass("discreet");
    }
    dateSlider.enable();

}

function ReCreateSlider() {
  if (dateSlider !== undefined) {
    dateSlider.destroy();
  }
  CreateSlider(isSliderRanged);
}

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


var isSliderAnimated = false;
var animationtimeout;
$('#animationtoggle').change(function () {
  var val = $(this).prop('checked');
  if (val == isSliderAnimated) { return; }
  if (val) {
    animationtimeout = setInterval(Animate, 300);
  } else {
     clearTimeout(animationtimeout);
  }
  isSliderAnimated = val;
});  

var updown = false;
function Animate(){
  if (dateSlider === undefined || !dateSlider.isEnabled()){
    return;
  }
  var current = dateSlider.getValue();
   if (isSliderRanged) {
      selectedDateMin = dateSlider.getValue()[0]
      selectedDateMax = dateSlider.getValue()[1]
    } else {
      if(current == dateSlider.getAttribute("max")){
        updown = false;
      }else if(current == dateSlider.getAttribute("min")){
        updown = true;
      }
      dateSlider.setValue(current + (updown ? 1 : -1),true,true);
    }
}

//######################################################################
//########    Main Update functions
//######################################################################

function Update() {
  //Do we have data?
  if (graphdata === undefined) {
    return;
  }
  if (selected_method !== null) {
    selected_method.Update();
  }
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
var graphdata = null;
var stockData = [{ name: "Les Miserables", url: "data/miserables.json" },
  { name: "Napier Publications", url: "data/napierPublications.json" },
  { name: "freeScaleTime-300-1.4", url: "data/freeScaleTime-300-1.4.json" },
  { name: "freeScaleTime-300-1.9", url: "data/freeScaleTime-300-1.9.json" },
  { name: "graphTest2b", url: "data/graphTest2b.json" },
  { name: "graphTest3b", url: "data/graphTest3b.json" },
  { name: "graphTest3c.json", url: "data/graphTest3c.json"}, 
  { name: "circleGraph50-2.json", url: "data/circleGraph50-2.json"},
  { name: "oscillatingValuesNodes.json", url: "data/oscillatingValuesNodes.json"},
  { name: "oscillatingValuesNodesEdges3.json", url: "data/oscillatingValuesNodesEdges3.json" },
  { name: "NodesLife.json", url: "data/NodesLife.json" }
];


var loadedData = [];

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
      if(selected_method !== null){
        InitChannelMixer(loadedData[i]);
      }
      graphdata = loadedData[i];
      
      startDate = graphdata.minDate;
      endDate = graphdata.maxDate;
      selectedDate = startDate;
      selectedDateMin = startDate;
      selectedDateMax = startDate;
     // console.log("Main setting mindate to: %o and maxdate to: %o", startDate, endDate);
      ReCreateSlider();
      if(selected_method !== null){
        selected_method.SetDateBounds(startDate, endDate);
        selected_method.SetData(graphdata);
      }
      slided();
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

//Creates the UI for channel Mixer, called on data change
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

//reads selected channels from the method and set UI accordingly
//TODO Test this for bugs.
function Readchannels() {
  //wipe dropdowns
  $("[id$=_dropdown]").selectpicker('val', "Disabled");
  for (var i = 0; i < selected_method.nodeChannels.length; i++) {
    var channel = selected_method.nodeChannels[i];
    if (channel.inUse) {
      var dd = $("#node_" + channel.dataParam + "_dropdown");
      if (dd.length == 1) {
        dd.selectpicker('val', channel.name);
      }
    }
  }
  for (var i = 0; i < selected_method.linkChannels.length; i++) {
    var channel = selected_method.linkChannels[i];
    if (channel.inUse) {
      var dd = $("#link_" + channel.dataParam + "_dropdown");
      if (dd.length == 1) {
        dd.selectpicker('val', channel.name);
      }
    }
  }
  selected_method.ChannelChanged();
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
var m_one = new Method_One();
methods.push(m_one);
var selected_method = null;

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
  var acceptedParams = ["slider", "checkbox", "textbox", "button"];

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
  var oldMethod = selected_method;
  if (typeof (methodName) === "string") {
    if (methodName == selected_method.name) { return; }
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
    if (methodName == selected_method) { return; }
    selected_method = methodName;
  }
  if (oldMethod !== undefined && oldMethod !== null) {
    oldMethod.Unload();
  }

  console.log("Loading Method: " + selected_method.name);
  selected_method.SetDateBounds(startDate, endDate);
  selected_method.Load();
 
  //clear param div
  var pdiv1 = $('#paramDiv1').html("");
  var pdiv2 = $('#paramDiv2').html("");
  var pdiv;

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
        boxDiv.bootstrapToggle();
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
        
      case "button":
        var boxDiv = $("<a class='btn btn-sm btn-success' href='#' role='button'>"+param.name+"</a>");
        newdiv.append(boxDiv)
        newdiv.css('text-align', 'center');
        ! function outer(pp, bb) {
          boxDiv.click(function inner() {
            selected_method.ParamChanged(pp);
          });
        } (param, boxDiv);
        break;
        
      default:
        console.error("Unkown method parameter type : " + param.name + " - " + param.ptype);
        break;
    }
    pdiv.append(newdiv);
  }
  pdiv.hide().show(0);
  Readchannels();
  resize();
  selected_method.SetData(graphdata);
  if(graphdata !== null){
    slided();
  }
  Update();
}

//######################################################################
//########    Progress Bar
//######################################################################

var progressbar = $("#progressbar");
var progressContainer = $("#progressContainer").detach();
var progressbarVisible = false;

function SetLoadingBarColour(colour) {
  if(colour === undefined){
    colour = "#337ab7";
  }
  progressbar.css("background-color", colour);
}

function ShowLoadingBar(percent, message) {
  if (!progressbarVisible) {
    $('#Slidercontainer').append(progressContainer);
    progressbarVisible = true;
  }
  progressbar.css('width', percent + '%');
  progressbar.css('transition', "width .1s ease");
  progressbar.html(percent + "% " + message);
}

function HideLoadingBar() {
  progressContainer.detach();
  progressbarVisible = false;
}

//######################################################################
//########    Junk
//######################################################################

$('#fullscreentoggle').change(function () {
  var val = $(this).prop('checked');
  if (val) {
    $('.container.superwide').css("max-width","90%");
  } else {
    $('.container.superwide').css("max-width","1094px");
  }
  resize();
});  