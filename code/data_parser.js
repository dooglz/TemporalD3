/*along with the actual data in the json file
 link_keys:["an","array","of all the property names of a link"]
 node_keys:["an","array","of all the property names  of a node"]
 date_type: either "date","numeric","static"
 link_attributes_info {
    value:{type:"number",min_val:0,max_val:100,dynamic:false},
    name:{type:"string",count:20,values[],dynamic:false},
    birthday:{type:"date",min_val:0,max_val:100,dynamic:false},
  }
  node_attributes_info {
    same as link_attributes_info
  }
*/

function IsDate(datestring) {
  //checks to see if string begins with "yyyy-mm-dd", "yyyy-m-dd" and "01 < mm < 12"
  var dateRegEx = /^\d{4}-([1-9]|0\d|1[0-2])-([0-3][1-9]|[1-9])/;
  return ((dateRegEx.test(datestring)) && (new Date(datestring) !== "Invalid Date") && (!isNaN(new Date(datestring))));
}
function IsNumber(numberString) {
  //will return true on "1234","0.123","1234.1234" and "1234.1234f",
  var numberRegEx = /^(([0-9]+)||([0-9]+\.[0-9]+f?))$/;
  return ((numberRegEx.test(numberString)) && (!isNaN(parseFloat(numberString))));
}

function ProcessAttributesInfo(infoObj, keys, values) {
  var global_max_num;
  var global_min_num;
  var global_max_date;
  var global_min_date;
  for (var i in keys) {
    var attribute = keys[i];
    infoObj[attribute] = {};
    infoObj[attribute].name = attribute;
    var attributeInfo = infoObj[attribute];
    var sampleValue = values[0][attribute];
    var attributeType = typeof (sampleValue);

    if (attributeType == "string") {
      if (IsDate(sampleValue)) { attributeType = "date"; } else {
        if (IsNumber(sampleValue)) {
          console.warn("Data attribute:'%s' is a valid number, but is encoded with qoutes, treating as String", attribute);
        }
        //pure string
        attributeInfo.values = [];
        //we must find all values of this attribute so we can catagorize them
        var tempObj = {}
        for (var j in values) {
          var sval = values[j][attribute];
          if (tempObj.hasOwnProperty(sval)) {
            continue;
          }
          attributeInfo.values.push(sval);
          tempObj[sval] = 1;
        }
        attributeInfo.count = attributeInfo.values.length;
      }
    }

    if (attributeType == "number" || attributeType == "date") {
      var min_val = sampleValue;
      var max_val = sampleValue;
     
      if (attributeType == "date") {
        if(global_max_date === undefined){
          global_max_date = max_val;
          global_min_date = min_val;
        }
        min_val = new Date(min_val).valueOf();
        max_val = new Date(max_val).valueOf();
      }else if(global_max_num === undefined){
        global_max_num = max_val;
        global_min_num = min_val;
      }
      for (var j in values) {
        //TODO: parse cahanging values!
        var nval = values[j][attribute];
        if (attributeType == "date") {
          nval = new Date(nval).valueOf();
        }
        max_val = Math.max(max_val, nval);
        min_val = Math.min(min_val, nval);
      }
      if (attributeType == "date") {
        min_val = new Date(min_val);
        max_val = new Date(max_val);
        global_max_date = max_val;
        global_min_date = min_val;
      }else{
        global_max_num = max_val;
        global_min_num = min_val;
      }
      attributeInfo.min_val = min_val;
      attributeInfo.max_val = max_val;
    }
    // console.log(keys[i] + " - " + sampleValue + " - " + attributeType);
    // console.log(attributeInfo);
    attributeInfo.type = attributeType;
    attributeInfo.dynamic = false;
  }
  console.log(global_max_num,global_min_num,global_max_date,global_min_date);
  infoObj.global_max_num = global_max_num;
  infoObj.global_min_num =global_min_num;
  infoObj.global_max_date = global_max_date;
  infoObj.global_min_date = global_min_date;
}


