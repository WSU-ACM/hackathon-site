#!/bin/bash

cd "$(dirname "$0")"

make
if [[ "$?" != 0 ]]; then exit 1; fi

clean_up() {
  jekyll_proc=$(pgrep -f jekyll)
  if [ ! -z "$jekyll_proc" ]; then
    # Sometimes jekyll stays running and needs to be manually killed
    kill $jekyll_proc
  fi

  if [ -e nginx.pid ]; then
    nginx_proc=$(cat nginx.pid)
    if [ ! -z "$nginx_proc" ]; then
      kill $nginx_proc
      if [ -e nginx.pid ]; then rm nginx.pid; fi
    fi
  fi
}

trap clean_up SIGHUP SIGINT SIGTERM

jekyll build --watch --config _jekyll-config.yml &
(cd ../api-server && go run main.go) &

/usr/sbin/nginx -c nginx.conf -p "$(pwd)"

sleep infinity
