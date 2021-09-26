
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");

var config = require("./test-http-config.js");

var extension= ( typeof config.extension==="string" ) ? [config.extension] : ( config.extension || [] );
extension= extension.map( v=>require( v ) );

//default is to browse directories and files, options={pathname,isRoot,head_text,mime}
var default_process= function( req, res, options ) {
	if(!options) options={};
	var {pathname,isRoot}= options;
	
	if( !pathname ){
		pathname = decodeURIComponent( url.parse(req.url).pathname );
		console.log(pathname);
		isRoot= (pathname==="/");
		
		pathname= __dirname+pathname;
	}
	
	//directory
	if( pathname.slice(-1).match(/^[\\\/]/) ){
		fs.readdir( pathname, {withFileTypes:true}, function(err,data) {
			if( err ) { console.log(err); res.writeHead(500,{"Content-type":"text/plain;charset=UTF-8"}); res.end(""+err); return; }
			var a= data.map(v=>{ var dirSlash=v.isDirectory() ? "/":""; return "<a href='"+ v.name+dirSlash+"'>"+ dirSlash + v.name + "</a>";});
			res.writeHead(200,{"Content-type":"text/html;charset=UTF-8"});
			res.end((options.head_text||config.head_text||"<style>a{display:block;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;text-decoration:none;}a:hover{text-decoration:underline;}div{column-width:10em;}</style>")+"<div>"+(isRoot?"":"<a href='../'>/..</a>")+a.join("")+"</div>");
		});
		return true;
	}
	
	//file
	fs.readFile( pathname,function(err,data) {
		if(err) {
			if( err.code==="ENOENT" ) { res.writeHead(404,{"Content-type":"text/plain"}); res.end("404 NOT FOUND"); }
			else{ console.log(err); res.writeHead(500,{"Content-type":"text/plain;charset=UTF-8"}); res.end(""+err); }
			return;
		};
		
		var mime= options.mime || config.mime;
		res.writeHead(200,{"Content-type":mime[path.extname(pathname).toLowerCase().slice(1)] || mime["*"] || "application/octet-stream"});
		res.end(data);
	});
	
	return true;
}
if( config.default_process ) default_process= require( config.default_process );

console.log("=".repeat(50));
console.log("http://" + config.http_ip+":"+ config.http_port + ", start at " + (new Date()));
console.log("root: " + __dirname );

http.createServer( function(req,res) {
	for(var i in extension ){ if( extension[i](req,res,{default_process:default_process}) ) return; }
	
	default_process(req,res);
	
}).listen(config.http_port,config.http_ip);

