#!/bin/bash

clean_up() {
  kill -9 `pgrep -f jekyll`
}

trap clean_up SIGHUP SIGINT SIGTERM

jekyll serve &
gulp

## And now we're done
clean_up