function FillAttributeInfo(infoObj, attribute, values) {
  //value:{type:"number",min_val:0,max_val:100,dynamic:false},
  infoObj[attribute.name] = {};
  var attributeType = attribute.type;
  if (attributeType == "numeric") { attributeType = "number" };
  infoObj[attribute.name].name = attribute.name;
  infoObj[attribute.name].type = attributeType;
  infoObj[attribute.name].dynamic = false;

  if (attributeType == "string") {
    if (IsNumber(sampleValue)) {
      console.warn("Data attribute:'%s' is a valid number, but is encoded with qoutes, treating as String", attribute);
    }
    //pure string
    infoObj[attribute.name].values = [];
    //we must find all values of this attribute so we can catagorize them
    for (var j in values) {
      //find the attribute in a specific node/links attribute list
      var specificAttribute = ($.grep(values[j].attributes, function (e) { return e.name == attribute.name; }))[0];
      if (specificStringAttribute === undefined) {
        console.error("Error %o, %o", attribute, values[j]);
      }
      //add the value to our list of values. //todo make this a map, to remove dupes
      if (specificStringAttribute.value != undefined) {
        infoObj[attribute.name].values.push(specificStringAttribute.value);
      } else if (specificStringAttribute.values != undefined) {
        infoObj[attribute.name].dynamic = true;
        //the value changes over time, add every different value.
        for (var k = 0; k < specificStringAttribute.values.length; k++) {
          infoObj[attribute.name].values.push(specificStringAttribute.values[k].value);
        }
      } else {
        console.error("Attribute has no values %o, %o", attribute, specificAttribute);
      }
    }
    infoObj[attribute.name].count = infoObj[attribute.name].values.length;
  }

  if (attributeType == "number" || attributeType == "date") {
    var min_val = Infinity;
    var max_val = -Infinity;

    var nval;
    for (var j in values) {
      //find the attribute in a specific node/links attribute list
      var specificAttribute = ($.grep(values[j].attributes, function (e) { return e.name == attribute.name; }))[0];
      if (specificAttribute === undefined) {
        console.error("Error %o, %o", attribute, values[j]);
      }
      //compare with min max
      if (specificAttribute.value != undefined) {
        nval = specificAttribute.value;
        if (attributeType == "date") {
          nval = new Date(nval).valueOf();
        }
        max_val = Math.max(max_val, nval);
        min_val = Math.min(min_val, nval);
      } else if (specificAttribute.values != undefined) {
        //the value changes ver time, add every different value.
        infoObj[attribute.name].dynamic = true;
        for (var k = 0; k < specificAttribute.values.length; k++) {
          nval = specificAttribute.values[k].value;
          if (attributeType == "date") {
            nval = new Date(nval).valueOf();
          }
          max_val = Math.max(max_val, nval);
          min_val = Math.min(min_val, nval);
        }
      } else {
        console.error("Attribute has no values %o, %o", attribute, specificAttribute);
      }
    }
    if (attributeType == "date") {
      min_val = new Date(min_val);
      max_val = new Date(max_val);
    }
    infoObj[attribute.name].min_val = min_val;
    infoObj[attribute.name].max_val = max_val;
  }
}

function FindDateSmaple(data) {
  if (data.links[0].start !== undefined) {
    return data.links[0].start;
  }
  if (data.links[0].end !== undefined) {
    return data.links[0].end;
  }
  if (data.nodes[0].start !== undefined) {
    return data.nodes[0].start;
  }
  if (data.nodes[0].end !== undefined) {
    return data.nodes[0].end;
  }
  //no date sample so far, have to search attributes
  for (var i = 0; i < data.link_keys.length; i++) {
    if (data.link_attributes_info[data.link_keys[i]].dynamic == true) {
      //foreach dynamic link attribute
      for (var j = 0; j < data.links.length; j++) {
        var attrL = data.links[j].attributes[i];
        if (attrL.values !== undefined) {
          //foreach dynamic link attribute value
          for (var k = 0; k < attrL.values.length; k++) {
            if (attrL.values[k].start !== undefined) {
              return attrL.values[k].start;
            } else if (attrL.values[k].end !== undefined) {
              return attrL.values[k].end;
            }
          }
        }
      }
    }
  }
  for (var i = 0; i < data.node_keys.length; i++) {
    if (data.node_attributes_info[data.node_keys[i]].dynamic == true) {
      //foreach dynamic node attribute
      for (var j = 0; j < data.nodes.length; j++) {
        var attrN = data.nodes[j].attributes[i];
        if (attrN.values !== undefined) {
          //foreach dynamic node attribute value
          for (var k = 0; k < attrN.values.length; k++) {
            if (attrN.values[k].start !== undefined) {
              return attrN.values[k].start;
            } else if (attrN.values[k].end !== undefined) {
              return attrN.values[k].end;
            }
          }
        }
      }
    }
  }
  return undefined;
}

