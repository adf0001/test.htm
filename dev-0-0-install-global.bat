
for /F %%i in ('npm bin -g') do ( set npmBinPath=%%i)

echo %1

if "%1"=="-r" (
	call npm i -g browserify
	call npm i -g watchify
	call npm i -g terser
	call npm i -g bundle-collapser
) else (
	if not exist "%npmBinPath%/browserify.cmd" 			call npm i -g browserify
	if not exist "%npmBinPath%/watchify.cmd"			call npm i -g watchify
	if not exist "%npmBinPath%/terser.cmd"				call npm i -g terser
	if not exist "%npmBinPath%/bundle-collapser.cmd"	call npm i -g bundle-collapser
)

pause
