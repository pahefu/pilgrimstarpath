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