var eventStream = require('event-stream');
var gulp = require('gulp');
var handlebars = require('handlebars');
var map = require('map-stream');
var stream = require('stream');

var buildDir = 'build/';
var webDir = 'web/';

gulp.task('static', function() {
  var staticDirs = ['images/', 'scripts/', 'style/'];

  var tasks = staticDirs.map(function(dir) {
    return gulp.src(webDir + dir + '**/*')
               .pipe(gulp.dest(buildDir + dir));
  });

  return eventStream.concat(null, tasks);
});

gulp.task('handle-bars', function() {
  var pages = [
    { file_name: 'ideas', title: 'Ideas' },
    { file_name: 'index', title: 'WSU Hackathon' },
    { file_name: 'pictures', title: 'Pictures' },
    { file_name: 'sponsorship', title: 'Sponsorship'}
  ];

  var template = '';
  return gulp.src(webDir + 'template.handlebars')
    .pipe(map(function(file, cb) {
      template = handlebars.compile(file.contents.toString());
      cb();
    }))
    .pipe(buildFiles());

  function buildFiles() {
    var tasks = pages.map(function(page) {
      return gulp.src(webDir + 'pages/_' + page.file_name + '.html')
        .pipe(map(function(file, cb) {
          page.content = file.contents.toString();
          cb(null, template(page));
        }))
        .pipe(gulp.dest(buildDir + page.file_name + '.html'));
    });
    return eventStream.concat(null, tasks);
  }
});

gulp.task('default', ['static', 'handle-bars']);
