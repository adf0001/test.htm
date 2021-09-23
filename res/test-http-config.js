
//global variable in not-common-js environment
var test_http_config ={
	http_ip: "127.0.0.1",
	http_port: 8070,
	
	mime: {
		"html":"text/html",
		"htm":"text/html",
		"jpg":"image/jpg",
		"css":"text/css",
		"js":"text/javascript",
		"bat":"text/bat",
		"txt":"text/plain",
	},
	
	extension: "./test-http-extension.js",
	
	//extension_allow_link_ouside: true,
	
};

try{ module.exports = test_http_config; } catch(ex) { }
