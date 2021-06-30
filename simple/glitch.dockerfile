FROM golang:alpine
WORKDIR /app
RUN apk add entr
COPY vendor vendor
COPY render/api render/api
COPY go.mod ./
COPY glitch glitch
CMD ls glitch/*.go | entr -n -r ./glitch/re-build.sh
# CMD ./glitch/re-build.sh
