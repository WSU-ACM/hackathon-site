// Imports
var del = require('del');
var path = require('path');
var eventStream = require('event-stream');
var gulp = require('gulp');
var handlebars = require('handlebars');
var jshint = require('gulp-jshint');
var map = require('map-stream');
var rename = require('gulp-rename');
var streamqueue = require('streamqueue');
var stylish = require('jshint-stylish');
var watch = require('gulp-watch');
var bump = require('gulp-bump');
var seq = require('run-sequence');
var replace = require('gulp-replace');
var install = require('gulp-install');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var version = require('./package.json').version;
var imagemin = require('gulp-imagemin');
var cssmin = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var imageResize = require('gulp-image-resize');
var fs = require('fs-extra');
var glob = require('glob');
var hackathonApiServer = require('hackathon-api-server');
var apiServerConfig = require('./configs/api-server-config.json')


gulp.task('node-serv', function() {
  hackathonApiServer.startServer(apiServerConfig);
});

gulp.task('default', ['node-serv']);

/******************************************** Version MGMT ********************************************/
function bumpIt(type) {
  gulp.src('./package.json')
    .pipe(bump({type: type}))
    .pipe(gulp.dest('./'));
  console.log("Site Version is now: " + version);
}

gulp.task('bump-minor', function() {
  bumpIt('minor')
});

gulp.task('bump-major', function() {
  bumpIt('major')
});

gulp.task('bump-patch', function() {
  bumpIt('patch')
});

/******************************************** Server Communication ********************************************/
gulp.task('copy-images', function(cb) {
  // Configure readline
  var readline = require('readline');
  var scp = require('gulp-scp2');

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Server settings
  var server = {
    'host': 'csg-gate.eecs.wsu.edu',
    'port': 11993
  }

  //copy and minify images
  glob(hosted_images + '*', function(err, folders) {
    folders.forEach(function(folder) {
      fs.copySync('./' + folder, './' +folder + '_mini');
      gulp.src(hosted_images + '@(*_mini)/*.*') //get all images
        .pipe(imageResize({
          width: 250
        }))
        .pipe(gulp.dest(function(file) {
          var parts = file.history[0].split('/');
          parts.splice(-2, 2); //remove the last two parts of the path
          //Needed to keep image in same folder
          var filedest = parts.join([separator = '/']);
          return filedest;
        }));
    });
  });

  // Get user account info
  rl.question("Please enter your username: ", function(username) {
    rl.question("Please enter your password: ", function(pass) {

      //copy images to server
      gulp.src(hosted_images + '**/*.*') //get all images
        .pipe(scp({
          'host': server.host,
          'port': server.port,
          'username': username,
          'password': pass,
          'dest': '/var/www/hosted-images'  
        }))
        .on('error', function(err) {
          console.error("An error occured during copy: " + err)
        })
        .on('end', function() {
          console.log("Images uploaded");
          //del(hosted_images); //clear so we don't try to copy them over again
          //Not working for some reason
        });
        console.log("Please clear the hosted-images folder so you don't have two copies on the server");
        cb();
    });
  });
});