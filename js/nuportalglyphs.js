
var glyphHandlerApp = {
	
	galAddr : "",
	humanGalAddr : "",
	humanPlanet : 1,
	planet : 1,
	result : new Array(12),
	inputDone : false,
	inputOk : false,
	errorMessage : "",
	
	initialize : function () {

		var items = new Object();
		items["SUNRISE"] = {id:"SUNRISE", val : 0, img : "0.png", imgObj : null};
		items["BIRD"] = {id:"BIRD", val : 1, img :  "1.png", imgObj : null};
		items["ALIENFACE"] = {id:"ALIENFACE", val : 2, img :  "2.png", imgObj : null};
		items["DIPLO"] = {id:"DIPLO", val : 3, img :  "3.png", imgObj : null};
		items["MOON"] = {id:"MOON", val : 4, img :  "4.png", imgObj : null};
		items["GMAPS"] = {id:"GMAPS", val : 5, img :  "5.png", imgObj : null};
		items["BOAT"] = {id:"BOAT", val : 6, img :  "6.png", imgObj : null};
		items["SPIDER"] = {id:"SPIDER", val : 7, img :  "7.png", imgObj : null};
		items["DRAGONFLY"] = {id:"DRAGONFLY", val : 8, img :  "8.png", imgObj : null};
		items["SPIRAL"] = {id:"SPIRAL", val : 9, img :  "9.png", imgObj : null};
		items["HEXAGON"] = {id:"HEXAGON", val : 0xa, img :  "10.png", imgObj : null};
		items["ORCA"] = {id:"ORCA", val : 0xb, img :  "11.png", imgObj : null};
		items["TIPI"] = {id:"TIPI", val : 0xc, img :  "12.png", imgObj : null};
		items["SPACESHIP"] = {id:"SPACESHIP", val : 0xd, img :  "13.png", imgObj : null};
		items["ETARC"] = {id:"ETARC", val : 0xe, img :  "14.png", imgObj : null};
		items["TRIFORCE"] = {id:"TRIFORCE", val : 0xf, img :  "15.png", imgObj : null};

		for(var item in items){
			items[item].imgObj = new Image();
			items[item].img = "./img/glyphs/" + (items[item].img);
			items[item].imgObj.src = (items[item].img);
			items[item].imgObj.setAttribute("alt", (items[item].id));
		}

		this.items = items;
		
		this.hexorder = [
			items["SUNRISE"],items["BIRD"],items["ALIENFACE"],items["DIPLO"],items["MOON"],items["GMAPS"],items["BOAT"],items["SPIDER"],items["DRAGONFLY"]
			,items["SPIRAL"],items["HEXAGON"],items["ORCA"],items["TIPI"],items["SPACESHIP"],items["ETARC"],items["TRIFORCE"]
		];
		this.xzorder = [
			[
				items["DRAGONFLY"],items["SPIRAL"],items["HEXAGON"],items["ORCA"],items["TIPI"],items["SPACESHIP"],items["ETARC"],items["TRIFORCE"],items["SUNRISE"]
				,items["BIRD"],items["ALIENFACE"],items["DIPLO"],items["MOON"],items["GMAPS"],items["BOAT"],items["SPIDER"]
			],
			this.hexorder,
			[
				items["BIRD"],items["ALIENFACE"],items["DIPLO"],items["MOON"],items["GMAPS"],items["BOAT"],items["SPIDER"],items["DRAGONFLY"]
				,items["SPIRAL"],items["HEXAGON"],items["ORCA"],items["TIPI"],items["SPACESHIP"],items["ETARC"],items["TRIFORCE"],items["SUNRISE"]
			]
		]
		this.yorder = [ 
			[
				items["DRAGONFLY"],items["SPIRAL"],items["HEXAGON"],items["ORCA"],items["TIPI"],items["SPACESHIP"],items["ETARC"],items["TRIFORCE"],items["SUNRISE"]
				,items["BIRD"],items["ALIENFACE"],items["DIPLO"],items["MOON"],items["GMAPS"],items["BOAT"],items["SPIDER"]
			],
			[
				items["BIRD"],items["ALIENFACE"],items["DIPLO"],items["MOON"],items["GMAPS"],items["BOAT"],items["SPIDER"],items["DRAGONFLY"]
				,items["SPIRAL"],items["HEXAGON"],items["ORCA"],items["TIPI"],items["SPACESHIP"],items["ETARC"],items["TRIFORCE"],items["SUNRISE"]
			]
		]
	},
	
	parseAddress : function (){
		// SPLIT
		
		function padLeft(nr, n, str){
			return Array(n-String(nr).length+1).join(str||'0')+nr;
		}
		var pthis = glyphHandlerApp;
		var fullGalAddrRe = new RegExp("([0-9A-F]+):([0-9A-F]+):([0-9A-F]+):([0-9A-F]+)");
		pthis.humanGalAddr = pthis.galAddr.replace(/ /g, ':').toUpperCase();
		
		var res = fullGalAddrRe.exec(pthis.humanGalAddr);

		pthis.inputDone = true;
		
		
		if(res){
			pthis.humanGalAddr = res[0];
			var x = padLeft(res[1],3,"");
			var y = padLeft(res[2],2,"");
			var z = padLeft(res[3],3,"");
			var syst = padLeft(res[4],3,"")
			
			var planet = Number(pthis.planet);
			if(planet<1 || planet > 7 || isNaN(planet)) { planet = 1; } // Safeguard
			pthis.result[0] = pthis.hexorder[planet];
			pthis.humanPlanet = planet;
			
			for(var i = 0; i < 3;i++){
				pthis.result[9+i] = ( pthis.xzorder[i][ parseInt(x[i],16)]);
				pthis.result[6+i] = ( pthis.xzorder[i][ parseInt(z[i],16)]);
				if(i<2){
					pthis.result[4+i] = ( pthis.yorder[i][ parseInt(y[i],16)]);
				}
				pthis.result[1+i] = ( pthis.hexorder[ parseInt(syst[i],16)]);
			}
			
			var node = $("#glyphNodesResult")[0];
			node.innerHTML = "";
			
			for(var i = 0;i<pthis.result.length;i++){
				var img = new Image();
				img.src = (pthis.result[i].img);
				node.appendChild(img);
			}
			
			pthis.inputOk = true;
		}else{
			pthis.inputOk = false;
			pthis.errorMessage = "Invalid format for destination";
		}
	}
	
}


//glyphHandlerApp.parseAddress("987 12 32b 01b",1);


