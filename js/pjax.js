/* global NexT, CONFIG, Pjax */

// Mark admin and external links with data-no-pjax to prevent PJAX from intercepting them
function markNoPjaxLinks() {
  document.querySelectorAll('a[href]').forEach(link => {
    try {
      const url = new URL(link.href, window.location.origin);
      if (url.pathname.startsWith('/admin') || url.origin !== window.location.origin) {
        link.setAttribute('data-no-pjax', '');
      }
    } catch (e) {}
  });
}
markNoPjaxLinks();

const pjax = new Pjax({
  selectors: [
    'head title',
    // Precede .main-inner to prevent placeholder TOC changes asap
    '.post-toc-wrap',
    '.main-inner',
    '.languages',
    '.pjax'
  ],
  switches: {
    '.post-toc-wrap': function(oldWrap, newWrap) {
      if (newWrap.querySelector('.post-toc')) {
        Pjax.switches.outerHTML.call(this, oldWrap, newWrap);
      } else {
        const curTOC = oldWrap.querySelector('.post-toc');
        if (curTOC) {
          curTOC.classList.add('placeholder-toc');
        }
        this.onSwitch();
      }
    }
  },
  analytics: false,
  cacheBust: false,
  scrollTo : !CONFIG.bookmark.enable
});

document.addEventListener('pjax:success', () => {
  pjax.executeScripts(document.querySelectorAll('script[data-pjax]'));
  NexT.boot.refresh();
  
  // Re-mark links for new page content
  markNoPjaxLinks();
  
  // Re-execute all inline scripts in the new content
  // This handles ECharts, Tableau, Douban, and any other dynamically loaded content
  document.querySelectorAll('.main-inner script:not([src])').forEach(script => {
    try {
      const newScript = document.createElement('script');
      // Copy all attributes from the original script
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = script.textContent;
      script.parentNode.replaceChild(newScript, script);
    } catch (e) {
      console.warn('Script re-execution error:', e);
    }
  });
  
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    NexT.motion.integrator
      .init()
      .add(NexT.motion.middleWares.subMenu)
      .add(NexT.motion.middleWares.postList)
      // Add sidebar-post-related transition.
      .add(NexT.motion.middleWares.sidebar)
      .bootstrap();
  }
  if (CONFIG.sidebar.display !== 'remove') {
    const hasTOC = document.querySelector('.post-toc:not(.placeholder-toc)');
    document.querySelector('.sidebar-inner').classList.toggle('sidebar-nav-active', hasTOC);
    NexT.utils.activateSidebarPanel(hasTOC ? 0 : 1);
    NexT.utils.updateSidebarPosition();
  }
});
