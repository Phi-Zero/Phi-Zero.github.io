(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reading progress.
  var progress = document.querySelector('.scroll-progress');
  function updateProgress() {
    if (!progress) return;
    var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    var scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (scrollRange > 0 ? Math.min(scrollTop / scrollRange * 100, 100) : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // Reveal sections only when motion is welcome.
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section'));
  if (!reducedMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -7% 0px' });
    sections.forEach(function (section) { revealObserver.observe(section); });
  } else {
    sections.forEach(function (section) { section.classList.add('in-view'); });
  }

  // External links remain visibly "Soon" until configured.
  var config = window.PHIZERO_CONFIG || {};
  document.querySelectorAll('[data-cfg]').forEach(function (element) {
    var value = config[element.getAttribute('data-cfg')];
    if (!value || value === '#') return;
    element.setAttribute('href', value);
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener');
    element.removeAttribute('aria-disabled');
    element.classList.remove('button-muted');
  });
  var year = document.getElementById('footer-year');
  if (year && config.YEAR) year.textContent = config.YEAR;

  // Navigation scroll spy.
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav .sections a'));
  var observedSections = navLinks.map(function (link) {
    var href = link.getAttribute('href');
    return href && href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
  }).filter(Boolean);

  function activateNav(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
      if (visible.length) activateNav(visible[0].target.id);
    }, { rootMargin: '-68px 0px -62% 0px', threshold: [0, 0.2, 0.5] });
    observedSections.forEach(function (section) { navObserver.observe(section); });
  }

  // Mobile navigation.
  var navToggle = document.querySelector('.nav-toggle');
  var navList = document.querySelector('.nav .sections');
  function closeNavigation() {
    if (!navList || !navToggle) return;
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      var open = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach(function (link) { link.addEventListener('click', closeNavigation); });
  }

  // Expanded application list: play only the groups currently in view.
  var demoPanels = Array.prototype.slice.call(document.querySelectorAll('.demo-panel'));
  function pauseDemoVideos(panel) {
    panel.setAttribute('data-demo-visible', 'false');
    panel.querySelectorAll('video').forEach(function (video) { video.pause(); });
  }

  function updateVisibleDemoVideos(panel) {
    var track = panel.querySelector('.application-video-list');
    if (!track || panel.getAttribute('data-demo-visible') !== 'true') return;
    var trackBounds = track.getBoundingClientRect();

    panel.querySelectorAll('video').forEach(function (video) {
      var card = video.closest('.video-card');
      var cardBounds = card ? card.getBoundingClientRect() : trackBounds;
      var visible = cardBounds.right > trackBounds.left + 8 &&
        cardBounds.left < trackBounds.right - 8;

      if (visible) {
        video.muted = true;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () { /* Browser autoplay policy may require a tap. */ });
        }
      } else {
        video.pause();
      }
    });
  }

  function playDemoVideos(panel) {
    panel.setAttribute('data-demo-visible', 'true');
    updateVisibleDemoVideos(panel);
  }

  function setupApplicationVideoList(panel) {
    var heading = panel.querySelector('.application-heading');
    var track = panel.querySelector('.application-video-list');
    if (!heading || !track) return;

    var title = heading.querySelector('h3');
    var controls = document.createElement('div');
    controls.className = 'application-list-controls';
    controls.setAttribute('aria-label', (title ? title.textContent : 'Application') + ' video navigation');
    controls.innerHTML =
      '<button type="button" data-application-direction="-1" aria-label="Previous videos">←</button>' +
      '<button type="button" data-application-direction="1" aria-label="Next videos">→</button>';
    heading.appendChild(controls);

    var buttons = Array.prototype.slice.call(controls.querySelectorAll('[data-application-direction]'));
    function updateApplicationButtons() {
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      buttons[0].disabled = track.scrollLeft <= 2;
      buttons[1].disabled = track.scrollLeft >= maxScroll - 2;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var direction = Number(button.getAttribute('data-application-direction')) || 1;
        var page = track.querySelector('.generation-page');
        var card = track.querySelector('.video-card');
        var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
        var step = page
          ? page.getBoundingClientRect().width + gap
          : (panel.id === 'demo-driving' || panel.classList.contains('single-video-panel')) && card
            ? card.getBoundingClientRect().width + gap
            : track.clientWidth;
        track.scrollBy({ left: direction * step, behavior: 'smooth' });
      });
    });

    var playbackFrame = 0;
    track.addEventListener('scroll', function () {
      updateApplicationButtons();
      window.cancelAnimationFrame(playbackFrame);
      playbackFrame = window.requestAnimationFrame(function () {
        updateVisibleDemoVideos(panel);
      });
    }, { passive: true });
    window.addEventListener('resize', updateApplicationButtons, { passive: true });
    updateApplicationButtons();
  }

  // Keep the source and transferred halves of each motion-transfer case aligned.
  document.querySelectorAll('.transfer-video-pair').forEach(function (pair) {
    var videos = pair.querySelectorAll('video');
    if (videos.length !== 2) return;

    var sourceVideo = videos[0];
    var transferredVideo = videos[1];
    function alignTransferredVideo() {
      if (transferredVideo.readyState > 0 &&
          Math.abs(transferredVideo.currentTime - sourceVideo.currentTime) > 0.12) {
        transferredVideo.currentTime = sourceVideo.currentTime;
      }
    }

    sourceVideo.addEventListener('play', function () {
      alignTransferredVideo();
      var playPromise = transferredVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () { /* Browser autoplay policy may require a tap. */ });
      }
    });
    sourceVideo.addEventListener('pause', function () { transferredVideo.pause(); });
    sourceVideo.addEventListener('seeking', alignTransferredVideo);
    sourceVideo.addEventListener('timeupdate', alignTransferredVideo);
  });

  demoPanels.forEach(setupApplicationVideoList);

  if (demoPanels.length && 'IntersectionObserver' in window) {
    var demoVideoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playDemoVideos(entry.target);
        } else {
          pauseDemoVideos(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '80px 0px 80px 0px' });

    demoPanels.forEach(function (panel) { demoVideoObserver.observe(panel); });
  } else {
    demoPanels.forEach(playDemoVideos);
  }

  // Horizontal qualitative-comparison carousel.
  var iqCarousel = document.querySelector('.iq-carousel');
  if (iqCarousel) {
    var iqTrack = iqCarousel.querySelector('.iq-comparison-list');
    var iqCards = Array.prototype.slice.call(iqCarousel.querySelectorAll('.iq-comparison-item'));
    var iqButtons = Array.prototype.slice.call(iqCarousel.querySelectorAll('[data-iq-direction]'));

    function setIqPlayButtons(card, visible) {
      card.querySelectorAll('.iq-video-play').forEach(function (button) {
        button.classList.toggle('is-visible', visible);
      });
    }

    function seekIqVideoToStart(video) {
      video.pause();
      if (video.readyState > 0) {
        video.currentTime = 0;
      } else {
        video.addEventListener('loadedmetadata', function () {
          video.currentTime = 0;
        }, { once: true });
      }
    }

    function finishIqPlayback(card) {
      card.removeAttribute('data-iq-playing');
      card.querySelectorAll('video').forEach(seekIqVideoToStart);
      setIqPlayButtons(card, true);
    }

    function playIqComparison(card) {
      var videos = Array.prototype.slice.call(card.querySelectorAll('video'));
      if (!videos.length) return;
      setIqPlayButtons(card, false);
      card.setAttribute('data-iq-playing', 'true');
      videos.forEach(function (video) {
        video.muted = true;
        if (video.readyState > 0) video.currentTime = 0;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () { finishIqPlayback(card); });
        }
      });
    }

    iqCards.forEach(function (card) {
      card.querySelectorAll('.iq-video').forEach(function (figure) {
        var label = figure.querySelector('figcaption');
        var playButton = document.createElement('button');
        playButton.type = 'button';
        playButton.className = 'iq-video-play';
        playButton.setAttribute('aria-label', 'Replay ' + (label ? label.textContent : 'video comparison'));
        playButton.innerHTML = '<span aria-hidden="true">▶</span>';
        playButton.addEventListener('click', function () { playIqComparison(card); });
        figure.appendChild(playButton);
      });
      card.querySelectorAll('video').forEach(function (video) {
        video.addEventListener('ended', function () { finishIqPlayback(card); });
      });
      setIqPlayButtons(card, true);
    });

    function updateIqButtons() {
      if (!iqTrack || iqButtons.length < 2) return;
      var maxScroll = Math.max(0, iqTrack.scrollWidth - iqTrack.clientWidth);
      iqButtons[0].disabled = iqTrack.scrollLeft <= 2;
      iqButtons[1].disabled = iqTrack.scrollLeft >= maxScroll - 2;
    }

    iqButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (!iqTrack || !iqCards.length) return;
        var gap = parseFloat(window.getComputedStyle(iqTrack).columnGap) || 0;
        var step = iqCards[0].getBoundingClientRect().width + gap;
        var direction = Number(button.getAttribute('data-iq-direction')) || 1;
        iqTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
      });
    });

    if (iqTrack) {
      iqTrack.addEventListener('scroll', updateIqButtons, { passive: true });
      window.addEventListener('resize', updateIqButtons, { passive: true });
      updateIqButtons();
    }

    if (iqTrack && 'IntersectionObserver' in window) {
      var iqVideoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if ((!entry.isIntersecting || entry.intersectionRatio < 0.45) &&
              entry.target.getAttribute('data-iq-playing') === 'true') {
            finishIqPlayback(entry.target);
          }
        });
      }, { root: iqTrack, threshold: [0, 0.45, 0.9] });

      iqCards.forEach(function (card) { iqVideoObserver.observe(card); });
    }
  }

  // Horizontal reconstruction carousel.
  var reconCarousel = document.querySelector('.recon-carousel');
  if (reconCarousel) {
    var reconTrack = reconCarousel.querySelector('.recon-video-list');
    var reconCards = Array.prototype.slice.call(reconCarousel.querySelectorAll('.recon-video-card'));
    var reconButtons = Array.prototype.slice.call(reconCarousel.querySelectorAll('[data-recon-direction]'));

    function updateReconButtons() {
      if (!reconTrack || reconButtons.length < 2) return;
      var maxScroll = Math.max(0, reconTrack.scrollWidth - reconTrack.clientWidth);
      reconButtons[0].disabled = reconTrack.scrollLeft <= 2;
      reconButtons[1].disabled = reconTrack.scrollLeft >= maxScroll - 2;
    }

    reconButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        if (!reconTrack || !reconCards.length) return;
        var gap = parseFloat(window.getComputedStyle(reconTrack).columnGap) || 0;
        var step = reconCards[0].getBoundingClientRect().width + gap;
        var direction = Number(button.getAttribute('data-recon-direction')) || 1;
        reconTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
      });
    });

    reconCards.forEach(function (card) {
      var videos = Array.prototype.slice.call(card.querySelectorAll('video'));
      if (videos.length < 2) return;

      var originalVideo = videos[0];
      var reconstructedVideo = videos[1];
      var syncRunning = false;

      function waitUntilPlayable(video) {
        return new Promise(function (resolve) {
          if (video.readyState >= 3) {
            resolve();
          } else {
            video.addEventListener('canplay', resolve, { once: true });
          }
        });
      }

      function keepReconPairSynchronized() {
        if (originalVideo.paused || originalVideo.ended) {
          syncRunning = false;
          return;
        }

        var drift = reconstructedVideo.currentTime - originalVideo.currentTime;
        if (Math.abs(drift) > 0.04 && reconstructedVideo.readyState >= 2) {
          reconstructedVideo.currentTime = originalVideo.currentTime;
        }
        window.requestAnimationFrame(keepReconPairSynchronized);
      }

      function startReconSyncLoop() {
        if (syncRunning) return;
        syncRunning = true;
        window.requestAnimationFrame(keepReconPairSynchronized);
      }

      function playReconPairFromStart() {
        originalVideo.currentTime = 0;
        reconstructedVideo.currentTime = 0;
        originalVideo.muted = true;
        reconstructedVideo.muted = true;

        var originalPlay = originalVideo.play();
        var reconstructionPlay = reconstructedVideo.play();
        if (originalPlay && typeof originalPlay.catch === 'function') {
          originalPlay.catch(function () { /* Muted autoplay may still be restricted. */ });
        }
        if (reconstructionPlay && typeof reconstructionPlay.catch === 'function') {
          reconstructionPlay.catch(function () { /* Muted autoplay may still be restricted. */ });
        }
        startReconSyncLoop();
      }

      originalVideo.addEventListener('play', function () {
        if (reconstructedVideo.paused) {
          var reconstructionPlay = reconstructedVideo.play();
          if (reconstructionPlay && typeof reconstructionPlay.catch === 'function') {
            reconstructionPlay.catch(function () { /* Muted autoplay may still be restricted. */ });
          }
        }
        startReconSyncLoop();
      });

      originalVideo.addEventListener('pause', function () {
        if (!originalVideo.ended) reconstructedVideo.pause();
      });

      originalVideo.addEventListener('seeking', function () {
        reconstructedVideo.currentTime = originalVideo.currentTime;
      });

      originalVideo.addEventListener('ended', playReconPairFromStart);

      Promise.all([
        waitUntilPlayable(originalVideo),
        waitUntilPlayable(reconstructedVideo)
      ]).then(playReconPairFromStart);
    });

    if (reconTrack) {
      reconTrack.addEventListener('scroll', updateReconButtons, { passive: true });
      window.addEventListener('resize', updateReconButtons, { passive: true });
      updateReconButtons();
    }
  }

  // Figure lightbox.
  var zoomableImages = document.querySelectorAll('.paper-figure img');
  if (zoomableImages.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close image">×</button><img alt="" />';
    document.body.appendChild(lightbox);

    var lightboxImage = lightbox.querySelector('img');
    var closeButton = lightbox.querySelector('.lightbox-close');

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    zoomableImages.forEach(function (image) {
      image.addEventListener('click', function () {
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  // BibTeX copy, with a fallback for file:// previews.
  document.querySelectorAll('.bibtex-copy').forEach(function (button) {
    button.addEventListener('click', function () {
      var pre = button.closest('.citation').querySelector('.bibtex');
      if (!pre) return;
      var original = button.textContent;

      function showSuccess() {
        button.textContent = 'Copied';
        button.classList.add('copied');
        window.setTimeout(function () {
          button.textContent = original;
          button.classList.remove('copied');
        }, 1400);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(pre.textContent).then(showSuccess);
        return;
      }

      var textarea = document.createElement('textarea');
      textarea.value = pre.textContent;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showSuccess();
      } catch (error) {
        // No-op: copy support varies for file:// previews.
      }
      document.body.removeChild(textarea);
    });
  });
})();
