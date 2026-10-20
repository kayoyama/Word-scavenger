var strword;
var selected;
var selectStart;
var selectedBox = [];
var RCid;
var XpointB;
var YpointB;
var totalscore;
var lastscore;
var letterset =[];
var lsminone;
var power=[];
var RCTemp=[];
var POWNUM;
var colordown = "#005f85";
var words = []
var toMain = "NO";
var curPage= "START";
var addTime=0;
var ingameTimer;



function LoadPage() {
letterset.length=0;
letterset.push("0");
strword="SCAVENGER"
timercount =0;
totalscore=0;
lastscore=0;

loadcharset2();
powerups();

lsminone=letterset.length-1;

init();
populate();
populate_time();


countdown("countdowntime" , 2, 0);

document.getElementById('score').innerHTML= totalscore;
document.getElementById('lastscore').innerHTML= lastscore;
//var borderbox = document.getElementById('bb1');
//borderbox.style.backgroundColor="red";
//document.getElementById('debug').innerHTML = borderbox.textContent;
//document.getElementById('r1c1').style.fontSize= (borderbox.clientWidth	) + "px";
//words = JSON.parse(localStorage.getItem("WordS"));

//document.getElementById('touch').innerHTML = obj;

}


function populate_time(){
var timercount;
timercount =1;

var counter = setInterval(function(){
	populate();
	timercount=timercount+1;

	if (timercount>5){
	clearInterval(counter);
	timercount=0;
	}
	document.getElementById('timer').innerHTML = timercount;

	}, 90);
}




function init(){

var touchzone = document.getElementById("touchzone");
  // Add an event handler for the touchstart event
  touchzone.addEventListener("touchstart", touchHandlerStart, false);
  touchzone.addEventListener("touchmove", touchHandlerMove, false);
  touchzone.addEventListener("touchend", touchHandlerEnd);

}

function touchHandlerStart(event) {
  // Get a reference to our coordinates div
var touchV = document.getElementById('touch');
  // Write the coordinates of the touch to the div
if(document.elementFromPoint(event.targetTouches[0].pageX, event.targetTouches[0].pageY).className=='divbox'){
  selectStart =event.touches[0].target.innerHTML;
  touchV.innerHTML = selectStart;
//  document.elementFromPoint(event.targetTouches[0].pageX, event.targetTouches[0].pageY).style.backgroundColor = "lightblue";
  document.elementFromPoint(event.targetTouches[0].pageX, event.targetTouches[0].pageY).style.backgroundColor = "SaddleBrown";
  document.elementFromPoint(event.targetTouches[0].pageX, event.targetTouches[0].pageY).style.color = "DarkGray";
  }
selected="";
XpointB = event.targetTouches[0].pageX;
YpointB = event.targetTouches[0].pageY;
RCid=document.elementFromPoint(XpointB, YpointB).id;
selectedBox.push(RCid);
//document.getElementById('touch').style.backgroundColor = "red";
}


function touchHandlerMove(event) {
var touchV = document.getElementById('touch');
var XpointC;
var YpointC;
var Zbegin;
var Zend;
var XpointA = event.targetTouches[0].pageX;
var YpointA = event.targetTouches[0].pageY;
Zend=3;
if(XpointB!=0 && YpointB!=0){

for(Zbegin=1;Zbegin<=Zend;Zbegin++){

XpointC=XpointB + ((Zbegin*(XpointA-XpointB))/Zend);
YpointC=YpointB + ((Zbegin*(YpointA-YpointB))/Zend);

if(validatebox(selectedBox,document.elementFromPoint(XpointC, YpointC).id)==false){
if((document.elementFromPoint(XpointC, YpointC).className=='divbox') && (RCid!=document.elementFromPoint(XpointC, YpointC).id)){
selectedBox.push(document.elementFromPoint(XpointC, YpointC).id);
selected=selected + document.elementFromPoint(XpointC, YpointC).textContent;
//document.elementFromPoint(event.targetTouches[0].pageX, event.targetTouches[0].pageY).style.backgroundColor = "lightblue";
document.elementFromPoint(XpointC, YpointC).style.backgroundColor = "SaddleBrown";
document.elementFromPoint(XpointC, YpointC).style.color = "DarkGray";
}
} else{
  var tempa =selectedBox[selectedBox.length-1];
  selectedBox.splice(selectedBox.length-1,1);
  var RCbox = new getRC(tempa);
 // document.getElementById('debug').innerHTML = tempa;
 changecolor(RCbox.R,RCbox.C,RCTemp[getIndexOfRC(RCTemp,tempa)].POW);
 document.getElementById('or' + RCbox.R + 'c' + RCbox.C).style.backgroundColor=colordown;
 selected= selected.substring(selected.length-1,0);
}


RCid=document.elementFromPoint(XpointC, YpointC).id;
} }//for loop

//if(validatebox(selectedBox,document.elementFromPoint(event.touches[0].pageX, event.touches[0].pageY).id)==false){
//document.getElementById('debug').innerHTML = selectedBox
var wordselected = selectStart + selected;




touchV.innerHTML = wordselected



XpointB = XpointA;
YpointB = YpointA;
RCid	=	document.elementFromPoint(XpointB, YpointB).id;

//}

var a;
var b=selectedBox.length-1;
var scoreselect= new wordscore(wordselected);

if(wordlist.indexOf(wordselected)!=-1){

document.getElementById('lastscore').innerHTML= scoreselect.scorenoWS;
if(scoreselect.multiplier>1){
document.getElementById('lastscore').innerHTML=document.getElementById('lastscore').innerHTML + ' x ' + scoreselect.multiplier;
}
for(a=0;a<=b;a++){
//document.getElementById('debug').innerHTML ='o' + selectedBox[a];
document.getElementById('o' + selectedBox[a]).style.backgroundColor="MintCream";  //"LightGoldenRodYellow";
}
}else{
document.getElementById('lastscore').innerHTML = '0';
for(a=0;a<=b;a++){
//document.getElementById('debug').innerHTML ='o' + selectedBox[a];
document.getElementById('o' + selectedBox[a]).style.backgroundColor=colordown;
}
}

}


