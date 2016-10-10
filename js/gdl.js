
var center = {
  coords: [2047,127,2047],
  name: 'Galaxy Center',
  mapCoords : [0,0,0]
};

var pilgrim = {
  coords: [0x64a,0x0082,0x1b9],
  name: 'Pilgrim Star',
  mapCoords : [0,0,0]
};

var userLocation = {
  coords: [0xeeb,0x0081,0x91a],
  name: 'User Location',
  enabled: false,
  mapCoords : [0,0,0]
}



var wp = undefined;
var hp = undefined;

var canvasWidth = undefined;
var canvasHeight = undefined;
var realCanvasWidth = undefined;
var realCanvasHeight = undefined;
var ctx = undefined;
var legendPercent = undefined;


var svgHelper = {
	
	svg : undefined,
	parent: undefined,
	
	init: function(domId, a, b){
		this.parent = document.getElementById("svgp");
		this.svg = document.getElementById("svgc");
						
		if(a == undefined){				
			var parent = document.getElementById("plotparent");
			
			var pwith = parent.getBoundingClientRect().width*0.9;
			var aspect = (document.documentElement.clientHeight*1.0/document.documentElement.clientWidth);
			if(document.documentElement.clientHeight > document.documentElement.clientWidth){
				aspect = (document.documentElement.clientWidth*1.0/document.documentElement.clientHeight);
			}
			
			wp = parent.getBoundingClientRect().width * 0.9;
			hp = wp * aspect; 
		}else{
			wp = a;
			hp = b;
		}
	
		this.svg.setAttribute("width",wp);
		this.svg.setAttribute("height",hp);
		this.clearContent(this.svg);

	},
	
	transformCoords : function (obj){
		var mX = 4096;
		var mZ = 4096;
		
		obj.mapCoords[0] = obj.coords[0] * wp / mX;
		obj.mapCoords[1] = obj.coords[1];
		obj.mapCoords[2] = obj.coords[2] * hp / mZ;
	},

	clearContent : function(node){
		while (node.firstChild) {
			node.removeChild(node.firstChild);
		}
	},
	
	addNode : function(type, attributes, content){
		var domObj = document.createElementNS("http://www.w3.org/2000/svg",type);
		for(i = 0;i<attributes.length;i+=2){
			domObj.setAttribute(attributes[i],""+attributes[i+1]);
		}
		if(content!=undefined && content!=null){
			domObj.innerHTML+=""+content;
		}
		this.svg.appendChild(domObj);
	},
	
	drawSvg : function(){
		
		this.clearContent(this.svg);
		
		this.drawGrid();
		this.drawAxis();
		
		this.transformCoords(center);
		this.transformCoords(pilgrim);
		this.transformCoords(userLocation);
		
		this.drawStar(center,6,'#7672E8');
		this.drawStar(pilgrim,4,'orange');
		
		if(userLocation.enabled){
			this.drawStar(userLocation,4,'#36AC3A');
			this.drawTravel(userLocation.mapCoords[0],userLocation.mapCoords[2],pilgrim.mapCoords[0],pilgrim.mapCoords[2]);
		}

	},
	

	drawGrid : function(){
		var step = 30;
		var localHtml = "";
		
		var color = 153; // 0x99

		for(var i = step;i<wp;i+=step){		
			this.addNode("line", ["x1",i,"y1",0,"x2",i,"y2",hp, "style","stroke:rgb(153,153,153); stroke-width:1;"]);
			
		}
		for(var i = step;i<hp;i+=step){
			this.addNode("line", ["x1",0,"y1",i,"x2",wp,"y2",i, "style","stroke:rgb(153,153,153); stroke-width:1;"]);
		}
		
	},
	
	drawStar : function(obj,size, fillStyle){
		var centerX = obj.mapCoords[0];
		var centerZ = obj.mapCoords[2];
		
		var template = '<circle cx="{{centerX}}" cy="{{centerZ}}" r="{{size}}" stroke="{{fillStyle}}" stroke-width="1" fill="{{fillStyle}}"></circle>';
		this.addNode("circle",["cx",centerX,"cy",centerZ,"r",size,"stroke",fillStyle,"stroke-width","1","fill",fillStyle]);
	},
	drawText : function(textStr, x,y) {
		var color = "white";
		this.addNode("text", ["dy",".75em","x",x,"y",y,"fill",color],textStr);
	},
	
	drawArrow : function(x1,y1,x2,y2){
		var color = 255;

		var document = 
		this.addNode("line", ["x1",x1,"y1",y1,"x2",x2,"y2",y2, "style","stroke:rgb(255,255,255); stroke-width:1;"]);
		
		var headlen = 10;   
		var angle = Math.atan2(y2-y1,x2-x1);	
		var pathText ="";
		pathText += Mustache.render("M{{a}} {{b}} ", {a: x2,b:y2});
		pathText += Mustache.render("L{{a}} {{b}} ", {a: x2-headlen*Math.cos(angle-Math.PI/6),b: y2-headlen*Math.sin(angle-Math.PI/6) });
		pathText += Mustache.render("L{{a}} {{b}} ", {a: x2-headlen*Math.cos(angle+Math.PI/6),b: y2-headlen*Math.sin(angle+Math.PI/6) });
		pathText+= " Z";
		this.addNode("path", ["d",pathText,"fill","white"]);

	},
	
	drawAxis : function (){
		this.drawText("X",140,25);
		this.drawArrow(10,10,150,10);
		this.drawText("Z",18,150);
		this.drawArrow(10,10,10,150);
	}
	
};


