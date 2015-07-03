//along with the actual data in the json file
// link_keys:["an","array","of all the property names of a link"]
// node_keys:["an","array","of all the property names  of a node"]

function ParseData(data){
	if (data.nodes[0].hasOwnProperty('attributes')) {
    //new format
	console.error("New Json Format not yet supportes")
  } else {
    //legacy format
    data.link_keys = Object.keys(data.links[0]);
    data.node_keys = Object.keys(data.nodes[0]);
  }
}

function getNodeAttributeAsPercentage(data,attribute){
	
}