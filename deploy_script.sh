rm -rf dist
gulp --force
scp -r dist/* ${HACKATHON_USER}@lugwww1.eecs.wsu.edu:/home/hackathon/public_html
