/* global Handlebars */
/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>

var canvasWidth = $('#chart').width();
var canvasHeight = $('#chart').height();
var selected_method;
//-----
$(document).ready(function(){
  ChangeData("Les Miserables");
  changeMethod(m_simple);
 }) 

$(window).keypress(function( event ) {
  //r =82
  if ( event.keyCode == 114 ) {
   selected_method.Reset();
  }
});

//######################################################################
//########    Date slider (more complex than it looks)
//######################################################################
var startDate;
var endDate;
var selectedDate;
var selectedDateMin;
var selectedDateMax;
//------------------------------------------
var slider_num_ticks = 10;
var slider_num_steps = 12;
//-----

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
    isSliderEnabled = false;
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

var isSliderVisible = true;
function SetSliderVisibility(b) {
  if (b == isSliderVisible) { return; }
  if(!b){
    $("#Slidercontainer").hide();
  }else{
    $("#Slidercontainer").show();
  }
  isSliderVisible = b;
}
var isSliderEnabled = true;
function SetSliderEnabled(b) {
  if (b == isSliderEnabled) { return; }
  $("#ex13").slider(b ? "enable":"disable");
  isSliderEnabled = b;
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
    checkOptionalChannels(selected_method.nodeChannels,"node");
    checkOptionalChannels(selected_method.linkChannels,"link");
  }
}

$(window).resize(resize);

function resize() {
  canvasWidth = $('#chart').width();
  canvasHeight = $('#chart').height();
  if(Exists(selected_method)){
    selected_method.Redraw(canvasWidth, canvasHeight);
  }
}

$("#colschmepicker").on('change', function () {
  selected_method.SetColorTheme($("#colschmepicker").val());
});
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
UpdateDataPicker();

var loadedData = [];

//dropdown selector ------------

$("#datapicker").on('change', function () {
  ChangeData($("#datapicker").val());
  Update();
});


function UpdateDataPicker(){
  for (i = 0; i < stockData.length; i++) {
    if( $("#datapicker").find(":contains('"+stockData[i].name+"')" ).length == 0){
      $("#datapicker").append("<option>" + stockData[i].name + "</option>");
    }
  }
  $("#datapicker").selectpicker('refresh');
}
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
      if(Exists(graphdata.settings)){
        //console.info("Loading settings from Data");
        //LoadSettings(selected_method.settings);
        if( $("#settingspicker").find(":contains('Data Settings')" ).length == 0){
          $("#settingspicker").append("<option>Data Settings</option>");
        }
      }else{
        $(":contains('Data Settings')","#settingspicker").remove();
      }
     UpdateSettingsPicker();
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
      if(ParseData(newData)){
        loadedData.push(newData);
        ChangeData(dataName);
      }else{
        window.alert("Parse error!");
      }
    }
  });
}

//######################################################################
//########    Channel Mixer
//######################################################################
var kmap = new CoolKeyMap();
var kmapKeys = [];
kmap.SetDefault("Disabled");
var channelPanelHeadderHtmlTemplate = $("#channelPanelHeadder").html();
var channelPanelHeadderTemplate = Handlebars.compile(channelPanelHeadderHtmlTemplate);
$("#channelPanelHeadder").html("");
var channelPanelInfoHtmlTemplate = $("#channelPanelInfo").html();
var channelPanelInfoTemplate = Handlebars.compile(channelPanelInfoHtmlTemplate);
$("#channelPanelInfo").html("");

//Creates the UI for channel Mixer, called on data change
function InitChannelMixer(data) {
  var nodeChannels = {};
  nodeChannels.channels = [];
  nodeChannels.amount = 0;
  var fvalues = [];
  for (var i = 0; i < selected_method.nodeChannels.length; i++) {
    nodeChannels.amount ++;
    nodeChannels.channels.push(selected_method.nodeChannels[i].name);
    selected_method.nodeChannels[i].dataParam = "";
    selected_method.nodeChannels[i].inUse = false;
    if(selected_method.nodeChannels[i].filter === undefined || selected_method.nodeChannels[i].filter.bind(selected_method)() ){
      fvalues.push(selected_method.nodeChannels[i].name);
    }
  }
  var linkChannels = {};
  linkChannels.channels = [];
  for (var i = 0; i < selected_method.linkChannels.length; i++) {
    linkChannels.amount = i;
    linkChannels.channels.push(selected_method.linkChannels[i].name);
    selected_method.linkChannels[i].dataParam = "";
    selected_method.linkChannels[i].inUse = false;
    if(selected_method.linkChannels[i].filter === undefined || selected_method.linkChannels[i].filter.bind(selected_method)() ){
      fvalues.push(selected_method.linkChannels[i].name);
    }
  }
  
  kmap.SetValues(fvalues);
  
  selected_method.ChannelChanged();
  var rendered = channelPanelHeadderTemplate({ displayName: data.displayName, nodes: data.nodes.length, links: data.links.length });
  $("#channelPanelHeadder").html(rendered);
  rendered = channelPanelInfoTemplate({ node_keys: data.node_keys, link_keys: data.link_keys, nodeChannels: nodeChannels.channels, linkChannels: linkChannels.channels });
  $("#channelPanelInfo").html(rendered);
  
  var lkeydiv = $("#linkDropdowns").html("<strong>Links</strong>");
  var nkeydiv = $("#nodeDropdowns").html("<strong>Nodes</strong>");
  
  for (var key in data.node_keys) {
    var dropn = GetChannelDropdown(selected_method.nodeChannels, data.node_keys[key], "node");
    var nid = ("node_"+data.node_keys[key]+"_dropdowns").replace(/\s+/g, '-__-');
    $('<div>', { 'class': 'methodParam text-right', 'id':nid  }).html(data.node_keys[key] + " - ")
      .append(dropn).appendTo(nkeydiv);
  }
  for (var key in data.link_keys) {
    var dropl = GetChannelDropdown(selected_method.linkChannels, data.link_keys[key], "link");
    var lid = ("link_"+data.link_keys[key]+"_dropdowns").replace(/\s+/g, '-__-');
    $('<div>', { 'class': 'methodParam text-right', 'id': lid }).html(data.link_keys[key] + " - ")
      .append(dropl).appendTo(lkeydiv);
  }

  // Init dropdowns
  $('.selectpicker').selectpicker();
}

