#!/usr/bin/env node
var path = require('path'),
	http = require('http'),
	express = require(path.join(__dirname, '..', 'node_modules', 'express')),
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
	var img_path = path.join("..", "images");
	
	if(year) {
		img_path = path.join(img_path, year);
	}

	img_path = path.join(img_path, "**", "*.jpg");

	glob(img_path, function(err, names) {
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
	//console.log("Team: " + JSON.stringify(teams[0], null, '\t'));
	//console.log("attendees: " + JSON.stringify(attendees[0], null, '\t'));
	teams.forEach(function(team, i_team) {
		attendees.forEach(function(user, i) {
			answered = false;
			//onsole.log("User team: " + JSON.stringify(user.team, null,  '\t'));
			if(team.creator.emails[0].email === user.profile.email ||
				(user.team !== null && team.id == user.team.id)) {
				user.answers.forEach(function(question) {
					if(question.question_id === "8622569") { //"question": "Would you like to have your team listed on our Team finder page?",
						console.log("Team " + team.name + " has " + team.attendee_count + 
						" members, and creator says " + question.answer + " to if he wants more help");
						if(question.answer === "Yes, I am looking for additional members") {
							_teams.push(team);
							attendees.splice(i, 1); //remove the user from the array so we don't have to scan through multiple times
						}
						answered = true;
					}
				});
				if(!answered) {
					attendees.splice(i, 1); //remove the user from the array so we don't have to scan through multiple times
				}
			}
		});
	});
	console.log(_teams.length + " teams want more people");
	console.log("Need teammates: " + JSON.stringify(_teams, null, '\t'));
	return;
}

function filterTeams(teams) {
	var filtered = [];
	teams.forEach(function(team) {
		if(team.attendee_count < 3) {
			filtered.push(team);
		}
	});
	console.log(filtered.length + " teams have < 3 people on them");
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
	function actual_request(url, callback) {
		request(url, function(err, response, body) {
			if(!err && response.statusCode === 200) {
				callback(err, JSON.parse(body));
			} else {
				console.log("Error: " + JSON.stringify(err));
				console.log("response code: " + JSON.stringify(response.statusCode));
				callback(err);
			}
		});	
	}
	function page(url, field, callback) {
		actual_request(url, function(err, body) {
			if(err) {
				callback(err, results); //return the results we already have
			}
			callback(err, body[field]);
		});
	}
	actual_request(url, function(err, body) {
		if(err) {
			callback(err); 
		}
		var field = Object.keys(body)[1]; //gets the field after pagination
		if(body.pagination.page_number < body.pagination.page_count) {
			var results = body[field];
			var tasks = [];

			for(var i = 2; i <= body.pagination.page_count; i++) {
				var pageURL = url + '&page=' + i;
				tasks.push(async.apply(page, pageURL, field))
			}

			async.parallel(tasks, function(err, _results) {
				console.log("Results before: " + results.length);
				_results.forEach(function(result) {
					console.log("Result length: " + result.length);
					results = results.concat(result);
				});
				console.log("Results after: " + results.length);
				callback(err, results);
			});
		} else {
			callback(err, body[field]);
		}
	});
	
}

var processResults = function(err, results) {
	if(!err) {
		console.log("Got results!");
		var attendees = results[0];
		var teams = results[1];
		//teams = filterTeams(teams);
		//console.log(teams, null, '\t');
		teams = removeHiddenTeams(teams, attendees);
		//console.log(JSON.stringify(_teams));
	} else {
		console.log("Error getting results: " + JSON.stringify(err));
	}
}

async.parallel([
		requestAttendees,
		requestTeams
	],
	processResults);

/*var updateInterval = setInterval(function() {
	console.log("Starting interval");
	async.parallel([
		requestAttendees,
		requestTeams
	],
	processResults);
}, 1000 * 30); //update every 20 minutes*/