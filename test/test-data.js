
setHtmlPage("sample","10em");	//html page setting

var sample= ( typeof module==="object" && module.exports ) ? require("../sample.js") : require( "sample" );

testData={		//global variable
	
	"test 1": function(done){
		done(!sample.funcTrue());
	},
	"test 2": function(done){
		done(!sample.funcFalse());
	},
	"test 3": function(done){
		setTimeout( function(){ done(!sample.funcTrue())},1000 );
	},
	"test 4": function(done){
		setTimeout( function(){ done(!sample.funcFalse())},1000 );
	},
};
