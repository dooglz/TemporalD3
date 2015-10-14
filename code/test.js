
$(window).resize(Resize);
$(window).keypress(function (event) {
  if (event.keyCode == 96) {
    Reset();
  }
});

//Jquery selectors
var testSetupDiv = $("#testSetupDiv");
var questionDiv = $("#questionDiv");
var chartsDiv = $("#chartsDiv");
var LeftGraphHeadder = $('#LeftGraphHeadder');
var CenterGraphHeadder = $('#CenterGraphHeadder');
var RightGraphHeadder = $('#RightGraphHeadder');
var questionOptionsHtmlTemplate = $("#questionOptionsForm").html();
var questionOptionsTemplate = Handlebars.compile(questionOptionsHtmlTemplate);
$("#questionOptionsForm").html("");
var questionLegendHtmlTemplate = $("#questionKeyDiv").html();
var questionLegendTemplate = Handlebars.compile(questionLegendHtmlTemplate);
$("#questionKeyDiv").html("");
$('#testReadyBtn').click(StartTest);
$('#testSubmitBtn').click(FinishTest);

//important globals
var expMode = false;
var loadedTests = [];
var loadedExperiments = [];
var loadedData = [];
var loadedExp;
var selected_method;
var m_static;
var m_simple;

var stockData = [{ name: "Les Miserables", url: "data/miserables.json" },
  { name: "Napier Publications", url: "data/napierPublications.json" },
  { name: "studentsClust-100-10", url: "data/studentsClust-100-10.json" },
  { name: "studentsClust-100-11", url: "data/studentsClust-100-11.json" },
  { name: "studentsClust-100-12", url: "data/studentsClust-100-12.json" },
  { name: "studentsClust-100-12a", url: "data/studentsClust-100-12a.json" },
  { name: "studentsClust-101-11-1", url: "data/studentsClust-101-11-1.json" },
  { name: "studentsClust-101-11", url: "data/studentsClust-101-11.json" },
  { name: "studentsClust-101-11int", url: "data/studentsClust-101-11int.json" },
  { name: "studentsClust-101-5-1", url: "data/studentsClust-101-5-1.json" },
  { name: "studentsClust-60-4", url: "data/studentsClust-60-4.json" },
  { name: "studentsClust-80-4", url: "data/studentsClust-80-4.json" },
  { name: "studentsFabClust-70-6-1", url: "data/studentsFabClust-70-6-1.json" },
  { name: "studentsFabClust-75-6-1", url: "data/studentsFabClust-75-6-1.json" }
];
var stockTests = ["tests/test1.json", "tests/test2.json", "tests/Training1a.json", "tests/Training1b.json",
  "tests/Training2a.json", "tests/Training2b.json",
  "tests/Training3a.json", "tests/Training3b.json",
  "tests/Insight1a.json", "tests/Insight2a.json",
  "tests/Insight3a.json", "tests/Insight4a.json",
  "tests/Task1a.json", "tests/Task1b.json",
  "tests/Task2a.json", "tests/Task2b.json",
  "tests/Task3a.json", "tests/Task3b.json",
  "tests/Task4a.json", "tests/Task4b.json"
];
var stockExperiments = ["experiments/exp1.json", "experiments/exp2.json", "experiments/mainA.json", "experiments/mainb.json"];

var selectedTest;
var selectedExperiment;
var testLoaded = false;
var loadcounter = 0;
var graphdata;
function LoadStatus() {
  loadcounter--;
  if (loadcounter < 1) {
    Reset();
  }
}
function Load() {

  for (var i = 0; i < stockExperiments.length; i++) {
    loadcounter++;
    d3.json(stockExperiments[i], function (error, newData) {
      if (error) {
        console.error(error);
      } else {
        loadedExperiments.push(newData);
      }
      LoadStatus();
    });
  }
  for (var i = 0; i < stockTests.length; i++) {
    loadcounter++;
    d3.json(stockTests[i], function (error, newData) {
      if (error) {
        console.error("error loading test: ", error);
      } else {
        loadedTests.push(newData);
      }
      LoadStatus();
    });
  }
  for (i = 0; i < stockData.length; i++) {
    loadcounter++;
    (function (i) {
      var url = stockData[i].url;
      d3.json(url, function (error, newData) {
        if (error) {
          console.error(error);
        } else {
          console.log("Loaded", url);
          newData.url = url;
          newData.displayName = stockData[i].name;
          if (ParseData(newData)) {
            loadedData.push(newData);
          } else {
            window.alert("Parse error!");
          }
        }
        LoadStatus();
      });
    })(i);
  }

}