var uniq = 0;
// creates and returns a <select> div with all channel options as <option>'s
function GetChannelDropdown(channels, attribute, atype, removeBtn) {
  uniq++;
  if (removeBtn === undefined) { removeBtn = false; }
  var str = "<option>Disabled</option>";
  for (var i in channels) {
    if (channels[i].filter !== undefined && !channels[i].filter.bind(selected_method)()) {
      continue;
    }
    str += "<option value='" + channels[i].name + "'>" + channels[i].name + "</option>";
  }
  var divA = $('<div>', { 'style': 'display:inline;', 'id': (atype + "_" + attribute + "_" + uniq + "_dropdownContainer").replace(/\s+/g, '-__-') });
  var divB = $('<select>', { 'class': 'selectpicker', 'data-width': '50%', 'id': (atype + "_" + attribute + "_" + uniq + "_dropdown").replace(/\s+/g, '-__-') }).html(str);
  divB.on('change', (function () { var suniq = uniq; return function () { ChannelChange(atype, attribute + "_" + suniq, divB.val()) } })());
  var divC;
  if (removeBtn) {
    divC = $('<button>', { 'class': 'btn btn-default', 'id': (atype + "_" + attribute + "_" + uniq + "_minus").replace(/\s+/g, '-__-') }).html('<span class="glyphicon glyphicon-minus"></span>');
    divC.on('click',(function () { var suniq = uniq; return function () { ChannelChange(atype, attribute + "_" + suniq, "Disabled"); kmap.RemoveKey(attribute + "_" + suniq); divA.remove(); } })());
  } else {
    divC = $('<button>', { 'class': 'btn btn-default', 'id': (atype + "_" + attribute + "_" + uniq + "_plus").replace(/\s+/g, '-__-') }).html('<span class="glyphicon glyphicon-plus"></span>');
    divC.on('click', function () {
      $(("#" + atype + "_" + attribute + "_dropdowns").replace(/\s+/g, '-__-')).append(GetChannelDropdown((atype == "node" ? selected_method.nodeChannels : selected_method.linkChannels), attribute, atype, true));
      $('.selectpicker').selectpicker();
    });
  }
  divA.append(divB);
  divA.append(divC);
  kmap.AddKey(attribute + "_" + uniq);
  return divA;
}

function checkOptionalChannels(channels, atype) {
  for (var i in channels) {
    var channel = channels[i];
    if (channel.filter !== undefined) {
      var dropdowns = $("[id$=_dropdown][id^=" + atype + "_]");
      var instances = dropdowns.find('[value="' + channel.name + '"]');
      if (!channel.filter.bind(selected_method)()) {
        if (instances.length != 0) {
          console.log("Removing channel from dropdown: ", channel.name);
          // Will set any dropdown cuurently to this, to disabled
          kmap.RemoveValue(channel.name);
          //remove from UI
          instances.remove();
          dropdowns.selectpicker('refresh');
        }
      } else if (instances.length == 0) {
        console.log("Adding channel to dropdown: ", channel.name);
        //add if not added
        dropdowns.append("<option value='" + channel.name + "'>" + channel.name + "</option>");
        dropdowns.selectpicker('refresh');
        kmap.AddValue(channel.name);
      }
    }
  }
}

function DropdownNameToAttributeName(str){
  return (str.slice(0,str.lastIndexOf("_"))).replace(/-__-/g," ");;
};

function Wipechannels() {
  //wipe dropdowns
  $("[id$=_dropdown]").selectpicker('val', "Disabled");
  kmap.WipePairsNoAssign();
  for (var i = 0; i < selected_method.nodeChannels.length; i++) {
    var nchannel = selected_method.nodeChannels[i];
    nchannel.inUse = false;
    nchannel.dataParam = "";
  }
  for (var i = 0; i < selected_method.linkChannels.length; i++) {
    var lchannel = selected_method.linkChannels[i];
    lchannel.inUse = false;
    lchannel.dataParam = "";
  }
  selected_method.ChannelChanged();
  //remove multidropdowns
  $("[id$=minus]").click();
}

