# CrimsonCode Hackathon Site
Site for CrimsonCode Hackathon. Template from Start Bootstrap.

## Developer Usage
You need npm (^6.0.1) and node (^10.13.0) installed.

Next, you'll probably have to update some crusty old node modules.
```
npm update
```
Install modules locally in node_modules folder. 
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

## Notes
- Remember that deploying the site won't delete any files that already exist in ```public_html```
- Using ```scp``` isn't working properly on Ubuntu. It won't overwrite the minified css; a simple hack is to delete the minified css on the server, and then deploy. I'll try to fix this in the future.