function ParseData(data) {

  data.link_attributes_info = {};
  data.node_attributes_info = {};
  if (data.edges !== undefined ||
    data.nodes[0].hasOwnProperty('attributes') ||
    data.links[0].hasOwnProperty('attributes')
    ) {
    
    //new format
    console.warn("New Json Format");
    
    //grab link attributes
    data.links = data.edges;
    data.link_keys = [];
    var l_global_max_num = -Infinity;
    var l_global_min_num = Infinity;
    var l_global_max_date;
    var l_global_min_date;
    if (data.links[0].attributes !== undefined) {
      for (var i = 0; i < data.links[0].attributes.length; i++) {
        var attribute = data.links[0].attributes[i];
        data.link_keys.push(attribute.name);
        FillAttributeInfo(data.link_attributes_info, attribute, data.links);
        attribute = attribute.name;
        if (data.link_attributes_info[attribute].type == "date") {
          if (l_global_max_date === undefined) {
            l_global_min_date = data.link_attributes_info[attribute].min_val;
            l_global_max_date = data.link_attributes_info[attribute].max_val;
          } else {
            if (data.link_attributes_info[attribute].max_val.valueOf() > l_global_max_date.valueOf()) {
              l_global_max_date = data.link_attributes_info[attribute].max_val;
            }
            if (data.link_attributes_info[attribute].min_val.valueOf() > l_global_max_date.valueOf()) {
              l_global_min_date = data.link_attributes_info[attribute].min_val;
            }
          }
        } else if (data.link_attributes_info[attribute].type == "number") {
          l_global_max_num = Math.max(l_global_max_num, data.link_attributes_info[attribute].max_val);
          l_global_min_num = Math.min(l_global_min_num, data.link_attributes_info[attribute].min_val);
        }
      }
    }
    // console.log(global_max_num,global_min_num,global_max_date,global_min_date);
    data.link_attributes_info.global_max_num = l_global_max_num;
    data.link_attributes_info.global_min_num = l_global_min_num;
    data.link_attributes_info.global_max_date = l_global_max_date;
    data.link_attributes_info.global_min_date = l_global_min_date;
    
    //grab node attributes
    data.node_keys = []
    var n_global_max_num;
    var n_global_min_num;
    var n_global_max_date;
    var n_global_min_date;
    if (data.nodes[0].attributes != undefined) {

      for (var i = 0; i < data.nodes[0].attributes.length; i++) {
        var n_attribute = data.nodes[0].attributes[i];
        data.node_keys.push(n_attribute.name);
        FillAttributeInfo(data.node_attributes_info, n_attribute, data.nodes);
        n_attribute = n_attribute.name;
        if (data.node_attributes_info[n_attribute].type == "date") {
          if (n_global_max_date === undefined) {
            n_global_min_date = data.node_attributes_info[n_attribute].min_val;
            n_global_max_date = data.node_attributes_info[n_attribute].max_val;
          } else {
            if (data.node_attributes_info[n_attribute].max_val.valueOf() > n_global_max_date.valueOf()) {
              n_global_max_date = data.node_attributes_info[n_attribute].max_val;
            }
            if (data.node_attributes_info[n_attribute].min_val.valueOf() > n_global_max_date.valueOf()) {
              n_global_min_date = data.node_attributes_info[n_attribute].min_val;
            }
          }
        } else if (data.node_attributes_info[n_attribute].type == "number") {
          if (n_global_max_num === undefined) {
            n_global_max_num = data.node_attributes_info[n_attribute].max_val;
            n_global_min_num = data.node_attributes_info[n_attribute].min_val;
          } else {
            n_global_max_num = Math.max(n_global_max_num, data.node_attributes_info[n_attribute].max_val);
            n_global_min_num = Math.min(n_global_min_num, data.node_attributes_info[n_attribute].min_val);
          }
        }
      }
    }
    // console.log(global_max_num,global_min_num,global_max_date,global_min_date);
    data.node_attributes_info.global_max_num = n_global_max_num;
    data.node_attributes_info.global_min_num = n_global_min_num;
    data.node_attributes_info.global_max_date = n_global_max_date;
    data.node_attributes_info.global_min_date = n_global_min_date;

    if (data.date_type !== undefined) {
      console.log("Json file specified date-type as %o", data.date_type);
    } else {
      //get a sample
      var date_sample = FindDateSmaple(data);
      //determine type
      if (date_sample === undefined) {
        data.date_type = "static";
      } else {
        data.date_type = typeof (date_sample);
        if (data.date_type != "number") {
          if (data.date_type == "string" && IsDate(date_sample)) {
            data.date_type = "date";
          } else {
            console.error("Unkown date type, sample: %o, typeof: %o", date_sample, data.date_type);
            data.date_type = "static";
          }
        }
      }
      console.log("Determined date-type as %o, from sample %o", data.date_type, date_sample);
    }
    //make sure targets are in correct format
    data.links.forEach(function (o) {
      if (typeof (o.source) !== "number" || typeof (o.target) !== "number") {
        console.warn("link target/source is not a number, converting");
      }
      o.source = parseInt(o.source);
      o.target = parseInt(o.target);
    }, this);

  } else {
    //legacy format
    data.link_keys = Object.keys(data.links[0]);
    data.node_keys = Object.keys(data.nodes[0]);
    //source and target are not attributes
    RemoveFromArray(data.link_keys, "source");
    RemoveFromArray(data.link_keys, "target");
    //we have to determin type ourselves
    ProcessAttributesInfo(data.link_attributes_info, data.link_keys, data.links);
    ProcessAttributesInfo(data.node_attributes_info, data.node_keys, data.nodes);

    //get date format
    if (data.links[0].date !== undefined) {
      data.date_type = typeof (data.links[0].date);
      if (data.date_type == "string" && IsDate(data.links[0].date)) {
        data.date_type = "date";
      }
    } else {
      data.date_type = "static";
    }
    console.log("Determined date-type as %o, from sample %o", data.date_type, data.links[0].date);
  }
  
  //check all links are valid
  data.links.forEach(function (o) {
    if (o.source >= data.nodes.length || o.target >= data.nodes.length) {
      console.error("Link %o, has source or target to non-existant node!", o);
      o.source = 0;
      o.target = 1;
    }
  });
  //we need to grab date ranges
  var range = { min: Infinity, max: -Infinity };
  if (data.date_type == "static") {
    range.max = Infinity;
    range.min = -Infinity;
  } else if (data.date_type == "date" || data.date_type == "number") {
    range = getMinMaxDateOfAttriutes(data.date_type, data.links);
    range = getMinMaxDateOfAttriutes(data.date_type, data.nodes, range.min, range.max);
    console.log(range);
    if (data.date_type == "date") {
      range.max = new Date(range.max);
      range.min = new Date(range.min);
    }
  } else {
    console.error("Can't get date range from unkown date type");
    return false;
  }

  if (range.max == "Invalid Date" || range.min == "Invalid Date") {
    console.error(data.date_type);
    return false;
  }
  data.maxDate = range.max;
  data.minDate = range.min;
  data.formattedMaxDate = (data.date_type == "date" ? data.maxDate.toDateString() : data.maxDate);
  data.formattedMinDate = (data.date_type == "date" ? data.minDate.toDateString() : data.minDate);
  //Grab Global ranges
  if(data.link_attributes_info.global_max_num > data.node_attributes_info.global_max_num){
     data.maxNumber = data.link_attributes_info.global_max_num;
  }else{
    data.maxNumber = data.node_attributes_info.global_max_num;
  }
  if(data.link_attributes_info.global_min_num < data.node_attributes_info.global_min_num){
     data.minNumber = data.link_attributes_info.global_min_num;
  }else{
    data.minNumber = data.node_attributes_info.global_min_num;
  }
  return true;
}

