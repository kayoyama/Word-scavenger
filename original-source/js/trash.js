//old codes

/*
function charset(a) {
var b;
var c;
var let = ["ZERO"];
var lett;

	for(b = 1; b<=26; b++) {
	lett = String.fromCharCode(64 + b);
	if(lett=="J" || lett=="K" || lett=="Q" || lett=="X" || lett=="Z"){for(c=1;c<=1;c++){let.push(lett);}}
	if(lett=="B" || lett=="C" || lett=="F" || lett=="H" || lett=="M" || lett=="P" || lett=="V" || lett=="W" || lett=="Y"){for(c=1;c<=2;c++){let.push(lett);}}
	if(lett=="G"){for(c=1;c<=3;c++){let.push(lett);}}
	if(lett=="D" || lett=="L" || lett=="S" || lett=="U"){for(c=1;c<=4;c++){let.push(lett);}}
	if(lett=="N" || lett=="R" || lett=="T"){for(c=1;c<=6;c++){let.push(lett);}}
	if(lett=="O"){for(c=1;c<=8;c++){let.push(lett);}}
	if(lett=="A" || lett=="I"){for(c=1;c<=9;c++){let.push(lett);}}
	if(lett=="E"){for(c=1;c<=12;c++){let.push(lett);}}
	//let.push(lett);
	}
/*	let.push("A");
	let.push("E");
	let.push("I");
	let.push("O");
	let.push("U");
	let.push("Y");

return let[a];
}  */

/*
function draw(){
  	   // Get the canvas element form the page
	   var canvas = document.getElementById("canvas");
	   // Make a 2D context
	   var ctx = canvas.getContext("2d");
		var text = "New Game";
	   //resize the canvas to occupy the full page

	  // Get the widow width and height
      var W = window.innerWidth;
	  var H = window.innerHeight;
	   // Set the same to the canvas
       canvas.width = W;
	   canvas.height = H;

      ctx.fillStyle = '#005f85';
	  ctx.fillRect(0,0,W,H);

	 var context = canvas.getContext('2d');
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 3;
      var radius = (2*canvas.width)/9;

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      context.fillStyle = 'green';
      context.fill();
      context.lineWidth = 5;
      context.strokeStyle = '#003300';
      context.stroke();

	  context.fillStyle = "black"; // font color to write the text with
		var font = "bold " + radius/3 +"px serif";
  		context.font = font;
// Move it down by half the text height and left by half the text width

	var width = context.measureText(text).width;
	var height = context.measureText("w").width; // this is a GUESS of height

	context.fillText(text, ((centerX-(radius))), (centerY));
		canvaslisten();
}
*/

function intersects(x, y, cx, cy, r) {
    var dx = x-cx
    var dy = y-cy
    return dx*dx+dy*dy <= r*r
}