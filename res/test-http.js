
var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");

var config = require("./test-http-config.js");

console.log("http://" + config.http_ip+":"+ config.http_port);
console.log("root: " + __dirname );

http.createServer( function(req,res) {
	var pathname = decodeURIComponent( url.parse(req.url).pathname );
	console.log(pathname);
	
	//directory
	if( pathname.slice(-1)==="/" ){
		fs.readdir( __dirname+"/"+pathname, {withFileTypes:true}, function(err,data) {
			if( err ) { console.log(err); res.writeHead(500,{"Content-type":"text"}); res.end(""+err); return; }
			var a= data.map((v)=>{ var dirSlash=v.isDirectory() ? "/":""; return "<a href='"+ v.name+dirSlash+"'>"+ dirSlash + v.name + "</a>";});
			res.writeHead(200,{"Content-type":"text/html;charset=UTF-8"});
			res.end("<style>a{display:block;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;text-decoration:none;}a:hover{text-decoration:underline;}</style><div style='column-width:10em;'><a href='../'>/..</a>"+a.join("")+"</div>");
		});
		return;
	}
	
	//file
	fs.readFile(__dirname+"/"+pathname,function(err,data) {
		if(err) {
			if( err.code==="ENOENT" ) { res.writeHead(404,{"Content-type":"text"}); res.end("404 NOT FOUND"); }
			else{ console.log(err); res.writeHead(500,{"Content-type":"text"}); res.end(""+err); }
			return;
		};
		
		res.writeHead(200,{"Content-type":config.mime[path.extname(pathname).toLowerCase().slice(1)]||"application/octet-stream"});
		res.end(data);
	});
}).listen(config.http_port,config.http_ip);