function getNodeAttributeValue(data, node, attribute, minDate, maxDate,global) {
  return getAttributeValue(true, data, node, attribute, minDate, maxDate,global);
}
function getLinkAttributeValue(data, link, attribute, minDate, maxDate,global) {
  return getAttributeValue(false, data, link, attribute, minDate, maxDate,global);
}
function getNodeAttributeAsPercentage(data, node, attribute, minDate, maxDate,global) {
  return getNLAttributeAsPercentage(true, data, node, attribute,global);
}
function getLinkAttributeAsPercentage(data, link, attribute, minDate, maxDate,global) {
  return getNLAttributeAsPercentage(false, data, link, attribute, minDate, maxDate,global);
}
function getAttributeAsPercentage(data, nodeOrLink, attribute, minDate, maxDate,global) {
  var at = attribute;
  if($.isArray(attribute)){
      at = attribute[0];
  }
  if (data.node_keys.indexOf(at) != -1) {
    //node
    return getNLAttributeAsPercentage(true, data, nodeOrLink, attribute, minDate, maxDate,global);
  } else if (data.link_keys.indexOf(at) != -1) {
    //link
    return getNLAttributeAsPercentage(false, data, nodeOrLink, attribute, minDate, maxDate,global);
  } else {
    console.error("coudn't determine type of attribute: %o", at);
    return 0;
  }
}

