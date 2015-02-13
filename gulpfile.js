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
    imageResize = require('gulp-image-resize'),
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
      console.log('Server loaded. Open http://localhost:' + PROXY_PORT + ' in your browser');
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