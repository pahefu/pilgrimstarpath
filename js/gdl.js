// Class prototype

function isValueNull(variable){
	return (variable == undefined || variable == null);
}

function setDefaultValueIfNull(variable, defaultVal){
	if(isValueNull(variable)) { variable = defaultVal; }
	return variable;
}

var Class = function(methods) {   
    var klass = function() {    
        this.initialize.apply(this, arguments);          
    };  
    
    for (var property in methods) { 
       klass.prototype[property] = methods[property];
    }
          
    if (!klass.prototype.initialize) klass.prototype.initialize = function(){};      
    
    return klass;    
};

var Region = Class({ 
    initialize: function(x,y,z, name, color) {
		this.coords = [x,y,z];
		this.mapCoords = [0,0,0];
		this.name = name;	
		this.enabled = false; // User Location Only
		this.color = color;
    },
	updateCoords : function (x,y,z) { this.coords = [x,y,z];},
	getX : function() { return this.coords[0];},
	getY : function() { return this.coords[1];},
	getZ : function() { return this.coords[2];},
	getMapX : function() { return this.mapCoords[0];},
	getMapY : function() { return this.mapCoords[1];},
	getMapZ : function() { return this.mapCoords[2];},
	getVector : function (otherR){

		var v = { a: 0, b:0, m: 0};
		v.a = (otherR.getX() - this.getX());
		v.b = (otherR.getZ() - this.getZ());
		v.m = Math.sqrt((v.a*v.a) + (v.b*v.b));

		v.getDegreesVector = function(otherV) {
			if(otherV.m == 0 || this.m == 0){
				return 0;
			}
			
			var radians =  Math.atan2(otherV.b,otherV.a) - Math.atan2(this.b,this.a);
			return radians;
		}
		return v;
	},
	calculateDistance : function(otherR){
		var dX = otherR.getX() - this.getX();
		var dY = otherR.getY() - this.getY();
		var dZ = otherR.getZ() - this.getZ();
	
		var distance = Math.sqrt(dX*dX + dY*dY + dZ*dZ);
		return distance*100; // NMS stuff
	}
	
});

var center = new Region(2047,127,2047,'Galaxy Center','#7672E8' );
var userLocation = new Region(0x0,0x0,0x0,'User Location','#36AC3A');
var destinations = [new Region(0x64a,0x082,0x1b9,'Pilgrim Star','orange')]; // Store for destinations (include one)

