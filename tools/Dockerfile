FROM ubuntu:14.04


ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y --no-install-recommends \
      pkg-config \
      ca-certificates \
      curl
RUN curl https://raw.githubusercontent.com/lovell/sharp/ef62daccf99c5f734d21b56d2f49938aa9032719/preinstall.sh | bash -

RUN apt-get install -y --no-install-recommends \
      apt-transport-https \
      ca-certificates \
      git \
      g++ \
      make \
      python \
      ruby \
      ruby-dev \
      wget

RUN wget https://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz
RUN tar -vxzf node-v0.12.7-linux-x64.tar.gz -C /tmp && \
    mv /tmp/node-v0.12.7-linux-x64 /opt/node && \
    rm node-v0.12.7-linux-x64.tar.gz
RUN ln -s /opt/node/bin/node /usr/local/bin/node
RUN ln -s /opt/node/bin/npm /usr/local/bin/npm

RUN npm install npm -g
RUN npm install gulp -g
RUN gem install --no-rdoc --no-ri bundle

# For Ruby
RUN apt-get install -y --no-install-recommends \
      openjdk-7-jre-headless

COPY Gemfile /hackathon-site/tools/
COPY Gemfile.lock /hackathon-site/tools/
RUN cd /hackathon-site/tools && bundle install

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

VOLUME /hackathon-site/build
VOLUME /hackathon-site/tools
VOLUME /hackathon-site/web

