
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
		SUNRISE = {id:"SUNRISE", val : 0, img : "0.png", imgObj : null};
		BIRD = {id:"BIRD", val : 1, img :  "1.png", imgObj : null};
		ALIENFACE = {id:"ALIENFACE", val : 2, img :  "2.png", imgObj : null};
		DIPLO = {id:"DIPLO", val : 3, img :  "3.png", imgObj : null};
		MOON = {id:"MOON", val : 4, img :  "4.png", imgObj : null};
		GMAPS = {id:"GMAPS", val : 5, img :  "5.png", imgObj : null};
		BOAT = {id:"BOAT", val : 6, img :  "6.png", imgObj : null};
		SPIDER = {id:"SPIDER", val : 7, img :  "7.png", imgObj : null};
		DRAGONFLY = {id:"DRAGONFLY", val : 8, img :  "8.png", imgObj : null};
		SPIRAL = {id:"SPIRAL", val : 9, img :  "9.png", imgObj : null};
		HEXAGON = {id:"HEXAGON", val : 0xa, img :  "10.png", imgObj : null};
		ORCA = {id:"ORCA", val : 0xb, img :  "11.png", imgObj : null};
		TIPI = {id:"TIPI", val : 0xc, img :  "12.png", imgObj : null};
		SPACESHIP = {id:"SPACESHIP", val : 0xd, img :  "13.png", imgObj : null};
		ETARC = {id:"ETARC", val : 0xe, img :  "14.png", imgObj : null};
		TRIFORCE = {id:"TRIFORCE", val : 0xf, img :  "15.png", imgObj : null};
		
		this.hexorder = [SUNRISE,BIRD,ALIENFACE,DIPLO,MOON,GMAPS,BOAT,SPIDER,DRAGONFLY	,SPIRAL,HEXAGON,ORCA,TIPI,SPACESHIP,ETARC,TRIFORCE];
		this.xzorder = [
			[DRAGONFLY,SPIRAL,HEXAGON,ORCA,TIPI,SPACESHIP,ETARC,TRIFORCE,SUNRISE,BIRD,ALIENFACE,DIPLO,MOON,GMAPS,BOAT,SPIDER],
			this.hexorder,
			[BIRD,ALIENFACE,DIPLO,MOON,GMAPS,BOAT,SPIDER,DRAGONFLY,SPIRAL,HEXAGON,ORCA,TIPI,SPACESHIP,ETARC,TRIFORCE,SUNRISE]
		]
		this.yorder = [ 
			[DRAGONFLY,SPIRAL,HEXAGON,ORCA,TIPI,SPACESHIP,ETARC,TRIFORCE,SUNRISE,BIRD,ALIENFACE,DIPLO,MOON,GMAPS,BOAT,SPIDER],
			[BIRD,ALIENFACE,DIPLO,MOON,GMAPS,BOAT,SPIDER,DRAGONFLY,SPIRAL,HEXAGON,ORCA,TIPI,SPACESHIP,ETARC,TRIFORCE,SUNRISE]
		]
		
		for(var i = 0;i<this.hexorder.length;i++){
			var item = this.hexorder[i];
			item.imgObj = new Image();
			item.img = "./img/glyphs/" + (item.img);
			item.imgObj.src = (item.img);
			item.imgObj.setAttribute("alt", (item.id));
		}
	},
	
	parseAddress : function (){
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
			
			var test_x = parseInt(res[1],16)<=0x1000;
			var test_y = parseInt(res[2],16)<=0x100;
			var test_z = parseInt(res[3],16)<=0x1000;
			var test_syst = parseInt(res[4],16)<=0x300;
			
			if(!test_x || !test_y || !test_z || !test_syst){
				pthis.inputOk = false;
				pthis.errorMessage = "Coords outside galaxy limits!";
				return;
			}
			
			var x = padLeft(res[1],4,"").substr(1,3);
			var y = padLeft(res[2],4,"").substr(2,2);
			var z = padLeft(res[3],4,"").substr(1,3);
			var syst = padLeft(res[4],4,"").substr(1,3);
			
			
			var planet = Number(pthis.planet);
			if(planet<1 || planet > 7 || isNaN(planet)) { planet = 1; } // Safeguard
			pthis.result[0] = pthis.hexorder[planet];
			pthis.humanPlanet = planet;
			
			var fullStr = "0"+(syst+y+z+x);

			var getValues = function(fullStr, positionArray, tablesArray, usesCarry){
				var localResult = new Array(positionArray.length);
				
				var trigger_last = (fullStr[positionArray[0]] == "F" ) && usesCarry;
				var trigger_2nd = (fullStr[positionArray[1]]  == "F" ) && trigger_last;

				var offset = 0;
				for(var i = 0;i<positionArray.length;i++){
					var chr = fullStr[positionArray[i]];
					var glyphIndex = parseInt(chr,16); 
					
					if( (trigger_last && i ==1) || (trigger_2nd && i == 2)){
						glyphIndex++;
						if(glyphIndex>0x0F) {glyphIndex = 0;}
					}
					
					localResult[i] = tablesArray[i][glyphIndex];
				}
				localResult.reverse();
				return localResult;
			}
			
			var xValues = getValues(fullStr,[11,10,9], [pthis.xzorder[2], pthis.xzorder[1],pthis.xzorder[0]],true);
			var zValues = getValues(fullStr,[8,7,6], [pthis.xzorder[2], pthis.xzorder[1],pthis.xzorder[0]],true);
			var yValues = getValues(fullStr,[5,4], [pthis.yorder[1],pthis.yorder[0]],true);
			var systValues = getValues(fullStr,[3,2,1], [pthis.hexorder,pthis.hexorder,pthis.hexorder], false);

			for(var i = 0; i < 3;i++){
				pthis.result[9+i] = xValues[i];
				pthis.result[6+i] = zValues[i];
				if(i<2){
					pthis.result[4+i] = yValues[i];
				}
				pthis.result[1+i] = systValues[i];
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





