.DELETE_ON_ERROR:

BIN           = ./node_modules/.bin
TESTS         = $(shell find src -path '*/__tests__/*-test.js')
FIXTURES      = $(shell find src -path '*/__tests__/*-fixture/*.js')
SRC           = $(filter-out $(TESTS) $(FIXTURES), \
                  $(shell find src -name '*.js' -or -name '*.js.flow'))
LIB           = $(SRC:src/%=lib/%)

build::
	@$(MAKE) -j 8 $(LIB)

benchmark: build
	@node ./benchmark/index.js

lint::
	@$(BIN)/eslint src

check::
	@$(BIN)/flow --show-all-errors src

test::
	@$(BIN)/jest

test-flow::
	@(cd test_flow/ && npm install && $(BIN)/flow check-contents < ./index.js)

ci::
	@$(BIN)/jest --watch

doctoc:
	@$(BIN)/doctoc --title '**Table of Contents**' ./README.md

version-major version-minor version-patch:: lint test build
	@npm version $(@:version-%=%)

publish::
	@npm publish
	@git push --tags origin HEAD:master

clean::
	@rm -rf lib

lib/%.js: src/%.js
	@echo "Building $<"
	@mkdir -p $(@D)
	@(cross-env NODE_ENV=build $(BIN)/babel $(BABEL_OPTIONS) -o $@ $<)

lib/%.js.flow: src/%.js.flow
	@echo "Building $<"
	@mkdir -p $(@D)
	@cp $< $@
