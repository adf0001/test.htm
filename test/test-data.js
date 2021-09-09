
setHtmlPage("sample","10em",1);	//html page setting

var sample= ( typeof module==="object" && module.exports ) ? require("../sample.js") : require( "sample" );

testData={		//global variable
	
	"test 1": function(done){
		return sample.funcTrue();	//success, return true;
	},
	"test 2": function(done){
		return sample.funcFalse();	//fail, return false;
	},
	"test 3": function(done){
		done(!sample.funcTrue());	//success, call done( error = false );
	},
	"test 4": function(done){
		done(!sample.funcFalse());	//fail, call done( error = true );
	},
	"test 5": function(done){
		setTimeout( function(){ done(!sample.funcTrue())},1000 );	//async success, call done( error = false );
	},
	"test 6": function(done){
		setTimeout( function(){ done(!sample.funcFalse())},1000 );	//async fail, call done( error = true );
	},
	
	
	/*
	//code template
	"": function(done){
		return 

	},
	*/
};
