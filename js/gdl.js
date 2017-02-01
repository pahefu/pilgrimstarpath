// Class prototype

var orangeColor = "#ffa500";
var re = new RegExp("[A-Z]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var lazyRe = new RegExp("[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var uberLazyRe = new RegExp("[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var lolExtremeLazyRe = new RegExp("[0-9A-F]+ [0-9A-F]+ [0-9A-F]+");

function generateMap(){
	galaxyMapApp.initialize();
	compassApp.initialize();
	
	var re = new RegExp("to=[0-9A-F]+:[0-9A-F]+:[0-9A-F]+[:]*[0-9A-F]*");
	var res = re.exec(window.location.search);
	
	if(res!=null){
		textHandler.parseLine(res[0].replace("to=",""),
			function(x,y,z,name,color){
				destinationApp.addDest(x,y,z,name,color);
				destinationApp.selectedDestination+=1;
			},
			function(){}
			,"Shared location",null
		);
	}
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
    initialize: function(x,y,z, name, color, index) {
		this.coords = [x,y,z];
		this.mapCoords = [0,0,0];
		this.name = name;	
		this.enabled = false; // User Location Only
		this.color = color;
		this.index = index;
		this.distance = "";
		this.jumps = "";
    },
	updateCoords : function (x,y,z) { this.coords = [x,y,z];},
	updateMapCoords : function(mapW, mapH){
		var mX = 4096;
		var mZ = 4096;
		this.mapCoords[0] = this.coords[0] * mapW / mX;
		this.mapCoords[1] = this.coords[1];
		this.mapCoords[2] = this.coords[2] * mapH / mZ;
	},
	getX : function() { return this.coords[0];},
	getY : function() { return this.coords[1];},
	getZ : function() { return this.coords[2];},
	getMapX : function() { return this.mapCoords[0];},
	getMapY : function() { return this.mapCoords[1];},
	getMapZ : function() { return this.mapCoords[2];},
	getMapTextX : function () {return this.mapCoords[0] +10;},
	getMapTextZ : function () {return this.mapCoords[2] -5;},
	getHexStr : function() { return toHex(this.getX(),4)+":"+toHex(this.getY(),4)+":"+toHex(this.getZ(),4)},
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

var textHandler = {
	okLines : "",
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
				}else{
					reResult = lolExtremeLazyRe.exec(line);
					if(reResult!=null){
						data = reResult[0].split(" ");
					}
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
		this.okLines = "";
		
		for(var i = 0;i<lines.length;i++){		
			var search = localRe.exec(lines[i]);
			if (search!=null && search.input.indexOf("|")>0){

				if(search[0] == "0000:1111:2222:3333"){
					continue;
				}
				var name = lines[i].substring(0,lines[i].indexOf("|")).replace(/[\*\[\]]/gi, '');
		
				this.okLines+=lines[i]+"\n";
			}
		}
		
		destinationApp.addBatchText(this.okLines, true);

		$("#redditbtnlist").toggleClass("hide");
		$("#redditbtnlist").toggleClass("show");
		
	},
	addRedRec : function(data){ this.addRed(data,"Rec") },
	addRedLast : function(data){ this.addRed(data,"Last") },
	grabRed : function(type){
		if(isValueNull(type)){
			
			$("#redditbtnlist").toggleClass("hide");
			$("#redditbtnlist").toggleClass("show");
		}else{
			$.ajax({ 
				url: 'https://www.reddit.com/r/nomanshigh/comments/5a7ovn/share_your_coordinates_recommend_planets_log_and/.json?limit=1&amp;jsonp=textHandler.addRed'+type
			});
		}
	}
};

var mathHandler = {
	calculateLine : function(obj1, obj2){
		var line = {
			m : 0,
			b : 0,
			x1: 0,
			x2: 0,
			y1: 0,
			y2: 0,
			generate : function(obj1,obj2){
				this.y1 = obj1.getZ();
				this.y2 = obj2.getZ();
				this.x1 = obj1.getX();
				this.x2 = obj2.getX();
				this.m = (this.y2 - this.y1) / (this.x2 - this.x1);
				this.b = (this.y1 - (this.m*this.x1));
			},
			getY : function(xValue){
				return Math.ceil(this.m*xValue + this.b);
			},
			getNextX : function(stepCount){
				var dx = (this.x2 - this.x1);
				var negative = (dx<0);
				
				var stepX = (!negative) ? Math.ceil(dx / 400.0) : (-1)*Math.ceil(-1*dx / 400.0) ;
				var localX = Math.ceil(this.x1) + stepX*stepCount;
				
				if(this.x1 < this.x2){
					return (localX<= this.x2) ? localX : undefined;
				}else{
					return (localX>= this.x2) ? localX : undefined;
				}
				
			},
			printSteps : function(stepCount){				
				var localX = 0;			
				for(var i = 0;i<stepCount;i++){
					localX = this.getNextX(i);
					if(localX>this.x2){
						break;
					}
				}
			}
		};
		line.generate(obj1,obj2);
		return line;
	}
}

var userLocationApp = new Vue({
	el: '#userLocationApp',
	data: {
		userLocation : new Region(0x0,0x0,0x0,'User Location','#36AC3A'), // This is region APP
		firstPush : false,
		locationValid: false,
		locationText : "",
		errorMessage : "",
		center : undefined
	},
	methods:{
		calculateLocation : function(){
			this.firstPush = true;
			this.center = destinationApp.center;
			var parentThis = this;
			textHandler.parseLine(this.locationText, function(x,y,z,name,color){
				parentThis.userLocation.updateCoords(x,y,z);
				parentThis.userLocation.updateMapCoords(galaxyMapApp.width, galaxyMapApp.height);
				parentThis.locationValid = true;
				
				destinationApp.reSyncFromUser(parentThis.userLocation); // Notify others, huh!
				galaxyMapApp.syncUserLocation(parentThis.userLocation); // Resync data --> MAP
				galaxyMapApp.showBlackHoleRing = false; // Not blackhole if you move
				compassApp.syncCompass(); // Sync our current compass
				heightMapApp.syncDiff();
			}, 
			function(){
				parentThis.locationValid = false;
				parentThis.errorMessage = "Invalid format for location";
			}, 	
			null, null);
		},
		drawBHZone : function (){ // Redirect
			this.firstPush = true;
			if(!this.locationValid){
				this.errorMessage = "Calculate your location first!";
				return;
			}
			galaxyMapApp.drawBHZone();
		}
	}
});

var destinationApp = new Vue({
	el : '#destinationApp',
	data : {
		center: new Region(2047,127,2047,'Galaxy Center','#7672E8' ),
		destinationsText : "",
		destinations : [
			new Region(0x64a,0x082,0x1b9,'Pilgrim Star',orangeColor,0), 
			new Region(0x469,0x0081,0x0D6D,'Galactic Hub (R.E.)','#c0ca33',1)
		],
		selectedDestination : 1,
	},
	methods : {
		destinationObj : function(){
			return this.destinations[this.selectedDestination];
		},
		
		destinationName : function() {
			return this.destinationObj().name;
		},
		addDest : function(x,y,z, name, color){
			name = setDefaultValueIfNull(name,"Destination " + this.destinations.length);
			color = setDefaultValueIfNull(color,orangeColor);
			var found = false;
					
			var totalSameCoords = this.destinations.filter(function(dest){ return (dest.getX()==x && dest.getY()==y && dest.getZ()==z)});
			if(totalSameCoords.length!=0){
				found = true;
			}
			
			if(!found){
				this.destinations.push(new Region(x,y,z,name,color, this.destinations.length));
			}
		},	
		addBatchText : function(textLines, fromReddit){
			var lines = textLines.split("\n");		

			for(var i = 0;i<lines.length;i++){
				var name = null;
				if(fromReddit){
					name = lines[i].substring(0,lines[i].indexOf("|")).replace(/[\*\[\]]/gi, '');	
				}
				
				var data = textHandler.parseLine(lines[i], 
					function(x,y,z,name,color){
						destinationApp.addDest(x,y,z,name,color);
					},
					function(){
						
					},
					name,null);
			}
			galaxyMapApp.syncDestinations();
			heightMapApp.syncDiff();
		},
		addBatch : function(){
			this.addBatchText(this.destinationsText, false);		
		},
		deleteDest : function(index){
			if(this.destinations.length<2){
				return;
			}	
			var shadow = this.destinations.slice(0, index).concat(this.destinations.slice(index+1, this.destinations.length)); // shadowcopy
			for(var i = 0;i<shadow.length;i++){
				shadow[i].index = i;
			}
			this.destinations = shadow;
			this.selectedDestination = 0;	
			galaxyMapApp.syncDestinations();
			heightMapApp.syncDiff();
		},
		selectDest : function(index){	
			this.selectedDestination = index;
			compassApp.syncCompass();
			heightMapApp.syncDiff();
		},
		selectDestColor: function(index){
			colorPickerApp.showWindow(index);
		},
		addPilgrim : function(){
			this.addDest(0x64a,0x082,0x1b9,'Pilgrim Star',orangeColor);
		},		
		addRedHub: function(){
			this.addDest(0x469,0x0081,0x0D6D,'Galactic Hub (R.E.)','#c0ca33');			
		},
		addRedLast: function(){
			textHandler.grabRed("Last");
		},
		addRedRec: function(){
			textHandler.grabRed("Rec");
		},
		updateMapCoords : function(mapW, mapH){
			for(var i = 0;i<this.destinations.length; i++){				
				this.destinations[i].updateMapCoords(mapW,mapH);
			}			
			this.center.updateMapCoords(mapW, mapH);
		},
		reSyncFromUser : function(usrLoc){
			
			for(var i = 0;i < this.destinations.length;i++){
				var distance = usrLoc.calculateDistance(this.destinations[i]);
				this.destinations[i].distance = distance.toFixed(3);
				this.destinations[i].jumps = Math.ceil(distance/400.0);
			}
			
		}
	}
});

var galaxyMapApp = new Vue({
	el : '#galaxyMapApp',
	data: {
		width: 0,
		height: 0,
		aspect : 0,
		showBlackHoleRing: false,
		blackHoleRadius : {rx : 0, ry: 0},
		userApp : userLocationApp,
		userPoint : { mx : 0, mz: 0, mxT : 0, mzT: 0,name:"", color:""},
		center : destinationApp.center,
		destinations : destinationApp.destinations
	},
	methods : {
		initialize : function(){
			this.width = (this.$el).getBoundingClientRect().width * 0.99;
			this.aspect = (document.documentElement.clientWidth*1.0/document.documentElement.clientHeight);
			this.height =  this.width / this.aspect; 
			this.syncDestinations(); // Notify map info
		},
		
		drawBHZone : function(){
			var centerDist = this.userApp.userLocation.calculateDistance(this.center);
			var outterDistance = (centerDist-1000)/100.0;
			var innerDistance = (centerDist-2000)/100.0;
				
			var aspectX = (this.width/4096);
			var aspectY = (this.height/4096);

			var rx = (outterDistance) *(aspectX);
			var ry = (outterDistance) *(aspectY);
			
			//var cx = center.getX()*aspectX;
			//var cy = center.getZ()*aspectY;
			this.blackHoleRadius.rx = rx-5;
			this.blackHoleRadius.ry = ry-5;
			this.showBlackHoleRing = true;
			
		},
		syncUserLocation : function(obj){
			this.userPoint = { mx : obj.getMapX(), mz: obj.getMapZ(), mxT : obj.getMapTextX(), mzT: obj.getMapTextZ() ,name: obj.name, color:obj.color};
		},
		
		syncDestinations : function(){
			this.destinations = destinationApp.destinations;
			destinationApp.updateMapCoords(this.width, this.height);
			// send map
		}
	}
	
});

var heightMapApp = new Vue({
	el: '#heightMapApp',
	data: {
		userApp : userLocationApp,
		destApp : destinationApp,
		destinations : []
	},
	methods:{
		syncDiff : function(){
			var u = this.userApp.userLocation;
			var dd = this.destApp.destinations;
			var si = this.destApp.selectedDestination;
			var copy = dd.slice(0,dd.length);
			var dest = copy[si];
			
			var destinations = []
			var diff = function(a,b){
				var r = b-a;
				return (r > 0) ? ("-" +r) : ("+" +r*-1);
			}
			
			function getDiffTxt(u,dest){
				var localDiff = diff (u.getY(), dest.getY());
				var txt = "Go " + Math.abs(localDiff) + " ";
				txt+=(localDiff>0) ? "Down" : "Up";
			}
			
			destinations.push( { name: dest.name, diffTxt : getDiffTxt(u,dest) });
			
			for(var j = 0;j<copy.length ;j++){
				if(destinations.length == 10) { break; }
				if(j==si) { continue; }
				destinations.push( { name: copy[j].name, diffTxt : getDiffTxt(u,dest) });
			}
			
			this.destinations = destinations;
			
		}
	}
});

var compassApp = new Vue({
	el: '#compassApp',
	data: {
		width: 0,
		height: 0,
		aspect : 0,
		userApp : userLocationApp,
		userPoint : { mx : 0, mz: 0, mxT : 0, mzT: 0,name:"", color:""},
		selectedDestinationName : destinationApp.destinationName(),
		compassDegrees : 0,
		compassDir : 'left',
		compassRadius : 50,
		rotateStr : ''
	},
	methods:{
		initialize : function(){
			this.width = (this.$el).getBoundingClientRect().width * 0.99;
			this.aspect = (document.documentElement.clientWidth*1.0/document.documentElement.clientHeight);
			this.height =  200; 
		},
		
		syncCompass : function(){
			this.selectedDestinationName = destinationApp.destinationName();
	
			var v1 = userLocationApp.userLocation.getVector(destinationApp.center); 
			var v2 = userLocationApp.userLocation.getVector(destinationApp.destinationObj());
			var radians = v1.getDegreesVector(v2);
	
			var degrees = (radians*180/Math.PI)
			this.rotateStr = "rotate("+degrees+" 80 80)";
			this.compassDegrees = Math.abs(degrees).toFixed(2);
			this.compassDir = (degrees>0) ? "right" : "left";
			
			
		}
	}
	
});

var colorPickerApp = new Vue({
	el: '#colorPickerApp',
	data: {
		visible : false,
		colors : ["663300", "990000","990033","990099","9900cc","6600cc","333399","003399","006666",
			"339933","003300","333300","996633","ff9900","cc0066","ff9933","ffff00","99ff33","33cc33","00ff99"
		],
		destinationName : "",
		previousColor : "",
		newColor : {r:0,g:0,b:0},
		index : 0
	},
	methods:{
		
		getColor : function(n){
			return "#"+toHex(n.r,2)+toHex(n.g,2)+toHex(n.b,2);
		},
		
		getBgColor(index){
			return "background-color: #" + this.colors[index];
		},
		
		getPrevBgStr : function(){
			return "width:50px;height:50px;background-color : " + this.previousColor;
		},
		
		getBgStr : function(){
			return "width:50px;height:50px;background-color : " + this.getColor(this.newColor);
		},
		
		setColor : function(element){
			if(element.target.id.indexOf("pc"!=-1)){
				var c = element.target.id.replace("pc","");
				this.newColor.r = fromHex(c.substr(1,2));
				this.newColor.g = fromHex(c.substr(3,2));
				this.newColor.b = fromHex(c.substr(5,2));
			}
		},
		
		showWindow : function (index){
			this.index = index;
			this.newColor = {r:125,g:125,b:125};
			this.previousColor = destinationApp.destinations[index].color;
			this.destinationName = destinationApp.destinations[index].name;
			this.visible = true;
		},
		apply : function(){
			// Generate new color, apply to the system itself
			destinationApp.destinations[this.index].color = this.getColor(this.newColor);
			this.close();
		},
		close : function (){
			this.visible = false;
		}
		
	}
	
});