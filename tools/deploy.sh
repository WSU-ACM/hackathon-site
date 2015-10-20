#!/bin/bash

deploy_dir=/var/www/hackathon-site
build_tarball=hackathon-site-build.tar

server_addr=hackathon.eecs.wsu.edu
ssh_port=22

clean_up() {
  if [ -e $build_tarball ]; then rm $build_tarball; fi
}

failure() {
  echo
  echo "Deployment failed :("
  clean_up
  exit
}
trap failure SIGHUP SIGINT SIGTERM

jekyll build --config _config.production.yml
if [ $? -ne 0 ]; then failure; fi

echo
read -p "Enter your user name on the server: " user_name


echo
echo 'Copying to the server...'

## Creating a tar archive. No need for compression however. Just need to
## reduce the number of files transferred.
tar -cf $build_tarball build

scp -P $ssh_port $build_tarball $user_name@$server_addr:$build_tarball

## Check to see if that failed.
if [ $? -ne 0 ]; then failure; fi


## The scary part! Move the staging directory to the deploy directory. There
## are quite a few ways of doing this so that it's an atomic operation, but
## this is the simplest and serves our purposes.
danger() {
  echo
  echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Danger !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  echo '!                 The site could be in an unstable state              !'
  echo
  failure
}
trap danger SIGHUP SIGINT SIGTERM

echo
echo 'Deploying...'
ssh -p $ssh_port $user_name@$server_addr \
  "rm -r $deploy_dir
   tar -xf $build_tarball && 
   mv build $deploy_dir && 
   chown -R :web $deploy_dir && s
   chmod -R o-w,g+w $deploy_dir"

if [ $? -ne 0 ]; then danger; fi

## No need to trap signals anymore
trap - SIGHUP SIGINT SIGTERM

clean_up

echo
echo '*************************************************************************'
echo 'Congrats! Deployment succeeded!'
