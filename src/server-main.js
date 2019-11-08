import 'core-js/stable';
import 'regenerator-runtime/runtime';
import environment from './environment';
import {PLATFORM} from 'aurelia-pal';
import bootstrapper from 'aurelia-ssr-bootstrapper-webpack';

async function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName('resources/index'));

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
  }

  aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('app')));
}
module.exports = bootstrapper(configure);
