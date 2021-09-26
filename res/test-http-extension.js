
var url = require("url");
var child_process = require('child_process');
var path = require("path");
var EventEmitter = require('events');
var fs = require("fs");

var config = require("./test-http-config.js");
var test_multiple_config = require('./test-multiple-config.js');

//////////////////////////////////
// project data

var projectData={};		//map project name to project data
var projectPage={};		//map project page to {name:1 or 2}, to check page duplicated.

function dirPart( path ){	//like path.dirname() + "/"
	return path.replace( /[\\\/]+$/ ,"").replace( /[^\\\/]+$/ ,"");
}

function normalizePath( path ){		//like path.normalize()
	path= path.replace( /(^|[\\\/])(\.([\\\/]|$))+/g, "$1" );
	var last="";
	while( path && last!=path ){
		last= path;
		path= path.replace( /(^|[\\\/])([^\.\\\/]|\.+[^\.\\\/])[^\\\/]*[\\\/]\.\.([\\\/]|$)/, "$1" );
	}
	return path;
}

function loadProject( projectConfig, link ){
	var i,v,newItem=[],linkPage;
	var linkPath= link? dirPart( projectData[link].link ) : "";
	
	for(i in projectConfig){
		if( i.indexOf("/*")>=0 ) continue;	//skip abnormal name
		
		v= projectConfig[i];
		if( !v ) continue;
		
		if( typeof v==="string" ) {
			if( v.match(/\btest\-multiple\-config\.js$/ ) ) {		//link
				i+="/*";
				if( ! projectData[i] ){
					projectData[i]={ link: link?(linkPath+v):v };
					newItem[newItem.length]=i;
				}
				continue;
			}
			v= { page: v };		//default page string
		}
		
		if( link ){ i= link+"/"+i; }
		
		if( projectData[i] || !v.page ) continue;	//page already existed
		projectData[i]=v;
		
		linkPage= normalizePath(linkPath+v.page);
		if(!projectPage[linkPage]) { projectPage[linkPage]={}; projectPage[linkPage][i]=1; }
		else { projectPage[linkPage][i]=2; }
		
		newItem[newItem.length]=i;
	}
	
	if( link ) projectData[link].loaded= 1;
	
	if( newItem.length>0 ) console.log(projectData,projectPage,newItem);
	return newItem;
}

//--------------------------------

loadProject(test_multiple_config);

//////////////////////////////////
// common tool

function responseText( res, text, status ){
	res.writeHead( status||200, {"Content-type":"text/plain;charset=UTF-8"});
	res.end(text);
	return true;
}

function responseOk( res, text ){
	return responseText(res,"1 " + text.replace(/^1 /, "") );
}

function responseError( res, text, status ){
	return responseText(res, "0 " + text.replace(/^0 /, ""), status||500 );
}

//////////////////////////////////
// spawn

var spawnCache={};	//map group to { commandPath : spawn_process }

function controlChildSpawn( group, name, op, commandPath, args, options ){
	var cacheItem= spawnCache[group];
	if( ! cacheItem ) cacheItem= spawnCache[group]= {};
	
	var link= linkFromName(name);
	var pagePath= (link?(path.dirname(projectData[link].link)+"/"):"")+projectData[name].page;
	
	var item= cacheItem[commandPath];
	if( op==="start" ){
		if( item ){
			console.log(name + " already started");
			return Error(name + " already started");
		}
		
		if( !options ) options={};
		if( !("cwd" in options ) ) options.cwd= path.dirname( commandPath );
		if( !("shell" in options ) ) options.shell= true;
		//if( !("windowsHide" in options ) ) options.windowsHide= false;
		
		item={console:[],pagePath:pagePath};
		item.process= child_process.spawn( commandPath, args, options );
		
		console.log( "stdio.length=" + item.process.stdio.length );
		
		item.process.stdout.on('data', (data) => {
			var s= name + ": " + data.toString().replace(/\s+$/,"").replace(/^\s+/,"");
			item.console.push(s);
			while( item.console.length>100 ){ item.console.shift(); }
			console.log( s );
		});

		item.process.stderr.on('data', (data) => {
			var s= name + ": stderr, " + data.toString().replace(/\s+$/,"").replace(/^\s+/,"");
			item.console.push(s);
			while( item.console.length>100 ){ item.console.shift(); }
			console.error( s );
		});

		item.process.on('exit', (code) => {
			console.log( name +": exited with code "+code);
			cacheItem[commandPath]= null;
			refreshState();
		});
		
		cacheItem[commandPath]= item;
		refreshState();
	}
	else if( op==="stop" ){
		if( item ){ item.process.kill(); }
	}
	else if( op==="view" ){
		if( ! item || ! item.console ) return "(void)";
		else return "\n"+item.console.join("\n");
	}
	
	return true;
}

