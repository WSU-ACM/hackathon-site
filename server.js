#!/usr/bin/env node
var path = require('path'),
	http = require('http'),
	express = require('express'),
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

var server = http.createServer(app);

function getImageNames(req, res) {
	var year = req.param('year', null);
	var img_path = path.join("web", "images");
	
	if(year) {
		img_path = path.join(img_path, year);
	}

	img_path = path.join(img_path, "**", "*.jpg"); //for globbing

	glob(img_path, function(err, names) {
			console.log("Files: " + JSON.stringify(names));
		res.send(names);
	});
}

function getTeamInfo(req, res) {
	var processed = [];

	_teams.forEach(function(team) {
		var teamObj = {
			name: team.name,
			members: team.attendee_count,
			description: team.description,
			captain: team.captain
		};
		processed.push(teamObj);
	});

	res.send(processed);
}

function removeDuplicates(list) {
	var uniqueArr = list.filter(function(elem, pos) {
		return list.indexOf(elem) == pos;
	});
	return uniqueArr;
}

function removeHiddenTeams(teams, attendees) {
	var visible_teams = [],
		answered = false,
		approved = false,
		description = null,
		captain = null;

	teams.forEach(function(team, i_team) {
		attendees.forEach(function(user, i) {
			answered = false;
			approved = false;
			description = null;
			captain = null;
			
			if(team.creator.emails[0].email === user.profile.email) {
				captain = {
					name: user.profile.name,
					email: user.profile.email
				};

				user.answers.forEach(function(question) {
					if(question.question_id === "8622569") { //"question": "Would you like to have your team listed on our Team finder page?",
						if(question.answer === "Yes, I am looking for additional members") {
							approved = true;							
						}

					} else if(question.question_id === "8622571") {
						if(typeof(question.answer) !== "undefined") {
							description = question.answer;
						}
					}
				});

				if(approved) {
					team.description = description;
					team.captain = captain;
					_teams.push(team);
				}
			}
		});
	});

	_teams = removeDuplicates(_teams); //ensure it is free of dups

	return;
}

function filterTeams(teams) {
	var filtered = [];
	teams.forEach(function(team) {
		if(team.attendee_count < 3) {
			filtered.push(team);
		}
	});
	//console.log(filtered.length + " teams have < 3 people on them");
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

				_results.forEach(function(result) {
					results = results.concat(result);
				});

				callback(err, results);
			});
		} else {
			callback(err, body[field]);
		}
	});	
}

var processResults = function(err, results) {
	if(!err) {
		var attendees = results[0];
		var teams = results[1];
		console.log("Total attendees: " + attendees.length);

		teams = filterTeams(teams);
		
		removeHiddenTeams(teams, attendees);

		console.log("Teams that need members: " + _teams.length);

	} else {
		console.log("Error getting results: " + JSON.stringify(err));
	}
}

function update() {
	var now = new Date();
	console.log("Updating at " + now.toLocaleString());
	async.parallel([
		requestAttendees,
		requestTeams
	],
	processResults);
}

app.use(function(err, req, res, next) {
	if(!err) return next();
	console.log("Error: ".red + JSON.stringify(err));
	console.log(err.stack);
	if(!res.headersSent) {
		res.json({error: err});
	}
});

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
	update();
});

var updateInterval = setInterval(function() {
	update();
}, 1000 * 60 * 20); //update every 20 minutes
