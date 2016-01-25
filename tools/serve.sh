#!/bin/bash

cd "$(dirname "$0")"

make
if [[ "$?" != 0 ]]; then exit 1; fi

clean_up() {
  if [ ! -z "$jekyll_pid" ]; then kill $jekyll_pid; fi
  if [ ! -z "$api_pid" ]; then kill $api_pid; fi

  if [ -e nginx.pid ]; then
    nginx_proc=$(cat nginx.pid)
    if [ ! -z "$nginx_proc" ]; then
      kill $nginx_proc
      while kill -0 $nginx_proc &> /dev/null; do sleep 0.1; done # Wait for the process to exit
      if [ -e nginx.pid ]; then rm nginx.pid; fi
    fi
  fi
}

trap clean_up SIGHUP SIGINT SIGTERM

jekyll build --watch --config jekyll-config.dev.yml &
jekyll_pid=$!

(cd ../api-server && go run main.go) &
api_pid=$!

/usr/sbin/nginx -c nginx.conf -p "$(pwd)"

echo
echo "*****************************************************************************"
echo "**                 Server listening at localhost:4000                      **"
echo "*****************************************************************************"
echo

sleep infinity