//reads selected channels from the method and set UI accordingly
function Readchannels() {
  //wipe dropdowns
  $("[id$=_dropdown]").selectpicker('val', "Disabled");
  kmap.WipePairsNoAssign();
  //remove multidropdowns
  $("[id$=minus]").click();
  
  for (var i = 0; i < selected_method.nodeChannels.length; i++) {
    var nchannel = selected_method.nodeChannels[i];
    if (nchannel.inUse) {
       SetChannel("node",nchannel.dataParam,nchannel.name);
    }
  }
  for (var i = 0; i < selected_method.linkChannels.length; i++) {
    var lchannel = selected_method.linkChannels[i];
    if (lchannel.inUse) {
      SetChannel("link",lchannel.dataParam,lchannel.name);
    }
  }
  selected_method.ChannelChanged();
}

//Takes an attribute and a channel, 
// finds an appropriate dropdown, assigns it, calls ChannelChange.
function SetChannel(atype, attribute, channelname) {
  var ddc = $(("#" + atype + "_" + attribute + "_dropdowns").replace(/\s+/g, '-__-'));
  var done = false;
  console.log("SetChannel1: %o, to attribute %o", channelname,attribute);
      console.log(ddc);
  for (var j = 0; j < $("[id$=_dropdown]", ddc).length; j++) {
    var dropdown = $("[id$=_dropdown]", ddc).eq(j);

    console.log(dropdown);
    console.log("SetChannel2: %o, to attribute %o", channelname,attribute);
    //console.log("lookign at %o, %o, value: %o",dropdown,dropdown.val(),dropdown.attr('id'));
    if (dropdown.val() == "Disabled" || dropdown.val() == attribute) {
     // var shortSpecificName =  (dropdown.attr('id').slice(5, -9)).replace(/-__-/g," ");
     var shortSpecificName =  (dropdown.attr('id').slice(5, -9));
      console.log("SetChannel3: %o, to attribute %o, dropdown: %o",channelname,attribute,shortSpecificName);
      ChannelChange(atype,shortSpecificName, channelname);
      done = true;
      break;
    }
    if (j == $("[id$=_dropdown]", ddc).length - 1) {
      $("[id$=_plus]", ddc).click();
    }
  }
  if (!done) {
    console.error("Loading in multi dropdown not supported yet :(");
  }
}

function Assign(attribute, oldchannelname, newchannelname) {
  var realAttribute = DropdownNameToAttributeName(attribute);
 // console.log("Assign() attribute: %o, realAttribute:%o, oldchannelname: %o, newchannelname: %o", attribute,realAttribute, oldchannelname, newchannelname);
  //disable old channel
  if (oldchannelname !== "Disabled") {
    var oldchannel = selected_method.nodeChannels.filter(function (obj) {
      return obj.name == oldchannelname;
    });
    if (oldchannel.length == 0) {
      oldchannel = selected_method.linkChannels.filter(function (obj) {
        return obj.name == oldchannelname;
      });
    }
    if (oldchannel.length == 0) {
      console.warn("Can't find old channel", oldchannelname);
      console.trace();
    } else {
      //console.log("Assign() setting channel dataParam to: Disabled ");
      oldchannel[0].dataParam = "";
      oldchannel[0].inUse = false;
    }
  }
  //enable new channel
  if (newchannelname !== "Disabled") {
    var newchannel = selected_method.nodeChannels.filter(function (obj) {
      return obj.name == newchannelname;
    });
    if (newchannel.length == 0) {
      newchannel = selected_method.linkChannels.filter(function (obj) {
        return obj.name == newchannelname;
      });
    }
    if (newchannel.length == 0) {
      console.warn("Can't find new channel", newchannelname);
    } else {
      //console.log("Assign() setting channel dataParam to: %o ", realAttribute);
      newchannel[0].dataParam = realAttribute;
      newchannel[0].inUse = true;
    }
  }
  console.log("Assign() setting dropdown to: %o ", newchannelname);
  $("[id$='_" + attribute + "_dropdown']").selectpicker('val', newchannelname);
}

kmap.SetAssignmentBehaviour(Assign);

