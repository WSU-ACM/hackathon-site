get-deps: Gemfile.lock

Gemfile.lock: Gemfile
	bundle install
	touch Gemfile.lock

clean:
	touch Gemfile

.PHONY: get-deps clean
