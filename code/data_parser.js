/*along with the actual data in the json file
 link_keys:["an","array","of all the property names of a link"]
 node_keys:["an","array","of all the property names  of a node"]
 
 link_attributes_info {
    value:{type:"number",min_val:0,max_val:100,dynamic:false},
    name:{type:"string",count:20,values[],dynamic:false},
    birthday:{type:"date",min_val:0,max_val:100,dynamic:false},
  }
  node_attributes_info {
    same as link_attributes_info
  }
*/

function isDate(datestring) {
  return ((new Date(datestring) !== "Invalid Date" && !isNaN(new Date(datestring))));
}


function FillAttributesInfo(infoObj, keys, values) {

  for (var i in keys) {
    var attribute = keys[i];
    infoObj[attribute] = {};
    var attributeInfo = infoObj[attribute];
    var sampleValue = values[0][attribute];
    var attributeType = typeof (sampleValue);

    if (attributeType == "string") {
      if (isDate(sampleValue)) { attributeType = "date"; } else {
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

    console.log(keys[i] + " - " + sampleValue + " - " + attributeType);
    console.log(attributeInfo);
    attributeInfo.type = attributeType;
    attributeInfo.dynamic = false;
  }
}

function ParseData(data) {
  if (data.nodes[0].hasOwnProperty('attributes')) {
    //new format
    console.error("New Json Format not yet supported")
    return;
  } else {
    //legacy format
    data.link_keys = Object.keys(data.links[0]);
    data.node_keys = Object.keys(data.nodes[0]);
    //source and target are not attributes
    data.link_keys.splice(data.link_keys.indexOf("source"), 1);
    data.link_keys.splice(data.link_keys.indexOf("target"), 1);
  }
  data.link_attributes_info = {};
  data.node_attributes_info = {};
  FillAttributesInfo(data.link_attributes_info, data.link_keys, data.links);
  FillAttributesInfo(data.node_attributes_info, data.node_keys, data.nodes);
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
    console.error("coudn't determine type of attribute: " + attribute);
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
    console.error((atype ? "node" : "link") + " has no attribute " + attribute);
    return 0;
  }

  if (attributes_info === undefined) {
    console.error("can find attribute info " + attribute);
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
    // console.log("string");
    if (aindex == -1) { return 0; }
    return (aindex * 1.0) / (attributes_info.count * 1.0);
  } else {
    console.error("unkown type! " + attributes_info.type);
  }
}