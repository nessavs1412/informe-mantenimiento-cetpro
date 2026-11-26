document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'cetpro_jo_informe_mantenimiento_v1';

  // Cargar estado guardado
  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  let state = loadState();

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  };

  // Notificación Toast
  const toastEl = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
  };

  // 1. TEMA CLARO / OSCURO
  const htmlEl = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const applyTheme = (theme) => {
    htmlEl.setAttribute('data-theme', theme);
    state.theme = theme;
    saveState();
  };
  if (state.theme) htmlEl.setAttribute('data-theme', state.theme);
  themeBtn.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // 2. MENÚ MÓVIL
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
  mainNav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // 3. BARRA DE LECTURA Y BOTÓN VOLVER ARRIBA
  const readingBar = document.getElementById('reading-progress-bar');
  const backToTopBtn = document.getElementById('btn-back-to-top');
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    readingBar.style.width = `${pct}%`;
    backToTopBtn.hidden = scrollTop < 350;
  });
  backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // 4. PORTADA Y FIRMAS SINCRONIZADAS
  const inputEstudiante = document.getElementById('input-estudiante');
  const inputFecha = document.getElementById('input-fecha');
  const firmaEstudiante = document.getElementById('firma-estudiante');
  const firmaFecha = document.getElementById('firma-fecha');

  const syncCover = () => {
    firmaEstudiante.textContent = inputEstudiante.value.trim() || 'Sin especificar';
    firmaFecha.textContent = inputFecha.value || 'Sin especificar';
  };

  if (state.estudiante) inputEstudiante.value = state.estudiante;
  if (state.fecha) inputFecha.value = state.fecha;
  syncCover();

  inputEstudiante.addEventListener('input', () => {
    state.estudiante = inputEstudiante.value;
    syncCover();
    saveState();
  });
  inputFecha.addEventListener('change', () => {
    state.fecha = inputFecha.value;
    syncCover();
    saveState();
  });

  // 5. ACORDEONES
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  const setAccordion = (trigger, expand) => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    trigger.setAttribute('aria-expanded', expand);
    panel.hidden = !expand;
  };
  accordionTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      setAccordion(btn, !expanded);
    });
  });
  document.getElementById('btn-expand-all').addEventListener('click', () => {
    accordionTriggers.forEach((btn) => setAccordion(btn, true));
  });
  document.getElementById('btn-collapse-all').addEventListener('click', () => {
    accordionTriggers.forEach((btn) => setAccordion(btn, false));
  });

  // 6. CHECKLISTS (PASOS + PRUEBAS) Y PROGRESO GLOBAL
  const stepCheckboxes = document.querySelectorAll('.step-checkbox');
  const testCheckboxes = document.querySelectorAll('.test-checkbox');
  const allCheckboxes = [...stepCheckboxes, ...testCheckboxes];

  if (state.checks) {
    allCheckboxes.forEach((cb) => {
      if (state.checks[cb.id]) cb.checked = true;
    });
  }

  const updateProgress = () => {
    // Por componente
    const groups = [...new Set([...stepCheckboxes].map((cb) => cb.dataset.group))];
    groups.forEach((group) => {
      const groupCbs = document.querySelectorAll(`.step-checkbox[data-group="${group}"]`);
      const checked = [...groupCbs].filter((c) => c.checked).length;
      const total = groupCbs.length;
      const pct = total ? Math.round((checked / total) * 100) : 0;

      const label = document.querySelector(`[data-progress-label="${group}"]`);
      const bar = document.querySelector(`[data-progress-bar="${group}"]`);
      if (label) {
        label.textContent = `${checked}/${total}`;
        label.classList.toggle('is-complete', checked === total);
      }
      if (bar) bar.style.width = `${pct}%`;
    });

    // Pruebas de funcionamiento
    const testsChecked = [...testCheckboxes].filter((c) => c.checked).length;
    const testsTotal = testCheckboxes.length;
    const testsPct = testsTotal ? Math.round((testsChecked / testsTotal) * 100) : 0;
    const testsLabel = document.getElementById('tests-progress-label');
    testsLabel.textContent = `${testsChecked}/${testsTotal} (${testsPct}%)`;
    testsLabel.classList.toggle('is-complete', testsChecked === testsTotal);
    document.getElementById('tests-progress-bar').style.width = `${testsPct}%`;

    // Global
    const totalChecked = allCheckboxes.filter((c) => c.checked).length;
    const totalAll = allCheckboxes.length;
    const globalPct = totalAll ? Math.round((totalChecked / totalAll) * 100) : 0;
    document.getElementById('header-progress-pct').textContent = `${globalPct}%`;
    document.getElementById('global-progress-text').textContent = `${totalChecked} de ${totalAll} verificaciones (${globalPct}%)`;
    document.getElementById('global-progress-bar').style.width = `${globalPct}%`;
  };

  allCheckboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      state.checks = state.checks || {};
      state.checks[cb.id] = cb.checked;
      saveState();
      updateProgress();
    });
  });
  updateProgress();

  // 7. CUADRO DE CONTROL
  const statusSelects = document.querySelectorAll('[data-control-status]');
  const noteInputs = document.querySelectorAll('[data-control-note]');

  const styleSelect = (sel) => {
    sel.classList.remove('status-bueno', 'status-regular', 'status-malo');
    if (sel.value === 'Bueno') sel.classList.add('status-bueno');
    if (sel.value === 'Regular') sel.classList.add('status-regular');
    if (sel.value === 'Malo') sel.classList.add('status-malo');
  };

  statusSelects.forEach((sel) => {
    const key = sel.dataset.controlStatus;
    if (state.control?.[key]?.status) sel.value = state.control[key].status;
    styleSelect(sel);
    sel.addEventListener('change', () => {
      styleSelect(sel);
      state.control = state.control || {};
      state.control[key] = { ...(state.control[key] || {}), status: sel.value };
      saveState();
    });
  });

  noteInputs.forEach((inp) => {
    const key = inp.dataset.controlNote;
    if (state.control?.[key]?.note) inp.value = state.control[key].note;
    inp.addEventListener('input', () => {
      state.control = state.control || {};
      state.control[key] = { ...(state.control[key] || {}), note: inp.value };
      saveState();
    });
  });

  document.getElementById('btn-clear-table').addEventListener('click', () => {
    if (!confirm('¿Limpiar todos los registros del cuadro de control?')) return;
    statusSelects.forEach((s) => { s.value = 'Sin revisar'; styleSelect(s); });
    noteInputs.forEach((i) => { i.value = ''; });
    state.control = {};
    saveState();
    showToast('Cuadro de control limpiado');
  });

  // 8. EVIDENCIAS FOTOGRÁFICAS Y LIGHTBOX
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  const closeLightbox = () => { lightbox.hidden = true; };
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);

  document.querySelectorAll('.evidence-card').forEach((card) => {
    const slot = card.dataset.photoSlot;
    const fileInput = card.querySelector('.photo-file-input');
    const previewImg = card.querySelector('.photo-preview');
    const placeholder = card.querySelector('.photo-placeholder');
    const zoomBtn = card.querySelector('.photo-zoom-btn');
    const removeBtn = card.querySelector('.photo-remove-btn');
    const stageSelect = card.querySelector('.photo-stage');
    const descInput = card.querySelector('.photo-desc');

    if (state.photos?.[slot]?.stage) stageSelect.value = state.photos[slot].stage;
    if (state.photos?.[slot]?.desc) descInput.value = state.photos[slot].desc;

    stageSelect.addEventListener('change', () => {
      state.photos = state.photos || {};
      state.photos[slot] = { ...(state.photos[slot] || {}), stage: stageSelect.value };
      saveState();
    });
    descInput.addEventListener('input', () => {
      state.photos = state.photos || {};
      state.photos[slot] = { ...(state.photos[slot] || {}), desc: descInput.value };
      saveState();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImg.src = ev.target.result;
        previewImg.hidden = false;
        placeholder.hidden = true;
        zoomBtn.hidden = false;
        removeBtn.hidden = false;
      };
      reader.readAsDataURL(file);
    });

    const openZoom = () => {
      if (previewImg.hidden) return;
      lightboxImg.src = previewImg.src;
      lightboxCaption.textContent = card.querySelector('.evidence-card__title').textContent;
      lightbox.hidden = false;
    };
    zoomBtn.addEventListener('click', openZoom);
    previewImg.addEventListener('click', openZoom);

    removeBtn.addEventListener('click', () => {
      fileInput.value = '';
      previewImg.src = '';
      previewImg.hidden = true;
      placeholder.hidden = false;
      zoomBtn.hidden = true;
      removeBtn.hidden = true;
    });
  });

  // 9. INVENTARIO
  const inventoryForm = document.getElementById('inventory-form');
  const getInventoryData = () => {
    const data = {};
    new FormData(inventoryForm).forEach((val, key) => { data[key] = val; });
    return data;
  };

  if (state.inventory) {
    Object.entries(state.inventory).forEach(([name, val]) => {
      const fields = inventoryForm.querySelectorAll(`[name="${name}"]`);
      fields.forEach((f) => {
        if (f.type === 'radio') f.checked = f.value === val;
        else f.value = val;
      });
    });
  }

  inventoryForm.addEventListener('input', () => {
    state.inventory = getInventoryData();
    saveState();
  });

  inventoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.inventory = getInventoryData();
    saveState();
    showToast('Inventario guardado localmente');
  });

  document.getElementById('btn-export-inventory').addEventListener('click', () => {
    const data = getInventoryData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario_cetpro_jesus_obrero.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo .json descargado');
  });

  document.getElementById('btn-clear-inventory').addEventListener('click', () => {
    if (!confirm('¿Borrar todos los datos del inventario?')) return;
    inventoryForm.reset();
    state.inventory = {};
    saveState();
    showToast('Inventario borrado');
  });

  // 10. IMPRIMIR Y REINICIAR TODO
  document.getElementById('btn-print').addEventListener('click', () => window.print());

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    if (!confirm('¿Seguro que deseas reiniciar todo el informe y borrar los datos guardados?')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
});
