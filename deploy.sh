#!/bin/bash

deploy_dir=/var/www/hackathon-site
stage_dir=hackathon-site-stage

server_addr=hackathon.eecs.wsu.edu
ssh_port=11993

failure() {
  echo
  echo "Deployment failed :("
  exit
}

rm -rf build

gulp build
if [ $? -ne 0 ]; then
  failure
fi

echo
read -p "Enter your user name on the server: " user_name

echo "Attempting to clean the staging directory. If this fails it's okay"
ssh -p $ssh_port $user_name@$server_addr rm -r $stage_dir
echo
echo 'Copying to the server...'
scp -P $ssh_port -r build/. $user_name@$server_addr:$stage_dir
if [ $? -ne 0 ]; then
  failure
fi
echo

# The scary part! Move the staging directory to the deploy directory. There
# are quite a few ways of doing this so that it's an atomic operation, but
# this is the simplest and serves our purposes.
echo 'Deploying...'
ssh -p $ssh_port $user_name@$server_addr \
  "rm -r $deploy_dir && \
  mv $stage_dir $deploy_dir && \
  chown -R :web $deploy_dir && \
  chmod -R o-w $deploy_dir && \
  chmod -R g+w $deploy_dir"

if [ $? -ne 0 ]; then
  echo
  echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Danger !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
  echo '!                 The site could be in an unstable state              !'
  echo
  failure
fi

echo 'Congrats! Deployment succeeded!'