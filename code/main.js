/// <reference path="../typings/d3/d3.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>
//######################################################################
//########    Date slider (more complex than it looks)
//######################################################################
var startDate = new Date("2007");
var endDate = new Date("2016");
var selectedDate = new Date("2011");

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
    formatter: function(value) {
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
    formatter: function(value) {
        var dd = new Date(startDate.toUTCString());
        dd.setMonth(dd.getMonth() + value);
        return dd.toDateString().slice(4);
    },
}).on('slide', slided).data('slider');
dateSlider.setValue(48);

//######################################################################
//########    Main Update functions
//######################################################################

function Update() {
    //Do we have data?
    if (graphdata === undefined) {
        return;
    }
    
    selectedDate = new Date(startDate.toUTCString());
    selectedDate.setMonth(selectedDate.getMonth() + dateSlider.getValue());
    selected_method.SetData(graphdata);
    selected_method.SetDate(selectedDate);

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
var stockData = [{name:"Les Miserables",url:"graph-byyear.json"},{name:"data2",url:"graph-byyear.json"},{name:"Napier Publications",url:"../data/napierPublications.json"}];
var loadedData = [];
ChangeData("Les Miserables");
//dropdown selector ------------
$("#datapicker").html("");
for (i = 0; i < stockData.length; i++) {
    $("#datapicker").append("<option>" + stockData[i].name + "</option>");
}

$("#datapicker").on('change', function() {
    ChangeData($("#datapicker").val());
    Update();
});

function ChangeData(dataName) {
    //loaded?
    console.log("changing Data to: "+dataName);
    for (i = 0; i < loadedData.length; i++) {
        if(loadedData[i].name == dataName){
            //yep, set and bail.
            graphdata = loadedData[i].data;
            return;
        }
    }
    //no, load it
    var url = "";
    for (i = 0; i < stockData.length; i++) {
        if(stockData[i].name == dataName){
            url = stockData[i].url;
            break;
        }
    }
    if(url == ""){
        //this isn't stock data
        console.error("Can't load custom url data yet :(");
        return;
    }
    
      console.log("Loading Data");
        d3.json(url, function(error, graph) {
               graphdata = graph;
            if (error) {
                console.error(error);
            } else {
                console.log("Loaded");
                loadedData.push({name:dataName,data:graph,url:url});
                graphdata = graph;
                Update();
            }
        });
}

//######################################################################
//########    Method Picking, Validating, Loading
//######################################################################
var methods = [];
var m_simple = new method_simple();
methods.push(m_simple);
var selected_method;
changeMethod(m_simple);

//dropdown selector ------------
$("#methodpicker").html("");
for (i = 0; i < methods.length; i++) {
    $("#methodpicker").append("<option>" + methods[i].name + "</option>");
}
$("#methodpicker").on('change', function() {
    changeMethod($("#methodpicker").val());
});

function VerifyMethodParmeters(method) {
    var mustHaveParams = ["name", "ptype", "pval"];
    var acceptedParams = ["slider", "checkbox", "textbox"];

    for (var i in method.parameters) {
        var param = method.parameters[i];
        for (var j in mustHaveParams) {
            var str = mustHaveParams[j];
            if (!param.hasOwnProperty(str)) {
                console.error("Method '" + method.name + "', parameter '" + param.name + "', must have a '" + str + "' member!");
                return false;
            }
        }

        if ($.inArray(param.ptype, acceptedParams) == -1) {
            console.error("Method '" + method.name + "', Unkown parameter type : " + param.name + " - " + param.ptype);
        }

    }
    return true;
}

function changeMethod(methodName) {
    if (typeof(methodName) === "string") {
        var find = $.grep(methods, function(e) {
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
        console.log("Method: " + selected_method.name + " has no parameters");
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
                }(param);
                break;

            case "checkbox":
                var boxDiv = $("<input  id=" + param.name + " type='checkbox' " + (param.pval ? "checked" : "") + ">");
                newdiv.append(boxDiv).append("  " + param.name);
                ! function outer(pp, bb) {
                    boxDiv.change(function inner() {
                        pp.pval = bb.is(":checked");
                        selected_method.ParamChanged(pp);
                    });
                }(param, boxDiv);
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
                }(param, input);
                break;

            default:
                console.error("Unkown method parameter type : " + param.name + " - " + param.ptype);
                break;
        }
        pdiv.append(newdiv);
    }
    pdiv.hide().show(0);
}