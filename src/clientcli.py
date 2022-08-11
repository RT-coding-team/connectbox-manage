#!/usr/bin/python3

#  Provides front-end command line interface.  Requires port 5002 operating instance of connectbox-manage/src/index.js (probably in PM2)
import requests
import json
import sys
import os

usage = """
Usage: connectboxmanage <command> <key> <value>
	Commands:
		- get
		- set
		- do

		Values to get:
usageTexts.get
		Values to set:
usageTexts.set
		Actions to do:
usageTexts.do

		Examples:
			connectboxmanage get hostname
			connectboxmanage get brand Image
			connectboxmanage do reboot
			connectboxmanage set hostname <new>
			connectboxmanage set brand Image=<wwwpath>
"""

verbs = {
	"get":"GET",
	"set":"PUT",
	"do":"GET"
}

# Convert CLI parameters into variables
parameters = ['executable','command','key','value']
params = {}
paramCounter = -1
data = {}
for i in range(len(sys.argv)):
	params[parameters[i]] = sys.argv[i]
#print (params)

# Validate the CLI parameters
valid = 0
if ('command' not in params):
	valid=-1
elif (params['command'] not in verbs):
	valid = -2
elif ('key' not in params):
	valid = -3
elif ('value' not in params and params['command'] == 'set'):
	valid = -4

# If not a valid request, show the usage info
if (valid < 0):
	usageTexts = {"get":"","set":"","do":""}
	f = open('./functions.js')  # Load the functions code with embedded DICT lines that define functions and usage
	for line in f:
		if (line.startswith('//DICT:')):
			fields = line.split(':')
			usageTexts[fields[1].lower()] += "			" + fields[2] + ": " + fields[3]
	usage = usage.replace('usageTexts.get',usageTexts["get"])
	usage = usage.replace('usageTexts.set',usageTexts["set"])
	usage = usage.replace('usageTexts.do',usageTexts["do"])
	print (usage)
	exit(1)
	

# Assemble the data if it's a set
if (params['command'] == "set"):
	data = {"value":params['value']}

# Do commands need to prepend the command to the URL:
if (params['command'] == "do"):
	params['key'] = "do/" + params['key']
	
# Brand needs to prepend the command to the URL:
if (params['key'] == "brand"):
	params['key'] = "brand/" + params['key']	

# Construct the HTTP transaction
headers = headers = {"Authorization": "Bearer 9bfa3ed8-8609-4e78-af68-7013aa2b720a","Accept":"application/json;charset=UTF-8"}
url = "http://127.0.0.1:5002/admin/api/" + params['key']
#print (verbs[params['command']], headers, url, data)

response = requests.request(verbs[params['command']], headers=headers, url=url, data=data)

if (response.status_code != 200):
	print ("Error: " + str(response.status_code))
	exit(1)

try:
	obj = response.json()
	result = obj[u'result']
	final = json.dumps(result[0])
	print (final)
except:
	print ("Invalid Data: " + response.text)