function getAttributeValue(atype, data, nodeOrLink, attribute, selecteddateMin, selecteddateMax) {
  if (selecteddateMin === undefined) {
    selecteddateMin = data.minDate;
  }
  if (selecteddateMax === undefined) {
    selecteddateMax = data.maxDate;
  }

  var keys;
  var attributes_info;
  if (atype) {
    //node
    keys = data.node_keys;
    attributes_info = data.node_attributes_info[attribute];
  } else {
    //link
    keys = data.link_keys;
    attributes_info = data.link_attributes_info[attribute];
  }

  var index = keys.indexOf(attribute);
  if (index == -1) {
    console.error((atype ? "node" : "link") + " has no attribute %o", attribute);
    return 0;
  }

  if (attributes_info === undefined) {
    console.error("can find attribute info: %o", attribute);
    return 0;
  }
  //try old attribute storage first
  var attribute_value = nodeOrLink[attribute];
  //try new storage if oldtorage fails
  if (attribute_value == undefined && nodeOrLink.attributes != undefined) {
    //find attributes{} is attributes[]
    attribute_value = ($.grep(nodeOrLink.attributes, function (e) { return e.name == attribute; }));
    //did we find it?
    if (attribute_value !== undefined && attribute_value.length == 1) {
      attribute_value = attribute_value[0];
      //does it have one single value?
      if (attribute_value.value !== undefined) {
        return attribute_value.value;
      } else if (attribute_value.values !== undefined) {
        //many values, by time
        for (var i = 0; i < attribute_value.values.length; i++) {
          var thisvalue = attribute_value.values[i];
          if (thisvalue.end === undefined && thisvalue.start !== undefined && thisvalue.start <= selecteddateMax) {
            return thisvalue.value;
          }
          if (thisvalue.start === undefined && thisvalue.end !== undefined && thisvalue.end >= selecteddateMin) {
            return thisvalue.value;
          }
          if ((thisvalue.start !== undefined && thisvalue.start <= selecteddateMax) && (thisvalue.end !== undefined && thisvalue.end >= selecteddateMin)) {
            return thisvalue.value;
          }
        }
        console.error("Attribute had no value within range", attribute, nodeOrLink, selecteddateMin, selecteddateMax);
        return null;
      }
    } else {
      console.error("couldn't find attribute ", attribute, nodeOrLink);
    }
  }
  //fnal check
  if (attribute_value == undefined) {
    console.error("couldn't find attribute value ", attribute, nodeOrLink);
    return 0;
  }
  return attribute_value;
}
var NormalError = true;
function getNLAttributeArrayAsPercentage(atype, data, nodeOrLink, attributes, selecteddateMin, selecteddateMax) {
  var keys;
  var attributes_info = [];
  var attributeType;
  if (atype) {
    //node
    keys = data.node_keys;
    for (var k = 0; k < attributes.length; k++) {
      attributes_info[k] = data.node_attributes_info[attributes[k]];
      if (attributes_info[k] === undefined) {
        console.error("can find attribute info: %o", attributes[k]);
        return 0;
      }
      if(attributeType === undefined){
        attributeType = attributes_info[k].type;
      }else if(attributes_info[k].type !== attributeType){
        if(NormalError){
          console.error("Can't normalise attributes of type %o(%o) with type %o (set NormalError to false to surpress this error)",attributes_info[k].type,attributes_info[k].name,attributeType);
        }
        return getNLAttributeAsPercentage(atype, data, nodeOrLink, attributes[0], selecteddateMin, selecteddateMax);
      }
    }
  } else {
    //link
    keys = data.link_keys;
    for (var k = 0; k < attributes.length; k++) {
      attributes_info[k] = data.link_attributes_info[attributes[k]];
      if (attributes_info[k] === undefined) {
        console.error("can find attribute info: %o", attributes[k]);
        return 0;
      }
      if(attributeType === undefined){
        attributeType = attributes_info[k].type;
      }else if(attributes_info[k].type !== attributeType){
        if(NormalError){
          console.error("Can't normalise attributes of type %o with type %o (set NormalError to false to surpress this error)",attributes_info[k].type,attributeType);
        }
       return getNLAttributeAsPercentage(atype, data, nodeOrLink, attributes[0], selecteddateMin, selecteddateMax);
      }
    }
  }
  
 // var attribute_values = [];
  //for (var k = 0; k < attributes.length; k++) {
  // attribute_values[k] = getAttributeValue(atype, data, nodeOrLink, attributes[k], selecteddateMin, selecteddateMax);
 // }
  var attribute_value = getAttributeValue(atype, data, nodeOrLink, attributes[0], selecteddateMin, selecteddateMax);

  if (attributeType == "number") {
    // console.log("number - val:"+attribute_value + " %: "+attribute_value / (attributes_info.max_val - attributes_info.min_val));
    var min = attributes_info[0].min_val;
    var max = attributes_info[0].max_val;
    for (var k = 0; k < attributes.length; k++) {
      min = Math.min(min,attributes_info[1].min_val);
      max = Math.max(max,attributes_info[1].max_val);
    }
    return attribute_value / (min - max);
  } else if (attributeType == "date") {
    console.warn("Normalising multiple date attributes unlikely to work yet :(");
    var min = attributes_info[0].min_val;
    var max = attributes_info[0].max_val;
    for (var k = 0; k < attributes.length; k++) {
      min = Math.min(min,attributes_info[1].min_val);
      max = Math.max(max,attributes_info[1].max_val);
    }
    attribute_value = new Date(attribute_value);
    return (attribute_value - min) / (max - min);
  } else if (attributeType == "string") {
    console.warn("Normalising multiple string attributes impossible :(");
    var aindex = attributes_info[0].values.indexOf(attribute_value);
    if (aindex == -1) { return 0; }
    return (aindex * 1.0) / (attributes_info[0].count * 1.0);
  } else {
    console.error("unkown type! %o", attributeType);
  }
}

