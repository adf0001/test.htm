
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

var _dateString23= function (dt) {
	if( !dt ) dt= new Date();
	
	var s = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate() +
		" " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
	return s.replace(/\b(\d)\b/g, "0$1")+"."+("00"+dt.getMilliseconds()).slice(-3);
}

var bakFileTail= function () {
	return "-" + _dateString23().replace( /[\-\:]/g,"").replace( " ", "-" );
}

async function copyReplacedFile( fname, replacePairArray, protectUserFile, destFname ){
	
	if( ! destFname ) destFname= fname;
	
	var sNew= fs.readFileSync( srcDir+fname, 'utf-8' );
	//console.log(sNew);
	for(var i=0;i<replacePairArray.length;i+=2){
		sNew=sNew.replace( replacePairArray[i], replacePairArray[i+1] );
	}
	
	if( fs.existsSync( destDir + destFname ) ){
		var sOld= fs.readFileSync( destDir+destFname, 'utf-8' );
		if( sNew==sOld ){
			console.warn( destFname + " ........................ skip identical !!!" );
			return false;
		}
		
		if( protectUserFile ){
			console.warn( destFname + " ........................ skip protected !!!" );
			return false;
		}
		
		var inp= await consolePrompt( "File '" + destFname+"' is already existed, to backup and replace it ? y/n (n):");
		
		if( inp!="y" ){
			console.warn( destFname + " ........................ skip existed !!!" );
			return false;
		}
		
		
		fs.copyFileSync( destDir + destFname, destDir + destFname.replace( /(\.[^\.]+)$/, bakFileTail()+"$1") );
	}
	
	fs.writeFileSync( destDir+destFname, sNew );
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
		await copyReplacedFile( "res/test-http-config.js", ["extension_allow_ouside_link:","//extension_allow_ouside_link:","extension_allow_ouside_root:","//extension_allow_ouside_root:","extension_server_file_exec:","//extension_server_file_exec:"], true, "../test-http-config.js" );
		await copyReplacedFile( "res/test-http-extension.js", [], false, "../test-http-extension.js" );
		await copyReplacedFile( "res/test-http.bat", [], false, "../test-http.bat" );
	}
	
	if( copyTestMultiple!==true && fs.existsSync( destDir + "../test-multiple-config.js" ) ){
		
		var aListText= fs.readFileSync( destDir + "../test-multiple-config.js", 'utf-8' ).split("//__NEW_INSERTION_HERE__");
		if( aListText.length==2 ){		//check format
			inp= await consolePrompt('* Append project link \"'+name+'\" to ../test-multiple-config.js ? y/n (n):');
			if( inp=="y" ){
				aListText[0]=aListText[0].replace(/\s+$/,"") + "\n\t\""+ name + "\": \"" + destDirLast+"/test/test.htm\",\n\n\t";
				
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
