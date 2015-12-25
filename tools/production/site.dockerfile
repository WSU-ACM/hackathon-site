FROM ubuntu:14.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
      nginx

COPY site-server.tar /
RUN mkdir -p /opt/hackathon-site/ && \
    cd /opt/hackathon-site && \
    tar -xf /site-server.tar && \
    rm /site-server.tar

COPY hackathon.nginx.conf /etc/nginx/sites-available/hackathon
RUN ln -s /etc/nginx/sites-available/hackathon /etc/nginx/sites-enabled/hackathon
RUN rm /etc/nginx/sites-enabled/default

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

EXPOSE 4000
CMD service nginx start && sleep infinity
