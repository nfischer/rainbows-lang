#!/usr/bin/env node
require('shelljs/global');

set('-e');
exec('git checkout gh-pages');
exec('git rev-parse --abbrev-ref HEAD');
exec('git merge master --commit');
exec('git push origin gh-pages');
exec('git checkout -');
echo('Deployed to https://nfischer.github.io/rainbows/');
