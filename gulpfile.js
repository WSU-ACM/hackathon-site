// Imports
var del = require('del');
var eventStream = require('event-stream');
var gulp = require('gulp');
var handlebars = require('handlebars');
var map = require('map-stream');
var rename = require('gulp-rename');
var stream = require('stream');
var streamqueue = require('streamqueue');

// Build and src directories
var buildDir = 'build/';
var webDir = 'web/';
var pagesDir = webDir + 'pages/';


/** !!!! Critical Configuration Variables !!!! **/
/*
These are your static directories. Files in these directories will get copied as
they are into the build directory */
var staticDirs = ['images/', 'scripts/', 'styles/'];

/*
These are your pages. The filename must match a file in the pages directory with
the convention of _${file_name}.html and there should also be a css file with
the same name in the styles directory or else the page will lack themeing */
var pages = [
  { file_name: 'ideas', title: 'Ideas' },
  { file_name: 'index', title: 'WSU Hackathon' },
  { file_name: 'pictures', title: 'Pictures' },
  { file_name: 'sponsorship', title: 'Sponsorship'}
];


/** The ugly buildy bits **/

// A basic clean task
gulp.task('clean', function(cb) {
  del(buildDir, cb);
});

// This takes all the static assets and simply moves them to the build directory.
gulp.task('static', ['clean'], function() {


  var tasks = staticDirs.map(function(dir) {
    return gulp.src(webDir + dir + '**/*')
               .pipe(gulp.dest(buildDir + dir));
  });

  return eventStream.concat.apply(null, tasks);
});

/*
Handles the template compilation. All it does is take the template at
template.handlebars, compile it, and apply each of the page contents to it */
gulp.task('handle-bars', ['clean'], function() {

  var template = '';
  return streamqueue({objectmode: true},
    gulp.src(webDir + 'template.handlebars')
      .pipe(map(function(file, cb) {
        template = handlebars.compile(file.contents.toString());
        cb();
      })),
    buildFiles());

  function buildFiles() {
    var tasks = pages.map(function(page) {
      return gulp.src(pagesDir + '_' + page.file_name + '.html')
        .pipe(map(function(file, cb) {
          page.content = file.contents.toString();
          file.contents = new Buffer(template(page));
          cb(null, file);
        }))
        .pipe(rename(page.file_name + '.html'))
        .pipe(gulp.dest(buildDir));
    });
    return eventStream.concat.apply(null, tasks);
  }
});

gulp.task('default', ['static', 'handle-bars']);
