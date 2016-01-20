//Create Gallery based on passed in selector
var initPhotoSwipeFromDOM = function(gallerySelector) {
  // parse slide data (url, title, size ...) from DOM elements 
  // (children of gallerySelector)
  var parseThumbnailElements = function(el) {
    var thumbElements = el.childNodes,
      numNodes = thumbElements.length,
      items = [],
      figureEl,
      childElements,
      linkEl,
      size,
      item;

    for(var i = 0; i < numNodes; i++) {
      figureEl = thumbElements[i]; // <figure> element
      // include only element nodes 
      if(figureEl.nodeType !== 1 &&
          figureEl.nodeName !== "FIGURE" &&
          typeof(figureEl.children) === "undefined")  {
        continue;
      }

      //sorry Dylan. JavaScript was being dumb. I tried to put it in the previous
      //if statement, but it didn't work
      if(figureEl.children.length === 0) {
        continue;
      }

      linkEl = figureEl.children[0]; // <a> element
    
      size = linkEl.getAttribute('data-size').split('x');

      // create slide object
      item = {
        src: linkEl.getAttribute('href'),
        w: parseInt(size[0], 10),
        h: parseInt(size[1], 10)
      };

      if(linkEl.children.length > 0) {
        // <img> thumbnail element, retrieving thumbnail url
        item.msrc = linkEl.children[0].getAttribute('src');
      } 
       
      item.el = figureEl; // save link to element for getThumbBoundsFn
      items.push(item);
    }
    return items;
  };

  // find nearest parent element
  var closest = function closest(el, fn) {
      return el && ( fn(el) ? el : closest(el.parentNode, fn) );
  };

  // triggers when user clicks on thumbnail
  var onThumbnailsClick = function(e) {
    e = e || window.event;
    e.preventDefault ? e.preventDefault() : e.returnValue = false;

    var eTarget = e.target || e.srcElement;

    var clickedListItem = closest(eTarget, function(el) {
        return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
    });

    if(!clickedListItem) {
      return;
    }


    // find index of clicked item
    var clickedGallery = clickedListItem.parentNode,
      childNodes = clickedListItem.parentNode.childNodes,
      numChildNodes = childNodes.length,
      nodeIndex = 0,
      index;

    for (var i = 0; i < numChildNodes; i++) {
      if(childNodes[i].nodeType !== 1) { 
          continue; 
      }

      if(childNodes[i] === clickedListItem) {
          index = nodeIndex;
          break;
      }
      nodeIndex++;
    }

    if(index >= 0) {
        openPhotoSwipe( index, clickedGallery );
    }
    return false;
  };

  // parse picture index and gallery index from URL (#&pid=1&gid=2)
  var photoswipeParseHash = function() {
    var hash = window.location.hash.substring(1),
      params = {};

    if(hash.length < 5) {
      return params;
    }

    var vars = hash.split('&');
    for (var i = 0; i < vars.length; i++) {
        if(!vars[i]) {
            continue;
        }
        var pair = vars[i].split('=');  
        if(pair.length < 2) {
            continue;
        }           
        params[pair[0]] = pair[1];
    }

    if(params.gid) {
      params.gid = parseInt(params.gid, 10);
    }

    if(!params.hasOwnProperty('pid')) {
        return params;
    }
    params.pid = parseInt(params.pid, 10);
    return params;
  };

  var openPhotoSwipe = function(index, galleryElement, disableAnimation) {
    var pswpElement = document.querySelectorAll('.pswp')[0],
      gallery,
      options,
      items;

    items = parseThumbnailElements(galleryElement);

      // define options (if needed)
    options = {
      index: index,

      // define gallery index (for URL)
      galleryUID: galleryElement.getAttribute('data-pswp-uid'),

      getThumbBoundsFn: function(index) {
        // See Options -> getThumbBoundsFn section of docs for more info
        var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
            pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
            rect = thumbnail.getBoundingClientRect(); 

        return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
      },

      // history & focus options are disabled on CodePen
      // remove these lines in real life: 
      historyEnabled: true,
      focus: true 
    };

    if(disableAnimation) {
        options.showAnimationDuration = 0;
    }

    // Pass data to PhotoSwipe and initialize it
    gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
  };

  // loop through all gallery elements and bind events
  var galleryElements = document.querySelectorAll( gallerySelector );

  for(var i = 0, l = galleryElements.length; i < l; i++) {
    galleryElements[i].setAttribute('data-pswp-uid', i+1);
    galleryElements[i].onclick = onThumbnailsClick;
  }

  // Parse URL and open gallery if it contains #&pid=3&gid=1
  var hashData = photoswipeParseHash();
  if(hashData.pid > 0 && hashData.gid > 0) {
    openPhotoSwipe( hashData.pid - 1 ,  galleryElements[ hashData.gid - 1 ], true );
  }
};

