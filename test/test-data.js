
setHtmlPage("sample","10em");	//html page setting

var sample= ( typeof module==="object" && module.exports ) ? require("../sample.js") : require( "sample" );

testData={		//global variable
	
	"test 1": function(done){
		return sample.funcTrue();
	},
	"test 2": function(done){
		return sample.funcFalse();
	},
	"test 3": function(done){
		done(!sample.funcTrue());
	},
	"test 4": function(done){
		done(!sample.funcFalse());
	},
	"test 5": function(done){
		setTimeout( function(){ done(!sample.funcTrue())},1000 );
	},
	"test 6": function(done){
		setTimeout( function(){ done(!sample.funcFalse())},1000 );
	},
};
