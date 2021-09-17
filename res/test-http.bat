
set supervisorPath=supervisor.cmd

title supervisor - test-http - %CD%

%supervisorPath% -w "./test-http.js,./test-http-config.js,./test-http-extension.js" -RV test-http.js
