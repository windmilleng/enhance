FROM golang:alpine
WORKDIR /app
RUN apk add entr
COPY vendor vendor
COPY render/api render/api
COPY storage/client storage/client
COPY storage/api storage/api
COPY go.mod ./
COPY muxer muxer
CMD ls muxer/*.go | entr -n -r ./muxer/re-build.sh
