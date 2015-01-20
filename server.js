#!/usr/bin/env node
var path = require('path'),
  http = require('http'),
  express = require('express'),
  imgSize = require('image-size'),
  bodyParser = require('body-parser'),
  config = require(path.join(__dirname, 'config.json')),
  compression = require('compression'),
  app = express(),
  request = require('request'),
  async = require('async'),
  _teams = [],
  approvedTeams = [],
  fs = require('fs'),
  glob = require('glob');


app.set('port', process.env.VCAP_APP_PORT || 3000);
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'build')));
app.use('/hosted-images', express.static(path.join('/var', 'www', 'hosted-images')));
app.get('/', express.static(path.join(__dirname, 'build', 'index.html')));
app.get("/teams", getTeamInfo);
app.get("/spots", getRemainingSpots);
app.get("/imgs/:year?", getImageNames);

var server = http.createServer(app);

/************************************** API End Points **************************************/

function getImageNames(req, res) {
  var year = req.query.year;
  var file_ext = req.query.ext; //default parameter is jpg
  var img_path = path.join('/var', 'www', 'hosted-images');
  if(year) {
    img_path = path.join(img_path, year);
  }

  if(!file_ext) {
    file_ext = "jpg";
  }

  img_path = path.join(img_path, "**", "*." + file_ext); //for globbing

  console.log("Path: " + img_path);

  glob(img_path, function(err, names) {
    var imgs = [];
    for(var i = 0; i < names.length; i++) {
      var size = imgSize(names[i]);
      var temp = {
        link: names[i].replace("/var/www/hosted-images", "hosted_images"),
        width: size.width,
        height: size.height
      }
      imgs.push(temp);
    }
    res.send(imgs);
  });
}

function getRemainingSpots(req, res) {
  var remainingSpots = 0;
  var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "?token=" + config.eventbrite.oathtoken;
  request(request_url, function(err, response, body) {
    if(!err && response.statusCode === 200) {
      body = JSON.parse(body);
      body.ticket_classes.forEach(function addSeats(ticket_type) {
        remainingSpots += ticket_type.quantity_sold;
      });
    } else {
      console.log("Error: " + JSON.stringify(err));
      console.log("response code: " + JSON.stringify(response.statusCode));
    }
    res.send({remainingSpots: (250 - remainingSpots)});
  });
}


function getTeamInfo(req, res) {
  res.send(approvedTeams);
}

/************************************** Team Processing Functions **************************************/

//Happened more commonly in old versions. 
function removeDuplicates(list) {
  var uniqueArr = list.filter(function(elem, pos) {
    return list.indexOf(elem) == pos;
  });
  return uniqueArr;
}

function processResponse(err, team, creator) {
  if(creator) {
    var response = getUserResponse(creator.answers);

    if(response.approved) {
      var teamObj = {
        name: team.name,
        members: team.attendee_count,
        description: response.description,
        captain: {
          name: creator.profile.name,
          email: creator.profile.email
        }
      };
      _teams.push(teamObj);
    }
  }
}

function getCreator(team, attendees, cb) {
  attendees.forEach(function(attendee) {
    if(team.creator.emails[0].email === attendee.profile.email) {
      cb(null, team, attendee);
    }
  });
  cb(null);
}

function getUserResponse(questions) {
  var response = {
    approved: false,
    description: null
  };

  questions.forEach(function(answer) {
    if(answer.question_id === "8622569") { //"question": "Would you like to have your team listed on our Team finder page?",
      if(answer.answer === "Yes, I am looking for additional members") {
        response.approved = true;
      }

    } else if(answer.question_id === "8622571") {
      if(typeof(answer.answer) !== "undefined") {
        response.description = answer.answer;
      }
    }
  });

  return response;
}

function removeHiddenTeams(teams, attendees) {
  var visible_teams = [],
    answered = false,
    approved = false,
    description = null,
    captain = null;

  for(var i = 0; i < teams.length; i++) {
    var team = teams[i];
    getCreator(team, attendees, processResponse);
  }

  _teams = removeDuplicates(_teams); //ensure it is free of dups

  return;
}

//removes small teams
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

/************************************** EVENTBRITE API Requests **************************************/
var requestTeams = function(callback) {
  var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "/teams/?token=" + config.eventbrite.oathtoken;
  make_request(request_url, callback);
};

var requestAttendees = function(callback) {
  var request_url = "https://www.eventbriteapi.com/v3/events/" + config.eventbrite.event_id + "/attendees/?token=" + config.eventbrite.oathtoken;
  make_request(request_url, callback);
};

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

  //To assist with the pagination of results
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
        tasks.push(async.apply(page, pageURL, field));
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

    approvedTeams = _teams;
    _teams = [];

    console.log("Teams that need members: " + approvedTeams.length);

  } else {
    console.log("Error getting results: " + JSON.stringify(err));
  }
};


function update() {
  var now = new Date();
  console.log("Updating at " + now.toLocaleString());
  async.parallel([
    requestAttendees,
    requestTeams
  ],
  processResults);
}

// Log errors before crash
app.use(function(err, req, res, next) {
  if(!err) return next();
  console.log("Error: ".red + JSON.stringify(err));
  console.log(err.stack);
  if(!res.headersSent) {
    res.json({error: err});
  }
});

//Start server
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  update();
});

var updateInterval = setInterval(function() {
  update();
}, 1000 * 60 * 15); //update every 15 minutes