var canvasHelper = {

	init: function(domId){
		var canvas = document.getElementById("plotc");
		var parentPercent = 0.9;
		legendPercent = 0.0;
		
		var parent = document.getElementById("plotparent");
		wp = parent.getBoundingClientRect().width * parentPercent;
		hp = wp * (document.documentElement.clientHeight*1.0/document.documentElement.clientWidth); 

		realCanvasWidth = wp;
		realCanvasHeight = hp;
		
		canvas.setAttribute("width",wp);
		canvas.setAttribute("height",hp);
		canvas.setAttribute("css","{width:'"+wp+"p‌​x',height:'"+hp+"px';}");

		canvasWidth = wp;
		canvasHeight = hp;
		ctx = canvas.getContext("2d");	 	
		
	},

	drawGrid : function (){
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
	},
	
	drawDot : function (x,z,size,fillStyle){
		var radius = size;
		
		ctx.beginPath();
		ctx.arc(x, z, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle = fillStyle;
		ctx.fill();
	},
	
	drawStar : function (x,z, size, fillStyle){
		var zX = 0;
		var zZ = 0;
		var mX = 4096;
		var mZ = 4096;
		
		var centerX = x * canvasWidth / mX;
		var centerZ = z * canvasHeight / mZ;
		this.drawDot(centerX,centerZ,size,fillStyle);
	},
	
	drawText : function (text, x,y){
		ctx.font="15px Georgia";
		ctx.fillText(text,x,y);
	},
	
	drawArrow : function (fromx, fromy, tox, toy){
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
	},
	
	drawAxis : function (){
		ctx.fillStyle = '#ffffff';
		ctx.strokeStyle = '#ffffff';
		this.drawText("X",140,30);
		this.drawArrow(10,10,150,10);
		this.drawText("Z",18,150);
		this.drawArrow(10,10,10,150);
	},
	
	drawCanvas: function (){
		ctx.clearRect(0, 0, realCanvasWidth, realCanvasHeight);
		this.drawGrid();
		this.drawAxis();
		this.drawStar(center.coords[0], center.coords[2],6,'#7672E8');
		this.drawStar(pilgrim.coords[0], pilgrim.coords[2],4,'orange');
		
		if(userLocation.enabled){
			this.drawStar(userLocation.coords[0], userLocation.coords[2],4,'#36AC3A');
		}
	
	}
	
}



function generateMap(){

	// Draw using canvas
	//canvasHelper.init("plotc");
	//canvasHelper.drawCanvas();
	
	
	// Draw on SVG
	svgHelper.init("galsvg",wp,hp);
	svgHelper.drawSvg();
	
}

function hideMessages(){
	var elementA = document.getElementById("errorMessage");
	var elementB = document.getElementById("locationInfo");
	
	elementA.className = elementA.className + " hidden";
	elementB.className = "hidden";
}

function showErrorMessage(text){
	var element = document.getElementById("errorMessage");
	element.className = "card indigo";
	var elementText = document.getElementById("errorMessageText");
	elementText.innerHTML = text;
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

	//canvasHelper.drawCanvas();
	svgHelper.drawSvg();
	
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
