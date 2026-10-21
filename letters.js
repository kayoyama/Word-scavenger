function wordscore(word_a){
var loopwordscore;
var score;
var LS;
var WS;
WS=1;
score=0;
LS=0;

for(loopwordscore = 1;loopwordscore<=word_a.length;loopwordscore++)
{
if(RCTemp[getIndexOfRC(RCTemp,selectedBox[loopwordscore-1])].POW=="2LS"){LS=2;}
else if(RCTemp[getIndexOfRC(RCTemp,selectedBox[loopwordscore-1])].POW=="3LS"){LS=3;}
else{LS=1;}

if(RCTemp[getIndexOfRC(RCTemp,selectedBox[loopwordscore-1])].POW=="2WS"){WS=WS*2;}
else if(RCTemp[getIndexOfRC(RCTemp,selectedBox[loopwordscore-1])].POW=="3WS"){WS=WS*3;}
//else{WS=1;}

score = score + ((letter_score(word_a.substring(loopwordscore,loopwordscore-1)))*LS);
LS=1;
//score=score + letter_score("A");
}
//document.getElementById('debug').innerHTML= WS;//RCTemp[getIndexOfRC(RCTemp,selectedBox[selectedBox.length-1])].POW
this.multiplier =WS;
this.scorenoWS=score;

score=score*WS;
return score;
}

function powerups(){
var b;
var c;
var d;
power.length=0;
POWNUM=500;
power.push("NO");
c=getRandom(400);

d=400-c;
for (b=1;b<=c;b++){power.push("NO");}
for (b=1;b<=37;b++){power.push("2LS");}
for (b=1;b<=26;b++){power.push("3LS");}
for (b=1;b<=22;b++){power.push("2WS");}
for (b=1;b<=15;b++){power.push("3WS");}
for (b=1;b<=d;b++){power.push("NO");}

}

function letter_score(letter){
var LScore=['0'];
var minus64;
//v1
//LScore.push(1,3 ,3 ,2 ,1,4 ,2 ,4 ,1,8 ,5 ,1,3 ,1,1,3 ,10 ,1,1,1,1,4 ,4 ,8 ,4 ,10);
//v2
LScore.push(16,34,32,23,14,42,24,41,16,81,52,22,32,19,18,34,102,19,22,19,22,45,42,82,42,101);
minus64=letter.charCodeAt(letter)-64;
//minus64=0;
return LScore[minus64];
//return minus64;
}

function loadcharset() {
var b;
var c;
var lett;

	for(b = 1; b<=26; b++) {
	lett = String.fromCharCode(64 + b);
	if(lett=="J" || lett=="K" || lett=="Q" || lett=="X" || lett=="Z"){for(c=1;c<=1;c++){letterset.push(lett);}}
	if(lett=="B" || lett=="C" || lett=="F" || lett=="H" || lett=="M" || lett=="P" || lett=="V" || lett=="W" || lett=="Y"){for(c=1;c<=2;c++){letterset.push(lett);}}
	if(lett=="G"){for(c=1;c<=3;c++){letterset.push(lett);}}
	if(lett=="D" || lett=="L" || lett=="S" || lett=="U"){for(c=1;c<=4;c++){letterset.push(lett);}}
	if(lett=="N" || lett=="R" || lett=="T"){for(c=1;c<=6;c++){letterset.push(lett);}}
	if(lett=="O"){for(c=1;c<=8;c++){letterset.push(lett);}}
	if(lett=="A" || lett=="I"){for(c=1;c<=9;c++){letterset.push(lett);}}
	if(lett=="E"){for(c=1;c<=12;c++){letterset.push(lett);}}

	}
}

function loadcharset2() {
var b;
var c;
var lett;

	for(b = 1; b<=26; b++) {
	lett = String.fromCharCode(64 + b);
	if(lett=="J" || lett=="K" || lett=="Q" || lett=="X" || lett=="Z"){for(c=1;c<=2;c++){letterset.push(lett);}}
	if(lett=="V"){for(c=1;c<=3;c++){letterset.push(lett);}}
	if(lett=="B" || lett=="F" || lett=="P" || lett=="W" || lett=="Y"){for(c=1;c<=4;c++){letterset.push(lett);}}
	if(lett=="G" || lett=="H"){for(c=1;c<=5;c++){letterset.push(lett);}}
	if(lett=="C" || lett=="M"){for(c=1;c<=6;c++){letterset.push(lett);}}
	if(lett=="L" || lett=="U"){for(c=1;c<=7;c++){letterset.push(lett);}}
	if(lett=="D"){for(c=1;c<=8;c++){letterset.push(lett);}}
	if(lett=="S"){for(c=1;c<=10;c++){letterset.push(lett);}}
	if(lett=="I" || lett=="N" || lett=="R"){for(c=1;c<=13;c++){letterset.push(lett);}}
	if(lett=="O" || lett=="T"){for(c=1;c<=15;c++){letterset.push(lett);}}
	if(lett=="A"){for(c=1;c<=16;c++){letterset.push(lett);}}
	if(lett=="E"){for(c=1;c<=24;c++){letterset.push(lett);}}

	}
}

