#!/bin/bash

cd "$(dirname "$0")"

clean_up() {
  jekyll_proc=$(pgrep -f jekyll)
  if [ ! -z "$jekyll_proc" ]; then
    # Sometimes jekyll stays running and needs to be manually killed
    kill -9 $jekyll_proc
  fi
}

trap clean_up SIGHUP SIGINT SIGTERM

jekyll serve --config _jekyll-config.yml &
gulp

## And now we're done
clean_up
