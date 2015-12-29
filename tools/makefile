get-deps: Gemfile.lock ../web/assets/photoswipe

Gemfile.lock: Gemfile
	bundle install
	touch Gemfile.lock

../web/assets/photoswipe:
	wget https://github.com/dimsemenov/PhotoSwipe/archive/v4.1.0.zip -O photoswipe.zip
	unzip -o photoswipe.zip PhotoSwipe-4.1.0/dist/\* -d ../build
	mv ../build/PhotoSwipe-4.1.0/dist ../web/assets/photoswipe
	rm -rf ../build/PhotoSwipe-4.1.0 photoswipe.zip

clean:
	touch Gemfile
	rm -r ../web/assets/photoswipe

.PHONY: get-deps clean
