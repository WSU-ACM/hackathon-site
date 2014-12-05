#!/usr/bin/env node
var path = require('path'),
	http = require('http'),
	express = require(path.join(__dirname, '..', 'node_modules', 'express')),
	bodyParser = require('body-parser'),
	bodyParser = require('body-parser'),
	config = require(path.join(__dirname, 'config.json')),
	compression = require('compression'),
	app = express(),
	request = require('request'),
	async = require('async'),
	_teams = [],
	fs = require('fs'),
	glob = require('glob');


app.set('port', process.env.VCAP_APP_PORT || 80);
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/teams", getTeamInfo);
app.get("/imgs/:year?", getImageNames);

function getImageNames(req, res) {
	var year = req.param('year', null);
	var path = "./images/";
	if(year) {
		path = path + year + "/"; 
	}
	path + "**/*.jpg";
	glob(path, function(err, names) {
		console.log("Files: " + JSON.stringify(names));
		res.send(names);
	});
}

function getTeamInfo(req, res) {
	res.send(teams);	
}

function removeHiddenTeams(teams, attendees) {
	var visible_teams = [],
		answered = false;
	console.log(typeof(teams.teams));
	teams.teams.forEach(function(team) {
		attendees.attendees.forEach(function(user, i) {
			answered = false;
			if(team.creator.emails[0].email === user.profile.email) {
				user.answers.forEach(function(question) {
					
					if(question.question_id === 8622569) { //"question": "Would you like to have your team listed on our Team finder page?",
						if(question.answer === "Yes, I am looking for additional members") {
							visible_teams.push(_team);
							attendees.attendees.splice(i, 1); //remove the user from the array so we don't have to scan through multiple times
						}
						answered = true;
					}
				});
				if(!answered) {
					attendees.attendees.splice(i, 1); //remove the user from the array so we don't have to scan through multiple times
				}
			}
		});
	});
	return visible_teams;
}

function filterTeams(teams) {
	var filtered = [];
	teams.forEach(function(team) {
		if(team.attendee_count < 3) {
			filtered.push(team);
		}
	});
	return filtered;
}

var requestTeams = function(callback) {
	var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "/teams/?token=" + config.eventbrite.oathtoken;
	make_request(request_url, callback);
}

var requestAttendees = function(callback) {
	var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "/attendees/?token=" + config.eventbrite.oathtoken;
	make_request(request_url, callback);
}

function make_request(url, callback) {
	console.log("Making request");
	request(url, function(err, response, body) {
		console.log("Got response");
		if(!err && response.statusCode === 200) {
			callback(err, JSON.parse(body));
		} else {
			callback(err);
		}
	});
}

var processResults = function(err, results) {
	if(!err) {
		console.log("Got results!");
		var attendees = results[0];
		var teams = results[1];
		teams = removeHiddenTeams(teams, attendees);
		console.log(JSON.stringify(_teams));
	} else {
		console.log("Error getting results: " + JSON.stringify(err));
	}
}

var updateInterval = setInterval(function() {
	console.log("Starting interval");
	async.parallel([
		requestAttendees,
		requestTeams
	],
	processResults);
}, 1000 * 30); //update every 20 minutes