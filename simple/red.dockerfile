FROM golang:alpine
WORKDIR /app
RUN apk add entr
COPY vendor vendor
COPY render/api render/api
COPY go.mod ./
COPY red red
CMD ls red/*.go | entr -n -r ./red/re-build.sh
