
//global variable in not-common-js environment
var test_http_config ={
	http_ip: "127.0.0.1",
	http_port: 8070,
	
	mime: {
		"*":"text/plain",		//default mime type; internal default value will be "application/octet-stream" if not set;
		
		"html":"text/html",
		"htm":"text/html",
		"jpg":"image/jpg",
		"css":"text/css",
		"js":"text/javascript",
		"bat":"text/bat",
		"txt":"text/plain",
		"md":"text/x-markdown",
	},
	
	//head_text: "",				//head text for directory browsing
	//default_process: "",			//default process module file name
	
	extension: "./test-http-extension.js",		//extension list
	
	//extension_allow_link_ouside: true,		//extension arg
	
};

try{ module.exports = test_http_config; } catch(ex) { }
