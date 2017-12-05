var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var tslint = require("gulp-tslint");

var tsProjectSrc = ts.createProject('./tsconfig.json');
gulp.task('build', function() {
    //find test code - note use of 'base'
    return gulp.src('src/**/*.ts')
    //.pipe(sourcemaps.init())
    /*transpile*/
    .pipe(tsProjectSrc())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/'));
});

//optional - use a tsconfig file
var tsProjectTest = ts.createProject('./tsconfig.json');

gulp.task('test', function() {
    return gulp.src('./tests/**/*.ts', { base: '.' })
    /*transpile*/
    .pipe(tsProjectTest())
    /*flush to disk*/
    .pipe(gulp.dest('.'))
    /*execute tests*/
    .pipe(mocha({
        reporter: 'progress',
        require: ['ts-node/register']
    }));
});

gulp.task("tslint", () =>
    gulp.src(["./src/**/*.ts", "./tests/**/*.ts"])
    .pipe(tslint({
        configuration: "./tslint.json"
    }))
    .pipe(tslint.report())
);