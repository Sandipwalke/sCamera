import { RETRO_FILTERS, FILTER_CATEGORIES, ASPECT_RATIOS, getFilterById } from './filters.js';
import { RetroRenderer } from './gl-renderer.js';
import { composeShot, formatDateStamp } from './compositor.js';
import { shutterAudio } from './audio.js';
import { loadSettings, saveSettings, photoStore } from './storage.js';

const LEAK_MODES = [
  { value: 0, label: 'OFF' },
  { value: 1, label: 'AMBER' },
  { value: 2, label: 'MAGENTA' },
  { value: 3, label: 'GOLD' },
  { value: 4, label: 'RANDOM' },
];

class RetroCameraApp {
  constructor() {
    this.settings = loadSettings();
    this.stream = null;
    this.videoTrack = null;
    this.torchSupported = false;
    this.flashMode = 'off'; // 'off' | 'on'
    this.zoom = 1.0;
    this.importedImage = null;
    this.importedCanvas = null;
    this.isCapturing = false;
    this.countdownTimer = null;
    this.deferredPrompt = null;
    this.activeLeakSeed = 1.37;
    this.resolvedRandomLeak = 1;
    this.photos = [];
    this.activePhotoId = null;
    this.galleryFavOnly = false;
    this.objectUrls = [];
    this.catalogCategory = this.settings.filterCategory || 'all';
    this.catalogQuery = '';
    this.visibleCarouselChips = new Set();
    this.visibleCatalogCards = new Set();

    this._cacheElements();
    this.renderer = new RetroRenderer(this.el.canvas);
    this.thumbCanvas = document.createElement('canvas');
    this.thumbCanvas.width = 96;
    this.thumbCanvas.height = 64;
    this.thumbRenderer = new RetroRenderer(this.thumbCanvas);
    this.fallbackPreviewCanvas = this._createFallbackPreviewCanvas();

    this._initPreviewObservers();
    this._buildCategoryBars();
    this._buildFilterCarousel();
    this._bindEvents();
    this._syncUI();
    this._registerServiceWorker();
    this._refreshGallery();
    this._startRenderLoop();
    this._initCamera();
  }

