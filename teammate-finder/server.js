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
	async = require('async');


app.set('port', process.env.VCAP_APP_PORT || 80);
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/teams", getTeamInfo);

function getTeamInfo(req, res) {
	
}

function removeHiddenTeams(teams, attendees) {
	var visible_teams = [],
		answered = false;
	teams.forEach(function(team) {
		attendees.forEach(function(user, i) {
			answered = false;
			if(team.creator.emails[0].email === user.profile.email) {
				user.answers.forEach(function(question) {
					
					if(question.question_id === 8622569) { //"question": "Would you like to have your team listed on our Team finder page?",
						if(question.answer === "Yes, I am looking for additional members") {
							visible_teams.push(team);
							attendees.splice(i, 1); //remove the user from the array so we don't have to scan through multiple times
						}
						answered = true;
					}
				});
				if(!answered) {
					attendees.splice(i, 1); //remove the user from the array so we don't have to scan through multiple times
				}
			}
		})
	});
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

function requestTeams(callback) {
	var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "/teams/?token=" + config.eventbrite.oathtoken;
	request(request_url, callback);
}

function requestAttendees(callback) {
	var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "/attendees/?token=" + config.eventbrite.oathtoken;
	request(request_url, callback);
}

function request(url, callback) {
	request(url, function(err, response, body) {
		if(!err && response.statusCode === 200) {
			callback(err, JSON.parse(body));
		}
		callback(err);
	});
}

requestTeams();


https://www.eventbriteapi.com/v3/events/13887256157/attendees/?token=HTSLIYVD5O6RDZX7756F