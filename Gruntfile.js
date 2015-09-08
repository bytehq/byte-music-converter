module.exports = function (grunt) {
    grunt.initConfig({
        mochacli: {
            options: {
                require: ['should', 'co-mocha'],
                reporter: 'spec',
                'harmony-generators': true,
                bail: false
            },
            all: ['test/**/*tests.js']
        },
        nodemon: {
            dev: {
                script: 'index.js',
                options: {
                    args: [],
                    nodeArgs: ['--harmony'],
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });
                        nodemon.on('restart', function () {});
                    },
                    cwd: __dirname,
                    ignore: [],
                    delay: 100
                }
            }
        },
        jsbeautifier: {
            files: [
                '*.js',
                'src/**/*.js',
                'test/**/*.js'
            ],
            options: {
                js: {
                    jslintHappy: true
                }
            }
        },
        jshint: {
            options: {
                force: true,
                eqeqeq: true,
                indent: 4,
                latedef: true,
                newcap: true,
                undef: true,
                unused: true,
                esnext: true,
                multistr: true,
                browser: true,
                jquery: true,
                node: true,
                noyield: true,
                mocha: true,
                globals: {
                    "config": false,
                    "dogstatsd": false,
                    "gcloud": false,
                    "logger": false
                },
                ignores: []
            },
            uses_defaults: [
                '*.js',
                'src/**/*.js',
                'test/**/*.js',
            ]
        }
    });

    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('forceEnv', 'Force set the node env', function (setEnv) {
        grunt.log.writeln('Force setting environment to ' + setEnv);
        process.env.NODE_ENV = setEnv;
    });

    grunt.registerTask('test', ['forceEnv:test', 'mochacli:all']);
    grunt.registerTask('default', ['jsbeautifier', 'jshint', 'nodemon']);
    grunt.registerTask('run', ['default']);
};
