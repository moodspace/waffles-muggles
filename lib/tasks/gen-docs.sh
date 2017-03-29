#!/usr/bin/env bash
npm i swagger-markdown -g
pip install mkdocs
pip install mkdocs-bootswatch
swagger-markdown --input swagger.yaml
mv swagger.md docs/index.md
mkdocs build
mv public/docs/tmp/index.html public/docs/index.html
rm -r public/docs/tmp
