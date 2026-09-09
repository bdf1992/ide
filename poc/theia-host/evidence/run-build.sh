#!/bin/sh
cd "$(dirname "$0")/../browser-app" || exit 1
../node_modules/.bin/theia build --mode production > ../evidence/theia-build.log 2>&1
