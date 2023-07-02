#!/usr/bin bash

rm -r ./release
mkdir ./release
mkdir ./release/images
cp -r ./background ./release
cp -r ./content ./release
cp -r ./popup ./release
cp -r ./utils ./release
cp -r ./images/png ./release/images/
cp ./manifest.json ./release