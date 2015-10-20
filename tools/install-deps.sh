#!/bin/sh

## This script is responsible for installing/updating dependencies. It's
## purpose is to simplify the process

## Makes sure we're always working from the right place
cd "$(dirname "$0")"

npm install
bundle install
