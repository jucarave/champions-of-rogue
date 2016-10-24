var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var tsify = require('tsify');
var fs = require('fs');
var preprocess = require('gulp-preprocess');
var clean = require('gulp-clean');

var parameters = {
    ENV: 'DEVELOPMENT',
    DEBUG: false
};

function printHelp() {
    console.log("Usage: gulp [task] [arguments]");

    console.log("");

    console.log("Options:");
    console.log("  -h, --help       Prints this help document.");
    console.log("  --dev            Builds in development environment.");
    console.log("  --prod           Builds in production environment.");
    console.log("  --debug          Enables debugging tools in the build.");
};

function parseParameters() {
    var argv = process.argv;

    if (argv.indexOf('--help') != -1 || argv.indexOf('-h') != -1){ 
        printHelp();
        process.exit(0);
    }

    if (argv.indexOf('--dev') != -1){ parameters.ENV = 'DEVELOPMENT'; }else
    if (argv.indexOf('--prod') != -1){ parameters.ENV = 'PRODUCTION'; }

    if (argv.indexOf('--debug') != -1){ parameters.DEBUG = true; }
}

parseParameters();

gulp.task("buildData", function() {
    var path = 'dist/data/';
    var enemies = require('./src/data/enemies.json');
    var data = {
        enemies: enemies
    };

    fs.unlinkSync(path + 'data.json');

    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }

    fs.writeFileSync(path + 'data.json', JSON.stringify(data), { flag: 'a' });
});

gulp.task("preprocess", function() {
    var flags = {
        context: parameters
    };

    return gulp.src("./src/**/*")
        .pipe(preprocess(flags))
        .pipe(gulp.dest("src_post"));
});

gulp.task("bundle", ["preprocess"], function() {
    return browserify({
        basedir: '.',
        debug: true,
        entries: ['src_post/index.ts'],
        cache: {},
        packageCache: {}
    })
    .plugin(tsify)
    .bundle()
    .pipe(source('game.js'))
    .pipe(gulp.dest("dist/js"));
});

gulp.task("default", ["buildData", "bundle"], function () {
    return gulp.src('./src_post')
        .pipe(clean());
});


var watchedBrowserify = watchify(browserify('src/index.ts').plugin(tsify, { noImplicitAny: true }));

function bundle() {
    return watchedBrowserify
		.bundle()
		.pipe(source('game.js'))
		.pipe(gulp.dest("dist/js"));
}

gulp.task('watchify', bundle);

watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);