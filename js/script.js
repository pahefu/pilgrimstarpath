var center = {
  x: [2048],
  y: [2048],
  coords: [2048,128,2048],
  mode: 'markers',
  type: 'scatter',
  name: 'Galaxy Center'
};

var pilgrim = {
  x: [ 0x64A],
  y: [0x1b9],
  coords: [0x64a,0x0082,0x1b9],
  mode: 'markers',
  type: 'scatter',
  name: 'Pilgrim Star'
};

var userLocation = {
  x: [ 0x123],
  y: [ 0x456],
  mode: 'markers',
  type: 'scatter',
  name: 'User Location'
}

var data = [center,pilgrim];

var layout = {
	shapes: [
		{
			type: 'circle',
			xref: 'x',
			yref: 'y',
			x0: 2048-60,
			y0: 2048-60,
			x1: 2048+60,
			y1: 2048+60,
			opacity: 0.2,
			fillcolor: 'blue',
			line: {
				color: 'blue'
			}
		}
	],
	xaxis: {range: [0, 4096], title:'X coord'},
	yaxis: {range: [0, 4096], title:'Z coord'},
	hovermode : 'closest'
};

function plotMap(){
	Plotly.newPlot('plotdiv', data,layout);
}

function hideMessages(){
	var elementA = document.getElementById("errorMessage");
	var elementB = document.getElementById("locationInfo");
	
	elementA.className = "hidden";
	elementB.className = "hidden";
}

function showErrorMessage(text){
	var element = document.getElementById("errorMessage");
	element.innerHTML = text;
	element.className = "visible button-error pure-button";
}

function calculateDistance(x0,y0,z0,x1,y1,z1){
	var deltaX = x1 - x0;
	var deltaY = y1 - y0;
	var deltaZ = z1 - z0;
	
	var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
	return distance*100; // NMS stuff
}

function setValue(domId,value){
	var element = document.getElementById(domId);
	element.innerHTML = value;
}

function showLocationInfo(x,y,z){
	var element = document.getElementById("locationInfo");
	element.className = "visible";
	
	userLocation.x[0] = x;
	userLocation.y[0] = z; // Plotly stuff
	
	setValue("xcoord",x);
	setValue("ycoord",y);
	setValue("zcoord",z);
	
	setValue("cdistance",calculateDistance(x,y,z,center.coords[0],center.coords[1],center.coords[2]) +" ly");
	setValue("pdistance",calculateDistance(x,y,z,pilgrim.coords[0],pilgrim.coords[1],pilgrim.coords[2]) +" ly");
	setValue("pjumps",Math.ceil(calculateDistance(x,y,z,pilgrim.coords[0],pilgrim.coords[1],pilgrim.coords[2])/400.0));

	var plotdata = document.getElementById("plotdiv").data;
	if(plotdata.length==3){
		Plotly.deleteTraces('plotdiv',2);
	}
	Plotly.addTraces('plotdiv', userLocation);	
}

function calculateLocation(){
	var elementValue = document.getElementById("userlocation").value;
	var data = elementValue.split(':');
	
	hideMessages();
	
	if(data.length!=5){
		showErrorMessage("Invalid format for location");
		return;
	}
	
	var x = Number("0x"+data[1]);
	var y = Number("0x"+data[2]);
	var z = Number("0x"+data[3]);
	
	if(isNaN(x) || isNaN(y) || isNaN(z)){
		showErrorMessage("Invalid format for location");
		return;
	}

	showLocationInfo(x,y,z);	
}
