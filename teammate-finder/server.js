#!/usr/bin/env node
var path = require('path'),
	http = require('http'),
	express = require(path.join(__dirname, '..', 'node_modules', 'express')),
	bodyParser = require('body-parser'),
	bodyParser = require('body-parser'),
	config = require(path.join(__dirname, 'config.json')),
	compression = require('compression'),
	app = express(),
	request = require('request');	


app.set('port', process.env.VCAP_APP_PORT || 80);
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/teams", getTeamInfo);

function getTeamInfo(req, res) {
	
}