  _cacheElements() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      flashOverlay: $('flash-overlay'),
      rollCounter: $('roll-counter'),
      btnAspect: $('btn-aspect'),
      btnFlash: $('btn-flash'),
      btnTimer: $('btn-timer'),
      btnGrid: $('btn-grid'),
      btnInstall: $('btn-install'),
      btnLab: $('btn-lab'),
      stage: $('viewfinder-stage'),
      video: $('camera-video'),
      canvas: $('viewfinder-canvas'),
      vfGrid: $('vf-grid'),
      vfDateStamp: $('vf-datestamp'),
      hudFilter: $('hud-filter'),
      hudFrame: $('hud-frame'),
      hudLeak: $('hud-leak'),
      importedBanner: $('imported-banner'),
      btnReturnLive: $('btn-return-live'),
      focusReticle: $('focus-reticle'),
      timerCountdown: $('timer-countdown'),
      shutterCurtain: $('shutter-curtain'),
      standby: $('camera-standby'),
      standbyMsg: $('standby-message'),
      btnStartCam: $('btn-start-camera'),
      btnStandbyImport: $('btn-standby-import'),
      zoomSlider: $('zoom-slider'),
      zoomVal: $('zoom-value'),
      evSlider: $('ev-slider'),
      evVal: $('ev-value'),
      filterCategories: $('filter-categories'),
      btnBrowseFilters: $('btn-browse-filters'),
      filterTotalCount: $('filter-total-count'),
      btnFilmPrev: $('btn-film-prev'),
      btnFilmNext: $('btn-film-next'),
      carousel: $('filter-carousel'),
      filtersModal: $('filters-modal'),
      filtersModalSub: $('filters-modal-sub'),
      btnCloseFilters: $('btn-close-filters'),
      filterSearchInput: $('filter-search-input'),
      catalogCategories: $('catalog-categories'),
      catalogGrid: $('catalog-grid'),
      btnGallery: $('btn-gallery'),
      galleryThumbImg: $('gallery-thumb-img'),
      galleryEmptyIcon: $('gallery-empty-icon'),
      galleryBadge: $('gallery-badge'),
      btnImport: $('btn-import'),
      btnShutter: $('btn-shutter'),
      btnLeakCycle: $('btn-leak-cycle'),
      leakBtnLabel: $('leak-btn-label'),
      btnFlip: $('btn-flip'),
      fileInput: $('file-input'),
      labModal: $('lab-modal'),
      btnCloseLab: $('btn-close-lab'),
      segDatestamp: $('seg-datestamp'),
      segFrame: $('seg-frame'),
      segLeak: $('seg-leak'),
      grainSlider: $('grain-slider'),
      grainVal: $('grain-val'),
      vignetteSlider: $('vignette-slider'),
      vignetteVal: $('vignette-val'),
      leakSlider: $('leak-slider'),
      leakVal: $('leak-val'),
      btnAutosaveToggle: $('btn-autosave-toggle'),
      btnSoundToggle: $('btn-sound-toggle'),
      storageSummary: $('storage-summary'),
      btnNewRoll: $('btn-new-roll'),
      iosTip: $('ios-install-tip'),
      galleryModal: $('gallery-modal'),
      galleryCountSub: $('gallery-count-sub'),
      btnFilterFav: $('btn-filter-fav'),
      btnClearRoll: $('btn-clear-roll'),
      btnCloseGallery: $('btn-close-gallery'),
      galleryGrid: $('gallery-grid'),
      galleryEmpty: $('gallery-empty'),
      lightboxModal: $('lightbox-modal'),
      lightboxMeta: $('lightbox-meta'),
      lightboxSub: $('lightbox-sub'),
      lightboxImg: $('lightbox-img'),
      lightboxCaption: $('lightbox-caption'),
      btnLbFav: $('btn-lb-fav'),
      btnLbShare: $('btn-lb-share'),
      btnLbDownload: $('btn-lb-download'),
      btnLbDelete: $('btn-lb-delete'),
      btnCloseLightbox: $('btn-close-lightbox'),
      a2hsPopup: $('a2hs-popup'),
      a2hsInstructions: $('a2hs-instructions'),
      btnA2hsInstall: $('btn-a2hs-install'),
      btnA2hsDismiss: $('btn-a2hs-dismiss'),
      btnA2hsClose: $('btn-a2hs-close'),
      toast: $('toast'),
    };
  }

  _createFallbackPreviewCanvas() {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 64;
    const ctx = c.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, 40);
    sky.addColorStop(0, '#3a6ea5');
    sky.addColorStop(0.55, '#f29e4c');
    sky.addColorStop(1, '#f7d08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 96, 40);

    // Sun disc
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(68, 22, 8, 0, Math.PI * 2);
    ctx.fill();

    // Sea / horizon
    const sea = ctx.createLinearGradient(0, 38, 0, 64);
    sea.addColorStop(0, '#2a6f97');
    sea.addColorStop(1, '#183a4a');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 38, 96, 26);

    // Foreground warm hills
    ctx.fillStyle = '#582f0e';
    ctx.beginPath();
    ctx.moveTo(0, 64);
    ctx.lineTo(0, 44);
    ctx.quadraticCurveTo(28, 36, 54, 52);
    ctx.lineTo(96, 46);
    ctx.lineTo(96, 64);
    ctx.closePath();
    ctx.fill();
    return c;
  }

  _initPreviewObservers() {
    this.carouselObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visibleCarouselChips.add(entry.target);
            this._renderThumbForElement(entry.target);
          } else {
            this.visibleCarouselChips.delete(entry.target);
          }
        }
      },
      { root: this.el.carousel, rootMargin: '120px' }
    );

    this.catalogObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visibleCatalogCards.add(entry.target);
            this._renderThumbForElement(entry.target);
          } else {
            this.visibleCatalogCards.delete(entry.target);
          }
        }
      },
      { root: this.el.catalogGrid, rootMargin: '160px' }
    );
  }

  _getPreviewSource() {
    return (
      this._getCurrentSource() || {
        source: this.fallbackPreviewCanvas,
        width: this.fallbackPreviewCanvas.width,
        height: this.fallbackPreviewCanvas.height,
        mirror: false,
      }
    );
  }

  _renderThumbForElement(el) {
    const filterId = el.dataset.filterId;
    const canvas = el.querySelector('canvas.filter-thumb-canvas');
    if (!filterId || !canvas) return;

    const src = this._getPreviewSource();
    const filter = getFilterById(filterId);
    this.thumbRenderer.render(src.source, src.width, src.height, {
      filter,
      exposure: this.settings.exposure,
      zoom: 1.0,
      mirror: src.mirror,
      grainIntensity: this.settings.grainIntensity * 0.7,
      vignetteIntensity: this.settings.vignetteIntensity,
      lightLeakMode: 0,
      lightLeakIntensity: 0,
      lightLeakSeed: 1.2,
      time: 1.0,
    });
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this.thumbCanvas, 0, 0, canvas.width, canvas.height);
    }
  }

  _refreshVisiblePreviews() {
    for (const chip of this.visibleCarouselChips) {
      this._renderThumbForElement(chip);
    }
    if (!this.el.filtersModal.classList.contains('hidden')) {
      for (const card of this.visibleCatalogCards) {
        this._renderThumbForElement(card);
      }
    }
  }

  _getFiltersFor(categoryId, query = '') {
    const favSet = new Set(this.settings.favoriteFilterIds || []);
    let list = RETRO_FILTERS;
    if (categoryId === 'favorites') {
      list = RETRO_FILTERS.filter((f) => favSet.has(f.id));
    } else if (categoryId && categoryId !== 'all') {
      list = RETRO_FILTERS.filter((f) => f.category === categoryId);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.subtitle.toLowerCase().includes(q) ||
          f.badge.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  _isFilterFavorite(id) {
    return (this.settings.favoriteFilterIds || []).includes(id);
  }

  _toggleFilterFavorite(id) {
    const set = new Set(this.settings.favoriteFilterIds || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.settings.favoriteFilterIds = [...set];
    this._persistSettings();
    this._buildCategoryBars();
    if (this.settings.filterCategory === 'favorites') {
      this._buildFilterCarousel();
    } else {
      const chip = this.el.carousel.querySelector(`[data-filter-id="${id}"] .filter-thumb-fav`);
      if (chip) chip.classList.toggle('hidden', !set.has(id));
    }
  }

  _buildCategoryBars() {
    this.el.filterTotalCount.textContent = String(RETRO_FILTERS.length);

    const renderBar = (container, activeId, onPick) => {
      container.innerHTML = '';
      for (const cat of FILTER_CATEGORIES) {
        const count = this._getFiltersFor(cat.id).length;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cat-pill${cat.id === activeId ? ' active' : ''}`;
        btn.dataset.category = cat.id;
        btn.textContent = `${cat.label} (${count})`;
        btn.addEventListener('click', () => onPick(cat.id));
        container.appendChild(btn);
      }
    };

    renderBar(this.el.filterCategories, this.settings.filterCategory || 'all', (catId) => {
      this.settings.filterCategory = catId;
      this._persistSettings();
      this._buildCategoryBars();
      this._buildFilterCarousel();
      this._syncUI();
    });

    renderBar(this.el.catalogCategories, this.catalogCategory, (catId) => {
      this.catalogCategory = catId;
      this._buildCategoryBars();
      this._renderCatalogGrid();
    });
  }

  _buildFilterCarousel() {
    this.carouselObserver.disconnect();
    this.visibleCarouselChips.clear();
    this.el.carousel.innerHTML = '';

    const list = this._getFiltersFor(this.settings.filterCategory || 'all');
    const frag = document.createDocumentFragment();

    for (const filter of list) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.dataset.filterId = filter.id;
      btn.setAttribute('role', 'option');
      const isFav = this._isFilterFavorite(filter.id);
      btn.innerHTML = `
        <div class="filter-thumb-wrap">
          <canvas class="filter-thumb-canvas" width="96" height="64"></canvas>
          <span class="filter-thumb-fav${isFav ? '' : ' hidden'}">★</span>
          <span class="filter-thumb-badge">${filter.badge}</span>
        </div>
        <span class="filter-name">${filter.name}</span>
      `;
      btn.addEventListener('click', () => this.selectFilter(filter.id));
      frag.appendChild(btn);
    }

    this.el.carousel.appendChild(frag);
    this.el.carousel.querySelectorAll('.filter-chip').forEach((chip) => {
      this.carouselObserver.observe(chip);
    });
    this._pulseFilmAdvance();
  }

  _pulseFilmAdvance() {
    this.el.carousel.classList.remove('film-advancing');
    void this.el.carousel.offsetWidth;
    this.el.carousel.classList.add('film-advancing');
  }

  _openFilterCatalog() {
    this.catalogCategory = this.settings.filterCategory || 'all';
    this.el.filterSearchInput.value = this.catalogQuery;
    this._buildCategoryBars();
    this._renderCatalogGrid();
    this.el.filtersModal.classList.remove('hidden');
  }

  _renderCatalogGrid() {
    this.catalogObserver.disconnect();
    this.visibleCatalogCards.clear();
    this.el.catalogGrid.innerHTML = '';

    const list = this._getFiltersFor(this.catalogCategory, this.catalogQuery);
    this.el.filtersModalSub.textContent = `${list.length} of ${RETRO_FILTERS.length} retro & modern filters`;

    const frag = document.createDocumentFragment();
    for (const filter of list) {
      const card = document.createElement('div');
      card.className = `catalog-card${filter.id === this.settings.filterId ? ' active' : ''}`;
      card.dataset.filterId = filter.id;
      card.setAttribute('role', 'button');
      card.tabIndex = 0;

      const isFav = this._isFilterFavorite(filter.id);
      card.innerHTML = `
        <div class="filter-thumb-wrap">
          <canvas class="filter-thumb-canvas" width="96" height="64"></canvas>
          <span class="filter-thumb-badge">${filter.badge}</span>
        </div>
        <div class="catalog-card-foot">
          <div class="catalog-card-title">
            <span class="filter-name">${filter.name}</span>
            <span class="catalog-card-sub">${filter.subtitle}</span>
          </div>
          <button type="button" class="fav-star-btn${isFav ? ' active' : ''}" aria-label="Favorite ${filter.name}">${isFav ? '★' : '☆'}</button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-star-btn')) {
          e.stopPropagation();
          this._toggleFilterFavorite(filter.id);
          const starBtn = card.querySelector('.fav-star-btn');
          const nowFav = this._isFilterFavorite(filter.id);
          starBtn.textContent = nowFav ? '★' : '☆';
          starBtn.classList.toggle('active', nowFav);
          return;
        }
        this.selectFilter(filter.id);
        this.el.filtersModal.classList.add('hidden');
        const activeChip = this.el.carousel.querySelector(`[data-filter-id="${filter.id}"]`);
        activeChip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });

      frag.appendChild(card);
    }

    this.el.catalogGrid.appendChild(frag);
    this.el.catalogGrid.querySelectorAll('.catalog-card').forEach((card) => {
      this.catalogObserver.observe(card);
    });
  }

  _bindEvents() {
    this.el.btnAspect.addEventListener('click', () => this._cycleAspect());
    this.el.btnFlash.addEventListener('click', () => this._toggleFlash());
    this.el.btnTimer.addEventListener('click', () => this._cycleTimer());
    this.el.btnGrid.addEventListener('click', () => {
      this.settings.gridEnabled = !this.settings.gridEnabled;
      this._persistSettings();
      this._syncUI();
    });

    this.el.btnLab.addEventListener('click', () => this._openLab());
    this.el.btnCloseLab.addEventListener('click', () => this.el.labModal.classList.add('hidden'));
    this.el.labModal.addEventListener('click', (e) => {
      if (e.target === this.el.labModal) this.el.labModal.classList.add('hidden');
    });

    this.el.btnStartCam.addEventListener('click', () => this._initCamera(true));
    this.el.btnStandbyImport.addEventListener('click', () => this.el.fileInput.click());
    this.el.btnImport.addEventListener('click', () => this.el.fileInput.click());
    this.el.btnReturnLive.addEventListener('click', () => this._clearImportedImage());

    this.el.fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this._loadImportedFile(file);
      e.target.value = '';
    });

    this.el.zoomSlider.addEventListener('input', (e) => {
      this.zoom = parseFloat(e.target.value);
      this.el.zoomVal.textContent = `${this.zoom.toFixed(1)}×`;
    });

    this.el.evSlider.addEventListener('input', (e) => {
      this.settings.exposure = parseFloat(e.target.value);
      this.el.evVal.textContent = (this.settings.exposure >= 0 ? '+' : '') + this.settings.exposure.toFixed(1);
      this._persistSettings();
    });

    this.el.canvas.addEventListener('click', (e) => this._handleTapFocus(e));

    this.el.btnShutter.addEventListener('click', () => this._triggerShutter());
    this.el.btnFlip.addEventListener('click', () => this._flipCamera());
    this.el.btnLeakCycle.addEventListener('click', () => this._cycleLightLeak());

    this.el.btnBrowseFilters.addEventListener('click', () => this._openFilterCatalog());
    this.el.btnFilmPrev.addEventListener('click', () => {
      this.el.carousel.scrollBy({ left: -280, behavior: 'smooth' });
    });
    this.el.btnFilmNext.addEventListener('click', () => {
      this.el.carousel.scrollBy({ left: 280, behavior: 'smooth' });
    });
    this.el.btnCloseFilters.addEventListener('click', () => this.el.filtersModal.classList.add('hidden'));
    this.el.filtersModal.addEventListener('click', (e) => {
      if (e.target === this.el.filtersModal) this.el.filtersModal.classList.add('hidden');
    });
    this.el.filterSearchInput.addEventListener('input', (e) => {
      this.catalogQuery = e.target.value;
      this._renderCatalogGrid();
    });

    // Keyboard shutter support (Spacebar when no modal open)
    window.addEventListener('keydown', (e) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        this.el.a2hsPopup.classList.contains('hidden') &&
        this.el.labModal.classList.contains('hidden') &&
        this.el.filtersModal.classList.contains('hidden') &&
        this.el.galleryModal.classList.contains('hidden') &&
        this.el.lightboxModal.classList.contains('hidden')
      ) {
        e.preventDefault();
        this._triggerShutter();
      }
    });

    // Lab segmented controls
    this._bindSegmented(this.el.segDatestamp, (val) => {
      this.settings.dateStampMode = val;
      this._persistSettings();
      this._syncUI();
    });
    this._bindSegmented(this.el.segFrame, (val) => {
      this.settings.frameStyle = val;
      this._persistSettings();
      this._syncUI();
    });
    this._bindSegmented(this.el.segLeak, (val) => {
      this.settings.lightLeakMode = Number(val);
      this.activeLeakSeed = Math.random() * 10 + 1;
      this.resolvedRandomLeak = Math.floor(Math.random() * 3) + 1;
      this._persistSettings();
      this._syncUI();
    });

    this.el.grainSlider.addEventListener('input', (e) => {
      this.settings.grainIntensity = parseFloat(e.target.value);
      this._persistSettings();
      this._syncUI();
    });
    this.el.vignetteSlider.addEventListener('input', (e) => {
      this.settings.vignetteIntensity = parseFloat(e.target.value);
      this._persistSettings();
      this._syncUI();
    });
    this.el.leakSlider.addEventListener('input', (e) => {
      this.settings.lightLeakIntensity = parseFloat(e.target.value);
      this._persistSettings();
      this._syncUI();
    });

    this.el.btnAutosaveToggle.addEventListener('click', () => {
      this.settings.autoSaveDevice = !this.settings.autoSaveDevice;
      this._persistSettings();
      this._syncUI();
    });

    this.el.btnSoundToggle.addEventListener('click', () => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      this._persistSettings();
      this._syncUI();
    });

    this.el.btnNewRoll.addEventListener('click', () => {
      this.settings.rollNumber += 1;
      this.settings.rollCounter = 1;
      this._persistSettings();
      this._syncUI();
      this._showToast(`Loaded Film Roll #${String(this.settings.rollNumber).padStart(2, '0')}`);
    });

    // Gallery modal
    this.el.btnGallery.addEventListener('click', () => this._openGallery());
    this.el.btnCloseGallery.addEventListener('click', () => this.el.galleryModal.classList.add('hidden'));
    this.el.galleryModal.addEventListener('click', (e) => {
      if (e.target === this.el.galleryModal) this.el.galleryModal.classList.add('hidden');
    });
    this.el.btnFilterFav.addEventListener('click', () => {
      this.galleryFavOnly = !this.galleryFavOnly;
      this.el.btnFilterFav.classList.toggle('active', this.galleryFavOnly);
      this._renderGalleryGrid();
    });
    this.el.btnClearRoll.addEventListener('click', async () => {
      if (!this.photos.length) return;
      if (confirm('Delete all photos from local Film Roll storage?')) {
        await photoStore.clearAll();
        await this._refreshGallery();
        this._showToast('Film roll cleared');
      }
    });

    // Lightbox modal
    this.el.btnCloseLightbox.addEventListener('click', () => this.el.lightboxModal.classList.add('hidden'));
    this.el.lightboxModal.addEventListener('click', (e) => {
      if (e.target === this.el.lightboxModal) this.el.lightboxModal.classList.add('hidden');
    });
    this.el.lightboxCaption.addEventListener('change', async () => {
      if (!this.activePhotoId) return;
      await photoStore.updatePhotoMeta(this.activePhotoId, {
        caption: this.el.lightboxCaption.value.trim(),
      });
      await this._refreshGallery();
    });
    this.el.btnLbFav.addEventListener('click', async () => {
      const photo = this.photos.find((p) => p.id === this.activePhotoId);
      if (!photo) return;
      const nextFav = !photo.favorite;
      await photoStore.updatePhotoMeta(photo.id, { favorite: nextFav });
      await this._refreshGallery();
      this._updateLightboxFavButton(nextFav);
    });
    this.el.btnLbDownload.addEventListener('click', () => this._downloadActivePhoto());
    this.el.btnLbShare.addEventListener('click', () => this._shareActivePhoto());
    this.el.btnLbDelete.addEventListener('click', async () => {
      if (!this.activePhotoId) return;
      await photoStore.deletePhoto(this.activePhotoId);
      this.el.lightboxModal.classList.add('hidden');
      await this._refreshGallery();
      this._showToast('Frame deleted');
    });

    // PWA Install Prompt & First-Visit Add to Home Screen Popup
    const A2HS_KEY = 'scamera.a2hsPrompted.v1';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

    const updateA2hsCopy = () => {
      if (this.deferredPrompt) {
        this.el.a2hsInstructions.textContent =
          'Install sCamera on your home screen for full-screen viewfinder mode, offline filters, and local gallery access.';
        this.el.btnA2hsInstall.textContent = 'Add to Home Screen';
      } else if (isIOS) {
        this.el.a2hsInstructions.innerHTML =
          'On iPhone/iPad Safari, tap the <strong>Share (↑)</strong> button at the bottom and choose <strong>Add to Home Screen</strong>.';
        this.el.btnA2hsInstall.textContent = 'Got It';
      } else {
        this.el.a2hsInstructions.textContent =
          'To add sCamera as an app, tap your browser menu (⋮) or Install icon (⊕) and select "Install app" or "Add to Home Screen".';
        this.el.btnA2hsInstall.textContent = 'Got It';
      }
    };

    const dismissA2hs = () => {
      try {
        localStorage.setItem(A2HS_KEY, '1');
      } catch {
        // ignore storage errors
      }
      this.el.a2hsPopup.classList.add('hidden');
    };

    const triggerNativeInstall = async () => {
      if (!this.deferredPrompt) {
        dismissA2hs();
        return;
      }
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.el.btnInstall.classList.add('hidden');
      }
      this.deferredPrompt = null;
      dismissA2hs();
    };

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.el.btnInstall.classList.remove('hidden');
      updateA2hsCopy();
    });

    this.el.btnInstall.addEventListener('click', triggerNativeInstall);
    this.el.btnA2hsInstall.addEventListener('click', triggerNativeInstall);
    this.el.btnA2hsDismiss.addEventListener('click', dismissA2hs);
    this.el.btnA2hsClose.addEventListener('click', dismissA2hs);
    this.el.a2hsPopup.addEventListener('click', (e) => {
      if (e.target === this.el.a2hsPopup) dismissA2hs();
    });

    window.addEventListener('appinstalled', () => {
      this.el.btnInstall.classList.add('hidden');
      dismissA2hs();
      this._showToast('sCamera installed as PWA');
    });

    if (isIOS && !isStandalone) {
      this.el.iosTip.classList.remove('hidden');
    }

    // Show Add to Home Screen popup automatically on very first visit
    let alreadyPrompted = false;
    try {
      alreadyPrompted = Boolean(localStorage.getItem(A2HS_KEY));
    } catch {
      alreadyPrompted = false;
    }
    if (!isStandalone && !alreadyPrompted) {
      setTimeout(() => {
        if (!this.el.labModal.classList.contains('hidden')) return;
        updateA2hsCopy();
        this.el.a2hsPopup.classList.remove('hidden');
      }, 900);
    }

    // Resize canvas resolution smoothly
    window.addEventListener('resize', () => this._resizeCanvas());
  }

  _bindSegmented(container, onSelect) {
    container.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => onSelect(btn.dataset.value));
    });
  }

  _persistSettings() {
    saveSettings(this.settings);
  }

  selectFilter(id) {
    this.settings.filterId = id;
    if (this.settings.soundEnabled) shutterAudio.playDialClick();
    this._persistSettings();
    this._syncUI();
    const chip = this.el.carousel.querySelector(`[data-filter-id="${id}"]`);
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  _cycleAspect() {
    const keys = Object.keys(ASPECT_RATIOS);
    const idx = keys.indexOf(this.settings.aspectRatio);
    this.settings.aspectRatio = keys[(idx + 1) % keys.length];
    this._persistSettings();
    this._syncUI();
  }

  _toggleFlash() {
    this.flashMode = this.flashMode === 'off' ? 'on' : 'off';
    if (this.torchSupported && this.videoTrack) {
      this.videoTrack.applyConstraints({ advanced: [{ torch: this.flashMode === 'on' }] }).catch(() => {});
    }
    this._syncUI();
  }

  _cycleTimer() {
    const order = [0, 3, 10];
    const idx = order.indexOf(this.settings.timerSeconds);
    this.settings.timerSeconds = order[(idx + 1) % order.length];
    this._persistSettings();
    this._syncUI();
  }

  _cycleLightLeak() {
    this.settings.lightLeakMode = (this.settings.lightLeakMode + 1) % LEAK_MODES.length;
    this.activeLeakSeed = Math.random() * 10 + 1;
    this.resolvedRandomLeak = Math.floor(Math.random() * 3) + 1;
    this._persistSettings();
    this._syncUI();
  }

  _syncUI() {
    const filter = getFilterById(this.settings.filterId);

    // Top plate
    this.el.rollCounter.textContent =
      `R${String(this.settings.rollNumber).padStart(2, '0')} • EXP ${String(this.settings.rollCounter).padStart(3, '0')}`;
    this.el.btnAspect.textContent = this.settings.aspectRatio;
    this.el.btnFlash.textContent = this.flashMode === 'on' ? '⚡ ON' : '⚡ OFF';
    this.el.btnFlash.classList.toggle('active', this.flashMode === 'on');
    this.el.btnTimer.textContent = this.settings.timerSeconds ? `⏱ ${this.settings.timerSeconds}s` : '⏱ OFF';
    this.el.btnTimer.classList.toggle('active', this.settings.timerSeconds > 0);
    this.el.btnGrid.classList.toggle('active', this.settings.gridEnabled);
    this.el.vfGrid.classList.toggle('hidden', !this.settings.gridEnabled);

    // Stage ratio class
    this.el.stage.className = `viewfinder-stage ratio-${this.settings.aspectRatio.replace(':', '-')}`;
    this._resizeCanvas();

    // HUD chips
    this.el.hudFilter.textContent = filter.name;
    this.el.hudFrame.textContent = this.settings.frameStyle.toUpperCase();
    this.el.hudFrame.classList.toggle('hidden', this.settings.frameStyle === 'none');
    const leakMeta = LEAK_MODES.find((m) => m.value === this.settings.lightLeakMode) || LEAK_MODES[0];
    this.el.hudLeak.textContent = `LEAK: ${leakMeta.label}`;
    this.el.hudLeak.classList.toggle('hidden', this.settings.lightLeakMode === 0);
    this.el.leakBtnLabel.textContent = `LEAK: ${leakMeta.label}`;

    // Date stamp preview
    const stamp = formatDateStamp(this.settings.dateStampMode);
    this.el.vfDateStamp.textContent = stamp;
    this.el.vfDateStamp.classList.toggle('hidden', !stamp);

    // Sliders
    this.el.evSlider.value = this.settings.exposure;
    this.el.evVal.textContent = (this.settings.exposure >= 0 ? '+' : '') + Number(this.settings.exposure).toFixed(1);
    this.el.grainSlider.value = this.settings.grainIntensity;
    this.el.grainVal.textContent = `${Math.round(this.settings.grainIntensity * 100)}%`;
    this.el.vignetteSlider.value = this.settings.vignetteIntensity;
    this.el.vignetteVal.textContent = `${Math.round(this.settings.vignetteIntensity * 100)}%`;
    this.el.leakSlider.value = this.settings.lightLeakIntensity;
    this.el.leakVal.textContent = `${Math.round(this.settings.lightLeakIntensity * 100)}%`;

    // Auto-save & Sound toggles
    this.el.btnAutosaveToggle.textContent = this.settings.autoSaveDevice ? 'ON' : 'OFF';
    this.el.btnAutosaveToggle.classList.toggle('active', this.settings.autoSaveDevice);
    this.el.btnSoundToggle.textContent = this.settings.soundEnabled ? 'ON' : 'OFF';
    this.el.btnSoundToggle.classList.toggle('active', this.settings.soundEnabled);

    // Segmented active states
    this._markSegmented(this.el.segDatestamp, this.settings.dateStampMode);
    this._markSegmented(this.el.segFrame, this.settings.frameStyle);
    this._markSegmented(this.el.segLeak, String(this.settings.lightLeakMode));

    // Carousel active chip
    this.el.carousel.querySelectorAll('.filter-chip').forEach((chip) => {
      const active = chip.dataset.filterId === filter.id;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-selected', String(active));
    });
  }

  _markSegmented(container, value) {
    container.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.value === value);
    });
  }

  _resizeCanvas() {
    const rect = this.el.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.round(rect.width * dpr));
    const h = Math.max(240, Math.round(rect.height * dpr));
    if (this.el.canvas.width !== w || this.el.canvas.height !== h) {
      this.el.canvas.width = w;
      this.el.canvas.height = h;
    }
  }

  async _initCamera(userTriggered = false) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.el.standbyMsg.textContent =
        'Camera API is unavailable in this browser/context. Import a photo to apply retro filters.';
      this.el.standby.classList.remove('hidden');
      return;
    }

    this._stopStream();
    try {
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: this.settings.facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.el.video.srcObject = this.stream;
      await this.el.video.play();

      this.videoTrack = this.stream.getVideoTracks()[0] || null;
      const caps = this.videoTrack?.getCapabilities ? this.videoTrack.getCapabilities() : {};
      this.torchSupported = Boolean(caps.torch);

      if (!this.importedImage) {
        this.el.standby.classList.add('hidden');
      }
      this._resizeCanvas();
      setTimeout(() => this._refreshVisiblePreviews(), 250);
    } catch (err) {
      if (userTriggered) {
        this._showToast('Camera permission denied or no webcam found');
      }
      this.el.standbyMsg.textContent =
        'No live camera active. Allow camera permission or import any photo to use all retro filters.';
      if (!this.importedImage) {
        this.el.standby.classList.remove('hidden');
      }
    }
  }

  _stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.videoTrack = null;
    }
  }

  async _flipCamera() {
    this.settings.facingMode = this.settings.facingMode === 'environment' ? 'user' : 'environment';
    this._persistSettings();
    await this._initCamera(true);
  }

  _loadImportedFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      this.importedImage = img;
      this.el.standby.classList.add('hidden');
      this.el.importedBanner.classList.remove('hidden');
      this._resizeCanvas();
      this._refreshVisiblePreviews();
      this._showToast('Photo loaded — pick a film stock & press shutter');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      this._showToast('Could not read selected image');
    };
    img.src = url;
  }

  _clearImportedImage() {
    this.importedImage = null;
    this.el.importedBanner.classList.add('hidden');
    if (!this.stream) {
      this.el.standby.classList.remove('hidden');
    }
    this._refreshVisiblePreviews();
  }

  _handleTapFocus(e) {
    const rect = this.el.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    this.el.focusReticle.style.left = `${x}%`;
    this.el.focusReticle.style.top = `${y}%`;
    this.el.focusReticle.classList.remove('active');
    void this.el.focusReticle.offsetWidth;
    this.el.focusReticle.classList.add('active');
    clearTimeout(this._focusTimeout);
    this._focusTimeout = setTimeout(() => {
      this.el.focusReticle.classList.remove('active');
    }, 900);
  }

  _getCurrentSource() {
    if (this.importedImage) {
      return {
        source: this.importedImage,
        width: this.importedImage.naturalWidth,
        height: this.importedImage.naturalHeight,
        mirror: false,
      };
    }
    if (this.stream && this.el.video.readyState >= 2 && this.el.video.videoWidth > 0) {
      return {
        source: this.el.video,
        width: this.el.video.videoWidth,
        height: this.el.video.videoHeight,
        mirror: this.settings.facingMode === 'user',
      };
    }
    return null;
  }

  _getEffectiveLeakMode() {
    if (this.settings.lightLeakMode === 4) {
      return this.resolvedRandomLeak;
    }
    return this.settings.lightLeakMode;
  }

  _startRenderLoop() {
    let lastThumbRefresh = 0;
    const loop = (now) => {
      const src = this._getCurrentSource();
      if (src) {
        this.renderer.render(src.source, src.width, src.height, {
          filter: getFilterById(this.settings.filterId),
          exposure: this.settings.exposure,
          zoom: this.zoom,
          mirror: src.mirror,
          grainIntensity: this.settings.grainIntensity,
          vignetteIntensity: this.settings.vignetteIntensity,
          lightLeakMode: this._getEffectiveLeakMode(),
          lightLeakIntensity: this.settings.lightLeakIntensity,
          lightLeakSeed: this.activeLeakSeed,
          time: now * 0.001,
        });
        if (!this.importedImage && now - lastThumbRefresh > 450) {
          lastThumbRefresh = now;
          this._refreshVisiblePreviews();
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  async _triggerShutter() {
    if (this.isCapturing) return;
    const src = this._getCurrentSource();
    if (!src) {
      this._showToast('Enable camera or import a photo first');
      return;
    }

    if (this.settings.timerSeconds > 0) {
      await this._runCountdown(this.settings.timerSeconds);
    }

    await this._captureFrame();
  }

  _runCountdown(seconds) {
    this.isCapturing = true;
    return new Promise((resolve) => {
      let remaining = seconds;
      this.el.timerCountdown.textContent = remaining;
      this.el.timerCountdown.classList.remove('hidden');
      if (this.settings.soundEnabled) shutterAudio.playBeep(false);

      const tick = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(tick);
          this.el.timerCountdown.classList.add('hidden');
          if (this.settings.soundEnabled) shutterAudio.playBeep(true);
          this.isCapturing = false;
          resolve();
        } else {
          this.el.timerCountdown.textContent = remaining;
          if (this.settings.soundEnabled) shutterAudio.playBeep(false);
        }
      }, 1000);
    });
  }

  async _captureFrame() {
    const src = this._getCurrentSource();
    if (!src) return;
    this.isCapturing = true;

    try {
      // Screen flash if front cam or flash ON without hardware torch
      if (this.flashMode === 'on' && (!this.torchSupported || this.settings.facingMode === 'user')) {
        this.el.flashOverlay.classList.add('firing');
        await new Promise((r) => setTimeout(r, 140));
      }

      if (this.settings.soundEnabled) {
        shutterAudio.playShutter();
      }
      this.el.shutterCurtain.classList.add('snap');
      setTimeout(() => this.el.shutterCurtain.classList.remove('snap'), 130);

      const filter = getFilterById(this.settings.filterId);
      const leakMode = this.settings.lightLeakMode === 4
        ? Math.floor(Math.random() * 3) + 1
        : this.settings.lightLeakMode;
      const leakSeed = this.settings.lightLeakMode === 4
        ? Math.random() * 20 + 1
        : this.activeLeakSeed;

      const frameNumber = this.settings.rollCounter;
      const { blob, thumbBlob, width, height } = await composeShot({
        source: src.source,
        sourceWidth: src.width,
        sourceHeight: src.height,
        aspectRatio: this.settings.aspectRatio,
        filter,
        exposure: this.settings.exposure,
        zoom: this.zoom,
        mirror: src.mirror,
        grainIntensity: this.settings.grainIntensity,
        vignetteIntensity: this.settings.vignetteIntensity,
        lightLeakMode: leakMode,
        lightLeakIntensity: this.settings.lightLeakIntensity,
        lightLeakSeed: leakSeed,
        dateStampMode: this.settings.dateStampMode,
        frameStyle: this.settings.frameStyle,
        frameNumber,
      });

      const id = `shot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await photoStore.savePhoto({
        blob,
        thumbBlob,
        meta: {
          id,
          createdAt: Date.now(),
          filterId: filter.id,
          filterName: filter.name,
          frameNumber,
          width,
          height,
          caption: '',
          favorite: false,
        },
      });

      this.settings.rollCounter += 1;
      if (this.settings.lightLeakMode === 4) {
        this.activeLeakSeed = Math.random() * 10 + 1;
        this.resolvedRandomLeak = Math.floor(Math.random() * 3) + 1;
      }
      this._persistSettings();
      this._syncUI();
      await this._refreshGallery();

      const filename = `sCamera_${filter.id}_EXP${String(frameNumber).padStart(3, '0')}.jpg`;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (this.settings.autoSaveDevice && !isIOS) {
        this._downloadBlob(blob, filename);
        this._showToast(`Saved ${filter.name} to Gallery & Device`);
      } else {
        this._showToast(`Saved ${filter.name} • EXP ${String(frameNumber).padStart(3, '0')}`);
      }
    } catch (err) {
      console.error('Capture error:', err);
      this._showToast('Failed to develop shot');
    } finally {
      this.el.flashOverlay.classList.remove('firing');
      this.isCapturing = false;
    }
  }

  async _openLab() {
    const summary = await photoStore.getStorageSummary();
    const mb = (summary.photosBytes / (1024 * 1024)).toFixed(2);
    this.el.storageSummary.textContent = `${summary.count} photos • ${mb} MB stored locally`;
    this.el.labModal.classList.remove('hidden');
  }

  async _refreshGallery() {
    const photos = await photoStore.listPhotos();
    this.objectUrls.forEach((u) => URL.revokeObjectURL(u));
    this.objectUrls = [];
    this.photos = photos;
    this.el.galleryBadge.textContent = String(this.photos.length);
    this.el.galleryCountSub.textContent = `${this.photos.length} developed shot${this.photos.length === 1 ? '' : 's'}`;

    if (this.photos.length > 0) {
      const latest = this.photos[0];
      const url = latest.thumbBlob ? URL.createObjectURL(latest.thumbBlob) : latest.thumbUrl;
      if (latest.thumbBlob) this.objectUrls.push(url);
      this.el.galleryThumbImg.src = url;
      this.el.galleryThumbImg.classList.remove('hidden');
      this.el.galleryEmptyIcon.classList.add('hidden');
    } else {
      this.el.galleryThumbImg.classList.add('hidden');
      this.el.galleryEmptyIcon.classList.remove('hidden');
    }

    if (!this.el.galleryModal.classList.contains('hidden')) {
      this._renderGalleryGrid();
    }
  }

  _openGallery() {
    this._renderGalleryGrid();
    this.el.galleryModal.classList.remove('hidden');
  }

  _renderGalleryGrid() {
    const list = this.galleryFavOnly ? this.photos.filter((p) => p.favorite) : this.photos;
    this.el.galleryGrid.innerHTML = '';
    this.el.galleryEmpty.classList.toggle('hidden', list.length > 0);

    for (const item of list) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-item';
      const url = item.thumbBlob ? URL.createObjectURL(item.thumbBlob) : item.thumbUrl;
      if (item.thumbBlob) this.objectUrls.push(url);

      btn.innerHTML = `
        <img src="${url}" alt="${item.filterName} exposure ${item.frameNumber}" loading="lazy">
        ${item.favorite ? '<span class="gallery-fav-star">★</span>' : ''}
        <div class="gallery-item-meta">
          <span>${item.filterName}</span>
          <span>#${String(item.frameNumber).padStart(3, '0')}</span>
        </div>
      `;
      btn.addEventListener('click', () => this._openLightbox(item.id));
      this.el.galleryGrid.appendChild(btn);
    }
  }

  async _openLightbox(id) {
    const full = await photoStore.getPhoto(id);
    if (!full) return;
    this.activePhotoId = id;

    if (this._activeLightboxUrl) URL.revokeObjectURL(this._activeLightboxUrl);
    this._activeLightboxUrl = URL.createObjectURL(full.blob);

    this.el.lightboxImg.src = this._activeLightboxUrl;
    this.el.lightboxMeta.textContent = `${full.filterName} • EXP ${String(full.frameNumber).padStart(3, '0')}`;
    const dt = new Date(full.createdAt).toLocaleString();
    this.el.lightboxSub.textContent = `${full.width} × ${full.height} • ${dt}`;
    this.el.lightboxCaption.value = full.caption || '';
    this._updateLightboxFavButton(full.favorite);
    this.el.btnLbShare.classList.toggle('hidden', !navigator.share);
    this.el.lightboxModal.classList.remove('hidden');
  }

  _updateLightboxFavButton(fav) {
    this.el.btnLbFav.textContent = fav ? '★ FAVORITED' : '☆ FAVORITE';
    this.el.btnLbFav.classList.toggle('active', fav);
  }

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async _downloadActivePhoto() {
    if (!this.activePhotoId) return;
    const full = await photoStore.getPhoto(this.activePhotoId);
    if (!full) return;
    const filename = `sCamera_${full.filterId}_EXP${String(full.frameNumber).padStart(3, '0')}.jpg`;
    this._downloadBlob(full.blob, filename);
  }

  async _shareActivePhoto() {
    if (!this.activePhotoId || !navigator.share) return;
    const full = await photoStore.getPhoto(this.activePhotoId);
    if (!full) return;
    const file = new File(
      [full.blob],
      `sCamera_${full.filterId}_EXP${String(full.frameNumber).padStart(3, '0')}.jpg`,
      { type: 'image/jpeg' }
    );
    try {
      await navigator.share({
        title: `sCamera — ${full.filterName}`,
        text: full.caption || `Shot on sCamera (${full.filterName})`,
        files: [file],
      });
    } catch {
      // user cancelled share
    }
  }

  _showToast(msg) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.remove('hidden');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.el.toast.classList.add('hidden');
    }, 2200);
  }

  async _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      reg.update().catch(() => {});
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.sCamera = new RetroCameraApp();
});
