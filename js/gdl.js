
var center = {
  coords: [2048,128,2048],
  name: 'Galaxy Center'
};

var pilgrim = {
  coords: [0x64a,0x0082,0x1b9],
  name: 'Pilgrim Star'
};

var userLocation = {
  coords: [0xeeb,0x0081,0x91a],
  name: 'User Location',
  enabled: false
}


var canvasWidth = undefined;
var canvasHeight = undefined;
var realCanvasWidth = undefined;
var realCanvasHeight = undefined;
var ctx = undefined;
var legendPercent = undefined;

function drawGrid(){
	
	ctx.strokeStyle = '#999999';
	var step = 30;
	
	for(var i = 0;i<canvasWidth;i+=step){
		ctx.beginPath();
		ctx.moveTo(i,0);
		ctx.lineTo(i,canvasHeight);
		ctx.stroke();
	}
	for(var i = 0;i<canvasHeight;i+=step){
		ctx.beginPath();
		ctx.moveTo(0,i);
		ctx.lineTo(canvasWidth,i);
		ctx.stroke();
	}
}

function drawDot(x,z,size,fillStyle){
	var radius = size;
	
	ctx.beginPath();
    ctx.arc(x, z, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fillStyle;
	ctx.strokeStyle = fillStyle;
    ctx.fill();
}

function drawStar(x,z, size, fillStyle){

	var zX = 0;
	var zZ = 0;
	var mX = 4096;
	var mZ = 4096;
	
	var centerX = x * canvasWidth / mX;
	var centerZ = z * canvasHeight / mZ;
	drawDot(centerX,centerZ,size,fillStyle);
	
}

function drawText(text, x,y){
	ctx.font="15px Georgia";
	ctx.fillText(text,x,y);
}

function drawArrow(fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
	ctx.stroke();
    ctx.moveTo(tox, toy);
	ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
	ctx.stroke();
	ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
	ctx.stroke();
}

function drawAxis(){
	
	ctx.fillStyle = '#ffffff';
	ctx.strokeStyle = '#ffffff';
	drawText("X",140,30);
	drawArrow(10,10,150,10);
	drawText("Z",18,150);
	drawArrow(10,10,10,150);
	
}

function drawLegend(){
	ctx.rect(realCanvasWidth*(1-legendPercent),0,realCanvasWidth*(1-legendPercent),realCanvasHeight);
	ctx.strokeStyle = '#777777';
	
	var step = 30;
	var offset = 15;

	drawDot(realCanvasWidth*(1-legendPercent)+15, offset,6,'#7672E8');
	drawText("Center",realCanvasWidth*(1-legendPercent)+25, offset+5);offset+=step;
	drawDot(realCanvasWidth*(1-legendPercent)+15, offset,4,'orange');
	drawText("Pilgrim",realCanvasWidth*(1-legendPercent)+25, offset+5);offset+=step;
	
	if(userLocation.enabled){
		drawDot(realCanvasWidth*(1-legendPercent)+15, offset,4,'#36AC3A');
		drawText("User",realCanvasWidth*(1-legendPercent)+25, offset+5);offset+=step;
	}
}

function drawCanvas(){
	ctx.clearRect(0, 0, realCanvasWidth, realCanvasHeight);
	drawGrid();
	drawAxis();
	drawStar(center.coords[0], center.coords[2],6,'#7672E8');
	drawStar(pilgrim.coords[0], pilgrim.coords[2],4,'orange');
	
	if(userLocation.enabled){
		drawStar(userLocation.coords[0], userLocation.coords[2],4,'#36AC3A');
	}
	drawLegend();
}

function generateMap(){
	var canvas = document.getElementById("plotc");
	
	var parentPercent = 0.7;
	legendPercent = 0.2;
	
	var parent = document.getElementById("plotparent");
	var wp = parent.getBoundingClientRect().width*parentPercent;
	var hp = wp*(1-legendPercent);

	realCanvasWidth = wp;
	realCanvasHeight = hp;
	
	canvas.setAttribute("width",wp);
	canvas.setAttribute("height",hp);
	canvas.setAttribute("css","{width:'"+wp+"p‌​x',height:'"+hp+"px';}");

	canvasWidth = hp;
	canvasHeight = hp;
	ctx = canvas.getContext("2d");	 	
	
	drawCanvas();
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
	
	userLocation.coords[0] = x;
	userLocation.coords[2] = z; 
	
	setValue("xcoord",x);
	setValue("ycoord",y);
	setValue("zcoord",z);
	
	setValue("cdistance",calculateDistance(x,y,z,center.coords[0],center.coords[1],center.coords[2]) +" ly");
	setValue("pdistance",calculateDistance(x,y,z,pilgrim.coords[0],pilgrim.coords[1],pilgrim.coords[2]) +" ly");
	setValue("pjumps",Math.ceil(calculateDistance(x,y,z,pilgrim.coords[0],pilgrim.coords[1],pilgrim.coords[2])/400.0));
	drawCanvas();
	
}

function calculateLocation(){
	var elementValue = document.getElementById("userlocation").value;
	var data = elementValue.split(':');
	
	hideMessages();
	userLocation.enabled = false;
	
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

	userLocation.enabled = true;
	showLocationInfo(x,y,z);	
}
