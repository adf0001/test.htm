
set oldPath=%CD%

cd /d "%~dp0"

node res/copy-files.js

@echo.
@echo --------------------------------------------
@echo.

@SET inp=
@SET /P inp=* Remove/uninstall package 'test.htm' ? y/n (n):

@if "%inp%"=="y" (
	cd ../..
	npm uninstall test.htm --no-save
	rd node_modules
)

cd /d "%oldPath%"

pause
