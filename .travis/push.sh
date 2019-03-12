#!/bin/sh

setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

git_push() {
  git add .
  git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
  git remote add gh https://${GITHUB_REPO_TOKEN}@github.com/m0rtadelo/recursive-readdir-async.git > /dev/null 2>&1
  git push gh
}
setup_git
git_push