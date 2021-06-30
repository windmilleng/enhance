FROM golang:alpine
WORKDIR /app
RUN apk add entr
COPY vendor vendor
COPY render/api render/api
COPY go.mod ./
COPY rectangler rectangler
CMD ls rectangler/*.go | entr -n -r ./rectangler/re-build.sh
