# `visvis`

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).

For more information, go to https://aurelia.io/docs/cli/webpack

## Using this repo

Run `./run.sh` to start serving 

## DEV Prerequisites

You need a working version of NPM installed, so install nodejs.

### Options for running dev app

You can view the options for running build and test scripts with

`npm run-script`

To build use 

`npm run-script build`

To start the dev server use

`npm run-script start`

The notes below are generic, the scripts in `package.json` achieve the same purpose with the locally installed aurelia-cli. That way you don't depend on a globally installed aurelia-cli.

## Run dev app

Run `au run`, then open `http://localhost:8080`

To open browser automatically, do `au run --open`.

To change dev server port, do `au run --port 8888`.

To enable Webpack Bundle Analyzer, do `au run --analyze`.

To enable hot module reload, do `au run --hmr`.

## Build for production

Run `au build --env prod`.

## Unit tests

Run `au test` (or `au jest`).

To run in watch mode, `au test --watch` or `au jest --watch`.