function Reset() {
  LeftGraphHeadder.html("");
  CenterGraphHeadder.html("");
  RightGraphHeadder.html("");
  testSetupDiv.show();
  questionDiv.hide();
  chartsDiv.hide();
  $("#testInputID").val(Math.random().toString(36).slice(2, -1));
  $("#testInput1").val("foo");
  $("#testInput2").val("bar");
  $("#infomodalError").html("");
  $("#testSelector").selectpicker("val", "");
  $("#expSelector").selectpicker("val", "");
  $('#expModeToggle').bootstrapToggle('off');
  $("#expSelectorDiv").hide();
  expMode = false;
  //
  $("#testSelector").empty();
  for (i = 0; i < loadedTests.length; i++) {
    $("#testSelector").append("<option>" + loadedTests[i].name + "</option>");
  }
  $("#testSelector").selectpicker('refresh');
  $("#testSelector").selectpicker('val', '');
  //
  $("#expSelector").empty();
  for (i = 0; i < loadedExperiments.length; i++) {
    $("#expSelector").append("<option>" + loadedExperiments[i].name + "</option>");
  }
  $("#expSelector").selectpicker('refresh');
  $("#expSelector").selectpicker('val', '');

  selectedTest = "";
  selectedExperiment = "";
  testLoaded = false;

  m_static = new Method_Static();
  m_simple = new Method_Simple();
  selected_method = m_simple;
}

