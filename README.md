[WSU Hackathon Website](http://hackathon.eecs.wsu.edu)
======================

Build Instructions
------------------
1. Install nodejs and npm. This will be dependant upon your system. Note that for
   those new to node on Debian systems, the nodejs-legacy package
   will probably be required. It's also probably worthwhile to update npm to
   the most latest version with:
   ```
   sudo npm install npm -g
   ```
   and then reload your shell.

2. Install gulp.
  ```
  sudo npm install gulp -g
  ```

3. Grab the dependencies.
  ```
  npm install
  ```

4. Run gulp.
  ```
  gulp
  ```

5. The website assets will have been built and copied into a newly created
   directory called ```build```. From there you can serve the files using
   your favorite web development server. If you leave gulp running, it will
   rerun when it senses any file changes. To only do a build with no file
   watching, run ```gulp build```.


Deploy Instructions
-------------------
So you've made your changes and think you're ready to deploy? If you have a user
account on the server, this is as easy as running ```./deploy.sh```. Just enter
your user name and it will do the rest. To make your life easier, it's
recommended to have public key ssh authentication set up.