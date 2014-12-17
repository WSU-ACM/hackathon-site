var eventStream = require('event-stream');
var gulp = require('gulp');
var handlebars = require('handlebars');
var stream = require('stream')

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

  var template = function() {};
  return gulp.src(webDir + 'template.handlebars')
    .pipe(function() {
      var template = handlebars.compile(aStringWithFileContents);
      return 'something...';
    }).pipe(function() {
      var tasks = staticDirs.map(function(page) {
        return gulp.src(webDir + 'pages/_' + file_name + '.html')
               .pipe(function() {
            page.content = htmlContentsAsString;
            template(page);
            return 'something....';
          });
      });
      return eventStream.concat(null, tasks);
  });
});
