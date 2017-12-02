var gulp = require('gulp');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var sourcemaps = require('gulp-sourcemaps');

var tsProjectSrc = ts.createProject('./tsconfig.json');
gulp.task('build', function() {
    //find test code - note use of 'base'
    return gulp.src('src/**/*.ts')
    //.pipe(sourcemaps.init())
    /*transpile*/
    .pipe(tsProjectSrc())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/'))
});

//optional - use a tsconfig file
var tsProjectTest = ts.createProject('./tsconfig.json');
gulp.task('testAfterBuild', ['build'], function() {
    //find test code - note use of 'base'
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

gulp.task('testonly', function() {
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
})

/* single command to hook into VS Code */
gulp.task('dev', ['build', 'testAfterBuild']);
gulp.task('test', ['testonly']);