#!/bin/bash

##
## This is the deploy script for the hackathon website. WARNING!!! Only specify
## an option if you know what you're doing. If in doubt, don't specify any
## options.
##
## Usage:
## --api    Deploys only the api server. This is helpful because rebuilding the
##          static site can be slow. Note that if the static site requires a
##          certain version of the api server this can spell problems.
##
## TIP: Set the environment variable $ACM_SERVER_USER to change the default
## username for the server.
##


ARGS=$(getopt -o "" -l "api" -- "$@");

#Bad arguments
if [ $? -ne 0 ];
then
  echo "Bad arguments"
  exit 1
fi

eval set -- "$ARGS";

DEPLOY_ALL=true
DEPLOY_API=false

for arg in "$@"; do
  case "$arg" in
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

echo
if [ "$ACM_SERVER_USER" ]; then server_user=$ACM_SERVER_USER; else server_user=$USER; fi
read -p "Enter your user name on the server [$server_user]: " read_user
if [ "$read_user" ]; then server_user="$read_user"; fi

deploy_dir="/tmp/hackathon-build"
ssh -p $ssh_port $server_user@$server_addr \
    "rm -r $deploy_dir &> /dev/null; mkdir -p $deploy_dir && chmod 700 $deploy_dir"

clean_up() {
  echo "clean up"
  ssh -p $ssh_port $server_user@$server_addr "rm -r $deploy_dir"
}

failure() {
  echo
  echo "Deployment failed :("
  clean_up
  exit
}
trap failure SIGHUP SIGINT SIGTERM


sync_site_server() {
  rm -r ../build/*
  jekyll build --config jekyll-config.production.yml
  (cd ../build && tar -cf $site_server_tarball .)

  scp -P $ssh_port ../build/$site_server_tarball $server_user@$server_addr:$deploy_dir

  ssh -p $ssh_port $server_user@$server_addr \
      "docker build -f $deploy_dir/site.dockerfile -t hackathon-site-server $deploy_dir"
}

sync_api_server() {
  (cd ../api-server && tar -cf ../build/$api_server_tarbell .)

  scp -P $ssh_port ../build/$api_server_tarbell $server_user@$server_addr:$deploy_dir
  ssh -p $ssh_port $server_user@$server_addr \
      "docker build -f $deploy_dir/api.dockerfile -t hackathon-api-server $deploy_dir"
}

scp -P $ssh_port production/* $server_user@$server_addr:$deploy_dir

if $DEPLOY_ALL; then sync_site_server; fi
if $DEPLOY_ALL || $DEPLOY_API; then sync_api_server; fi

API_CONTAINTER_NAME=hackathon-api-server
SITE_CONTAINER_NAME=hackathon-site-server
start_site_server() {
  ssh -p $ssh_port $server_user@$server_addr "
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
        --publish 80:4000 \
        --restart unless-stopped \
        -v /etc/timezone:/etc/timezone \
        hackathon-site-server
    docker start $SITE_CONTAINER_NAME
  "
}

start_api_server() {
  ssh -p $ssh_port $server_user@$server_addr "
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

start_api_server
start_site_server

## No need to trap signals anymore
trap - SIGHUP SIGINT SIGTERM

clean_up

echo
echo '*************************************************************************'
echo 'Congrats! Deployment succeeded!'
