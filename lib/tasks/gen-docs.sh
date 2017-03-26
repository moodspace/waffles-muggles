#!/usr/bin/env bash
npm i swagger-markdown --save-dev
pip install mkdocs
swagger-markdown --input swagger.yaml
mv swagger.md docs/index.md
rm -r public/docs
mkdocs build
