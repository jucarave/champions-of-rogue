var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var tsify = require('tsify');

gulp.task("transpile", function () {
    return browserify({
        basedir: '.',
        debug: true,
        entries: ['src/index.ts'],
        cache: {},
        packageCache: {}
    })
    .plugin(tsify)
    .bundle()
    .pipe(source('game.js'))
    .pipe(gulp.dest("dist/js"));
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