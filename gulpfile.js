var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var tsify = require('tsify');
var fs = require('fs');

gulp.task("buildData", function() {
    var path = 'dist/data/';
    var enemies = require('./src/data/enemies.json');
    var data = {
        enemies: enemies
    };

    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }

    fs.writeFileSync(path + 'data.json', JSON.stringify(data), { flag: 'a' });
});

gulp.task("default", ["buildData"], function () {
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