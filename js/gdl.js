// Pahefu @ 2017
// Fixes, updates, performance checks, civilizations at Federation support

var orangeColor = "#ffa500";
var re = new RegExp("[A-Z]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var lazyRe = new RegExp("[0-9A-F]+:[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var uberLazyRe = new RegExp("[0-9A-F]+:[0-9A-F]+:[0-9A-F]+");
var lolExtremeLazyRe = new RegExp("[0-9A-F]+ [0-9A-F]+ [0-9A-F]+");

/* Preconfiguration*/

$('.menuitem').click(function(){
   $(".menuitem").removeClass("active");
   $(".page").removeClass("active");
   $(this).addClass("active");
   $("#"+$(this).attr("rel")).addClass("active");
});

rivets.configure({
	templateDelimiters: ['{{', '}}']
});
rivets.formatters.plus = function(item,plus) {return item+plus };

/* Aux functions */

function toHex(str, totalChars){
	totalChars = (totalChars) ? totalChars : 2;
	str = (Array(totalChars).join("0")+Number(str).toString(16)).slice(-totalChars).toUpperCase();	
	return str;
}

function fromHex(str){
	return parseInt(str,16);
}

/* Code Functionality */

function generateMap(){

	galaxyMapApp.initialize(); // Init the map first to get W/H
	settingsApp.initialize(); // Do the setting loading here... after maps can be tweaked
	
	destinationApp.initialize();
	localRadarApp.initialize();

	helpApp.loadQuestionsFromWiki();
	federationsApp.loadFederationsFromWiki();
	
	// Handle URL parameters <<< HERE
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


function wikiAsync(page, okCallback, justHtml){
	var url = 'https://nomanssky.gamepedia.com/api.php?action=parse&format=json&prop=wikitext&page='+page;
	
	if(justHtml){
		url = 'https://nomanssky.gamepedia.com/api.php?action=parse&format=json&page='+page;
	}
	$.ajax({ 
		url: url,
		dataType: 'jsonp',
		success: okCallback
	});
}

function Region(x,y,z, name, color, index){
	if (!(this instanceof Region)) return new Region(x,y,z, name, color, index);

	this.coords = [x,y,z];
	this.mapCoords = [0,0,0];
	this.name = name;	
	this.enabled = false; // User Location Only
	this.color = color;
	this.index = index;
	this.distance = "";
	this.distanceLineal = "";
	this.jumps = "";
	this.federation = false;
    
	this.updateCoords = function (x,y,z) { this.coords = [x,y,z];};
	
	this.updateMapCoords = function(mapW, mapH){
		var mX = 4096;
		var mZ = 4096;
		this.mapCoords[0] = this.coords[0] * mapW / mX;
		this.mapCoords[1] = this.coords[1];
		this.mapCoords[2] = this.coords[2] * mapH / mZ;
	};
	
	this.getHexStr = function() { return toHex(this.coords[0],4)+":"+toHex(this.coords[1],4)+":"+toHex(this.coords[2],4)};
	
	this.getVector = function (otherR){

		var v = { a: 0, b:0, m: 0};
		v.a = (otherR.coords[0] - this.coords[0]);
		v.b = (otherR.coords[2] - this.coords[2]);
		v.m = Math.sqrt((v.a*v.a) + (v.b*v.b));

		v.getDegreesVector = function(otherV) {
			if(otherV.m == 0 || this.m == 0){
				return 0;
			}
			var radians =  Math.atan2(otherV.b,otherV.a) - Math.atan2(this.b,this.a);
			return radians;
		}
		return v;
	};
	this.calculateDistance = function(otherR){
		var dX = otherR.coords[0] - this.coords[0];
		var dY = otherR.coords[1] - this.coords[1];
		var dZ = otherR.coords[2] - this.coords[2];
	
		var distance = Math.sqrt(dX*dX + dY*dY + dZ*dZ);
		return distance*100; // NMS stuff
	};
	
};

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
	}

};

var commonData = {
	center: new Region(2047,127,2047,'Galaxy Center','#7672E8' ),
	userLocation : new Region(0x0,0x0,0x0,'User Location','#36AC3A'), // This is region APP
	destinations : [],
	selectedFederation : null,
	selectedDestination : 1,
	selectedDestinationObj : undefined,
	selectedDestinationName: "",
	localRadarRange: 25,
	jumpRange : 1600,
	degrees: 0,
	degreesDir: "left",
	degreesTransf: "",
	coffeeHint: "",
	shouldUseBh : false,
	heightNotOK : false,
	heightDiff: 0,
	heightDir: "",
	
	locationChangeCallbacks : [],
	destinationsChangeCallbacks : [],
	triggerCallback: function(cbs){
		for(var i = 0;i<cbs.length;i++){
			cbs[i]();
		}
	},
	
	onLocationChange: function(){
		commonData.triggerCallback(commonData.locationChangeCallbacks);
	},
	onDestinationsChange: function(){
		commonData.triggerCallback(commonData.destinationsChangeCallbacks);
	}
};

var userLocationApp = {
	
	userLocation: commonData.userLocation,
	firstPush : false,
	locationValid: false,
	locationText : "",
	errorMessage : "",
	center : commonData.center,
	common: commonData,
	showCompass: false,
	showBhHelper: false,
	lastJumpDistanceText: "",
	
	
	calculateLocation : function(){
		
		var pThis = userLocationApp;
		pThis.firstPush = true;		
		textHandler.parseLine(pThis.locationText, 
			function(x,y,z,name,color){ // OK Callback
				var common = commonData;
				common.userLocation.updateCoords(x,y,z);
				common.userLocation.updateMapCoords(galaxyMapApp.width, galaxyMapApp.height);
				common.userLocation.distance = common.userLocation.calculateDistance(common.center).toFixed(3);
				userLocationApp.locationValid = true;
				galaxyMapApp.showBlackHoleRing = false; // No blackhole if you move
				galaxyMapApp.showAreaHint = false;
				
				// Trigger waterfall events!
				common.onLocationChange();
				
				federationsApp.syncDistanceToUser();
			}, 
			function(){
				userLocationApp.locationValid = false;
				userLocationApp.errorMessage = "Grah! Invalid format for location";
			}, 	
			null, null
		);
	},
	toggleCompass : function(){
		userLocationApp.showCompass = !userLocationApp.showCompass;
	},
	toggleBhHelper : function(){
		userLocationApp.showBhHelper = !userLocationApp.showBhHelper;
	},
	drawAreaHint : function(){
		var pThis = userLocationApp;
		var jdt = (Number(pThis.lastJumpDistanceText));
		galaxyMapApp.drawAreaHint(jdt /4.0, true); // Linear dist fix
	},
	drawBHZone : function (){ // Redirect
		
		var pThis = userLocationApp;
		pThis.firstPush = true;
		
		if(!pThis.locationValid){
			pThis.errorMessage = "Grah!! Calculate your location first!";
			return;
		}
		galaxyMapApp.drawBHZone();
		
	}
};

var userLocationAppBind = rivets.bind($("#userLocationNode")[0], userLocationApp);

var destinationApp = {
	el : '#destinationApp',
	center : commonData.center,
	destinations : commonData.destinations,
	destinationsText : "",
	wikiLoading : false,
	initialize : function(){
		// Initialize custom destinations here
		this.addDest(0x64a,0x082,0x1b9,'Pilgrim Star',orangeColor);
		this.addDest(0x469,0x0081,0x0D6D,'Galactic Hub','#c0ca33'); this.destinations[1].federation = true; // trick here
		
		if(commonData.selectedFederation){
			var s = commonData.selectedFederation;
			this.setFederationDest(s.coords[0], s.coords[1],s.coords[2],s.name, s.color,false);
		}
		
		this.changeDest(1); // Force it
		
		// Initialize stuff
		commonData.selectedDestinationObj = commonData.destinations[commonData.selectedDestination];
		commonData.selectedDestinationName = commonData.selectedDestinationObj.name;
		// Grab changes from user location
		commonData.locationChangeCallbacks.push(destinationApp.reSyncDistanceToUser);
		commonData.locationChangeCallbacks.push(destinationApp.reSyncDegrees);
	},
	changeDest: function(index){
		commonData.selectedDestination = index;
		// Initialize stuff
		commonData.selectedDestinationObj = commonData.destinations[commonData.selectedDestination];
		commonData.selectedDestinationName = commonData.selectedDestinationObj.name;
	},
	addDest : function(x,y,z, name, color){
		name = (name) ? name : ("Destination " + commonData.destinations.length);
		color = (color) ? color : orangeColor;
						
		var totalSameCoords = commonData.destinations.filter(function(dest){ return (dest.coords[0]==x && dest.coords[1]==y && dest.coords[2]==z)});
		if(totalSameCoords.length==0){
			var newRe = new Region(x,y,z,name,color, commonData.destinations.length);
			newRe.updateMapCoords(galaxyMapApp.width, galaxyMapApp.height);
			commonData.destinations.push(newRe);
		}
	},	
	
	addBatchText : function(){
		var lines = destinationApp.destinationsText.split("\n");		

		for(var i = 0;i<lines.length;i++){
			var name = null;
			var data = textHandler.parseLine(lines[i], 
				function(x,y,z,name,color){
					destinationApp.addDest(x,y,z,name,color);
				},
				function(){},
				name,null
			);
		}
		commonData.onLocationChange(); // Force all updates!
	},
	
	deleteDest : function(){
		var pThis = destinationApp;
		if(pThis.destinations.length<2){
			return;
		}	
		
		var index = Number($(this).attr("rel"));
		for(var i = index;i<pThis.destinations.length-1;i++){
			pThis.destinations[i] = pThis.destinations[i+1];
			pThis.destinations[i].index = i;
		}
		pThis.destinations.pop();
		destinationApp.changeDest(0);	
		commonData.onLocationChange(); // Trigger waterfall events!
		
	},
	selectDest : function(){	
		destinationApp.changeDest(Number($(this).attr("rel")));	
		commonData.onLocationChange(); // Trigger waterfall events!
	},
	addPilgrim : function(){
		destinationApp.addDest(0x64a,0x082,0x1b9,'Pilgrim Star',orangeColor);
	},		
	addRedHub: function(){
		destinationApp.addDest(0x469,0x0081,0x0D6D,'Galactic Hub','#c0ca33');			
	},
	parseWikiLocations : function(data){
		var wikiRows = data.parse.wikitext["*"].split("\n");
		for(var i = 0;i<wikiRows.length;i++){
			if(wikiRows[i].indexOf("| ")==0){
				var values = wikiRows[i].replace("| ","").split(" || ");
				var name = values[0];
				var data = textHandler.parseLine(values[1], 
					function(x,y,z,name,color){
						destinationApp.addDest(x,y,z,name,color);
					},
					function(){},name,null
				);
			}
		}
	},
	loadLast : function(){
		destinationApp.wikiLoading = true;
		wikiAsync("PlayersLocations", function(data){
			destinationApp.parseWikiLocations(data);
			destinationApp.wikiLoading = false;
		});
	},
	loadRec : function(){
		destinationApp.wikiLoading = true;
		wikiAsync("RecommendedLocations", function(data){
			destinationApp.parseWikiLocations(data);
			destinationApp.wikiLoading = false;
		});
	},
	setFederationDest : function( x,y,z, name, color, save){
		
		var currFed = null;
		var pthis = destinationApp;
		for(var i = 0;i<pthis.destinations.length;i++){
			if (pthis.destinations[i].federation == true){
				currFed = pthis.destinations[i];
				destId = currFed.index;
				currFed.coords = [x,y,z];
				currFed.name = name;
				break;
			}
		}
		
		if(currFed == null){ // No fed ON, lets create it
			destId = pthis.destinations.length
			pthis.addDest(x,y,z,fedObj.name,'#c0ca33');
			pthis.selectedDestination+=1;
			currFed = pthis.destinations[pthis.selectedDestination];
		}
		
		// Save the selected federation option
		commonData.selectedFederation = currFed;
		if(save){
			settingsApp.applySettings(); 
		}
		
		pthis.changeDest(destId);
		pthis.reSyncDistanceToUser();
		localRadarApp.syncGrid();
		commonData.onLocationChange();
		galaxyMapApp.forceReDraw();
		
		$(".page").removeClass("active"); // Force gui refresh
		$("#page1").addClass("active");
		$(".menuitem").removeClass("active");
		$("#mainMenuItem").addClass("active");
		
	},
	reSyncDistanceToUser : function(){
		var common = commonData;
		for(var i = 0;i < common.destinations.length;i++){
			var distance = common.userLocation.calculateDistance(common.destinations[i]);
			common.destinations[i].distance = distance.toFixed(3);
			common.destinations[i].distanceLineal = (distance*4).toFixed(3);
			common.destinations[i].jumps = Math.ceil(distance/(common.jumpRange/4.0));
		}
		
		// Height calculation!
		var hUser = common.userLocation.coords[1];
		var hDest = common.selectedDestinationObj.coords[1];
		common.heightNotOK = (hDest!=hUser);
		common.heightDiff = (hUser-hDest);
		common.heightDir = (common.heightDiff>0) ? "above" : "below";
		common.heightDiff = Math.abs(common.heightDiff);
		
		// Coffee hint calculation
		if(common.selectedDestinationObj.jumps>100){
			common.coffeeHint = "Use BlackHole Roulette";
			common.shouldUseBh = true;
		}else{
			common.coffeeHint = "Travel directly";
			common.shouldUseBh = false;
		}
		
	},
	reSyncDegrees: function(){
		var common = commonData;
		var v1 = common.userLocation.getVector(common.center); 
		var v2 = common.userLocation.getVector(common.selectedDestinationObj);
		var radians = v1.getDegreesVector(v2);

		var degrees = (radians*180/Math.PI)
		common.degreesTransf = "rotate("+degrees+" 80 80)";
		common.degrees = Math.abs(degrees).toFixed(2);
		common.degreesDir = (degrees>0) ? "right" : "left";
		
	}
};

var destinationAppBind = rivets.bind($("#destinationNode")[0], destinationApp);

var mapOverlayApp = {
	el : '#mapOverlayApp',
	galaxyMode : true,
	toggleMode : function() {
		var m = mapOverlayApp;
		var r = localRadarApp;
		var g = galaxyMapApp;
		
		m.galaxyMode = !m.galaxyMode;
		g.mapEnabled = m.galaxyMode;		
		r.mapEnabled = !m.galaxyMode;
		
		commonData.onLocationChange();
	}
}
var mapOverlayAppBind = rivets.bind($("#mapOverlayNode")[0], mapOverlayApp);

var galaxyMapApp = {
	common: commonData,
	width: 0,
	height: 0,
	aspect : 0,
	blackHoleRadius : {rx : 0, ry: 0},
	areaHint : {cx:0,cy:0,rx:0,ry:0},
	showBlackHoleRing: false,
	showAreaHint: false,
	mapEnabled : true,
	center: commonData.center,
	userApp: userLocationApp,
	userLocation: commonData.userLocation,	
	destApp : destinationApp,
	destinations : destinationApp.destinations,

	initialize : function(){
		this.width = ($("#galaxyMapNode")[0]).getBoundingClientRect().width * 0.991;
		this.aspect = (document.documentElement.clientWidth*1.0/document.documentElement.clientHeight);
		this.height =  this.width / this.aspect; 
		this.height -= $("#mainnav")[0].clientHeight + $("#userInputPanel")[0].clientHeight +30;
		
		commonData.center.updateMapCoords(galaxyMapApp.width, galaxyMapApp.height);
	},
	
	forceReDraw : function(){
		commonData.center.updateMapCoords(galaxyMapApp.width, galaxyMapApp.height);
		for(var i = 0;i<commonData.destinations.length;i++){
			commonData.destinations[i].updateMapCoords(galaxyMapApp.width, galaxyMapApp.height);
		}
	},
	drawAreaHint : function (lyRadius, showBh){
		
		this.areaHint.cx =  commonData.userLocation.mapCoords[0];
		this.areaHint.cy =  commonData.userLocation.mapCoords[2];
		this.areaHint.rx = lyRadius /100.0 * ((this.width/4096)) ;
		this.areaHint.ry = lyRadius /100.0 * ((this.height/4096)) ;
		
		this.showAreaHint = true;
		
		if(showBh){
			this.drawBHZone();
		}

	},
	drawBHZone : function(){
		var centerDist = commonData.userLocation.calculateDistance(commonData.center);
		var outterDistance = (centerDist-1000)/100.0;	
		var aspectX = (this.width/4096);
		var aspectY = (this.height/4096);
		var rx = (outterDistance) *(aspectX);
		var ry = (outterDistance) *(aspectY);
		
		this.blackHoleRadius.rx = rx-5;
		this.blackHoleRadius.ry = ry-5;
		this.showBlackHoleRing = true;

	}
	
};
var galaxyMapAppBind = rivets.bind($("#galaxyMapNode")[0], galaxyMapApp);

var localRadarApp = {
	el : '#localRadarApp',
	userApp : userLocationApp,
	width: 0,
	height: 0,
	aspect : 0,
	mapEnabled : false,
	userPoint : { mx : 0, mz: 0, mxT : 0, mzT: 0,name:"", color:""},
	dest : { mx : 0, mz: 0, mxT : 0, mzT: 0,name:"", color:""},
	heightDiff: 0,
	heightDir: "up",
	heightNotOK : false,
	mapRelationH : 0,
	mapRelationW : 0,
	radarValid : false,
	radarValidDist: '',
	
	initialize : function(){
		this.width = galaxyMapApp.width;
		this.height =  galaxyMapApp.height;
		this.syncGrid();
		commonData.locationChangeCallbacks.push(localRadarApp.syncLocations);
		
	},
	syncGrid: function(){
		var gridRange = commonData.localRadarRange;
		var l = localRadarApp;
		l.mapRelationW = l.width / gridRange+1;
		l.mapRelationH = l.height / gridRange+1;

		l.syncLocations(); // Do as we should use the new values
	},

	syncLocations : function(){
		
		var pThis = localRadarApp;
		var mapW = pThis.width;
		var mapH = pThis.height;
		
		var obj = commonData.selectedDestinationObj;
		
		var hDest = obj.coords[1];
		var destC = {x:obj.coords[0], y:obj.coords[1], z:obj.coords[2]};

		pThis.dest.mx = mapW/2.0;
		pThis.dest.mz = mapH/2;
		pThis.dest.mxT = pThis.dest.mx+10;
		pThis.dest.mzT = pThis.dest.mz-5;
		pThis.dest.name = obj.name;
		pThis.dest.color = obj.color;

		if(userLocationApp.locationValid){
			
			// Technically valid
			obj = commonData.userLocation;	
			var gridRange = commonData.localRadarRange;
			var uX = obj.coords[0];
			var uZ = obj.coords[2];
			if(uX >=destC.x-gridRange && uX <=destC.x+gridRange){
				if(uZ >=destC.z-gridRange && uZ <=destC.z+gridRange){
					// We need to draw ourselves
					
					pThis.userPoint.mx = pThis.dest.mx - ((destC.x-uX) *pThis.mapRelationW);
					pThis.userPoint.mz = pThis.dest.mz - ((destC.z-uZ) *pThis.mapRelationH);
					
					pThis.userPoint.name= obj.name;
					pThis.userPoint.color= obj.color;
					pThis.userPoint.mxT= pThis.userPoint.mx+10;
					pThis.userPoint.mzT= pThis.userPoint.mz-5;
				}
			}
			
			var l = localRadarApp;
			var cjumps = commonData.selectedDestinationObj.jumps;

			if(cjumps=="" || cjumps > gridRange/2){
				l.radarValidDist = ""+(gridRange/2);
				l.radarValid = false;
			}else{
				l.radarValid = true;
			}
			
		}
	}

};
var localRadarAppBind = rivets.bind($("#localRadarNode")[0], localRadarApp);


var settingsApp = {
	common : commonData,
	map : galaxyMapApp,
	tag : "nmspspset",
	initialize: function(){	
		if(localStorage!=undefined){
			try{
				var rawData = localStorage.getItem(settingsApp.tag);
				if(rawData==undefined || rawData == null){
					return;
				}
				var data = JSON.parse(rawData);
				
				commonData.jumpRange = data.jumpRange;
				commonData.localRadarRange = data.localRadarRange;
				commonData.selectedFederation = data.selectedFederation;			
				galaxyMapApp.height = data.height;

			}catch(err){
				console.log("Err restoring storage: ",err);
			}
			
		}
	},
	
	applySettings : function(){
		if(localStorage!=undefined){
			try{
				localStorage.setItem(settingsApp.tag, JSON.stringify({
					jumpRange: commonData.jumpRange, 
					localRadarRange: commonData.localRadarRange, 
					selectedFederation : commonData.selectedFederation,
					height: galaxyMapApp.height
				}));
				
			}catch(err){
				console.log("Err saving storage: ",err);
			}
		}
				
		localRadarApp.syncGrid();
		commonData.onLocationChange(); // Trigger data
		galaxyMapApp.forceReDraw(); // Redraw with new data
	},
	clearSettings: function(){
		if(localStorage!=undefined){
			localStorage.removeItem(settingsApp.tag);
		}
	}
}
var settingsAppBind = rivets.bind($("#settingsNode")[0], settingsApp);

var helpApp = {
	
	wikiLoading : false,
	helpItems : [],
	loadQuestionsFromWiki : function (){
		helpApp.wikiLoading = true;		
			
		wikiAsync("PSPathHelp", function(data){
			var externalData = data.parse.wikitext["*"].split("\n\n");
							
			for(var i = 0; i< externalData.length;i++){
				try{
					if(externalData[i].indexOf("QuestionTag")>=0){ // Only if data present
						var systemInfo = externalData[i].split("\n");						
						var qTag = systemInfo[0].split("QuestionTag: ")[1];
						var qTitle = systemInfo[1].split("QuestionTitle: ")[1];
						var qText = systemInfo[2].split("QuestionText: ")[1].split("\"\"\"")[1];
						
						var total = helpApp.helpItems.filter(function(item){ return (item.tag == qTag);});
						if(total.length==0){
							helpApp.helpItems.push({tag : qTag, title: qTitle, text: qText});
						}
					}
				}catch(err){ /* Doh? Here */}
			}
			helpApp.wikiLoading = false;
			
		});
	}	
};
var helpAppBind = rivets.bind($("#helpNode")[0], helpApp);

var federationsApp = {
	common : commonData,
	user : userLocationApp,
	wikiLoading : false,
	federations: [],
	loadFederationsFromWiki : function(){
		federationsApp.wikiLoading = true;
		
		wikiAsync("United_Federation_of_Travelers", function(rawData){
			var externalRawData = rawData.parse.text["*"];
			
			var elements = $(externalRawData);
			wikiImageNodes = $("img",elements);
			
			wikiAsync("United_Federation_of_Travelers", function(data){
				var externalData = data.parse.wikitext["*"].split("\n");
								
				for(var i = 0; i< externalData.length;i++){
					try{
						
						if(externalData[i].indexOf("| ")>=0){
							var splitData = externalData[i].split("|").filter(function f(node) { return (node.indexOf("style")<0 && node.length>2) ; });
							if(splitData[0][0]=="["){
								var fname = "";
								var name = "";
								var coordsText = "";
								var coords = null;
								for(var j = 0;j<splitData.length;j++){
									if(splitData[j].indexOf("[[")>=0){
										if(splitData[j].indexOf("File:")>=0){
											fname = splitData[j].replace("[[File:","").replace("]]","");
										}
										else{
											name = (name!="") ? name : splitData[j].split("]]")[0].replace("[[","");
										}
									}
									
									if (splitData[j].indexOf(":00")>0){
										coordsText = splitData[j];
									}
								}
								
								// Parse it here
								textHandler.parseLine(coordsText,
									function(x,y,z,name,color){			
										coords = [x,y,z];
									},
									function(){}
									,name,'#c0ca33'
								);
								
								if(fname!=""){
									for(var j = 0;j<wikiImageNodes.length;j++){									
										if(wikiImageNodes[j].alt == fname){
											fname = wikiImageNodes[j].src;
											break;
										}
									}									
								}else{
									fname="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
								}

								federationsApp.federations.push({fname :fname, name: name, coordsText: coordsText, coords: coords, index : federationsApp.federations.length, distanceToUser: 0, jumpsToUser:0});
							}
						}
					}catch(err){
						console.log("ERR: ",err);
						/* Doh? Here */
					}
				}
				federationsApp.wikiLoading = false;
				
			});
		}, true);
	},
	
	syncDistanceToUser: function(){
		var pThis = federationsApp;
		for(var i = 0;i<pThis.federations.length;i++){
			pThis.federations[i].distanceToUser = pThis.common.userLocation.calculateDistance(pThis.federations[i]).toFixed(3);
			pThis.federations[i].jumpsToUser = Math.ceil(pThis.federations[i].distanceToUser / (pThis.common.jumpRange / 4.0));
		}
		
	},
	
	selectFederation : function(){
		var pThis = federationsApp;
		var index = Number($(this).attr("rel"));
		var fedObj = pThis.federations[index];

		var currFed = null;
		var destId = -1;

		destinationApp.setFederationDest(fedObj.coords[0],fedObj.coords[1],fedObj.coords[2],fedObj.name,'#c0ca33', true);
	}
}
var federationsAppBind = rivets.bind($("#federationsNode")[0], federationsApp);