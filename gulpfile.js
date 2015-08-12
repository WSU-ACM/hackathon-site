// Imports
var apiServerConfig = require('./api-server-config.json'),
    bump = require('gulp-bump'),
    express = require('express'),
    fs = require('fs-extra'),
    glob = require('glob'),
    gulp = require('gulp'),
    hackathonApiServer = require('hackathon-api-server'),
    http = require('http'),
    httpProxy = require('http-proxy'),
    print = require('gulp-print'),
    url = require('url'),
    version = require('./package.json').version;

var API_PORT = 3000;
var HOSTED_IMAGES_DIR = 'hosted-images';
var HOSTED_IMAGES_SERV_PORT = 3031;
var JEKYLL_SERV_PORT = 4000;
var PROXY_PORT = 3030;

gulp.task('dev-server', function() {
  runImageServer();
  runProxyServer();

  function runProxyServer() {
    var proxy = httpProxy.createProxyServer({});

    http.createServer(function (req, res) {
      var rootPath = url.parse(req.url).pathname.split('/')[1];
      if (rootPath === 'api') {
        proxy.web(req, res, { target: 'http://127.0.0.1:' + API_PORT });
      } else if (rootPath === 'hosted_images') {
        proxy.web(req, res, { target: 'http://127.0.0.1:' + HOSTED_IMAGES_SERV_PORT });
      } else {
        proxy.web(req, res, { target: 'http://127.0.0.1:' + JEKYLL_SERV_PORT });
      }
    }).listen(PROXY_PORT, function() {
      console.log('\n' +
'********************************************************************************\n' +
'**                    Ignore above output. Server loaded                      **\n' +
'**                Open http://localhost:' + 
                                   PROXY_PORT + 
                                            ' in your browser                  **\n' +
'********************************************************************************\n' +
'');
    });
  }

  function runImageServer() {
    var imageServerConfig = express();
    imageServerConfig.use('/hosted_images', express.static(HOSTED_IMAGES_DIR));
    var imageServer = http.createServer(imageServerConfig);
    imageServer.listen(HOSTED_IMAGES_SERV_PORT, function() {
      console.log('Serving ' + HOSTED_IMAGES_DIR + ' on port ' + HOSTED_IMAGES_SERV_PORT);
    })
  }
});

gulp.task('node-serv', function() {
  hackathonApiServer.startServer(apiServerConfig);
});

gulp.task('default', ['node-serv', 'dev-server']);

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
gulp.task('min-images', function(cb) {
  // Configure readline
  var gulpSharp = require('gulp-sharp');

  //copy and minify images
  glob(HOSTED_IMAGES_DIR + '/*', function(err, folders) {
    folders.forEach(function(folder) {
      
      var destFolder = './' + folder + '_mini';
      var srcFolder = './' + folder;
      //console.log("Folder: " + destFolder);
      
      fs.copy(srcFolder, destFolder, function(err) {
        console.log("Done copying");
        //get all images
        gulp.src(HOSTED_IMAGES_DIR + '/*_mini/*.*') 
          .pipe(print())
          .pipe(gulpSharp({
            resize: [300],
            max: true
          }))
          .pipe(print(function(filepath) {
            return "Minified: " + filepath;
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
  });
});

process.on('uncaughtException', function (err) {
    console.log(err);
}); 