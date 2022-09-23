const gulp = require('gulp');
const gulpUglify = require('gulp-uglify');
const pipeline = require('readable-stream').pipeline;

function uglify() {
  return gulp.src('build/**/*.js').pipe(gulpUglify()).pipe(gulp.dest('build/'));
}

exports.uglify = uglify;
