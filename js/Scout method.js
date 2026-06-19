/* ==========================================================================
   Scout Method — interactive radial diagram
   8 elements orbit a central hub, joined by spokes. Click to expand detail.
   Self-contained: safe to include on any page that has the markup.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('scoutMethod');
  if (!root) return;
var ELEMENTS = [
  {
    n: 'i',
    title: 'Scout Promise & Law',
    text: 'The Scout Promise and Law form the foundation of behaviour within our troop.\n\nThese values are reinforced through:\n• Patrol Reward & Recognition System\n• Uniform inspections\n• Reflection sessions after activities\n• Leadership responsibilities within patrols\n\nRather than simply memorising the Promise and Law, Scouts are encouraged to apply them in their everyday actions and decisions.'
  },

  {
    n: 'ii',
    title: 'Learning by Doing',
    text: 'Most learning within our troop happens through practical experiences.\n\nExamples include:\n• Governance Challenge\n• Pioneering activities\n• Dauguet hikes\n• Orienteering exercises\n• Camps and expeditions\n\nYoung people learn by participating, experimenting and reflecting on their experiences.'
  },

  {
    n: 'iii',
    title: 'Personal Progression',
    text: 'Scouts progress through a combination of badge work, practical skills, leadership responsibilities and participation in activities.\n\nExamples include:\n• Activity badges\n• Governance Challenge\n• Orienteering Badge\n• Pioneering Badge\n• Leadership roles within patrols\n\nProgress is monitored through observation, practical assessments and discussions with leaders.'
  },

  {
    n: 'iv',
    title: 'Patrol System',
    text: 'The Patrol System remains the foundation of our troop structure.\n\nThe troop consists of five patrols led by Patrol Leaders and Assistant Patrol Leaders.\n\nThrough the rebuilding of our Patrol Leaders’ Council, youth leaders are increasingly involved in evaluating activities, proposing improvements and contributing to programme planning.'
  },

  {
    n: 'v',
    title: 'Adult Support',
    text: 'Leaders act primarily as mentors and facilitators rather than directors.\n\nExamples include:\n• Mentoring Patrol Leaders\n• Supporting the Venture Executive Committee\n• Coaching Scouts during badge work\n• Providing guidance while encouraging independence\n\nThe objective is to help young people grow through responsibility and experience.'
  },

  {
    n: 'vi',
    title: 'Symbolic Framework',
    text: 'The symbolic elements of Scouting create identity and belonging.\n\nExamples include:\n• Patrol names and identities\n• Scout uniform\n• Ceremonies and investitures\n• Badges and awards\n• Group traditions\n\nThese symbols help create a unique educational experience and strengthen commitment to the Movement.'
  },

  {
    n: 'vii',
    title: 'Nature',
    text: 'Nature remains an essential part of our programme.\n\nExamples include:\n• Hikes at Dauguet\n• Camps and expeditions\n• Outdoor skills activities\n• Orienteering challenges\n• Environmental awareness initiatives\n\nOutdoor experiences help Scouts develop resilience, confidence and respect for the environment.'
  },

  {
    n: 'viii',
    title: 'Community Involvement',
    text: 'Scouts are encouraged to become active citizens through service and engagement.\n\nExamples include:\n• Environmental initiatives\n• Community service projects\n• Heritage activities in Port Louis\n• District-level events\n• Support to local causes\n\nThese experiences help young people understand their role within society and contribute positively to their communities.'
  }
];
  var nodesWrap = root.querySelector('.sm-nodes');
  var spokes = root.querySelector('.sm-spokes');
  var hub = root.querySelector('.sm-hub');
  var detail = root.querySelector('#smDetail');
  var dNum = root.querySelector('#smNum');
  var dTitle = root.querySelector('#smTitle');
  var dText = root.querySelector('#smText');
  var dClose = root.querySelector('#smClose');

  var CX = 300, CY = 300, R = 200; // viewBox coordinates (matches SVG)
  var count = ELEMENTS.length;
  var activeIndex = -1;

  // Build nodes + spokes
  ELEMENTS.forEach(function (el, i) {
    var angle = (-90 + (360 / count) * i) * Math.PI / 180; // start at top
    var x = CX + R * Math.cos(angle);
    var y = CY + R * Math.sin(angle);
    var px = (x / 600) * 100, py = (y / 600) * 100; // % for absolute positioning

    // spoke line (hub -> node)
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', CX); line.setAttribute('y1', CY);
    line.setAttribute('x2', x);  line.setAttribute('y2', y);
    line.setAttribute('class', 'sm-spoke');
    line.dataset.index = i;
    spokes.appendChild(line);

    // node button
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sm-node';
    btn.style.left = px + '%';
    btn.style.top = py + '%';
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<span class="sm-node-num">' + el.n + '</span>' +
                    '<span class="sm-node-title">' + el.title + '</span>';
    btn.addEventListener('click', function () { select(i); });
    nodesWrap.appendChild(btn);
  });

  var nodeBtns = nodesWrap.querySelectorAll('.sm-node');
  var spokeLines = spokes.querySelectorAll('.sm-spoke');

  function select(i) {
    if (activeIndex === i) { clear(); return; }
    activeIndex = i;
    var el = ELEMENTS[i];
    nodeBtns.forEach(function (b, j) {
      b.classList.toggle('active', j === i);
      b.setAttribute('aria-pressed', j === i);
    });
    spokeLines.forEach(function (l, j) { l.classList.toggle('active', j === i); });
    hub.classList.add('dimmed');

    dNum.textContent = el.n;
    dTitle.textContent = el.title;
    dText.textContent = el.text;
    detail.hidden = false;
    detail.classList.add('in');
    // bring detail into view on small screens
    if (window.innerWidth < 760) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clear() {
    activeIndex = -1;
    nodeBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    spokeLines.forEach(function (l) { l.classList.remove('active'); });
    hub.classList.remove('dimmed');
    detail.classList.remove('in');
    detail.hidden = true;
  }

  // Hub highlights everything (shows the "all interact" idea)
  hub.addEventListener('click', function () {
    var on = hub.classList.toggle('all');
    hub.setAttribute('aria-pressed', on);
    spokeLines.forEach(function (l) { l.classList.toggle('glow', on); });
    nodeBtns.forEach(function (b) { b.classList.toggle('glow', on); });
    if (on) clear();
  });

  dClose.addEventListener('click', clear);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clear(); });
})();