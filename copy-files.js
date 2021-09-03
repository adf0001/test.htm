
var fs= require("fs");
var path= require("path");
const readline = require('readline');

var destDir= path.normalize(__dirname+"/../../");
//console.log( destDir );

if( ! fs.existsSync( destDir + "package.json" ) ){
	console.error( "error: package.json not exists at "+destDir );
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

function copyReplacedFile( fn, replacePairArray ){
	if( fs.existsSync( destDir + fn ) ){
		console.warn( fn + " ........................ skip existed !!!" );
	}
	else{
		var s= fs.readFileSync( "./"+fn, 'utf-8' );
		//console.log(s);
		for(var i=0;i<replacePairArray.length;i+=2){
			s=s.replace( replacePairArray[i], replacePairArray[i+1] );
		}
		if( (name+".js")!= mainName ) s=s.replace( "%module%.js", mainName );
		fs.writeFileSync( destDir+fn, s );
		console.warn( fn + " ...... copied" );
	}
}

var simpleName= ((name+".js")== mainName);

copyReplacedFile( "dev-1-browserify-watchify.bat", simpleName ? ["sample", name]: ["sample", name,"%module%.js", mainName] );
copyReplacedFile( "dev-2-browserify-terser.bat", simpleName ? ["sample", name]: ["sample", name,"%module%.js", mainName] );

if( ! fs.existsSync( destDir + "test" ) ) fs.mkdirSync( destDir+ "test" );
copyReplacedFile( "test/test.htm", [] );

var newRef= name.replace( /\W/g,"_" ).replace( /^(\d)/, "_$1");

copyReplacedFile( "test/test-data.js", [ /\"sample\"/g, "\""+name+"\"", "../sample.js", "../"+mainName, /sample/g, newRef ] );

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.question('for mocha? y/n (y)', (answer) => {
	if( !answer || answer==="y" ){
		copyReplacedFile( "test/test.bat", [] );
		copyReplacedFile( "test/test.js", ['mocha-test','mocha-test: '+ name ] );
	}
	rl.close();
});

