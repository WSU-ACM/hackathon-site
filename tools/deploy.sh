#!/bin/bash

ARGS=$(getopt -o "" -l "site,api" -- "$@");

#Bad arguments
if [ $? -ne 0 ];
then
  echo "Bad arguments"
  exit 1
fi

eval set -- "$ARGS";

DEPLOY_ALL=true
DEPLOY_SITE=false
DEPLOY_API=false

for arg in "$@"; do
  case "$arg" in
    --site)
      DEPLOY_ALL=false
      DEPLOY_SITE=true
      ;;

    --api)
      DEPLOY_ALL=false
      DEPLOY_API=true
      ;;

    --)
      break;
      ;;
  esac
done

cd "$(dirname "$0")"
make

site_server_tarball=site-server.tar
api_server_tarbell=api-server.tar

server_addr=home.dylankpowers.com
ssh_port=48924

clean_up() {
  echo "clean up"
#  if [ -e $build_tarball ]; then rm $build_tarball; fi
}

failure() {
  echo
  echo "Deployment failed :("
  clean_up
  exit
}
trap failure SIGHUP SIGINT SIGTERM

echo
read -p "Enter your user name on the server [$USER]: " user_name
if [ ! "$user_name" ]; then user_name="$USER"; fi

deploy_dir="/tmp/hackathon-build"
ssh -p $ssh_port $user_name@$server_addr \
    "rm -r $deploy_dir &> /dev/null; mkdir -p $deploy_dir"

sync_site_server() {
  rm -r ../build/*
  jekyll build --config jekyll-config.production.yml
  (cd ../build && tar -cf $site_server_tarball .)

  scp -P $ssh_port ../build/$site_server_tarball $user_name@$server_addr:$deploy_dir

  ssh -p $ssh_port $user_name@$server_addr \
      "docker build -f $deploy_dir/site.dockerfile -t hackathon-site-server $deploy_dir"
}

sync_api_server() {
  (cd ../api-server && tar -cf ../build/$api_server_tarbell .)

  scp -P $ssh_port ../build/$api_server_tarbell $user_name@$server_addr:$deploy_dir
  ssh -p $ssh_port $user_name@$server_addr \
      "docker build -f $deploy_dir/api.dockerfile -t hackathon-api-server $deploy_dir"
}

scp -P $ssh_port production/* $user_name@$server_addr:$deploy_dir

if $DEPLOY_ALL || $DEPLOY_SITE; then sync_site_server; fi
if $DEPLOY_ALL || $DEPLOY_API; then sync_api_server; fi

API_CONTAINTER_NAME=hackathon-api-server
SITE_CONTAINER_NAME=hackathon-site-server
start_site_server() {
  ssh -p $ssh_port $user_name@$server_addr "
    if ! docker ps | grep -o -E '\<$API_CONTAINTER_NAME\>([^-]|$)' > /dev/null; then
      echo 'The API container must be running before the site container can run'
      exit 1
    fi
    if docker ps -a | grep -o -E '\<$SITE_CONTAINER_NAME\>([^-]|$)' > /dev/null; then
      docker stop $SITE_CONTAINER_NAME
      docker rm $SITE_CONTAINER_NAME
    fi
    docker create \
        --link $API_CONTAINTER_NAME \
        --name $SITE_CONTAINER_NAME \
        --publish 127.0.0.1:4000:4000 \
        --restart unless-stopped \
        -v /etc/timezone:/etc/timezone \
        hackathon-site-server
    docker start $SITE_CONTAINER_NAME
  "
}

start_api_server() {
  ssh -p $ssh_port $user_name@$server_addr "
    if docker ps -a | grep -o -E '\<$API_CONTAINTER_NAME\>([^-]|$)' > /dev/null; then
      docker stop $API_CONTAINTER_NAME
      docker rm $API_CONTAINTER_NAME
    fi
    docker create \
        --name $API_CONTAINTER_NAME \
        --restart unless-stopped \
        -v /etc/timezone:/etc/timezone \
        --workdir /opt/hackathon-api-server/ \
        hackathon-api-server
    docker start $API_CONTAINTER_NAME
  "
}

if $DEPLOY_ALL || $DEPLOY_API; then start_api_server; fi
start_site_server


#ssh -p $ssh_port $user_name@$server_addr \
#    "docker build

#jekyll build --config _config.production.yml
#if [ $? -ne 0 ]; then failure; fi
#
#echo
#read -p "Enter your user name on the server: " user_name
#
#
#echo
#echo 'Copying to the server...'
#
### Creating a tar archive. No need for compression however. Just need to
### reduce the number of files transferred.
#tar -cf $build_tarball ../build
#
#scp -P $ssh_port $build_tarball $user_name@$server_addr:$build_tarball
#
### Check to see if that failed.
#if [ $? -ne 0 ]; then failure; fi
#
#
### The scary part! Move the staging directory to the deploy directory. There
### are quite a few ways of doing this so that it's an atomic operation, but
### this is the simplest and serves our purposes.
#danger() {
#  echo
#  echo '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Danger !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
#  echo '!                 The site could be in an unstable state              !'
#  echo
#  failure
#}
#trap danger SIGHUP SIGINT SIGTERM
#
#echo
#echo 'Deploying...'
#ssh -p $ssh_port $user_name@$server_addr \
#  "rm -r $deploy_dir
#   tar -xf $build_tarball &&
#   mv build $deploy_dir &&
#   chown -R :web $deploy_dir &&
#   chmod -R o-w,g+w $deploy_dir"

#if [ $? -ne 0 ]; then danger; fi

## No need to trap signals anymore
trap - SIGHUP SIGINT SIGTERM

clean_up

echo
echo '*************************************************************************'
echo 'Congrats! Deployment succeeded!'