function getNLAttributeAsPercentage(atype, data, nodeOrLink, attribute, selecteddateMin, selecteddateMax,global) {
  if($.isArray(attribute)){
    if(attribute.length > 1){
      return getNLAttributeArrayAsPercentage(atype, data, nodeOrLink, attribute, selecteddateMin, selecteddateMax)
    }else{
      attribute = attribute[0];
    }
  }
  var keys;
  var attributes_info;
  if (atype) {
    //node
    keys = data.node_keys;
    attributes_info = data.node_attributes_info[attribute];
  } else {
    //link
    keys = data.link_keys;
    attributes_info = data.link_attributes_info[attribute];
  }

  if (attributes_info === undefined) {
    console.error("can find attribute info: %o", attribute);
    return 0;
  }

  var attribute_value = getAttributeValue(atype, data, nodeOrLink, attribute, selecteddateMin, selecteddateMax);

  if (attributes_info.type == "number") {
    // console.log("number - val:"+attribute_value + " %: "+attribute_value / (attributes_info.max_val - attributes_info.min_val));
    if(global){
      return attribute_value / (data.maxNumber - data.minNumber);
    }else{
      return attribute_value / (attributes_info.max_val - attributes_info.min_val);
    }
  } else if (attributes_info.type == "date") {
    attribute_value = new Date(attribute_value);
    if(global){
      return attribute_value / (data.maxNumber - data.minNumber);
    }else{
      return (attribute_value - attributes_info.minDate) / (attributes_info.maxDate - attributes_info.minDate);
    }
  } else if (attributes_info.type == "string") {
    var aindex = attributes_info.values.indexOf(attribute_value);
    if (aindex == -1) { return 0; }
    return (aindex * 1.0) / (attributes_info.count * 1.0);
  } else {
    console.error("unkown type! %o", attributes_info.type);
  }
}
//true if link was created before range end AND died after range start
function IsNodeEverAliveInRange(node, min, max) {
  return IsLinkEverAliveInRange(node, min, max);
}
function IsLinkEverAliveInRange(link, min, max) {
  if (graphdata.date_type == "static") { return true; }
  //todo take into account multiple births and deaths
  var LinkBirthday;
  var LinkDeathDay;
  if (link.date === undefined) {
    if (link.start === undefined) {
      LinkBirthday = new Date(0);
    } else {
      LinkBirthday = new Date(link.start);
    }
    if (link.end === undefined) {
      LinkDeathDay = Infinity
    } else {
      LinkDeathDay = new Date(link.end);
    }
  } else {
    LinkBirthday = new Date(link.date);
    LinkDeathDay = Infinity
  }
  return (LinkBirthday <= max && LinkDeathDay >= min);
}

function NodeCreatedInRange(node, min, max) {
  return LinkCreatedInRange(node, min, max);
}
//true if link created during range
function LinkCreatedInRange(link, min, max) {
  var LinkBirthday;
  if (link.date === undefined) {
    if (link.start === undefined) {
      return false;
    } else {
      LinkBirthday = new Date(link.start);
    }
  } else {
    LinkBirthday = new Date(link.date);
  }
  //todo take into account births and deaths
  return (max >= LinkBirthday && min <= LinkBirthday);
}

