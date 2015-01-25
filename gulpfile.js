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


/** !!!! Critical Configuration Variables !!!! **/
// Build and src directories
var buildDir = 'build/';
var webDir = 'web/';
var pagesDir = webDir + 'pages/';
var hosted_images = 'hosted-images/';

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
  //Copies our static content
  var styles = "styles/";
  var scripts = "scripts/";
  var images = "images/";
  
  var cssStream = gulp.src(webDir + styles + '**/*.*')
    .pipe(replace('-v<version>', '-v' + version)) //rename the file with the version and update the @import file names
    .pipe(rename(function(path) {
       path.basename += '-v' + version;  
    }))
    .pipe(gulpif(!argv.nomin,
      cssmin({processImport: false})
    )) //will crash if it processes imports due to file renaming
    .pipe(gulp.dest(buildDir + styles));

  var jsStream = gulp.src(webDir + scripts + '**/*.*')
    .pipe(gulpif(!argv.nomin,
      uglify()
    ))
    .pipe(sourcemaps.write())
    .pipe(replace('-v<version>', '-v' + version))
    .pipe(rename(function(path) {
       path.basename += '-v' + version;  
    }))
    .pipe(gulpif(!argv.local, 
      replace("localhost:3000", "hackathon.eecs.wsu.edu/api")
    ))
    .pipe(gulp.dest(buildDir + scripts));

  var imgStream = gulp.src(webDir + 'images/**/*.*')
    .pipe(imagemin({optimizationLevel: 10}))
    .pipe(gulp.dest(buildDir + 'images/'));


  //Copies photoswipe
  var photoswipe_dist = path.join(__dirname, 'node_modules', 'photoswipe', 'dist/');
  var photoswipe_css = gulp.src(photoswipe_dist + "*.css")
        .pipe(cssmin({processImport: false}))
        .pipe(gulp.dest(buildDir + 'styles/'));

  var photoswipe_js = gulp.src(photoswipe_dist + "*.js")
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(buildDir + 'scripts/'));

  var default_skin = gulp.src(photoswipe_dist + 'default-skin/*')
        .pipe(gulp.dest(buildDir + 'styles/' + 'default-skin/'));

});

gulp.task('node-serv', function() {
  //Copy server and config file over
  //If the --local argument is not passed in, it will remove the lines that allow for hosting
  gulp.src(['./server.js', './config.json'])
    .pipe(gulpif(!argv.local, 
      replace(/app\.(use|get)\(('\/'|'\/hosted_images').*/ig, '')))
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