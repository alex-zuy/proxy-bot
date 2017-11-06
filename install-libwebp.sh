#!/usr/bin/env bash

DOWNLOAD_URL='https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-0.6.0-linux-x86-64.tar.gz'

curl $DOWNLOAD_URL -o libwebp.tar.gz
tar -xzf libwebp.tar.gz
PATH="./libwebp-0.6.0-linux-x86-64/bin:$PATH";
