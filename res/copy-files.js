﻿
var fs= require("fs");
var path= require("path");
var readline = require('readline');
var child_process = require('child_process');

/////////////////////////////////
// arguments

var srcDir= path.normalize(__dirname+"/../");
var destDir= path.normalize(__dirname+"/../../../");
console.log( "destination path: " + destDir );

if( ! fs.existsSync( destDir + "package.json" ) ){
	console.error( "error: 'package.json' not exists at "+destDir );
	return;
}

var pkg= JSON.parse( fs.readFileSync( destDir + "package.json" ) );
var name= pkg.name;
var mainName= pkg.main;
if( ! mainName.match(/\.js$/i) ){
	console.error( "error: main file '"+mainName+"' is not a *.js file" );
	return;
}
//console.log( name );
//console.log( mainName );

var simpleName= ((name+".js")== mainName);

var newRef= name.replace( /\W/g,"_" ).replace( /^(\d)/, "_$1");

if( ! fs.existsSync( destDir + "test" ) ) fs.mkdirSync( destDir+ "test" );

/////////////////////////////////
// readline

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

async function consolePrompt( questionText ){
	return new Promise( (resolve)=>{
		rl.question(questionText, (answer) => {resolve(answer);});
	});
}

/////////////////////////////////
// copy file

var replaceMode="";

async function copyReplacedFile( fname, replacePairArray, protectUserFile ){
	if( fs.existsSync( destDir + fname ) ){
		if( protectUserFile ){
			console.warn( fname + " ........................ skip existed and protected !!!" );
			return;
		}
		
		var inp= await consolePrompt( "File '" + fname+"' is already existed, replaced it ? y/n (n):");
		
		if( inp!="y" ){
			console.warn( fname + " ........................ skip existed !!!" );
			return true;
		}
	}
	
	var s= fs.readFileSync( srcDir+fname, 'utf-8' );
	//console.log(s);
	for(var i=0;i<replacePairArray.length;i+=2){
		s=s.replace( replacePairArray[i], replacePairArray[i+1] );
	}
	fs.writeFileSync( destDir+fname, s );
	console.warn( fname + " ...... copied" );
	return true;
}

/////////////////////////////////
// main process

async function mainAsync(){
	await copyReplacedFile( "test/test.htm", [] );
	await copyReplacedFile( "test/test-data.js", [ /\"sample\"/g, "\""+name+"\"", "../sample.js", "../"+mainName, /sample/g, newRef ], true );
	
	var inp= await consolePrompt('* For mocha? y/n (n):');
	if( inp=="y" ){
		await copyReplacedFile( "test/test.bat", [] );
		await copyReplacedFile( "test/test.js", ['mocha-test','mocha-test: '+ name ] );
	}
	
	inp= await consolePrompt('* Copy develope tool? y/n (n):');
	if( inp=="y" ){
		await copyReplacedFile( "dev-1-browserify-watchify.bat", simpleName ? ["sample", name]: ["sample", name,"%module%.js", mainName] );
		await copyReplacedFile( "dev-2-browserify-terser.bat", simpleName ? ["sample", name]: ["sample", name,"%module%.js", mainName] );
	}
	
	inp= await consolePrompt('* Install global environment ( at first time usage )? y/n/r[re-install] (n):');
	if( inp=="y" || inp=="r"  ){
		child_process.execSync( srcDir+"dev-0-0-install-global.bat" +((inp=="r")?" -r":""), {stdio: 'inherit'} );
	}
	
	return true;
}

mainAsync().finally(
	()=>{
		rl.close();
		//console.log("rl closed");
		return true;
	}
);
