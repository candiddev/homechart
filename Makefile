.PHONY: hugo build deploy run

DOCKER_LOGOPTS = --log-opt max-file=1 --log-opt max-size=100k
DOCKER_UID = -u `id -u`:`id -g`
HUGO = .bin/hugo
HUGO_VERSION = 0.111.3

build: hugo
	$(HUGO) --cleanDestinationDir --minify

deploy: build
	$(HUGO) deploy --maxDeletes -1 --target $(DEPLOY_TARGET)

hugo:
	if ! $(HUGO) version | grep $(HUGO_VERSION); then \
		mkdir -p .bin; \
		curl -L https://github.com/gohugoio/hugo/releases/download/v$(HUGO_VERSION)/hugo_extended_$(HUGO_VERSION)_Linux-64bit.tar.gz | tar -C .bin -xz ;\
	fi;

run_start: hugo run_stop
	docker run \
		-d \
		$(DOCKER_LOGOPTS) \
		--name hugo_homechart \
		-p 3004:3004 \
		--restart always \
		-v `pwd`:/hugo \
		$(DOCKER_UID) \
		-w /hugo \
		debian:bullseye \
		$(HUGO) server --verbose --watch --bind 0.0.0.0 -p 3004 -b / --appendPort=false

run_stop:
	docker rm -f hugo_homechart || true