//////////////////////////////////
// state

var eventEmitter= new EventEmitter();

var ACTIVE_PULSE_SECONDS=	20;
var ACTIVE_PULSE_SECONDS_DELAY=	ACTIVE_PULSE_SECONDS + 15;	//add 15s

var ACTIVE_PULSE_MAX_COUNT=	1000;

var lastStateString="";

function refreshState(){
	lastStateString="";
	eventEmitter.emit("state-change");
}

function getStateString(){
	if( lastStateString ) return lastStateString;
	
	//get new state string
	
	var state={dirname:__dirname},i,j,cacheItem,si,cnt;
	
	for( i in spawnCache ){
		cacheItem= spawnCache[i];
		
		si= {}; cnt=0;
		for(j in cacheItem){ if( cacheItem[j] ){ si[cacheItem[j].pagePath]= 1; cnt++; } }
		
		if( cnt ) state[i]= si;
	}
	lastStateString= JSON.stringify(state);
	
	return lastStateString;
}

function getSpawnState( res, lastClientState ){
	var stateStr= getStateString();
	
	if( stateStr!= lastClientState ){
		responseOk( res, stateStr );
		return;
	}
	
	//long polling
	console.log("state polling start");
	
	res.setHeader('Connection', "Keep-Alive" );
	res.setHeader('Keep-Alive', "timeout="+ ACTIVE_PULSE_SECONDS_DELAY );
	res.writeHead( 200, {"Content-type":"text/plain;charset=UTF-8"});
	res.write("1 //");
	
	var tmid=null, evtlistener=null;
	
	var stateCallback= function(){
		if( tmid ){ clearTimeout( tmid ); tmid=false; };
		if( evtlistener ){ eventEmitter.removeListener( "state-change", evtlistener ); evtlistener=null; };
		if( !res.writableEnded ){
			try{ res.end( "\n"+getStateString() ); } catch(ex){}
		}
		console.log("state polling finished");
	}
	
	
	//connection timeout
	res.setTimeout( ACTIVE_PULSE_SECONDS_DELAY*1000, stateCallback );
	res.on('close', stateCallback );
	res.on('error', stateCallback );
	
	//keep live pulse
	var keepLiveCount=0;
	
	var keepLiveTimer= function(){
		//console.log("keep live");
		if( ! tmid && tmid!==null ) return;	//timer has stopped
		if( res.writableEnded ) return;		//end()
		
		if( ++keepLiveCount > ACTIVE_PULSE_MAX_COUNT ){ stateCallback(); return; }
		
		res.write( "/" );
		//console.log("keep live write, " + (new Date()));
		
		if( tmid ){ clearTimeout( tmid ); tmid=null; }
		tmid= setTimeout( keepLiveTimer, ACTIVE_PULSE_SECONDS*1000 );
	}
	
	keepLiveTimer();
	
	//listen change event
	
	evtlistener= stateCallback
	eventEmitter.once( "state-change", evtlistener );
}

//////////////////////////////////
// link

function linkFromName(name){
	var i= name.indexOf("/*/");
	if( i<0 ) return "";
	
	var link= name.slice(0,i+2);
	if( ! projectData[link] ) return "";
	
	if( ! projectData[link].loaded ) loadLink(null,link);
	
	return link;
}

