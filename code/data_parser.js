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

  for (var i in keys) {
    var attribute = keys[i];
    infoObj[attribute] = {};
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
        min_val = new Date(min_val).valueOf();
        max_val = new Date(max_val).valueOf();
      }
      for (var j in values) {
        var nval = values[j][attribute];
        if (attributeType == "date") {
          nval = new Date(nval).valueOf();
        }
        max_val = Math.max(max_val, nval);
        min_val = Math.min(min_val, nval);
      }
      if (attributeType == "date") {
        min_val = new Date(min_val)
        max_val = new Date(max_val)
      }
      attributeInfo.min_val = min_val;
      attributeInfo.max_val = max_val;
    }

    // console.log(keys[i] + " - " + sampleValue + " - " + attributeType);
    // console.log(attributeInfo);
    attributeInfo.type = attributeType;
    attributeInfo.dynamic = false;
  }
}


function FillAttributeInfo(infoObj, attribute, values) {
  //value:{type:"number",min_val:0,max_val:100,dynamic:false},
  infoObj[attribute.name] = {};
  var attributeType = attribute.type;
  if (attributeType == "numeric") { attributeType = "number" };
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

function ParseData(data) {

  data.link_attributes_info = {};
  data.node_attributes_info = {};
  if (data.edges !== undefined ||
    data.nodes[0].hasOwnProperty('attributes') ||
    data.links[0].hasOwnProperty('attributes')
    ) {
    
    //new format
    console.warn("New Json Format, probably loads of bugs");
    
    //grab link attributes
    data.links = data.edges;
    data.link_keys = []
    if (data.links[0].attributes != undefined) {
      for (var i = 0; i < data.links[0].attributes.length; i++) {
        var attribute = data.links[0].attributes[i];
        data.links_keys.push(attribute.name);
        FillAttributeInfo(data.link_attributes_info, attribute, data.links);
      }
    }
    
    //get date format
    if (data.links[0].start !== undefined) {
      data.date_type = typeof (data.links[0].start);
      if (data.date_type == "string" && IsDate(data.links[0].start)) {
        data.date_type = "date";
      }
    } else if (data.links[0].end !== undefined) {
      data.date_type = typeof (data.links[0].end);
      if (data.date_type == "string" && IsDate(data.links[0].end)) {
        data.date_type = "date";
      }
    } else {
      data.date_type = "static";
    }
    
    //make sure targets are in correct format
    data.links.forEach(function (o) {
      if (typeof (o.source) !== "number" || typeof (o.target) !== "number") {
        console.warn("link target/source is not a number, converting");
      }
      o.source = parseInt(o.source);
      o.target = parseInt(o.target);
    }, this);  
    
    //grab node attributes
    data.node_keys = []
    if (data.nodes[0].attributes != undefined) {
      for (var i = 0; i < data.nodes[0].attributes.length; i++) {
        var attribute = data.nodes[0].attributes[i];
        data.node_keys.push(attribute.name);
        FillAttributeInfo(data.node_attributes_info, attribute, data.nodes);
      }
    }
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
  
  //we need to grab date ranges
  var maxdate;
  var minDate;
  if (data.date_type == "static") {
    maxdate = Infinity;
    minDate = -Infinity;
  } else if (data.date_type == "date" || data.date_type == "number") {
    maxdate = -Infinity;
    minDate = Infinity;
    data.links.forEach(function (o) {
      var nval;
      if (o.date !== undefined) {
        nval = o.date
        if (data.date_type == "date") {
          if (!IsDate(nval)) {
            console.error("%o is not a valid date", nval);
          }
          nval = new Date(nval).valueOf();
        }
        maxdate = Math.max(maxdate, nval);
        minDate = Math.min(minDate, nval);
      }
      if (o.start !== undefined) {
        nval = o.start;
        if (data.date_type == "date") {
          if (!IsDate(nval)) {
            console.error("%o is not a valid date", nval);
          }
          nval = new Date(nval).valueOf();
        }
        maxdate = Math.max(maxdate, nval);
        minDate = Math.min(minDate, nval);
      }
      if (o.end !== undefined) {
        nval = o.end;
        if (data.date_type == "date") {
          if (!IsDate(nval)) {
            console.error("%o is not a valid date", nval);
          }
          nval = new Date(nval).valueOf();
        }
        maxdate = Math.max(maxdate, nval);
        minDate = Math.min(minDate, nval);
      }
    }, this);
    if (data.date_type == "date") {
      console.log(maxdate, minDate);
      maxdate = new Date(maxdate);
      minDate = new Date(minDate);
    }
  } else {
    console.error(data.date_type);
  }
  if (maxdate == "Invalid Date" || minDate == "Invalid Date") {
    console.error(data.date_type);
  }
  data.maxDate = maxdate;
  data.minDate = minDate;


}

function getNodeAttributeAsPercentage(data, node, attribute) {
  return getNLAttributeAsPercentage(true, data, node, attribute);
}
function getLinkAttributeAsPercentage(data, link, attribute) {
  return getNLAttributeAsPercentage(false, data, link, attribute);
}
function getAttributeAsPercentage(data, nodeOrLink, attribute) {
  if (data.node_keys.indexOf(attribute) != -1) {
    //node
    return getNLAttributeAsPercentage(true, data, nodeOrLink, attribute);
  } else if (data.link_keys.indexOf(attribute) != -1) {
    //link
    return getNLAttributeAsPercentage(false, data, nodeOrLink, attribute);
  } else {
    console.error("coudn't determine type of attribute: %o", attribute);
    return 0;
  }

}
function getNLAttributeAsPercentage(atype, data, nodeOrLink, attribute) {
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
  var attribute_value = nodeOrLink[attribute];
  if (attributes_info.type == "number") {
    // console.log("number - val:"+attribute_value + " %: "+attribute_value / (attributes_info.max_val - attributes_info.min_val));
    return attribute_value / (attributes_info.max_val - attributes_info.min_val);
  } else if (attributes_info.type == "date") {
    attribute_value = new Date(attribute_value);
    return (attribute_value - attributes_info.min_val) / (attributes_info.max_val - attributes_info.min_val);
  } else if (attributes_info.type == "string") {
    var aindex = attributes_info.values.indexOf(attribute_value);
    if (aindex == -1) { return 0; }
    return (aindex * 1.0) / (attributes_info.count * 1.0);
  } else {
    console.error("unkown type! %o", attributes_info.type);
  }
}
//true if link was created before range end AND died after range start
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