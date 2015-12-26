FROM ubuntu:14.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
      pkg-config \
      ca-certificates \
      curl \
      apt-transport-https \
      git \
      g++ \
      make \
      nginx \
      openjdk-7-jre-headless \
      python \
      ruby \
      ruby-dev \
      ssh \
      unzip \      
      wget

# nginx does some initialization when it's first ran
RUN nginx

# AUFS glitch. To properly set permissions have to remove and add with new perms
RUN rm -r /var/log/nginx && \
    mkdir /var/log/nginx && \
    chmod 777 /var/log/nginx


# There's still a node dependency in the Ruby stuff. At least we 
# don't have to deal with NPM
RUN wget https://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz && \
    tar -vxzf node-v0.12.7-linux-x64.tar.gz -C /tmp && \
    mv /tmp/node-v0.12.7-linux-x64 /opt/node && \
    rm node-v0.12.7-linux-x64.tar.gz && \
    ln -s /opt/node/bin/node /usr/local/bin/node && \
    ln -s /opt/node/bin/npm /usr/local/bin/npm


RUN gem install --no-rdoc --no-ri bundle


COPY Gemfile /hackathon-site/tools/
COPY Gemfile.lock /hackathon-site/tools/
RUN cd /hackathon-site/tools && bundle install

ENV GO_VERSION 1.5.1
RUN curl https://storage.googleapis.com/golang/go${GO_VERSION}.linux-amd64.tar.gz | \
      tar -vxz -C /opt && \
    ln -s /opt/go/bin/go /usr/local/bin/
ENV GOROOT /opt/go

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN cp /root/.bashrc /home/.bashrc

VOLUME /hackathon-site/build
VOLUME /hackathon-site/api-server
VOLUME /hackathon-site/tools
VOLUME /hackathon-site/web

EXPOSE 4000
CMD bash
