var obj=[];

obj = JSON.parse(localStorage.getItem('WordScavenged'));

//obj = localStorage.getItem('WordS');

function SaveWordCount(LocStor,search){
//retrieve
obj = JSON.parse(localStorage.getItem(LocStor));

// Check browser support
if (typeof(Storage) !== "undefined") {

	hasCount(search);
//	obj.length=0;

	bubbleSort(obj, 'CTR');
//console
	var c=obj.length;
	if(obj.length>5){c=5;}

	for (i = 0; i < c; i++) {
   	console.log(obj[i]);
	}
// Store
localStorage.setItem(LocStor,JSON.stringify(obj));

//localStorage.setItem(LocStor,obj);
} else {
//    document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Storage...";
console.log("not");
}

}

function hasCount(word){
var c;
c = getIndexOfWORD(obj,word);

console.log(c);

if(c == 'NO'){

obj.push({'WORD':word,'CTR': 1});

}else{


obj[c].CTR = obj[c].CTR + 1;

}

}

function getIndexOfWORD(a,v) {
  var l = a.length;

  for (var k=0;k<l;k++) {

    if (a[k].WORD==v) {

	return k;

     }
  }

  return 'NO';
}

function bubbleSort(a, par)
{
    var swapped;
    do {
        swapped = false;
        for (var i = 0; i < a.length - 1; i++) {
            if (a[i][par] < a[i + 1][par]) {
                var temp = a[i];
                a[i] = a[i + 1];
                a[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}

function alternate(array,ID) {
var c=array.length;
var total=0;
var ROW = document.getElementById(ID);
var cls;

for(var b=0;b<array.length;b++){
total=total+array[b].CTR
}

if(array.length>10){c=10;}

	for (i = 0; i < c; i++) {
	cls = i % 2 == 0 ? "row-one" : "row-two";
    console.log(i);
	ROW.innerHTML= ROW.innerHTML + "<div class='"+ cls  +"'><div class='Sleft'>"  +  array[i].WORD + "</div><div class='Sright'>" + roundToTwo((array[i].CTR/total)*100) + "%</div><div class='Scenter'>"+ array[i].CTR +"</div><!--1-->"
	ROW.innerHTML= ROW.innerHTML +  "</div><!--2-->";

	}
}