function isValueNull(variable){
	return (variable == undefined || variable == null);
}

function setDefaultValueIfNull(variable, defaultVal){
	if(isValueNull(variable)) { variable = defaultVal; }
	return variable;
}

function toHex(str, totalChars){
	totalChars = setDefaultValueIfNull(totalChars,2);
	str = ('0'.repeat(totalChars)+Number(str).toString(16)).slice(-totalChars).toUpperCase();	
	return str;
}
function fromHex(str){
	return parseInt(str,16);
}

var colorModalHandler = {	
	r :  0,
	g : 0,
	b : 0,
	index : 0,

	showModal : function(index){
		var template = $("#modalcolortemplate").html();
		this.index = index;
		$("#modalcolor").html(Mustache.render(template, destinations[index] ));
		
		var color = destinations[selectedDestination].color;

		this.getRgbColor(color);
		
		// Generate colors for predefined squares
		var colors = ["663300", "990000","990033","990099","9900cc","6600cc","333399","003399","006666",
			"339933","003300","333300","996633","ff9900","cc0066","ff9933","ffff00","99ff33","33cc33","00ff99"
		];
		
		for (var i = 0;i<colors.length;i++){
			$("<div class='pickcolor' rel='#"+colors[i]+"' style='display:inline-block; width:20px; height:20px; margin:2px; background-color: #"+colors[i]+";'></div>").appendTo("#predefinedcolors");
		}

		$(".pickcolor").click(function(){
			var color = $(this).attr("rel");
			colorModalHandler.getRgbColor(color);
		});
		
		$("#modalcolor").show();
	},
	
	getRgbColor : function(colorStr){
		this.r = fromHex(colorStr.substr(1,2));
		this.g = fromHex(colorStr.substr(3,2));
		this.b = fromHex(colorStr.substr(5,2));
		$("#colorr").val(this.r);
		$("#colorg").val(this.g);
		$("#colorb").val(this.b);

		this.onChangeColor();
	},
	
	getColor : function(){
		var lr = toHex($("#colorr").val(),2);
		var lg = toHex($("#colorg").val(),2);
		var lb = toHex($("#colorb").val(),2);
		return "#"+lr+lg+lb;
	},

	closeColorModal : function(){
		$("#modalcolor").hide();
		$("#modalcolor").html("");
	},

	onColorOk : function(){
		destinations[this.index].color = this.getColor();
		this.closeColorModal();
		galSvg.drawSvg();
	},
	
	onChangeColor : function(){					
		var c = this.getColor();
		$("#colordemo").css("background-color", c+";");
	}

}