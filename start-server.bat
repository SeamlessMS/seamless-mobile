@echo off
start /B node server.js > server.log 2>&1
echo Server started! Visit http://localhost:3000/ticket-submission to test the form. 