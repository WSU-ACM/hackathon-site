(function($) {
  "use strict"; // Start of use strict

  // ensure red wheat logo for small screens
  $(window).on('load resize', function() {
    if ($(window).width() < 992) {
      $(".navbar-brand img").attr("src","img/crimson-code-logo-color.png");
      $(".navbar .list-social li a").addClass("red");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
      $(".navbar-brand img").attr("src","img/crimson-code-logo-white.png");
      $(".navbar .list-social li a").removeClass("red");
    }
  });

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 48)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });
  
  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#mainNav',
    offset: 54
  });

  // Collapse the navbar when page is scrolled
  $(window).scroll(function() {
    if ($("#mainNav").offset().top > 100 || $(window).width() < 992) {
      $("#mainNav").addClass("navbar-shrink");
      $(".navbar-brand img").attr("src","img/crimson-code-logo-color.png")
      $(".navbar .list-social li a").addClass("red");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
      $(".navbar-brand img").attr("src","img/crimson-code-logo-white.png");
      $(".navbar .list-social li a").removeClass("red");
    }
  });

})(jQuery); // End of use strict
