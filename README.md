[WSU Hackathon Website](http://hackathon.eecs.wsu.edu)
======================

Build Instructions
------------------
1. Install Node.js and npm. This will be dependant upon your system. Note that for
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

3. Grab the dependencies. This may occasionally have to be rerun as we update
   the site and add additional dependencies.
   ```
   npm install
   ```

4. Install Jekyll. If you already have ruby, and ruby gems installed,
   this can be as simple as running
   ```
   gem install jekyll
   ```
   If not, Jekyll may be in your distro's repositories
   (a big maybe as it will probably be an old version) or you can
   choose to take the recommended route and
   install ruby from scratch. To do that use [RVM](rvm.io).
   Whichever way you decide, the oldest version of
   Jekyll known to work is 2.5.3.

5. Configure the API server. Start with the file at
   ```configs/default-api-server-config.json``` and copy it to
   ```configs/api-server-config.json```. Fill in the Eventbrite eventId and
   oathToken params with suitable values. Whatever you do, do NOT add the
   Eventbrite credentials to the ```default-api-server-config.json``` file and
   proceed to commit it into the repo!

6. At this point, building and serving is as easy as calling
   ```
   ./serve.sh
   ```
   This script will build and copy the assets into a
   directory called ```build```. From there they will be served at the address
   http://localhost:3030. The build will automatically be rerun as you make
   file changes and all you'll have to do is refresh your web page =)
   To only do a build with no file
   watching or serving, run ```jekyll build```.

***Bonus:***  
If you've downloaded the source for the
[api server](https://github.com/WSU-ACM/hackathon-api-server) you can have Node
directly link into it so you don't continually have to be pushing code around.
To do this run the following in the directory of the hackathon-api-server source
```
sudo npm link
```
Then, in this repo run
```
npm link hackathon-api-server
```


Deploy Instructions
-------------------
So you've made your changes and think you're ready to deploy? If you have a user
account on the server, this is as easy as running ```./deploy.sh```. Just enter
your user name and it will do the rest. To make your life easier, it's
recommended to have public key ssh authentication set up.
