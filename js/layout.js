(function () {
  'use strict';

  var HEADER_HTML =
    '<div class="wrap nav">' +
      '<a class="brand" href="index.html">Michaël</a>' +
      '<button class="nav-toggle" aria-label="Menu" aria-expanded="false">☰</button>' +
      '<ul class="nav-links">' +
        '<li><a href="index.html">Home</a></li>' +
        '<li><a href="scouting-journey.html">Journey</a></li>' +
        '<li><a href="wood-badge.html">Wood Badge</a></li>' +
        '<li><a href="contact.html">Contact</a></li>' +
      '</ul>' +
    '</div>';

  var FOOTER_HTML =
    '<div class="wrap footer-grid">' +
      '<div>' +
        '<div class="footer-brand">Michaël Etiennette</div>' +
        '<p style="max-width:340px;">Open to collaborations, speaking engagements, youth-participation' +
          ' initiatives and leadership-development opportunities.</p>' +
        '<a class="btn btn--gold" href="contact.html">Start a conversation</a>' +
      '</div>' +
      '<div>' +
        '<h4>Explore</h4>' +
        '<ul class="nav-links">' +
          '<li><a href="index.html">Home</a></li>' +
          '<li><a href="scouting-journey.html">Journey</a></li>' +
          '<li><a href="wood-badge.html">Wood Badge</a></li>' +
          '<li><a href="contact.html">Contact</a></li>' +
        '</ul>' +
      '</div>' +
      '<div>' +
        '<h4>Connect</h4>' +
        '<ul class="footer-links">' +
          '<li><a href="mailto:michaeletiennette73@gmail.com">Email</a></li>' +
          '<li><a href="https://www.linkedin.com/in/michaël-etiennette-635b53268/" target="_blank" rel="noopener">LinkedIn</a></li>' +
          '<li><a href="https://www.instagram.com/mika_etiennette/" target="_blank" rel="noopener">Instagram</a></li>' +
          '<li><a href="https://www.facebook.com/profile.php?id=100008579681114" target="_blank" rel="noopener">Facebook</a></li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="wrap footer-bottom">' +
      '<span>© <span id="year"></span> Michaël Etiennette. All rights reserved.</span>' +
      '<span>Youth participation · Service · Integrity · Inclusion · Innovation</span>' +
    '</div>';

  var header = document.getElementById('site-header');
  if (header) header.innerHTML = HEADER_HTML;

  var footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = FOOTER_HTML;
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
})();