function findGalleries(callback) {
  var galleries = document.getElementsByClassName('gallery');
  callback(galleries);
}


//contains some data about the galleries
var img_galleries = {};

function selectTab(year) {
  document.getElementById("hackathon_" + year).style.display = 'block';
  document.getElementById("tab_" + year).classList.add('selected');

  switch (year) {
    case 2:
      document.getElementById('hackathon_3').style.display = 'none';
      document.getElementById('tab_3').classList.remove('selected');
      break;
    case 3:
      document.getElementById('hackathon_2').style.display = 'none';
      document.getElementById('tab_2').classList.remove('selected');
      break;
  }
}

function getImagesForGalleries(galleries) {

  function imgRequest(year, options, callback) {
    var url;
    var baseURL = "api/v1/photos";

    url = baseURL + "/" + year + toQueryString(options);

    var request = new XMLHttpRequest();
    request.onload = function() {
      callback(JSON.parse(request.response));
    };
    request.open("GET", url);
    request.send();
  }

  function getImgsForGallery(gallery) {
    console.log("Skip for " + gallery.id + " is " + img_galleries[gallery.id])
    var skip = img_galleries[gallery.id] || 0;
    
    if(skip === 0) {
      // initialze the value
      img_galleries[gallery.id] = 0;
    }

    var year;
    switch (gallery.id) {
      case "hackathon_2":
        year = 2;
        break;
      case "hackathon_3":
        year = 3;
        break;
    }

    imgRequest(year, {skip: skip}, function(response) {
      //console.log(imgs.length + " images for " + gallery.id);

      var imgs = response;
      img_galleries[gallery.id] += imgs.length;

      if(imgs.length > 0) {
        addImagesToGallery(gallery, imgs, function() {
          console.log("galleryID: " + gallery.id);
          initPhotoSwipeFromDOM('#' + gallery.id);
        });
      } else {
        //If no pictures exist, remove from DOM
        gallery.parentNode.style.display = 'none';
      }
    });
  }

  for(var i = 0; i < galleries.length; i++) {
    getImgsForGallery(galleries[i]);
  }
}

function addImagesToGallery(gallery, imgs, callback) {
  function addImgToGallery(img) {
    var imgFigure = document.createElement("figure");
    var imgLink   = document.createElement("a");
    var imgImg    = document.createElement("img");
    var button    = document.getElementById(gallery.id + "_button");

    imgFigure.setAttribute('itemprop', 'associatedMedia');
    imgFigure.setAttribute('itemscope', 'null');
    imgFigure.setAttribute('itemscope', 'http://schema.org/ImageObject');

    //link to big version of img
    imgLink.href = img.link;

    imgLink.setAttribute('itemprop', 'contentUrl');
    imgLink.setAttribute('data-size', img.width + 'x' + img.height);

    imgImg.src = img.link_mini;
    imgImg.setAttribute('itemprop', 'thumbnail');

    imgLink.appendChild(imgImg);
    imgFigure.appendChild(imgLink);
    gallery.insertBefore(imgFigure, button);
  }

  //process each image
  for(var i = 0; i < imgs.length; i++) {
    addImgToGallery(imgs[i]);
  }
  callback();

}

function toQueryString(params) {
  var keys = Object.keys(params);
  var qs = "";

  for(var i = 0; i < keys.length; i++) {
    if(i === 0) {
      qs += "?" + keys[i] + "=" + params[keys[i]];
    } else {
      qs += "&" + keys[i] + "=" + params[keys[i]];
    }
  }
  console.log("qs: " + qs);
  return qs;
}

findGalleries(getImagesForGalleries);