function loadLink( res, name ){
	var projectItem= projectData[name];
	if( ! projectItem ){ responseError( res, "link name unfound, " + name ); return; }
	
	if( projectItem.loaded && projectItem.linkData ) {
		if( res ) responseOk( res, projectItem.linkData );
		return;
	}
	
	var cfg= null;
	try{
		cfg= require( __dirname+"/"+projectItem.link );
		projectItem.linkData= JSON.stringify(cfg);
		
		loadProject( cfg, name );
		
		if( res ) responseOk( res, projectItem.linkData );
	}
	catch(ex){
		//console.log(ex);
		if( res ) responseError( res, ""+ex );
	}
}

function loadLinkFile( req, res, linkPath, default_process ){
	var mr= linkPath.match( /^\/([^\/\*]+\/\*)\/(.*)$/ );
	var link= mr[1], linkFilePath= mr[2]||"/";
	
	linkFilePath= linkFilePath.replace(/(^|\/)\*\*\//g, "$1../");	//decode "../"
	
	if( !projectData[link] ){ responseError( res, "link unfound, " + link ); return; }
	
	//file
	console.log(__dirname+"/"+ projectData[link].link);
	var root= path.dirname( path.normalize( __dirname+"/"+ projectData[link].link ));
	
	var pathname = path.normalize( root + "/" + decodeURIComponent( linkFilePath ));
	if( ! config.extension_allow_link_ouside && pathname.indexOf(root)!==0 ){ responseError( res, "outside link path, " + link ); return; }
	
	console.log("link file, "+link+" : "+ path.dirname(projectData[link].link) + "/ " + linkFilePath );
	//console.log(pathname);
	//console.log(root);
	
	default_process( req, res, {pathname:pathname, isRoot:(pathname.replace(/[\\\/]+$/,"")==root), } );
}

//////////////////////////////////
// http extension

//if the request is processed, return true.
module.exports = function(req,res,options){
	res.setHeader('Access-Control-Allow-Origin', "*" );
	res.setHeader('Access-Control-Allow-Methods', "GET");
	res.setHeader('Access-Control-Allow-Headers', "x-requested-with,content-type");
	
	//link file
	var reqUrl= url.parse(req.url,true);
	if( reqUrl.pathname.match( /^\/[^\/\*]+\/\*\// ) ){
		loadLinkFile(req,res,reqUrl.pathname,options.default_process);
		return true;
	}
	
	//cmd at root
	
	if( reqUrl.pathname !== "/" ) return;
	
	//parameter
	
	var query= reqUrl.query;
	if( !query ) return;
	var cmd= query["cmd"];
	if( !cmd ) return;
	
	//global cmd
	if( cmd==="getSpawnState" ){
		console.log( "cmd=" + cmd );
		getSpawnState(res, query["lastState"]);
		return true;
	}
	else if( cmd==="loadLink" ){
		console.log( "cmd=" + cmd+", "+ reqUrl.search );
		loadLink(res,query["name"]);
		return true;
	}
	
	//item cmd
	
	var name= query["name"];
	//console.log(name);
	if(!name ) return;
	
	var link= linkFromName( name );
	
	var item= projectData[name];
	//console.log(item);
	if( ! item ) return;
	
	console.log( "cmd=" + cmd + ", name=" + name + ", link=" + link );
	
	if( cmd==="startWatchify" || cmd==="stopWatchify" || cmd==="viewConsole"){
		
		var execPath= path.normalize( __dirname +"/" + (link?(path.dirname( projectData[link].link ) + "/"):"") + ( item.watchify|| (path.dirname( item.page ) +"/../dev-1-browserify-watchify.bat") ) );
		console.log( cmd + ", " + execPath);
		
		var ret= controlChildSpawn( "watchify", name, cmd.match(/^[a-z]+/)[0], execPath );
		
		if( ret instanceof Error ) responseError( res, ""+ret );
		else if( typeof ret==="string" ){
			responseOk( res, ret );
		}
		else responseOk( res, cmd );
	}
	else return;
	
	return true;
}
