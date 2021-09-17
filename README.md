﻿# test.htm
test htm template

## usage

1. prepare the file 'package.json' of your project;

2. install with no-save mode
```
npm install test.htm --no-save
```

3. run copy-files tool, or double click to run
```
.\node_modules\test.htm\dev-0-1-copy-files.bat
```

* optional, at first time usage, select 'y' to "Install global environment";
	or double click to run './node_modules/test.htm/dev-0-0-install-global.bat';

* optional, to copy mocha tools, select 'y' to "Copy for mocha";

* optional, to copy develope tools, select 'y' to "Copy develope tools";

* optional, to copy tools for multiple projects, to the parent folder, select 'y' to "Copy tools for multiple projects";

* optional, to copy tools for http debugging, to the parent folder, select 'y' to "Copy tools for http";

* optional, to append project link to the found projects tools, select 'y' to "Append project link";

* optional, package 'test.htm' can be removed now, as you like; 
	select 'y' to "Remove/uninstall package 'test.htm'"; 
	or execute manually
```
npm uninstall test.htm --no-save
```

4. now update file 'test/test-data.js' in your project with your code,
	and open page 'test/test.htm' to test in browsers; or run 'test-http.bat' and open page '../test-list.htm' to test in browsers.


## file structure

```
├─package.json                             //your package.json
├─node_modules
│  ├─test.htm
│  │  │  .gitignore
│  │  │  dev-0-0-install-global.bat       //initialize environment
│  │  │  dev-0-1-copy-files.bat           //initialize your project
│  │  │  dev-1-browserify-watchify.bat    //develop tool 1: watchify
│  │  │  dev-2-browserify-terser.bat      //develop tool 2: pack
│  │  │  package.json
│  │  │  README.md
│  │  │  sample.js
│  │  │
│  │  ├─release
│  │  │      bundle.js
│  │  │      bundle.min.js
│  │  │
│  │  ├─res
│  │  │      copy-files.js
│  │  │      test-list.htm                //multiple projects tool
│  │  │      test-list-config.js          //multiple projects tool config
│  │  │      test-http.bat                //http running tool
│  │  │      test-http.js                 //http tool
│  │  │      test-http-config.js          //http tool config
│  │  │      test-http-extension.js       //http tool extension
│  │  │
│  │  └─test
│  │          test-data.js        //user defined test data
│  │          test.htm            //for browser
│  │          test.bat            //for mocha
│  │          test.js             //for mocha
```