function touchHandlerEnd(event){
var touchV = document.getElementById('touch');
var retain = document.getElementsByClassName('outerbox');
var selectedBoxLen= selectedBox.length;
var a;
var b;
var wordselected;
XpointB = 0;
YpointB = 0;


b="";
var timerend;
timerend =1;
wordselected = selectStart + selected;

//[].forEach.call(retain, function(a){
  //  a.style.backgroundColor = "#005f85";
//});

for(a=1;a<RCTemp.length;a++){
var RCbox = new getRC(RCTemp[a].RC);

changecolor(RCbox.R,RCbox.C,RCTemp[a].POW);
document.getElementById('or' + RCbox.R + 'c' + RCbox.C).style.backgroundColor="#005f85";

}

if(wordlist.indexOf(wordselected)!=-1){
//Android.noTouch();
dontTouch(false);
var counterend = setInterval(function(){

timerend=timerend+1;

for (a = 0; a < selectedBoxLen; a++){

var tempRC = new getRC(selectedBox[a]);

//writedoc(tempRC.R,tempRC.C,charset(getRandom(98)));}
var templetset = letterset[getRandom(lsminone)];
writedoc(tempRC.R,tempRC.C,templetset);

var temppow=power[getRandom(POWNUM)];
changecolor(tempRC.R,tempRC.C,temppow);

RCTemp[getIndexOfRC(RCTemp,selectedBox[a])].POW=temppow;
RCTemp[getIndexOfRC(RCTemp,selectedBox[a])].LET=templetset;

}

if (timerend>5){
    dontTouch(true);
	clearInterval(counterend);
	timerend=0;
	selectedBox.length=0;
	}  	}

, 80);  //timer end

//document.getElementById('debug').innerHTML=selectedBox[selectedBox.length-1];

//for (a = 0; a < selectedBoxLen; a++){}

//localStorage.setItem('WordS',wordselected);


lastscore=wordscore(wordselected);

totalscore=totalscore + lastscore;
document.getElementById('lastscore').innerHTML= lastscore;
document.getElementById('score').innerHTML= totalscore;

//words.push({'word':wordselected});

//localStorage.setItem("WordS", JSON.stringify(words));
addToCount(wordselected,1);
}else
{
	selectedBox.length=0;
	touchV.innerHTML = "word does not exist"
}
    function dontTouch(h){
    var hide=document.getElementById("hidder");
    hide.hidden=h;
    }
}




function populate_word(){

clear();

var ARword;
var ACword;

ARword = getRandom(6);
ACword = getRandom(6);

writedoc(ARword,ACword,"S");


}


function clear(){
var r;
var c;
    for (r = 1; r <= 6; r++) {
	for (c = 1; c <= 6; c++) {

	writedoc(r,c,String.fromCharCode(8194));

	}
	}
}

function getRC(RC){
this.R=RC.substring(1,2);
this.C=RC.substring(3);
}

function populate(){
RCTemp.length=0;
RCTemp.push({'RC':'r0c0','POW':'NO','LET':'@'});
var r;
var c;
var temppow;
var templet;

    for (r = 1; r <= 5; r++) {
	for (c = 1; c <= 5; c++) {

//	writedoc(r,c,charset(getRandom(98)));
	templet=letterset[getRandom(lsminone)];
	writedoc(r,c,templet);

	temppow=power[getRandom(POWNUM)];
	RCTemp.push({'RC':'r' + r + 'c' + c,'POW':temppow,'LET':templet});
	changecolor(r,c,temppow);

	}
	}
//	document.getElementById('score').innerHTML= RCTemp[getIndexOfRC(RCTemp ,'r6c6')].POW;
}