//true if time is between link start and end
function IsLinkAliveAtTime(link, time) {
  //todo take into account multiple births and deaths
  var LinkBirthday;
  var LinkDeathDay;
  if (link.date === undefined) {
    if (link.start === undefined) {
      LinkBirthday = new Date(0);
    } else {
      LinkBirthday = new Date(link.start);
    }
    if (link.end === undefined) {
      LinkDeathDay = Infinity
    } else {
      LinkDeathDay = new Date(link.end);
    }
  } else {
    LinkBirthday = new Date(link.date);
    LinkDeathDay = Infinity
  }

  return (LinkDeathDay >= time && LinkBirthday <= time);
}

function RemoveFromArray(array, removal) {
  var tt = array.indexOf(removal);
  if (tt != -1) {
    array.splice(tt, 1);
  }
}

function CopyAttributes(obj, sources, destinations) {
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    var dest = destinations[i];
    obj[dest] = obj[source];
  }
}
function CopyAttributesIntoArray(obj, sources, destinations, index) {
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    var dest = destinations[i];
    if (obj[dest] === undefined) {
      obj[dest] = [];
    }
    obj[dest][index] = obj[source];
  }
}

function getMinMaxDateOfAttriutes(date_type, nodesOrlinks, minV, maxV) {
  if (minV === undefined) {
    minV = Infinity;
  }
  if (maxV === undefined) {
    maxV = -Infinity;
  }
  var range = { min: minV, max: maxV };

  if (date_type == "static") {
    range.max = Infinity;
    range.min = -Infinity;
    return range;
  }

  nodesOrlinks.forEach(function (o) {
    if (o.date !== undefined) {
      range = getMinMaxDateOfValue(range.min, range.max, date_type, o.date);
    }
    if (o.start !== undefined) {
      range = getMinMaxDateOfValue(range.min, range.max, date_type, o.start);
    }
    if (o.end !== undefined) {
      range = getMinMaxDateOfValue(range.min, range.max, date_type, o.end);
    }
    if (o.attributes !== undefined) {
      for (var f = 0; f < o.attributes.length; f++) {
        var attribute = o.attributes[f];
        if (attribute.value !== undefined) {
          //single static value
          range = getMinMaxDateOfValue(range.min, range.max, date_type, attribute.value);
        } else if (attribute.values !== undefined) {
          //multiple values
          for (var q = 0; q < attribute.values.length; q++) {
            if (attribute.values[q].start !== undefined) {
              range = getMinMaxDateOfValue(range.min, range.max, date_type, attribute.values[q].start);
            }
            if (attribute.values[q].end !== undefined) {
              range = getMinMaxDateOfValue(range.min, range.max, date_type, attribute.values[q].end);
            }
          }
        } else {
          console.error("Attribute with no value %o, node/link: %o", attribute, o);
        }
      }
    }
  });

  return range;
}

function getMinMaxDateOfValue(minV, maxV, date_type, value) {
  if (date_type == "date") {
    value = convertDateToNumber(value);
  }
  maxV = Math.max(maxV, value);
  minV = Math.min(minV, value);
  return { min: minV, max: maxV };
}
function convertDateToNumber(date) {
  if (!IsDate(date)) {
    console.error("%o is not a valid date", date);
  }
  return (new Date(date).valueOf());
}

var CoolKeyMap = function () {
  this.values = [];
  this.keys = [];
  this.default = null;
  this.Assignment = function () { };
  this.pairs = {};
};
CoolKeyMap.prototype.GetUnassignedKeys = function () {
  var a = [];
  for (var pk in this.pairs) {
    if (this.pairs[pk] == this.default) {
      a.push(pk);
    }
  }
  return a;
};
CoolKeyMap.prototype.GetUnassignedValues = function () {
  return "todo";
};
CoolKeyMap.prototype.GetAssignedKeys = function () {
  var a = [];
  for (var pk in this.pairs) {
    if (this.pairs[pk] != this.default) {
      a.push(pk);
    }
  }
  return a;
};
CoolKeyMap.prototype.GetAssignedValues = function () {
  return "todo";
};
CoolKeyMap.prototype.SetAssignmentBehaviour = function (func) {
  this.Assignment = func;
};
CoolKeyMap.prototype.SetDefault = function (def) {
  this.default = def;
};
CoolKeyMap.prototype.SetValues = function (newvals) {
  //console.info("SetValues");console.trace();
  //check to see for any removals
  this.values.forEach(function (o) {
    this.Pair(null, o);
  }, this);
  this.values = newvals;
};
CoolKeyMap.prototype.UpdateValues = function (newvals) {
  //console.info("UpdateValues");console.trace();
  //check to see for any removals
  this.values.forEach(function (o) {
    if ($.inArray(o, newvals) == -1) {
      this.Pair(null, o);
    }
  }, this);
  /*add new - don't actually have to do anything
  newvals.forEach(function (o) {
    if ($.inArray(o, this.values) == -1) {this.Pair(null, o);}
  }, this);*/
  console.log("kmap vals: ", newvals);
  this.values = newvals;
};