var re = new RegExp("[A-Z]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var lazyRe = new RegExp("[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var uberLazyRe = new RegExp("[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");

var galSvg = undefined; // Main SVG
var compSvg = undefined; // Compass SVG
var coordSvg = undefined; // Coordinates SVG
var centerDistSvg = undefined; // Distance to center SVG
var heightSvg = undefined; // HeightMap SVG
var customDestination = false;

var destinationDataState = {
	shown : true,
	height : 0,
	obj : undefined,
	txtObj : undefined,
	toggle : function(){
		if (this.obj==undefined){
			this.obj = document.getElementById("destinationdata");
			this.txtObj = document.getElementById("showhidelabel");
			this.height = this.obj.offsetHeight;
		}
		if(this.shown){
			this.obj.setAttribute("class","hidden");
			this.txtObj.setAttribute("class","icon-plus-circled");
			this.txtObj.setAttribute("title","Show list");
		}else{
			this.obj.setAttribute("class","visible");
			this.obj.setAttribute("style","min-height:"+this.height);
			this.txtObj.setAttribute("class","icon-minus-circled");
			this.txtObj.setAttribute("title","Hide list");
			
		}
		this.shown = !this.shown;
	}
	
};

var svgImage = Class({
	
	initialize: function(domId, parentDomId, width, height) {

		this.domIdName = domId;
		this.parent = $("#"+parentDomId)[0];
		this.svg = $("#" +domId)[0];
		this.wp = width;
		this.hp = height;
		
		var aspect;
		
		if(isValueNull(width)){		

			var parent = this.parent;
			
			aspect = (document.documentElement.clientHeight*1.0/document.documentElement.clientWidth);
			if(document.documentElement.clientHeight > document.documentElement.clientWidth){
				aspect = (document.documentElement.clientWidth*1.0/document.documentElement.clientHeight);
			}
			this.wp = parent.getBoundingClientRect().width * 0.99;
		}
		
		if(isValueNull(height)){
			//this.hp = this.wp;
			this.hp = this.wp * aspect; 
		}
		
		this.svg.setAttribute("width",this.wp);
		this.svg.setAttribute("height",this.hp);
		
    },
	
	clearContent : function(){
		while (this.svg.firstChild) {
			this.svg.removeChild(this.svg.firstChild);
		}
	},
	
	addNode : function(type, attributes, content){
		var domObj = document.createElementNS("http://www.w3.org/2000/svg",type);
		for(i = 0;i<attributes.length;i+=2){
			domObj.setAttribute(attributes[i],""+attributes[i+1]);
		}
		
		if(!isValueNull(content)){
			domObj.innerHTML+=""+content;
		}

		this.svg.appendChild(domObj);
	},
	
	fastAdd : function(type, attrs){
		var node = document.createElementNS("http://www.w3.org/2000/svg",type);
		attrs = attrs.split("|");
		if(attrs!=null && attrs.length>1){
			for(var i = 0;i<attrs.length;i+=2){
				node.setAttribute(attrs[i],""+attrs[i+1]);
			}
		}
		return node;
	},
	
	drawGrid : function(){
		var defsn = this.fastAdd("defs", "");
		var patternN = this.fastAdd("pattern","id|gridPattern|x|0|y|0|width|30|height|30|patternUnits|userSpaceOnUse");
		var rectN = this.fastAdd("rect","x|0|y|0|width|30|height|30|style|stroke: rgb(153,153,153);");
		
		var parentNode = document.getElementById(this.domIdName);
		
		patternN.appendChild(rectN);
		defsn.appendChild(patternN);

		var background = this.fastAdd("rect",Mustache.render('x|0|y|0|width|{{w}}|height|{{h}}|style|fill: url(#gridPattern);',{w :this.wp, h: this.hp} ));

		parentNode.appendChild(defsn);	
		parentNode.appendChild(background);	
		
	},
	
	drawText : function(textStr, x,y, color, fontsize) {
		color = setDefaultValueIfNull(color,"white");
		fontsize = setDefaultValueIfNull(fontsize,"0.75em");
		this.addNode("text", ["dy",fontsize,"x",x,"y",y,"fill",color],textStr);
	},
	
	drawArrow : function(x1,y1,x2,y2, stroke, fill){
		var color = 255;
		stroke = setDefaultValueIfNull(stroke,"stroke:rgb(255,255,255); stroke-width:1;");
		fill = setDefaultValueIfNull(fill,"white");
		
		var document = 
		this.addNode("line", ["x1",x1,"y1",y1,"x2",x2,"y2",y2, "style",stroke]);
		
		var headlen = 10;   
		var angle = Math.atan2(y2-y1,x2-x1);	
		var pathText ="";
		pathText += Mustache.render("M{{a}} {{b}} ", {a: x2,b:y2});
		pathText += Mustache.render("L{{a}} {{b}} ", {a: x2-headlen*Math.cos(angle-Math.PI/6),b: y2-headlen*Math.sin(angle-Math.PI/6) });
		pathText += Mustache.render("L{{a}} {{b}} ", {a: x2-headlen*Math.cos(angle+Math.PI/6),b: y2-headlen*Math.sin(angle+Math.PI/6) });
		pathText+= " Z";
		this.addNode("path", ["d",pathText,"fill",fill]);

	}

});

var destinationHandler = {
	syncDestinationList : function (){
		var destinationObj = document.getElementById("destinationlist");
		var localHtml = "";
		var template = document.getElementById("destinationtemplate").innerHTML;
		for(var i = 0;i<destinations.length;i++){
			var distance = (userLocation.enabled) ? ""+userLocation.calculateDistance(destinations[i]).toFixed(3) : "--";
			var jumps = (userLocation.enabled) ? ""+ Math.ceil(userLocation.calculateDistance(destinations[i])/400.0) : "--";
			
			var x = ('0000'+((destinations[i].getX()).toString(16))).slice(-4).toUpperCase();
			var y = ('0000'+((destinations[i].getY()).toString(16))).slice(-4).toUpperCase();
			var z = ('0000'+((destinations[i].getZ()).toString(16))).slice(-4).toUpperCase();
			
			localHtml+=Mustache.render(template,{id:i, name: destinations[i].name , distance:distance, jumps:jumps, x:x,y:y,z:z});
		}
		destinationObj.innerHTML = localHtml;
	
		galSvg.drawSvg(); // Draw general map
	},
	
	parseLine : function (line, okCb, errorCb, name,color){
		var data = undefined;
		line = line.toUpperCase();
		var reResult = re.exec(line);
		if(reResult!=null){
			data = reResult[0].split(":");
			data.shift();
		}else{
			reResult = lazyRe.exec(line);
			if(reResult!=null){
				data = reResult[0].split(":");
			}else{
				
				reResult = uberLazyRe.exec(line);
				if(reResult!=null){
					data = reResult[0].split(":");
				}
				else{
					
				}
			}
		}
		
		if(data != undefined){
			var x = Number("0x"+data[0]);
			var y = Number("0x"+data[1]);
			var z = Number("0x"+data[2]);

			if(isNaN(x) || isNaN(y) || isNaN(z)){
				errorCb();
			}else{
				okCb(x,y,z,name,color);
			}
		}else{
			errorCb();
		}
		
	},
	
	addDest : function(x,y,z, name, color){	
		if(!destinationDataState.shown){
			destinationDataState.toggle();
		}
		name = setDefaultValueIfNull(name,"Destination " + destinations.length);
		color = setDefaultValueIfNull(color,"orange");
		
		var found = false;
				
		var totalSameCoords = destinations.filter(function(dest){ return (dest.getX()==x && dest.getY()==y && dest.getZ()==z)});
		if(totalSameCoords.length!=0){
			found = true;
		}
		
		if(!found){
			destinations.push(new Region(x,y,z,name,color));
		}
	},
	deleteDest : function(index){
		if(destinations.length<2){
			return;
		}	
		destinations.splice(index, 1);
		
		this.syncDestinationList();
	},
	updateDestName : function (index,obj){
		destinations[index].name = obj.value;
		galSvg.drawSvg();
	},
	addPilgrim : function(){
		this.addDest(0x64a,0x082,0x1b9,'Pilgrim Star','orange');
		this.syncDestinationList();
	},
	
	addBatch : function(){
		var remainingText = "";
		var destination = document.getElementById("destinationlocation");
		var lines = destination.value.split("\n");		
		for(var i = 0;i<lines.length;i++){
			var data = this.parseLine(lines[i], 
				function(x,y,z,name,color){
					destinationHandler.addDest(x,y,z,name,color);
				},
				function(){
					remainingText+=lines[i]+"\n";	
				},
				null,null);
		}
		destination.value = remainingText;
		this.syncDestinationList();
	},
	
	addRedHub: function(){
		this.addDest(0x469,0x0081,0x0D6D,'Galactic Hub (R.e.)','#ccff33');
		this.syncDestinationList();
		$("#redditbtnlist").toggleClass("hide");
		$("#redditbtnlist").toggleClass("show");
	},
	
	addRedLast: function(data){
		this.addRed(data, "Last");
	},
	addRedRec: function(data){
		this.addRed(data, "Rec");
	},
	addRed: function(data, type){
		
		var fullText = (data[0]['data']['children'][0]['data']['selftext']);
		
		var localRe = new RegExp("[A-Z]*[:]*[0-9A-F]+:[0-9A-F]+:[0-9A-F]+[:]*[0-9A-F]*");
		
		fullText = fullText.substring(fullText.indexOf("List"), fullText.indexOf("###RESOURCES AND HELP")).split("List: ");
		
		switch(type){
			case "Last":
				fullText = fullText.filter(function(x){ return (x.indexOf("Last")>=0 && x.indexOf("Last")<10);});
			break;
			
			case "Rec":
				fullText = fullText.filter(function(x){ return (x.indexOf("Rec")>=0 && x.indexOf("Rec")<10);});
			break;		
		}

		fullText = fullText.join("\n");
		var lines = fullText.split("\n");
		
		for(var i = 0;i<lines.length;i++){		
			var search = localRe.exec(lines[i]);
			if (search!=null && search.input.indexOf("|")>0){
				
				if(search[0] == "0000:1111:2222:3333"){
					continue;
				}
				var name = lines[i].substring(0,lines[i].indexOf("|")).replace(/[\*\[\]]/gi, '');
								
				this.parseLine(lines[i],
					function(x,y,z,name,color){
						destinationHandler.addDest(x,y,z,name,color);
					},
					function(){},
				name,null);
			}
		}
		this.syncDestinationList();
		
		$("#redditbtnlist").toggleClass("hide");
		$("#redditbtnlist").toggleClass("show");
		
	},
	
	grabRed : function(type){		

		if(isValueNull(type)){
			
			$("#redditbtnlist").toggleClass("hide");
			$("#redditbtnlist").toggleClass("show");
		}else{
			$.ajax({ 
				url: 'https://www.reddit.com/r/NoMansSkyTheGame/comments/5884yf/share_your_coordinates_recommend_planets_log_and/.json?limit=1&amp;jsonp=destinationHandler.addRed'+type
			});
		}
	}
};


function generateMap(){

	// Coordinates definition
	
	coordSvg = new svgImage("coordsvg","coordsvgp",null,100);
	coordSvg.drawCoords = function(x,y,z){
		
		var minx = 10;
		var maxx = 70;
		var miny = 70;
		var maxy = 10;
		
		var midx = 45;
		var midy = 35;

		this.clearContent();
		
		this.drawArrow(minx,miny, maxx,miny); // X axis
		this.drawArrow(minx,miny, minx,maxy); // Y axis
		this.drawArrow(minx,miny, midx,midy); // Z axis
				
		this.drawText("X coord: " +x,maxx+5,miny-10);
		this.drawText("Y coord: " +y,minx+5,maxy-10);
		this.drawText("Z coord: " +z,midx+10,midy-5);
		
	}
	
	// Distance to center definition
	
	centerDistSvg = new svgImage("centerdistsvg","centerdistsvgp",null,100);
	centerDistSvg.drawDistance = function(distance){
		this.clearContent();
		var distanceTxt = distance.toFixed(3) +" ly";
		this.drawText(distanceTxt + " to the center" ,0,(this.hp/2)-20);
		this.drawArrow(2,this.hp/2, this.wp-2, this.hp/2);
	}
	
	// Compass definition
	
	compSvg = new svgImage("compasssvg","compassp",null,200);
	compSvg.drawCompass = function(radius,radians){		
		this.clearContent();
		var pos = [80,80];
		
		var degrees = (radians*180/Math.PI);
		
		var x = pos[0];
		var y = pos[1]-radius;
		
		var transform = "rotate("+degrees+" 80 80)";
		
		this.addNode("circle",["cx",pos[0],"cy",pos[1],"r",radius,"style","stroke:rgb(153,153,153); stroke-width:2;","transform",transform]);
		this.addNode("line", ["x1",pos[0],"y1",pos[1],"x2",x,"y2",y, "style","stroke:rgb(123,123,230); stroke-width:2;"]);	
		this.addNode("line", ["x1",pos[0],"y1",pos[1],"x2",x,"y2",y, "style","stroke:rgb(255,0,0); stroke-width:4;","transform",transform]);		
		this.drawText("Center",75,10, center.color);
		
		var txt = document.getElementById("degreestxt");
		var txtDir = document.getElementById("degreesdirtxt");
		
		txt.innerHTML = ""+Math.abs(degrees).toFixed(2);
		txtDir.innerHTML = (degrees>0) ? "right" : "left";
		
	}

	// HeightMap definition
	
	heightSvg = new svgImage("heightsvg","heightsvgp",null,150);
	
	heightSvg.drawStar = function(obj, x, size, index){
		var centerX = x;
		var centerY = this.hp- (obj.mapCoords[1]* this.hp / 256);
		var fillStyle = obj.color;

		this.addNode("circle",["cx",centerX,"cy",centerY,"r",size,"stroke",fillStyle,"stroke-width","1","fill",fillStyle]);
		
		var name = (index == undefined || index == null) ? (obj.name[0]) : (obj.name[0] + (index+1));
		this.drawText(name,centerX+10,centerY-10,obj.color);
		
	}
	
	
	
	heightSvg.drawSvg = function(){
			this.clearContent();	
			this.drawGrid();
			this.drawArrow(5,this.hp-2, 5,20);
			this.drawText("Y",15,20)
			this.drawStar(userLocation,50,4);
			
			var maxDestinations = Math.min(destinations.length,7);
			
			for(var i = 0;i<maxDestinations;i++){
				this.drawStar(destinations[i],(i*40)+100,4,i);	
			}
	}
	
	// Gal Map definition
	galSvg = new svgImage("svgc","svgp",undefined, undefined);
	
	galSvg.transformCoords = function (obj){
			var mX = 4096;
			var mZ = 4096;
			obj.mapCoords[0] = obj.coords[0] * this.wp / mX;
			obj.mapCoords[1] = obj.coords[1];
			obj.mapCoords[2] = obj.coords[2] * this.hp / mZ;
	};
	
	
		
	galSvg.drawStar = function(obj,size){
		var centerX = obj.getMapX();
		var centerZ = obj.getMapZ();
		var fillStyle = obj.color;
		this.addNode("circle",["cx",centerX,"cy",centerZ,"r",size,"stroke",fillStyle,"stroke-width","1","fill",fillStyle]);
		this.drawText(obj.name,centerX+10, centerZ-10, "white");
	};
			
	galSvg.drawAxis = function (){
		this.drawText("X",140,25);
		this.drawArrow(10,10,150,10);
		this.drawText("Z",18,150);
		this.drawArrow(10,10,10,150);
	};
	
	galSvg.drawBHZone = function(){
		
		if(!userLocation.enabled){
			showErrorMessage("Calculate your location first!");
			return;
		}
		
		var minX = 9999; var maxX = 0;
		var localD = 0;
		var found = false;
		
		var centerDist = userLocation.calculateDistance(center);
		
		var outterDistance = (centerDist-1000)/100.0;
		var innerDistance = (centerDist-2000)/100.0;
			
		var aspectX = (this.wp/4096);
		var aspectY = (this.hp/4096);

		var rx = (outterDistance) *(aspectX);
		var ry = (outterDistance) *(aspectY);
		
		var cx = center.getX()*aspectX;
		var cy = center.getZ()*aspectY;

		var innerNode = this.fastAdd("ellipse",Mustache.render("cx|{{cx}}|cy|{{cy}}|rx|{{rx}}|ry|{{ry}}|style|stroke:rgb(255,0,0);stroke-width:5px;stroke-opacity:0.3;fill:none;",{ cx:cx, cy:cy, rx:rx-5,ry:ry-5 }));
		this.svg.appendChild(innerNode);
		
	}

	galSvg.drawSvg = function(){

			this.clearContent();	
			this.drawGrid();
			this.drawAxis();
			
			this.transformCoords(center);		
			this.transformCoords(userLocation);
			
			if(userLocation.enabled){
				var backgroundBh = this.fastAdd("rect","id|bhMap|x|0|y|0|width|0|height|0|style|fill: rgb(250,215,212); fill-opacity:0.2");
				document.getElementById(this.domIdName).appendChild(backgroundBh);	
			}

			// Draw all locations even if there is no user
			for(var i = 0;i<destinations.length;i++){
				this.transformCoords(destinations[i]);	
				this.drawStar(destinations[i],4);
			}
			
			this.drawStar(center,6);
		
			if(userLocation.enabled){
				this.drawStar(userLocation,4);

				var v1 = userLocation.getVector(center); 
				var v2 = userLocation.getVector(destinations[0]);

				var angle = v1.getDegreesVector(v2);		
				
				compSvg.initialize("compasssvg","compassp",null,200);
				compSvg.drawCompass(50,angle);
				
				heightSvg.initialize("heightsvg","heightsvgp",null,150);
				heightSvg.drawSvg();
				
				
				
				
			}
	};
	
	var re = new RegExp("to=[A-Z]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
	var res = re.exec(window.location.search);
	
	if(res!=null){
		destinationHandler.parseLine(res[0].replace("to=",""),
			function(x,y,z,name,color){
				destinationHandler.addDest(x,y,z,name,color);
			},
			function(){}
			,"Shared location",null
		);
		destinationHandler.deleteDest(0);
	}
	destinationHandler.syncDestinationList(); // So draws it too inside

}

function hideMessages(){
	var elementA = document.getElementById("errorMessage");
	var elementB = document.getElementById("locationInfo");
	var elementC = document.getElementById("directionsmap");
	
	elementA.className = elementA.className + " hidden";
	elementB.className = "hidden";
	elementC.className = "hidden";
}

function showErrorMessage(text){
	var element = document.getElementById("errorMessage");
	element.className = "card blue-grey indigo";
	var elementText = document.getElementById("errorMessageText");
	elementText.innerHTML = text;
}

function setValue(domId,value){
	var element = document.getElementById(domId);
	element.innerHTML = value;
}

function showLocationInfo(x,y,z){
	var element = document.getElementById("locationInfo");
	element.className = "visible";
	
	var elementB = document.getElementById("directionsmap");
	elementB.className = "visible";
	
	userLocation.updateCoords(x,y,z);
			
	centerDistSvg.initialize("centerdistsvg","centerdistsvgp",null,100);
	centerDistSvg.drawDistance(userLocation.calculateDistance(center));
	
	coordSvg.initialize("coordsvg","coordsvgp",null,100);
	coordSvg.drawCoords(x,y,z);
	
	destinationHandler.syncDestinationList();


}

function calculateLocation(){
	var elementValue = document.getElementById("userlocation").value;
	
	hideMessages();
	userLocation.enabled = false;
	
	destinationHandler.parseLine(elementValue, 
		function(x,y,z,name,color){
			userLocation.enabled = true;
			showLocationInfo(x,y,z);	
		}, 
		function(){
			showErrorMessage("Invalid format for location");
		}, 
	null, null);
}


