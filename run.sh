#!/bin/bash
function home {
	cd -
}
trap home EXIT

cd dist
# python 3.x
python -m http.server 8080 --bind 127.0.0.1
# fallback for 2.x
python -m SimpleHTTPServer 8080
cd -
