#!/bin/bash

jekyll serve &
gulp

clean_up() {
  kill `pgrep -f jekyll`
}

trap clean_up SIGHUP SIGINT SIGTERM