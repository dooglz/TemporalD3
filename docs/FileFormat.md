# Dynamic Data JSON file Format

This applications loads in data via javascript, the file-type must be valid JSON file.
The JSON File is split into two Main objects, **Nodes** and **Links**.

When loaded, the JSON file is turned into a javascript object. Extra **metadata** is added to the top level of the object when it is being parsed, this metadata can be hard-coded into the JSON file to speed up parsing times.

```javascript
//Minimum valid dataset, note the use of {object} and [array]
{
 nodes:[
   {},
   {},
   {}
 ]
 links:[
   {source:0, target:1},
   {source:1, target:2}
 ]
}
```

## Node and Link Lifetime
The start and end time of a node or link can be set by adding a ``start`` or ``end`` property.
A Node/Link can only be created and deleted once, if a Node/Link is to stop existing at some point and then exist again later, two nodes/links must be created.

**Notice:** A link can only exist during a period of time, if and only if, both the source and target nodes exist during the *full length* of the link lifetime.

## Links
Links must have a ``source`` and ``target`` property. 
This is a number representing the correspoding nodes theat the link is conencted to.
Nodes are indexed in the order they are listed in the `nodes[]` array, starting from 0.

A Link **Must always be connected to two nodes**, the source and target **cannot change**, 
If a link needs to disconnect from one node and connect to another, create two links with start and end times.

## Attributes
Both Nodes and Links can have attributes, this gives meaning to the data and can be shown through various visual channels.
All attributes should be objects contained in an `attributes[]` array.

An attribute object **must** have: "**`name`**", "**`type`**" and "**`value" or "values[]`**" properties 
### Attribute types
Must be either "number", "string" or "date"

### Attribute Value
An attribute can have one static value, that doesn't change for the entire lifetime of the node or link.

This is signified simple by:  ``value:"whatever value you want"``

### Non-static Attribute Values
If the value of an attributes changes over time, an array of values must be used, within   ``values:[]``

A value object is a simple object: ``{start:0, end:10, value:100}``

You can have as many value objects in the values[] array as you want.
However none of the Start and End time must overlap. This will result in undefined behavior.
You can have just a start, or just an end in a value object if the start or end point is unknown, i.e for the very first or the very last value.
Again, nothing can overlap.
```javascript
{
    nodes: [{
        attributes[{
            name: "First Name",
            type: "string",
            value: "Jim"
        }]
    }, {
        attributes[{
            name: "First Name",
            type: "string",
            value: "Joe"
        }]
    }, {
        attributes[{
            name: "First Name",
            type: "string",
            value: "bob"
        }]
    }]
    links: [{
        source: 0,
        target: 1,
        attributes[{
            name: "Wealth",
            type: "number",
            value: "200"
        }]
    }, {
        source: 1,
        target: 2,
        attributes[{
            name: "Wealth",
            type: "number",
            values: [{
                end: 2,
                value: 100
            }, {
                start: 2,
                end: 5,
                value: 200
            }, {
                start: 5,
                value: 300
            }]
        }]
    }, ]
}
```

## Metadata

Todo