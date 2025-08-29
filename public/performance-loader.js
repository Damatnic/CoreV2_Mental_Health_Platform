// Performance optimization loader
// Defers non-critical resources and optimizes initial page load

(function() {
  // Defer non-critical CSS
  const deferCSS = () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      if (!link.dataset.critical) {
        link.media = 'print';
        link.onload = function() { this.media = 'all'; };
      }
    });
  };

  // Lazy load images
  const lazyLoadImages = () => {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      images.forEach(img => imageObserver.observe(img));
    }
  };

  // Preconnect to external domains
  const preconnect = () => {
    const domains = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // Initialize optimizations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      deferCSS();
      lazyLoadImages();
      preconnect();
    });
  } else {
    deferCSS();
    lazyLoadImages();
    preconnect();
  }
})();