function writedoc(r,c, str){
document.getElementById('r' + r + 'c' + c).innerHTML = str;//"<span class='divspan' style='background:red;'>"+str+"</span>";
}

function changecolor(r,c, powerC){
if(powerC=="2LS"){document.getElementById('r' + r + 'c' + c).style.backgroundColor = "lightblue";}
if(powerC=="3LS"){document.getElementById('r' + r + 'c' + c).style.backgroundColor = "DodgerBlue";}
if(powerC=="2WS"){document.getElementById('r' + r + 'c' + c).style.backgroundColor = "violet";}
if(powerC=="3WS"){document.getElementById('r' + r + 'c' + c).style.backgroundColor = "red";}
if(powerC=="NO"){document.getElementById('r' + r + 'c' + c).style.backgroundColor = "lightsalmon";}

document.getElementById('r' + r + 'c' + c).style.color = "black";
}




function getRandom(max){
	return Math.floor((Math.random() * max) + 1);
}



function getIndexOfRC(a,v) {
  var l = a.length;
  for (var k=1;k<=l;k++) {
    if (a[k].RC==v) {
        return k;
      }
  }
  return false;
}

function validatebox(box,boxsel){
var c = false;
var a = box.length-1;
for (var b=0;b<a;b++){
if(box[b]==boxsel){
c = true;
}
}
//document.getElementById('debug').innerHTML= c;
return c;
}


function front(){
var front1 = document.getElementById("frontdiv");

var W = window.innerWidth;
var H = window.innerHeight;
front.width = W;
front.height = H;
canvaslisten();
tabWhite(1,'#eee','white');
//android_init(); // to initialize add interface
//console.log(DB.list("X"));
    function canvaslisten(){
    var newmnu = document.getElementById("newgamemenu");
    var statmnu = document.getElementById("statmenu");
    newmnu.addEventListener("touchstart", newstart, false);
    statmnu.addEventListener("touchstart", statstart, false);
    front1.addEventListener("touchstart", printlog, false);
    }
MainTimer();
}

function statstart(event){
var canvas = document.getElementById("statdiv");

canvas.hidden=false;
canvas.addEventListener("touchstart", hidestat, false);
//console.log(DB.list("X X"));
var rowInner = document.getElementById("rows");
curPage="STAT";
Android.setCurPage("STAT");
rowInner.innerHTML = DB.list(1);
    function hidestat(){
//    canvas.hidden=true;
    }
console.log(curPage);
}



function newstart(event){
var canvas = document.getElementById("frontdiv");
var game =document.getElementById("game");
canvas.hidden=true;

LoadPage();
curPage="GAME";
game.addEventListener("touchstart", printlog, false);

Android.setCurPage("GAME");
Android.setMain("NO");
}

function printlog(){
console.log(toMain+","+curPage);
}

function MainTimer(){
var log;
var counter = setInterval(function(){

        if((curPage=="GAME")&&(toMain=="MAINN")){
        document.getElementById("frontdiv").hidden=false;
        clearTimeout(ingameTimer);
        curPage="START";
        Android.setMain("NO");
        Android.setCurPage("START");
        }else if((curPage=="STAT")&&(toMain=="MAINS")){
        document.getElementById("statdiv").hidden=true;
        curPage="START";
        Android.setCurPage("START");
        Android.setMain("NO");
        }else{

        }
        toMain = Android.ReturnMain();
//        if((toMain+curPage)!=log){
//        console.log(toMain+","+curPage);
//        }
//        log=toMain+curPage;
    },1);
}


function countdown( elementName, minutes, seconds)
{
    var element, endTime, hours, mins, msLeft, time;
	var countime;
	countime=(minutes*60) + (seconds) + 1;

    function twoDigits( n )
    {
        return n <= 9 ? "0" + n : n;
    }

    function updateTimer()
    {
        if ( countime == 0 ) {
            element.innerHTML = "Game Over!";
            //setTimeout(Stopper,500);  //
        } else {
        countime=countime-1+addTime;
        addTime=0;
        element.innerHTML = twoDigits(((countime-(countime%60))/60)) + ":" + twoDigits(countime%60);
        ingameTimer = setTimeout( updateTimer, 1000 );
        }
    }
    element = document.getElementById( elementName );
    updateTimer();
}

function Stopper(){
// Test
showAndroidToast(totalscore);
}

function showAndroidToast(toast) {
   Android.showToast(toast);
}

function addToCount(WORD,CTR){
    DB.addToCount(WORD,CTR);
}


function android_init(){
var dblist = DB.list("X");
}

function tabWhite(tab,color1,color2){
var c=document.getElementsByClassName("tab");
[].forEach.call(c,function(c){c.style.backgroundColor= color1;})
document.getElementById("tab"+tab).style.backgroundColor=color2;
}