$('#expModeToggle').change(function () {
  if ($(this).prop('checked')) {
    expMode = true;
    selectedTest = undefined;
    $("#testSelectorDiv").hide();
    $("#expSelectorDiv").show();
  } else {
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

$('#modalTestStartBtn').click(
  function () {
    if (CheckforStart()) {
      BeginExp();
    }
  }
  );

function CheckforStart() {
  if ($("#testInput1").val() == "") {
    $("#infomodalError").html("Please enter a Value for Input 1");
    return false;
  }
  if ($("#testInput2").val() == "") {
    $("#infomodalError").html("Please enter a Value for Input 2");
    return false;
  }
  if (expMode && selectedExperiment == undefined) {
    $("#infomodalError").html("Please select an experiment");
    return false;
  }
  if (!expMode && selectedTest == undefined) {
    $("#infomodalError").html("Please select a Test");
    return false;
  }
  if (!testLoaded) {
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
var displayMode;
var chartBoxLeft = $("#chartBoxLeft");
var chartBoxRight = $("#chartBoxRight");
SetDisplayMode(1);
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
  Resize();
};
function Resize() {
  if (displayMode == 1) {
    var a = Math.min($("#stopbox").width(), 648);
    $("#chartBoxLeft").width(a);
    $("#chartBoxLeft").height(a);
  } else if (displayMode == 2) {
    var a = Math.min($("#stopbox").width() * 0.5, 648);
    $("#chartBoxLeft").width(a);
    $("#chartBoxLeft").height(a);
    $("#chartBoxRight").width(a);
    $("#chartBoxRight").height(a);
    //    $("#stopbox").height(a);
  }
  canvasWidth = $('#chart').width();
  canvasHeight = $('#chart').height();
  if (Exists(selected_method)) {
    selected_method.Redraw(canvasWidth, canvasHeight);
  }
}

function GetNextTest(exp) {
  console.log("get next test %o", exp);
  if (typeof (exp) == "string") {
    for (var i = 0; i < loadedExperiments.length; i++) {
      if (loadedExperiments[i].name == exp) {
        exp = loadedExperiments[i];
        loadedExp = exp;
        break;
      }
    }
  }
  if (!Exists(exp.currentPos)) {
    exp.currentPos = 0;
  }
  if (exp.currentPos == exp.order.length) {
    console.log("experiment complete!");
    return null;
  }
  if (!Exists(exp.done)) {
    exp.done = [];
  }
  console.log("get next test %o, %o", exp.done, exp.currentPos);
  var current = exp.order[exp.currentPos];
  if ($.isArray(current)) {
    //random select.
    var a = current.slice(0);
    //remove done
    for (var index = 0; index < a.length; index++) {
      var e = a[index];
      if ($.inArray(e, exp.done)) {
        a.splice(index, 1);
        index--;
      }
    }
    if (a.length > 0) {
      current = a[Math.round(Math.random() * (a.length - 1))];
    } else {
      exp.currentPos++;
      return GetNextTest(exp);
    }
  } else {
    //not a random select, but is it a repeat?
    console.log(current, exp.done);
    if ($.inArray(current, exp.done) != -1) {
      console.warn("%o has duplicate tests!", exp.name);
      exp.currentPos++;
      return GetNextTest(exp);
    }
  }
  exp.currentPos++;
  exp.done.push(current);
  return current;
}

function LoadSettings(s) {
  if (typeof (s) == "string") {
    console.error("I have no idea man");
    return;
  }
  console.log("Load Settings, %o", s);
  //Load interface
  if (Exists(s.interface)) {
    if (Exists(s.interface.testMode)) { }
    if (Exists(s.interface.displayMode)) { SetDisplayMode(s.interface.displayMode); }
    if (Exists(s.interface.colourTheme)) { selected_method.SetColorTheme(s.interface.colourTheme); }
  }
  //control
  if (Exists(s.control)) {
    if (Exists(s.control.data)) { ChangeData(s.control.data); }
    // if (Exists(s.control.method)) { changeMethod(s.control.method); }
    //if (Exists(s.control.dateRange)) { $('#rangetoggle').bootstrapToggle(s.control.dateRange ? 'on' : 'off'); }
    //if (Exists(s.control.animatedSlider)) { $('#rangetoggle').bootstrapToggle(s.control.animatedSlider ? 'on' : 'off'); }
    //if (Exists(s.control.fullscreen)) { $('#rangetoggle').bootstrapToggle(s.control.fullscreen ? 'on' : 'off'); }
  }
  //Method
  if (Exists(s.method)) {
    if (Exists(s.method.parameters) && s.method.parameters.length > 0) {
      for (var i = 0; i < s.method.parameters.length; i++) {
        var p = s.method.parameters[i];
        //find the actual
        var pa = $.grep(selected_method.parameters, function (e) { return e.name == p.name });
        if (pa.length > 0) {
          pa = pa[0];
          //do we need to set it again?
          if (pa.pval != p.pval) {
            //yes, this gets awkward as we need to know the type of attribute
            //Todo make this a function
            if (pa.ptype == "checkbox") {
              var e = $("#" + EscapeID(pa.name + "_checkbox"));
              e.bootstrapToggle(p.pval ? 'on' : 'off');
            } else if (pa.ptype == "textbox") {
              var e = $("#" + EscapeID(pa.name + "_textbox"));
              e.val(p.pval);
            } else if (pa.ptype == "slider") {
              //Todo
            }
            pa.pval = p.pval;
          }
        }
      }
      selected_method.ParamChanged();
    }
      selected_method.Update();
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
  selected_method.Update();
}
function ChannelChange(atype, attribute, newChannel) {
   console.log("Data " + atype + " Attribute:'" + attribute + "' reassigned to " + atype + " channel: " + newChannel);
  var c = $.grep(atype == "node" ? selected_method.nodeChannels : selected_method.linkChannels, function (n, i) { return (n.name == newChannel) })[0];
  c.inUse = true;
  c.dataParam = attribute;
   selected_method.ChannelChanged();
  return;
  //fuck the rest of this noise
 
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


function SetChannel(atype, attribute, channelname) {
  ChannelChange(atype, attribute, channelname);
}


var loadedTest;

function LoadTest(t) {
  testLoaded = false;
  if (typeof (t) == "string") {
    t = $.grep(loadedTests, function (n, i) { return (n.name == t) })[0];
  }
  console.log("Loading test %o", t.name);
  LoadSettings(t.settings);
  //Hide graph
  $("svg").attr('visibility', 'hidden');
  //load the question text
  $("#questionText").html(t.questionText);
  //load question answer elements
  var qdiv = $("#questionOptionsForm");
  qdiv.empty();
  if (Exists(t.questionInputs) && t.questionInputs.length > 0) {
    var qq = { num: [], text: [] };
    for (var index = 0; index < t.questionInputs.length; index++) {
      var q = t.questionInputs[index];
      if (q.type == "TextBox") {
        q.id = (index + "_test_TextBox_q");
        qq.text.push(q);
      } else if (q.type == "NumberBox") {
        q.id = (index + "_test_NumberBox_q");
        qq.num.push(q);
      } else {
        console.error("Test %o, has unrecognised Input type: %o", t.name, q.type);
      }
    }
    var rendered = questionOptionsTemplate(qq);
    qdiv.html(rendered);
    $("[id$=_q]", "#questionOptionsForm").attr("disabled", true);
  }
  //load legened
  if (Exists(t.showKey) && t.showKey == true) {
    //  $("#questionKeyDiv").html(questionLegendTemplate(selected_method.GetChannelAssignments()));
  } else {
    $("#questionKeyDiv").html("");
  }
  //show headders
  if (Exists(t.CenterGraphHeadder) && t.CenterGraphHeadder != "") {
    $('#CenterGraphHeadder').html(t.CenterGraphHeadder);
  } else {
    $('#CenterGraphHeadder').html("");
  }
  if (Exists(t.LeftGraphHeadder) && t.LeftGraphHeadder != "") {
    $('#LeftGraphHeadder').html(t.LeftGraphHeadder);
  } else {
    $('#LeftGraphHeadder').html("");
  }
  if (Exists(t.RightGraphHeadder) && t.RightGraphHeadder != "") {
    $('#RightGraphHeadder').html(t.RightGraphHeadder);
  } else {
    $('#RightGraphHeadder').html("");
  }
  
  //enable/disable highlighting
  if (Exists(t.enableNodeHighlight) && t.enableNodeHighlight) {
    console.log("Enabeling Highlighting");
    //enable highlighting
    selected_method.EnableHighlighting(true);
  } else {
    console.log("disable Highlighting");
    //disable higlighting
    selected_method.EnableHighlighting(false);
  }
  //highlight selcted nodes if there are any
  selected_method.Highlight();
  if (Exists(t.highlightedNodes) && t.highlightedNodes.length > 0) {
    console.log("Highlighting:", t.highlightedNodes);
    selected_method.Highlight(t.highlightedNodes);
  }
  //enable Ready btn
  $("#testReadyBtn").attr("disabled", false);
  $("#testSubmitBtn").attr("disabled", true);
  testLoaded = true;
  loadedTest = t;
  CheckforStart();
}

function BeginExp() {
  testSetupDiv.hide();
  questionDiv.show();
  chartsDiv.show();
  Resize();
}
function StartTest() {
  $("#testReadyBtn").attr("disabled", true);
  $("#testSubmitBtn").attr("disabled", false);
  $("svg").attr('visibility', 'visible');
  $("[id$=_q]", "#questionOptionsForm").attr("disabled", false);
  loadedTest.startTime = new Date();
}

function FinishTest() {
  var t = loadedTest;
  t.endTime = new Date();
  console.info("finished test %o, time: %o", t.name, MillisToTime(t.endTime - t.startTime));
  // Grab repsonces
  t.responce = [];
  var qs = $("[id$=_q]", "#questionOptionsForm");
  var ql = $("label", "#questionOptionsForm");
  for (var i = 0; i < qs.length; i++) {
    t.responce.push({ input: ql.eq(i).html(), responce: EscapeHtml(qs.eq(i).val()) });
  }
  //also grab selected nodes
  if (Exists(t.enableNodeHighlight) && t.enableNodeHighlight) {
    var h = selected_method.GetHighlightedNodes();
    var ids = [];
    for (var i = 0; i < h.length; i++) {
      ids.push(h[i].index);
    }
    t.responce.push({ input: "hilightedNodes", responce: ids });
  }
  //
  //are we in expirement mode?
  if (expMode) {
    t = GetNextTest(loadedExp);
    if (t == null) {
      FinishExperiment();
      return;
    }
    LoadTest(t);
  } else {
    FinishExperiment();
  }
}


function ChangeData(dataName) {
  //loaded?
  console.log("changing Data to: " + dataName);
  var data = $.grep(loadedData, function (a) { return a.displayName == dataName })[0];
  if (Exists(data)) {
    graphdata = data;
    //alert the method
    if (Exists(selected_method)) {
      selected_method.SetData(null);
      selected_method.SetData(graphdata);
    }
    Update();
  } else {
    //no, load it
    var url = $.grep(stockData, function (a) { return a.name == dataName })[0].url;

    if (!Exists(url) || url == "") {
      console.error("Can't load custom url data yet :(");
      return;
    }
    console.log("Loading new Data ", dataName);
    d3.json(url, function (error, newData) {
      if (error) {
        console.error(error);
      } else {
        console.log("Loaded");
        newData.url = url;
        newData.displayName = dataName;
        if (ParseData(newData)) {
          loadedData.push(newData);
          ChangeData(dataName);
        } else {
          window.alert("Parse error!");
        }
      }
    });
  }
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

function GetTest(t) {
  if (typeof (t) == "string") {
    for (var i = 0; i < loadedTests.length; i++) {
      if (loadedTests[i].name == t) {
        return loadedTests[i];
      }
    }
  }
  return t;
}

function GetHighlightedNodes() {
  var a = [];
  graphdata.nodes.forEach(function (n) {
    if (n.highlight) {
      a.push(n);
    }
  }, this);
  return a;
}

function Update() {
}

function Exists(i) {
  return (i !== undefined && i !== null);
}

Load();
Reset();

///----- here be d3 stuff

