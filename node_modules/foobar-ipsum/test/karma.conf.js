module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['Electron'],
    frameworks: ['jasmine'],
    files: [
      '../dist/foobar-ipsum.js',
      './web.test.js'
    ],
    reporters: ['progress', 'coverage'],
    preprocessors: {
      '../dist/foobar-ipsum.js': ['coverage']
    },
    coverageReporter: {
      reporters: [
        { type : 'html', dir : '../coverage/' },
        { type:'lcovonly', dir : '../coverage/' },
        { type:'json', dir : '../coverage/' }
      ]
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: true
  })
}
