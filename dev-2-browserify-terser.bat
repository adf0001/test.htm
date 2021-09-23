
for /F %%i in ('npm root -g') do ( set globalModulePath=%%i)

set browserifyPath="browserify.cmd"
set bundleCollapserPath="%globalModulePath%/bundle-collapser/plugin"
set terserPath="terser.cmd"

set module=sample

if not exist ./release md release

call %browserifyPath% -p %bundleCollapserPath% -o ./release/bundle.min.js -v ^
	-r ./%module%.js:%module%

echo on

call %terserPath% ./release/bundle.min.js -o ./release/bundle.min.js -c -m

pause
