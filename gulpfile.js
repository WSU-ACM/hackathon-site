var del = require('del');
var eventStream = require('event-stream');
var gulp = require('gulp');
var handlebars = require('handlebars');
var map = require('map-stream');
var rename = require('gulp-rename');
var stream = require('stream');
var streamqueue = require('streamqueue');

var buildDir = 'build/';
var webDir = 'web/';

gulp.task('clean', function(cb) {
  del(buildDir, cb);
});

gulp.task('static', ['clean'], function() {
  var staticDirs = ['images/', 'scripts/', 'style/'];

  var tasks = staticDirs.map(function(dir) {
    return gulp.src(webDir + dir + '**/*')
               .pipe(gulp.dest(buildDir + dir));
  });

  return eventStream.concat.apply(null, tasks);
});

gulp.task('handle-bars', ['clean'], function() {
  var pages = [
    { file_name: 'ideas', title: 'Ideas' },
    { file_name: 'index', title: 'WSU Hackathon' },
    { file_name: 'pictures', title: 'Pictures' },
    { file_name: 'sponsorship', title: 'Sponsorship'}
  ];

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
      return gulp.src(webDir + 'pages/_' + page.file_name + '.html')
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
