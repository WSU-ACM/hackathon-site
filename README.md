# CrimsonCode Hackathon Site
Site for CrimsonCode Hackathon. Template from Start Bootstrap.

## Developer Usage
You need npm and node installed. Not sure what versions... when I get more time, I'll make this README better.

Next, you'll probably have to update some crusty old node modules.
```
npm update
```
Add gulp's command-line interface. You'll probably need to be super user although this isn't recommended.
```
sudo npm install --global gulp-cli
```
Install modules in node_modules folder. 
```
npm install
```
To test any changes, you can simply build a local copy of the distribution by typing
```
gulp
```
and then viewing ```dist/index.html``` in a browser.

## Deployment
In order for any new changes in master to show up on the website, it needs to be published:
1. Obtain access to the LUG (Linux Users' Group) server for the hackathon site (talk to the current president or sysadmin)
2. In a terminal, set the environment variable for HACKATHON_USER to the username given to you by the LUG once you have access. 
   export HACKATHON_USER=[insert username here] (this only sets the variable for the current session)
3. Make sure you are in the hackathon directory and then run the "deploy_script.sh"

If you have any issues, contact whoever set up your access to the server and if they are unable to help, contact a past ACM chair or troubleshoot via Google.
