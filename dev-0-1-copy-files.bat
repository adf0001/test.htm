
node ./res/copy-files.js

@echo.
@echo --------------------------------------------
@echo.

@SET /P inp=* Remove/uninstall package 'test.htm' ? y/n (n):

@if "%inp%"=="y" (
	cd ../..
	npm uninstall test.htm --no-save
	rd node_modules
)

pause
