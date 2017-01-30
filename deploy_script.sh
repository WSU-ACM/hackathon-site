grunt build --force
scp -r dist/* ${HACKATHON_USER}@hackathon.eecs.wsu.edu:/home/hackathon/public_html
