
function FunnyGraph(squareData) {

	function createSquareElement(color) {
		var element = document.createElement("span");
		var attr = document.createAttribute("class");
		attr.value = "funny-graph";
		element.setAttributeNode(attr);
		if (color) {
			element.style.backgroundColor = "#000000";
		}
		return element;
	}

	var data = squareData || 
	["000000000000000",
	 "011111111111110",
	 "010000000000010",
	 "010000000000010",
	 "011111111111110",
	 "000000000000000"];

	var playG = document.getElementById("footline");
	for (var row = 0; row < data.length; row++) {
		for (var col = 0; col < data[row].length; col++) {
			var colorCode = parseInt(data[row][col]);
			playG.appendChild(createSquareElement(colorCode));
		}
	}
	playG.style.width = 12*data[0].length + "px";
}
