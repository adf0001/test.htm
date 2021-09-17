
var url = require("url");
var child_process = require('child_process');
var path = require("path");
var EventEmitter = require('events');

//////////////////////////////////
// common tool

function responseText( res, text, status ){
	res.writeHead( status||200, {"Content-type":"text"});
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

var spawnCache={};	//map group to { name : spawn_process }

function controlChildSpawn( group, name, op, commandPath, args, options ){
	var cacheItem= spawnCache[group];
	if( ! cacheItem ) cacheItem= spawnCache[group]= {};
	
	var item= cacheItem[name];
	if( op==="start" ){
		if( item ){
			console.log(name + " already started");
			return;
		}
		
		if( !options ) options={};
		if( !("cwd" in options ) ) options.cwd= path.dirname( commandPath );
		if( !("shell" in options ) ) options.shell= true;
		//if( !("windowsHide" in options ) ) options.windowsHide= false;
		
		item={console:[]};
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
			cacheItem[name]= null;
			refreshState();
		});
		
		cacheItem[name]= item;
		refreshState();
	}
	else if( op==="stop" ){
		if( item ){ item.process.kill(); }
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
	
	var state={},i,j,cacheItem,si,cnt;
	
	for( i in spawnCache ){
		cacheItem= spawnCache[i];
		
		si= {}; cnt=0;
		for(j in cacheItem){ if( cacheItem[j] ){ si[j]= 1; cnt++; } }
		
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
	res.writeHead( 200, {"Content-type":"text"});
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
// http extension

//if the request is processed, return true.
module.exports = function(req,res){
	res.setHeader('Access-Control-Allow-Origin', "*" );
	res.setHeader('Access-Control-Allow-Methods', "GET");
	res.setHeader('Access-Control-Allow-Headers', "x-requested-with,content-type");
	
	var reqUrl= url.parse(req.url,true);
	if( reqUrl.pathname !== "/" ) return;
	
	var query= reqUrl.query;
	if( !query ) return;
	var cmd= query["cmd"];
	if( !cmd ) return;
	
	if( cmd==="getSpawnState" ){
		console.log( "cmd=" + cmd );
		getSpawnState(res, query["lastState"]);
		return true;
	}
	
	var name= query["name"];
	var item= JSON.parse(query["item"]);
	if( typeof item==="string" ) item= { page: item };
	
	console.log( "cmd=" + cmd + ", name=" + name + ", item=" + query["item"] );
	
	if( cmd==="startWatchify" ){
		
		var execPath= path.normalize( __dirname +"/" + ( item.watchify|| (path.dirname( item.page ) +"/../dev-1-browserify-watchify.bat") ) );
		console.log("exec " + execPath);
		
		controlChildSpawn( "watchify", name, "start", execPath );
		
		responseOk( res, "startWatchify" );
	}
	else if( cmd==="stopWatchify" ){
		controlChildSpawn( "watchify", name, "stop" );
		
		responseOk( res, "stopWatchify" );
	}
	else return;
	
	return true;
}