CoolKeyMap.prototype.SetKeys = function (newkeys) {
  // console.info("setkeys");console.trace();
  //check to see for any removals
  this.keys.forEach(function (o) {
    this.Pair(o, this.default);
  }, this);
  this.pairs = {};
  this.keys = newkeys;
};

CoolKeyMap.prototype.UpdateKeys = function (newkeys) {
  //  console.info("UpdateKeys");console.trace();
  //check to see for any removals
  this.keys.forEach(function (o) {
    if ($.inArray(o, newkeys) == -1) {
      this.Pair(o, this.default);
      delete this.pairs[o];
    }
  }, this);
  //add new
  newkeys.forEach(function (o) {
    if ($.inArray(o, this.keys) == -1) {
      this.Pair(o, this.default);
    }
  }, this);

  this.keys = newkeys;
};

CoolKeyMap.prototype.AddKey = function (key) {
  // console.info("addkey ", key);console.trace();
  var tt = this.keys.indexOf(key);
  if (tt == -1) {
    this.keys.push(key);
    this.Pair(key, this.default);
  }
};

CoolKeyMap.prototype.RemoveKey = function (key) {
  var tt = this.keys.indexOf(key);
  if (tt != -1) {
    //unpair form any value
    this.Pair(key, this.default);
    //delete the pairing
    delete this.pairs[key];
    //remove from keys
    this.keys.splice(tt, 1);
    // console.info("removed K ",key);
  }
};

CoolKeyMap.prototype.AddValue = function (val) {
  // console.info("AddValue ",val);console.trace();
  var tt = this.values.indexOf(val);
  if (tt == -1) {
    this.values.push(val);
  }
};

CoolKeyMap.prototype.RemoveValue = function (val) {
  // console.info("RemoveValue %o",val);console.trace();
  var tt = this.values.indexOf(val);
  if (tt != -1) {
    //unpair form any key
    this.Pair(null, val);
    //remove from values
    this.values.splice(tt, 1);
    console.info("removed V ", val);
  }
  //else{console.error("No such value!");}
};
CoolKeyMap.prototype.WipePairsNoAssign = function (key, value) {
  this.pairs = {};
};

CoolKeyMap.prototype.Pair = function (key, value) {
  //console.info("Pair ",key, value);console.trace();
  if (key == null && value !== this.default) {
    //unnasign any key assigned to value
    for (var pk in this.pairs) {
      if (this.pairs[pk] == value) {
        this.Assignment(pk, this.pairs[pk], this.default);
        this.pairs[pk] = this.default;
      }
    }
    return;
  }
  var oldval;
  if (value == this.default) {
    //no need to check anything, just set.
    oldval = this.pairs[key];
    if (oldval === undefined) { oldval = this.default; }
    if (oldval != this.default) {
      this.Assignment(key, oldval, value);
      this.pairs[key] = this.default;
    }
    return;
  }
  //find anything paired with value
  for (var pk in this.pairs) {
    //unnasign if not key
    if (this.pairs[pk] == value && pk != key) {
      this.Assignment(pk, this.pairs[pk], this.default);
      this.pairs[pk] = this.default;
    }
  }
  //find key current value
  if (this.pairs[key] === undefined || this.pairs[key] === this.default) {
    this.pairs[key] = value;
    this.Assignment(key, this.default, value);
    return;
  }
  oldval = this.pairs[key];
  if (oldval == value) {
    return;
  }
  this.Assignment(key, oldval, value);
  this.pairs[key] = value;
};

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function MillisToTime(millis) {
  var hours = zeroPad(Math.floor(millis / 36e5), 2),
      mins = zeroPad(Math.floor((millis % 36e5) / 6e4), 2),
      secs = zeroPad(Math.floor((millis % 6e4) / 1000), 2),
      mil = zeroPad(Math.floor((millis % 1000)), 3);
  return (hours + ':' + mins + ':' + secs + ':' + mil);
}

 var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function EscapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }
  
function EscapeID(string) {
  return String(string).replace(/\s+|'+|"+|\.+|,+/g, '-_-');
}

function rainbow(i){
  var frequency = .3;
  red   = Math.floor(Math.sin(frequency*i + 0) * 127 + 128);
  green = Math.floor(Math.sin(frequency*i + 2) * 127 + 128);
  blue  = Math.floor(Math.sin(frequency*i + 4) * 127 + 128);
  return "rgb("+red+","+green+","+blue+")";
}