get-deps: Gemfile.lock node_modules hosted-images api-server-config.json

Gemfile.lock: Gemfile
	bundle install
	touch Gemfile.lock

node_modules: package.json
	npm install

hosted-images: node_modules/hackathon-api-server/bin/seed-hosted-images.sh
	node_modules/hackathon-api-server/bin/seed-hosted-images.sh

api-server-config.json:
	cp node_modules/hackathon-api-server/conf/sample-api-server-config.json api-server-config.json

clean:
	touch Gemfile
	- rm -r node_modules
	- rm -r hosted-images
	- rm api-server-config.json

.PHONY: get-deps clean
