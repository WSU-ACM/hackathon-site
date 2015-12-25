FROM ubuntu:14.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl

ENV GO_VERSION 1.5.1
RUN curl https://storage.googleapis.com/golang/go${GO_VERSION}.linux-amd64.tar.gz | \
      tar -vxz -C /opt && \
    ln -s /opt/go/bin/go /usr/local/bin/
ENV GOROOT /opt/go

COPY api-server.tar /
RUN mkdir -p /opt/hackathon-api-server/ && \
    cd /opt/hackathon-api-server && \
    tar -xf /api-server.tar && \
    rm /api-server.tar

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN useradd --system --shell /usr/sbin/nologin hackathon
USER hackathon

EXPOSE 4001
CMD go run main.go