// Handles changing of channels, called when any dropdown selector changes
function ChannelChange(atype, attribute, newChannel) {
  console.log("Data " + atype + " Attribute:'" + attribute + "' reassigned to " + atype + " channel: " + newChannel);
  kmap.Pair(attribute, newChannel);
  checkOptionalChannels(selected_method.nodeChannels, "node");
  checkOptionalChannels(selected_method.linkChannels, "link");
  if (newChannel == "Disabled") {
    selected_method.ChannelChanged();
  } else {
    //find the actual channel
    var channel = (atype == "node" ? selected_method.nodeChannels : selected_method.linkChannels).filter(function (obj) {
      return obj.name == newChannel;
    });
    if (channel.length != 1) {
      console.error("Can't find " + atype + " Channel '" + newChannel + "' in method %o", selected_method.name);
      return;
    }
    channel = channel[0];
    selected_method.ChannelChanged(channel);
  }
  return;
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
  //zero position of all nodes and links
  if (graphdata !== undefined && graphdata !== null && graphdata.nodes !== undefined) {
    graphdata.nodes.forEach(function (o) {
      o.px = o.py = o.x = o.y = 0;
    });
  }
  selected_method.Load();
 
  //clear param div
  var pdiv1 = $('#paramDiv1').html("");
  var pdiv2 = $('#paramDiv2').html("");
  var pdiv;

  if (!selected_method.hasOwnProperty("parameters")) {
    console.log("Method: %o has no parameters", selected_method);
    return;
  }
  
  $("#colschmepicker").empty();
  selected_method.ColorThemes.forEach(function(c) {
    $("#colschmepicker").append("<option>" + c.name + "</option>");
  }, this);
  $("#colschmepicker").selectpicker('refresh');
  
  //verify parameters
  if (!selected_method.hasOwnProperty("parameters")) {
    console.log("Method: %o has no parameters", selected_method);
    return;
  }
  else if (!VerifyMethodParmeters(selected_method)) {
    //return;
  } else {
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
          var sliderDiv = $("<input id='"+EscapeID(param.name+"_"+param.ptype)+"' data-slider-id='ex1Slider' type='text' data-slider-min=" + param.minval + " data-slider-max=" + param.maxval + " data-slider-step=" + param.step + " data-slider-value=" + param.pval + " />");
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
          var boxDiv = $("<input id='"+EscapeID(param.name+"_"+param.ptype)+"' type='checkbox' " + (param.pval ? "checked" : "") + " data-toggle='toggle' data-size='small'>");
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
          newdiv.append(param.name);
          var igroup = $("<div class='input-group'></div>");
          var input = $("<input type='text class='form-control' style='max-width:80%;' value='"+param.pval+"' id='"+EscapeID(param.name+"_"+param.ptype)+"'>");
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
          var boxDiv = $("<a id='"+EscapeID(param.name+"_"+param.ptype)+"' class='btn btn-sm btn-success' href='#' role='button'>" + param.name + "</a>");
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
  }
  Wipechannels();
  pdiv.hide().show(0);
  //Readchannels();
  resize();
  selected_method.SetData(graphdata);
  if (graphdata !== null) {
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
//########    save button
//######################################################################

$('#savebtn').click(function () {
  var pngscale = parseInt($("#imagescalepicker").val().slice(0, 1));
  //cnvert svg to base64 text
  var html = d3.select("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .node().parentNode.innerHTML;
  var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);
  
  //setup canvas
  var w = $("#chart").width();
  var h = $("#chart").height();
  $("#canvas").width(w * pngscale).height(h * pngscale);
  var canvas = document.querySelector("#canvas");
  var context = canvas.getContext("2d");
  context.canvas.width = w * pngscale;
  context.canvas.height = h * pngscale;

  var image = new Image;
  image.src = imgsrc;
  image.onload = function () {
    //draw to canvas
    context.drawImage(image, 0, 0, w * pngscale, h * pngscale);
    //convert  to png
    var canvasdata = canvas.toDataURL("image/png");
    //download
    var a = document.createElement("a");
    a.download = pngscale + "x_"+graphdata.displayName + "_" + selected_method.name + "_" + selectedDate.toString() + ".png";
    a.href = canvasdata;
    a.click();
  };
});

//######################################################################
//########    File Uploader
//######################################################################

InitUploadUi();

function InitUploadUi() {
  // Check for the various File API support.
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    alert('The File APIs are not fully supported in this browser.');
    return;
  }
  $('#file').change(OnUploadFile);
}

var customDataToParse = undefined;

function OnUploadFile(){
  $("#dataparsebtn").attr("disabled", "disabled");
  $("#dataloadbtn").attr("disabled", "disabled");
  $("#dataParseResults").html("");
  customDataToParse = undefined;

  if(this.files.length != 1 || this.files[0] === undefined){
    console.error("Error reading file");
    $("#filelist").html("Error reading file");
    return;
  }
  var f = this.files[0];
  if(f.type != ""){
    console.error("File doesn't look like json! "+(f.type || 'n/a'));
    $("#filelist").html("File doesn't look like json! "+(f.type || 'n/a'));
    return;
  }

  var infoString = '<li><strong>' + f.name + '</strong> ' + f.size + ' bytes, last modified: ' +
    (f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a') + '</li>';
  console.log(f);
  $("#filelist").html(infoString);

  var reader = new FileReader();
  reader.onload = (function (theFile) {
    return function (e) {
      if (IsJson(e.target.result)) {
        $("#dataParseResults").html("Json file Loaded");
        customDataToParse = JSON.parse(e.target.result);
        customDataToParse.url = f.name;
        customDataToParse.displayName = "Custom: " + f.name;
        console.log(customDataToParse);
        $("#dataparsebtn").removeAttr("disabled");
      } else {
        console.error("Error reading Json file");
        $("#filelist").append("<br>Error reading Json file");
      }
    };
  })(f);

  reader.readAsText(f);
}
var dataParseOutputTemplate = $("#dataParseResults").html();
var dataParsetemplate = Handlebars.compile(dataParseOutputTemplate);
$("#dataParseResults").html("");

$('#dataparsebtn').click(function () {
  console.log("custom parsing");
  $("#dataloadbtn").attr("disabled", "disabled");
  $("#dataParseResults").html("");
  if (customDataToParse === undefined) {
    return;
  }
  if (ParseData(customDataToParse)) {
    $("#dataloadbtn").removeAttr("disabled");
    var rendered = dataParsetemplate(customDataToParse);
    $("#dataParseResults").html(rendered);
  }
});

$('#dataloadbtn').click(function () {
  if (customDataToParse === undefined) {
    return;
  }
  loadedData.push(customDataToParse);
  stockData.push({ name: customDataToParse.displayName, url: customDataToParse.url });
  UpdateDataPicker();
});

//######################################################################
//########    Settings Save/load
//######################################################################
var stockSettings = ["settings/blank.json","settings/blankDark.json"];
var loadedSettings = [];

for (i = 0; i < stockSettings.length; i++) {
  d3.json(stockSettings[i], function (error, newData) {
    if (error) {
      console.error(error);
    } else {
      loadedSettings.push(newData);
      UpdateSettingsPicker();
    }
  });
}
  

function UpdateSettingsPicker(){
  for (i = 0; i < loadedSettings.length; i++) {
    if( $("#settingspicker").find(":contains('"+loadedSettings[i].name+"')" ).length == 0){
      $("#settingspicker").append("<option>" + loadedSettings[i].name + "</option>");
    }
  }
  $("#settingspicker").selectpicker('refresh');
 $("#settingspicker").selectpicker('val','');
}

$('#saveSettingsbtn').click(SaveSettings);
var saveout;
function SaveSettings() {
  console.log("saving settings");
  var out = {};
  out.name = "output"+loadedSettings.length;
  //Interface settings
  out.interface = {};
  out.interface.testMode = false;
  out.interface.displayMode = $("#dspmodepicker").val();
  out.interface.colourTheme = $("#colschmepicker").val();
 
  //Slider Settings
  out.slider = {};
  out.slider.visible = true;
  out.slider.enabled = true;
  out.slider.position = 2;
 
  //Controll Settings
  out.control = {};
  out.control.method = (Exists(selected_method) ? null :selected_method.name);
  out.control.data = (Exists(graphdata) ? null :graphdata.displayName);
  out.control.dateRange = false;
  out.control.animatedSlider = false;
  out.control.fullscreen = isFullscreen;
 

  if (selected_method !== undefined && selected_method !== null) {
    out.method ={};
    //Method parameters
    out.method.parameters = [];
    selected_method.parameters.forEach(function (c) {
       out.method.parameters.push({ name: c.name, pval: c.pval});
    }, this);
    //Method channels  
    out.method.nodeChannels = [];
    selected_method.nodeChannels.forEach(function (c) {
      if (c.inUse) {
        out.method.nodeChannels.push({ name: c.name, inUse: true, dataParam: c.dataParam });
      } else {
        out.method.nodeChannels.push({ name: c.name, inUse: false });
      }
    }, this);
    out.method.linkChannels = [];
    selected_method.linkChannels.forEach(function (c) {
      if (c.inUse) {
        out.method.linkChannels.push({ name: c.name, inUse: true, dataParam: c.dataParam });
      } else {
        out.method.linkChannels.push({ name: c.name, inUse: false });
      }
    }, this);
  }
  console.log(JSON.stringify(out));
  //SaveJsonToFile(JSON.stringify(out),"settings.json");
  saveout = out;
  loadedSettings.push(out);
  UpdateSettingsPicker();
}

$("#settingspicker").on('change', function () {
  LoadSettings($("#settingspicker").val());
});
function LoadSettings(s) {
  if(typeof(s) == "string"){
    if(s == "Data Settings"){
      s = graphdata.settings;
    }else{
    for (var i = 0; i < loadedSettings.length; i++) {
      if(loadedSettings[i].name == s){
        s = loadedSettings[i];
        break;
      }
    }}
  }
  console.log("Load Settings, %o",s);
  //Load interface
  if (Exists(s.interface)) {
    if (Exists(s.interface.testMode)) { }
    if (Exists(s.interface.displayMode)) {SetDisplayMode(s.interface.displayMode); }
    if (Exists(s.interface.colourTheme)) { selected_method.SetColorTheme(s.interface.colourTheme); }
  }
  //control
  if (Exists(s.control)) {
    if (Exists(s.control.method)) { changeMethod(s.control.method); }
    if (Exists(s.control.data)) { ChangeData(s.control.data); }
    if (Exists(s.control.dateRange)) { $('#rangetoggle').bootstrapToggle(s.control.dateRange ? 'on' : 'off'); }
    if (Exists(s.control.animatedSlider)) { $('#rangetoggle').bootstrapToggle(s.control.animatedSlider ? 'on' : 'off'); }
    if (Exists(s.control.fullscreen)) { $('#rangetoggle').bootstrapToggle(s.control.fullscreen ? 'on' : 'off'); }
  }
  //slider
  if (Exists(s.slider)) {
    if (Exists(s.slider.visible)) { SetSliderVisibility(s.slider.visible); }
    if (Exists(s.slider.enabled)) { SetSliderEnabled(s.slider.enabled); }
    if (Exists(s.slider.position)) { }
  }
  //Method
  if (Exists(s.method)) {
      if (Exists(s.method.parameters) && s.method.parameters.length > 0) {
      for (var i = 0; i < s.method.parameters.length; i++) {
        var p = s.method.parameters[i];
        //find the actual 
        var pa = $.grep(selected_method.parameters, function(e){return e.name == p.name});
        if( pa.length > 0){
          pa = pa[0];
          //do we need to set it again?
          if (pa.pval != p.pval){
            //yes, this gets awkward as we need to know the type of attribute
            //Todo make this a function
            if(pa.ptype == "checkbox"){
               var e = $("#"+EscapeID(pa.name+"_checkbox"));
               e.bootstrapToggle(p.pval ? 'on' : 'off');
            }else if(pa.ptype == "textbox"){
              var e = $("#"+EscapeID(pa.name+"_textbox"));
              e.val(p.pval);
            }else if(pa.ptype == "slider"){
              //Todo
            }
            pa.pval = p.pval;
          } 
        } 
      }
      selected_method.ParamChanged();
    }
    if (Exists(s.method.nodeChannels) && s.method.nodeChannels.length > 0) {
      for (var i = 0; i < s.method.nodeChannels.length; i++) {
        var nc = s.method.nodeChannels[i];
        if (nc.inUse) {
          SetChannel("node", nc.dataParam, nc.name);
        }
      }
    }
    if (Exists(s.method.linkChannels) && s.method.linkChannels.length > 0) {
      for (var i = 0; i < s.method.linkChannels.length; i++) {
        var lc = s.method.linkChannels[i];
        if (lc.inUse) {
          SetChannel("link", lc.dataParam, lc.name);
        }
      }
    }
  }
}

//######################################################################
//########    DisplayMode
//######################################################################

$("#dspmodepicker").on('change', function () {
  SetDisplayMode($("#dspmodepicker").val());
});

var chartBoxLeft = $("#chartBoxLeft");
var chartBoxRight = $("#chartBoxRight");

SetDisplayMode(2);
var displayMode;

function SetDisplayMode(mode) {
  if (typeof (mode) == "string") {
    if (mode == "Split") {
      mode = 2;
    } else if (mode == "Single") {
      mode = 1;
    } else {
      mode = 0;
    }
  }
  if (displayMode === mode) { return; }
  switch (mode) {
    case 0:
      $("#dspmodepicker").val("Single - Wide");
      $("#dspmodepicker").selectpicker('refresh');
      chartBoxLeft.addClass("box");
      chartBoxLeft.removeClass("box2");
      chartBoxRight.hide();
      break;
    case 1:
      $("#dspmodepicker").val("Single");
      $("#dspmodepicker").selectpicker('refresh');
      chartBoxLeft.addClass("box2");
      chartBoxLeft.removeClass("box");
      chartBoxRight.hide();
      break;
    case 2:
      $("#dspmodepicker").val("Split");
      $("#dspmodepicker").selectpicker('refresh');
      chartBoxLeft.addClass("box2");
      chartBoxLeft.removeClass("box");
      chartBoxRight.show();
      break;
    default:
      break;
  }
  displayMode = mode;
  resize();
  if(Exists(selected_method)){
    checkOptionalChannels(selected_method.nodeChannels,"node");
    checkOptionalChannels(selected_method.linkChannels,"link");
  }
};

//######################################################################
//########    Junk
//######################################################################
var isFullscreen = false;
$('#fullscreentoggle').change(function () {
  var val = $(this).prop('checked');
  if (val) {
    isFullscreen = true;
    $('.container.superwide').css("max-width","90%");
  } else {
    isFullscreen = false;
    $('.container.superwide').css("max-width","1094px");
  }
  resize();
});
  
function IsJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};
function Exists(i){
  return (i !== undefined && i !== null);
}

//######################################################################
//########   Testing
//######################################################################
var stockTests = ["tests/test1.json", "tests/test2.json"];
var loadedTests = [];
var stockExperiments = ["experiments/exp1.json", "experiments/exp2.json"];
var loadedExperiments = [];
var selectedTest;
var selectedExperiment;
var expMode = false;

var questionOptionsHtmlTemplate = $("#questionOptionsForm").html();
var questionOptionsTemplate = Handlebars.compile(questionOptionsHtmlTemplate);
$("#questionOptionsForm").html("");

$('#startTestbtn').click(EnterTestMode);
$('#modalTestQuitBtn').click(ExitTestMode);
$('#modalTestQuitBtn2').click(ExitTestMode);
$("#expSelectorDiv").hide();
$('#modalTestStartBtn').click(
  function(){
    if(CheckforStart()){  
      //Let's a go!
      $("#infoModal").modal("hide");
    }
  }
);
$('#testReadyBtn').click(StartTest);
$('#testSubmitBtn').click(FinishTest);


$('#expModeToggle').change(function() {
  if($(this).prop('checked')){
    expMode = true;
    selectedTest = undefined;
    $("#testSelectorDiv").hide();
    $("#expSelectorDiv").show();
  }else{
    expMode = false;
    selectedExperiment = undefined;
    $("#testSelectorDiv").show();
    $("#expSelectorDiv").hide();
  }
});

$("#testSelector").on('change', function () {
  selectedTest = $(this).val();
  LoadTest(selectedTest);
});
$("#expSelector").on('change', function () {
  selectedExperiment = $(this).val();
  CleanExperiment(selectedExperiment);
  LoadTest(GetNextTest(selectedExperiment));
});

//load stock tests and experiments
for (var i = 0; i < stockTests.length; i++) {
  d3.json(stockTests[i], function (error, newData) {
    if (error) {
      console.error("error loading test: ",error);
    } else {
      loadedTests.push(newData);
      UpdateTestSelector();
    }
  });
}

function UpdateTestSelector() {
  //remove all
  $("#testSelector").empty();
  for (i = 0; i < loadedTests.length; i++) {
    $("#testSelector").append("<option>" + loadedTests[i].name + "</option>");
  }
  $("#testSelector").selectpicker('refresh');
  $("#testSelector").selectpicker('val', '');
}
for (var i = 0; i < stockExperiments.length; i++) {
  d3.json(stockExperiments[i], function (error, newData) {
    if (error) {
      console.error(error);
    } else {
      loadedExperiments.push(newData);
      UpdateExpSelector();
    }
  });
}
function UpdateExpSelector() {
  //remove all
  $("#expSelector").empty();
  for (i = 0; i < loadedExperiments.length; i++) {
    $("#expSelector").append("<option>" + loadedExperiments[i].name + "</option>");
  }
  $("#expSelector").selectpicker('refresh');
  $("#expSelector").selectpicker('val', '');
}
var inTestMode = false;
ExitTestMode();
function ExitTestMode() {
  inTestmode = false;
  console.warn("exiting Test Mode");
  $('#navcontainer').show();
  $('body').css('padding-top', '70px');
  $('#libCredits').show();
  $('#channelDiv').show();
  $('#optionsDiv').show();
  $("#infoModal").modal("hide");
  $("#testResultsModal").modal("hide");
  $('#questionDiv').hide();
  $("svg").attr('visibility','visible');
  loadedTest = undefined;
   loadedExperiments.forEach(CleanExperiment);
  loadedTests.forEach(CleanTest);
};


function EnterTestMode() {
  inTestMode = true;
  testLoaded = false
  expMode = false;
  loadedTest = undefined;
  console.warn("Entering Test Mode");
  $('#navcontainer').hide();
  $('body').css('padding-top', '0');
  $('#libCredits').hide();
  $('#channelDiv').hide();
  $('#optionsDiv').hide();
  //
  $("#infoModal").modal({keyboard: false,backdrop: "static"});
  $('#questionDiv').show();
  $('#questionText').html("");
  //$('#questionOptions').html("");
  $("#testReadyBtn").attr("disabled",true);
  $("#testSubmitBtn").attr("disabled",true);
  //
  $("#testInputID").val(Math.random().toString(36).slice(2,-1));
  $("#testInput1").val("");
  $("#testInput2").val("");
  $("#testSelector").selectpicker("val","");
  $("#expSelector").selectpicker("val","");
  $('#expModeToggle').bootstrapToggle('off');
  //
  loadedExperiments.forEach(CleanExperiment);
  loadedTests.forEach(CleanTest);
};

function CheckforStart(){
  $("#infomodalError").html("Please select test options");
  if($("#testInput1").val() == ""){
     $("#infomodalError").html("Please enter a Value for Input 1");
    return;
  }
  if(expMode && selectedExperiment == undefined){
     $("#infomodalError").html("Please select an experiment");
    return;
  }
  if(!expMode && selectedTest == undefined){
     $("#infomodalError").html("Please select a Test");
    return;
  }
  if(!testLoaded){
     $("#infomodalError").html("Test Loading...");
    return false;
  }
  return true;
}

function CleanExperiment(exp) {
  if (typeof (exp) == "string") {
    for (var i = 0; i < loadedExperiments.length; i++) {
      if (loadedExperiments[i].name == exp) {
        exp = loadedExperiments[i];
        break;
      }
    }
  }
  exp.currenPos = 0;
  exp.done = [];
}
function CleanTest(t) {
     if(typeof(t) == "string"){
    for (var i = 0; i < loadedTests.length; i++) {
      if(loadedTests[i].name == t){
        t = loadedTests[i];
        break;
      } 
    }
  }
  t.reponce = [];
  t.startTime = 0;
  t.endTime = 0;
}

var loadedExp;
function GetNextTest(exp){
  console.log("get next test %o",exp);
   if(typeof(exp) == "string"){
    for (var i = 0; i < loadedExperiments.length; i++) {
      if(loadedExperiments[i].name == exp){
        exp = loadedExperiments[i];
        loadedExp = exp;
        break;
      } 
    }
  }
  if(!Exists(exp.currentPos)){
    exp.currentPos = 0;
  }
  if(exp.currentPos ==  exp.order.length){
    console.log("experiment complete!");
    return null;
  }
  if(!Exists(exp.done)){
    exp.done = [];
  }
  console.log("get next test %o, %o",exp.done,exp.currentPos);
  var current = exp.order[exp.currentPos];
  if($.isArray(current)){
    //random select.
    var a = current.slice(0);
    //remove done
    for (var index = 0; index < a.length; index++) {
      var e = a[index];
      if($.inArray(e,exp.done)){
       a.splice(index, 1);
       index--;
      }
    }
    if(a.length > 0){
      current = a[Math.round(Math.random() * (a.length - 1))];
    }else{
      exp.currentPos++;
      return GetNextTest(exp);
    }
  }else{
    //not a random select
    //but is it a repeat?
    console.log(current,exp.done);
    if($.inArray(current,exp.done) != -1){
      console.warn("%o has duplicate tests!",exp.name);
      exp.currentPos++;
      return GetNextTest(exp);
    }
  }
  exp.currentPos++;
  exp.done.push(current);
  return current;
}

var loadedTest;
var testLoaded = false;
function LoadTest(t){
  testLoaded = false;
    if(typeof(t) == "string"){
    for (var i = 0; i < loadedTests.length; i++) {
      if(loadedTests[i].name == t){
        t = loadedTests[i];
        break;
      } 
    }
  }
  console.log("Loading test %o",t.name);
  LoadSettings(t.settings);
  //Hide graph
  $("svg").attr('visibility','hidden');
  //load the question text
  $("#questionText").html(t.questionText);
  //load question answer elements
  var qdiv = $("#questionOptionsForm");
  qdiv.empty();
  if(Exists(t.questionInputs) && t.questionInputs.length > 0){
    var qq = {num:[],text:[]};
    for (var index = 0; index < t.questionInputs.length; index++) {
      var q = t.questionInputs[index];
      if(q.type == "TextBox"){
        q.id = (index+"_test_TextBox_q");
        qq.text.push(q);
      }else if(q.type == "NumberBox"){
        q.id = (index+"_test_NumberBox_q");
        qq.num.push(q);
      }else{
        console.error("Test %o, has unrecognised Input type: %o",t.name,q.type);
      }
    }
    var rendered = questionOptionsTemplate(qq);
    qdiv.html(rendered);
    $("[id$=_q]","#questionOptionsForm").attr("disabled",true);
  }
  
  //highlight selcted nodes if there are any
  if(Exists(t.highlightedNodes) && t.highlightedNodes.length > 0){
    //Todo
  }
  
  //enable Ready btn
  $("#testReadyBtn").attr("disabled",false);
  $("#testSubmitBtn").attr("disabled",true);
  testLoaded = true;
  loadedTest = t;
  CheckforStart();
}

function StartTest(){
  $("#testReadyBtn").attr("disabled",true);
  $("#testSubmitBtn").attr("disabled",false);
  $("svg").attr('visibility','visible');
  $("[id$=_q]","#questionOptionsForm").attr("disabled",false);
  loadedTest.startTime = new Date();
}

function FinishTest(){
  var t = loadedTest;
  t.endTime = new Date();
  console.info("finished test %o, time: %o",t.name,MillisToTime(t.endTime - t.startTime));
  // Grab repsonces
  t.responce = [];
  var qs =$("[id$=_q]","#questionOptionsForm");
  var ql =$("label","#questionOptionsForm");
  for (var i = 0; i < qs.length; i++) {
    t.responce.push({input:ql.eq(i).html(),responce:EscapeHtml(qs.eq(i).val())});
  }
  //
  //are we in expirement mode?
  if(expMode){
    t = GetNextTest(loadedExp);
    if(t == null){
      FinishExperiment();
      return;
    }
    LoadTest(t);
  }else{
    FinishExperiment();
  }
}

function GetTest(t){
    if(typeof(t) == "string"){
    for (var i = 0; i < loadedTests.length; i++) {
      if(loadedTests[i].name == t){
        return loadedTests[i];
      } 
    }
  }
  return t;
}

function FinishExperiment() {
  //show results modal
  $("#testResultsModal").modal({ keyboard: false, backdrop: "static" });
  var x = "";
  x += "Id: " + $("#testInputID").val() + "<br>";
  x += "Input 1: " + $("#testInput1").val() + "<br>";
  x += "Input 2: " + $("#testInput2").val() + "<br>";
  var t;
  var results = { experimentmode: expMode, id: $("#testInputID").val(), input1: $("#testInput1").val(), input2: $("#testInput2").val(), tests: [] };
  if (expMode) {
    for (var index = 0; index < loadedExp.done.length; index++) {
      t = GetTest(loadedExp.done[index]);
      results.tests.push({ name: t.name, responces: t.responce, start: t.startTime, end: t.endTime });
      x += t.name + "<br>" + JSON.stringify(t.responce).replace(/},{/g, "<br>") + "<br> Time: " + MillisToTime(t.endTime - t.startTime) + "<br><br>";
    }
  } else {
    t = loadedTest;
    results.tests.push({ name: t.name, responces: t.responce, start: t.startTime, end: t.endTime });
    x += t.name + "<br>" + JSON.stringify(t.responce).replace(/},{/g, "<br>") + "<br> Time: " + MillisToTime(t.endTime - t.startTime) + "<br><br>";
  }
  HandleResults(results);
  $("#results").html(x);
}

var lastRes;
function HandleResults(res) {
  lastRes = res;
  var name = res.id + "_" + ((new Date).toUTCString()).replace(/\s+|:|,/g, '_') + "_results.json";
  SaveJsonToFile(JSON.stringify(res), name);
}

function SaveJsonToFile(j, filename) {
  var file = 'data:text/json;charset=utf-8;base64,' + btoa(j);
  var a = document.createElement("a");
  a.download = filename;
  a.href = file;
  a.click();
}