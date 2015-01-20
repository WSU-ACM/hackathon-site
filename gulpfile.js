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


/** !!!! Critical Configuration Variables !!!! **/
// Build and src directories
var buildDir = 'build/';
var webDir = 'web/';
var pagesDir = webDir + 'pages/';

/*
These are your static directories. Files in these directories will get copied as
they are into the build directory */
var staticDirs = [
  'images/',
  'scripts/',
  'styles/'
];

/*
These are your pages. The filename must match a file in the pages directory with
the convention of _${file_name}.html and there should also be a css file with
the convention of ${file_name}.css in the styles directory or else the page
will lack theming */
var pages = [
  { file_name: 'ideas', title: 'Ideas' },
  { file_name: 'index', title: 'WSU Hackathon' },
  { file_name: 'pictures', title: 'Pictures' },
  { file_name: 'sponsorship', title: 'Sponsorship' },
  { file_name: 'teams', title: 'Teams' }
];

var picturesTemplateData = { picturesUrl: 'http://hackathon.eecs.wsu.edu/hosted_images/hackathon_02' };


/** The ugly buildy bits **/
var webStaticGlobs = staticDirs.map(function(dir) { return webDir + dir + '**/*'});
var buildStaticGlobs = staticDirs.map(function(dir) { return buildDir + dir + '**/*'});


// A basic clean task
gulp.task('clean', function(cb) {
  del(buildDir.substring(0, buildDir.length - 1), cb);
});


// A clean task that only cleans the static stuff
gulp.task('clean-static', function(cb) {
  del(buildStaticGlobs, cb);
});

// This takes all the static assets and simply moves them to the build directory.
gulp.task('static', ['clean-static'], function() {
  function copyStatic(dir) {
    return gulp.src(webDir + dir + '**/*')
      .pipe(gulp.dest(buildDir + dir));
  }

  //Copies our static content
  staticDirs.forEach(function(dir) {
    if(dir !== "images/") {
      //rename the file with the version and update the @import file names
      gulp.src(webDir + dir + '**/*')
        .pipe(rename(function(path) {
          path.basename += '-v' + version;  
        }))
        .pipe(replace('-v<version>', '-v' + version))
        .pipe(replace("localhost:3000", "hackathon.eecs.wsu.edu/api"))
        .pipe(gulp.dest(buildDir + dir));
    } else {
      copyStatic(dir);
    }
  });

  //Copies photoswipe
  var photoswipe_dist = path.join(__dirname, 'node_modules', 'photoswipe', 'dist/');
  var photoswipe_css = gulp.src(photoswipe_dist + "*.css")
        .pipe(gulp.dest(buildDir + 'styles/'));

  var photoswipe_css = gulp.src(photoswipe_dist + "*.js")
        .pipe(gulp.dest(buildDir + 'scripts/'));

  var default_skin = gulp.src(photoswipe_dist + 'default-skin/*')
        .pipe(gulp.dest(buildDir + 'styles/' + 'default-skin/'));

});

gulp.task('node-serv', function() {
  //Copy server and config file over
  //If the --local argument is not passed in, it will remove the lines that allow for hosting
  gulp.src(['./server.js', './config.json'])
    .pipe(gulpif(!argv.local, 
      replace(/app\.(use|get)\(('\/'|'\/hosted-images').*/ig, '')))
    .pipe(gulp.dest(buildDir));

  //install npm dependencies
  gulp.src('./package.json')
    .pipe(gulp.dest(buildDir))
    .pipe(install({production: true}));
});

/*
Handles the template compilation. All it does is take the template at
template.handlebars, compile it, and apply each of the page contents to it */
gulp.task('handle-bars', ['clean', 'static'], function() {
  var buildPageFunct;
  return streamqueue({objectmode: true},
    gulp.src(webDir + 'template.handlebars')
      .pipe(map(function(file, cb) {
        buildPageFunct = handlebars.compile(file.contents.toString());
        cb();
      })),
    buildFiles());

  function buildFiles() {
    var tasks = pages.map(function(page) {
      return gulp.src(pagesDir + '_' + page.file_name + '.html')
        .pipe(map(function(file, cb) {
          page.version = version; //for cache busting
          page.content = file.contents.toString();

          //Makes it easier to move to production
          if(!argv.local) {
            page.content = page.content.replace("localhost:3000", "hackathon.eecs.wsu.edu/api");
          }

          // Replace filename with version for cache breaking
          page.content = page.content.replace('-v<version>', '-v' + version);


          // Compile the pictures as a template first
          if (page.file_name == 'pictures') {
            var pictures_template = handlebars.compile(page.content);
            page.content = pictures_template(picturesTemplateData)
          }

          file.contents = new Buffer(buildPageFunct(page));
          cb(null, file);
        }))
        .pipe(rename(page.file_name + '.html'))
        .pipe(gulp.dest(buildDir));
    });
    return eventStream.concat.apply(null, tasks);
  }
});


// jshint the server script
gulp.task('jshint-server', function() {
  gulp.src('./server.js')
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});


gulp.task('watch', function() {

  // Autowatch on the static content directories.
  watch(webStaticGlobs, function() {
    gulp.start('static');
  });

  // Autowatch on the handlebars built stuff.
  watch([webDir + '**/*.handlebars', pagesDir + '**/*'], function() {
    gulp.start('handle-bars');
  });
});


gulp.task('build', ['static', 'handle-bars', 'node-serv']);
gulp.task('default', ['build', 'watch']);

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