FROM golang:alpine
WORKDIR /app
RUN apk add entr
COPY vendor vendor
COPY go.mod ./
COPY storage storage
CMD ls storage/*.go | entr -n -r ./storage/re-build.sh
