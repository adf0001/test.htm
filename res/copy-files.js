
var fs= require("fs");
var path= require("path");
var readline = require('readline');
var child_process = require('child_process');

/////////////////////////////////
// arguments

var srcDir= path.normalize(__dirname+"/../");
var destDir= path.normalize(__dirname+"/../../../");
console.log( "destination path: " + destDir );

var destDirLast= path.basename(destDir);

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

async function copyReplacedFile( fname, replacePairArray, protectUserFile, destFname ){
	
	if( ! destFname ) destFname= fname;
	
	if( fs.existsSync( destDir + destFname ) ){
		if( protectUserFile ){
			console.warn( destFname + " ........................ skip protected !!!" );
			return false;
		}
		
		var inp= await consolePrompt( "File '" + destFname+"' is already existed, replaced it ? y/n (n):");
		
		if( inp!="y" ){
			console.warn( destFname + " ........................ skip existed !!!" );
			return false;
		}
	}
	
	var s= fs.readFileSync( srcDir+fname, 'utf-8' );
	//console.log(s);
	for(var i=0;i<replacePairArray.length;i+=2){
		s=s.replace( replacePairArray[i], replacePairArray[i+1] );
	}
	fs.writeFileSync( destDir+destFname, s );
	console.log( destFname + " ...... copied" );
	return true;
}

/////////////////////////////////
// main process

async function mainAsync(){
	await copyReplacedFile( "test/test.htm", [] );
	await copyReplacedFile( "test/test-data.js", [ /\"sample\"/g, "\""+name+"\"", "../sample.js", "../"+mainName, /sample/g, newRef ], true );
	
	var inp;
	
	inp= await consolePrompt('* Install global environment ( at first time usage )? y/n/r[re-install] (n):');
	if( inp=="y" || inp=="r"  ){
		child_process.execSync( srcDir+"dev-0-0-install-global.bat" +((inp=="r")?" -r":""), {stdio: 'inherit'} );
	}
	
	inp= await consolePrompt('* Copy for mocha? y/n (n):');
	if( inp=="y" ){
		await copyReplacedFile( "test/test.bat", [] );
		await copyReplacedFile( "test/test.js", ['mocha-test','mocha-test: '+ name ] );
	}
	
	inp= await consolePrompt('* Copy develope tools? y/n (n):');
	if( inp=="y" ){
		await copyReplacedFile( "dev-1-browserify-watchify.bat", simpleName ? ["sample", name]: ["sample", name,"%module%.js", mainName] );
		await copyReplacedFile( "dev-2-browserify-terser.bat", simpleName ? ["sample", name]: ["sample", name,"%module%.js", mainName] );
	}
	
	var copyTestMultiple=false;
	inp= await consolePrompt('* Copy tools for multiple projects, to parent folder? y/n (n):');
	if( inp=="y" ){
		await copyReplacedFile( "res/test-multiple.htm", [], false, "../test-multiple.htm" );
		
		copyTestMultiple= await copyReplacedFile( "res/test-multiple-config.js", ["Sample",name,"../test/test.htm",destDirLast+"/test/test.htm","\"module\":","//\"module\":"], true, "../test-multiple-config.js" );
	}
	
	inp= await consolePrompt('* Copy tools for http, to parent folder? y/n (n):');
	if( inp=="y" ){
		await copyReplacedFile( "res/test-http.js", [], false, "../test-http.js" );
		await copyReplacedFile( "res/test-http-config.js", [], true, "../test-http-config.js" );
		await copyReplacedFile( "res/test-http-extension.js", [], false, "../test-http-extension.js" );
		await copyReplacedFile( "res/test-http.bat", [], false, "../test-http.bat" );
	}
	
	if( copyTestMultiple!==true && fs.existsSync( destDir + "../test-multiple-config.js" ) ){
		
		var aListText= fs.readFileSync( destDir + "../test-multiple-config.js", 'utf-8' ).split("//__NEW_INSERTION_HERE__");
		if( aListText.length==2 ){		//check format
			inp= await consolePrompt('* Append project link \"'+name+'\" to ../test-multiple-config.js ? y/n (n):');
			if( inp=="y" ){
				if( ! aListText[0].match(/[\,\{]\s*$/) ) aListText[0]= aListText[0]+",\n\t";
				aListText[0]+="\""+ name + "\": \"" + destDirLast+"/test/test.htm\",\n\t";
				
				fs.writeFileSync( destDir+"../test-multiple-config.js", aListText.join("//__NEW_INSERTION_HERE__") );
				
				console.log( "project \""+name+"\" ...... appended" );
			}
		}
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
