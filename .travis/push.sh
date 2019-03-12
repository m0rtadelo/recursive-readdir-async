#!/bin/sh

setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

git_push() {
  git remote add gh https://${GITHUB_REPO_TOKEN}@github.com/m0rtadelo/recursive-readdir-async.git > /dev/null 2>&1
  git add .
  git commit --message "BUILD Travis build: $TRAVIS_BUILD_NUMBER"
  git push gh HEAD:master
}
setup_git
git_push