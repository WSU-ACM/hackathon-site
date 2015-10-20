FROM ubuntu:14.04


ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
      apt-transport-https \
      ca-certificates \
      curl \
      git \
      make \
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

# For Node
RUN apt-get install -y --no-install-recommends \
      pkg-config
RUN curl https://raw.githubusercontent.com/lovell/sharp/ef62daccf99c5f734d21b56d2f49938aa9032719/preinstall.sh | bash -

# For Ruby
RUN apt-get install -y --no-install-recommends \
      openjdk-7-jre-headless

COPY . /hackathon-site/tools/
RUN /hackathon-site/tools/install-deps.sh
RUN cd /hackathon-site/tools && \
    node_modules/hackathon-api-server/bin/seed-hosted-images.sh && \
    cp node_modules/hackathon-api-server/conf/sample-api-server-config.json api-server-config.json

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

VOLUME /hackathon-site/web

