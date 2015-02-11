#!/bin/sh

jekyll serve -s web -d build -B
gulp

clean_up() {
  kill `pgrep -f jekyll`
}

trap clean_up SIGHUP SIGINT SIGTERM