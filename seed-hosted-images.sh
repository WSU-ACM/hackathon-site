#!/bin/sh

echo "This script grabs a few dummy photos off the server. If nothing happens,"
echo "no worries! That means you've already seeded your photos directory."

hosted_images2=hosted-images/hackathon_02
hosted_images3=hosted-images/hackathon_03

## Create the directories if they don't exist
if [ ! -d $hosted_images2 ]; then mkdir -p $hosted_images2; fi
if [ ! -d ${hosted_images2}_mini ]; then mkdir ${hosted_images2}_mini; fi
if [ ! -d $hosted_images3 ]; then mkdir $hosted_images3; fi
if [ ! -d ${hosted_images3}_mini ]; then mkdir ${hosted_images3}_mini; fi

server_images_url=hackathon.eecs.wsu.edu/hosted_images/
images="IMG_0388.jpg IMG_0390.jpg IMG_0393.jpg IMG_0400.jpg IMG_0402.jpg IMG_0405.jpg"

for image in $images; do
  wget -nvc ${server_images_url}hackathon_02/$image -P $hosted_images2
  wget -nvc ${server_images_url}hackathon_02_mini/$image -P ${hosted_images2}_mini
done

wget -nvc ${server_images_url}hackathon_03/sticker.jpg -P $hosted_images3
wget -nvc ${server_images_url}hackathon_03_mini/sticker.jpg -P ${hosted_images3}_mini