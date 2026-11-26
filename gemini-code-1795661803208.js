/**
 * Informe Técnico de Mantenimiento Preventivo - CETPRO Jesús Obrero
 * JavaScript puro (vanilla) sin dependencias externas.
 * Gestiona persistencia en localStorage, checklists, tabla de control,
 * galería fotográfica local, inventario con validación y exportación JSON.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================================
     1. UTILIDADES SEGURAS PARA LOCALSTORAGE Y NOTIFICACIONES
     ======================================================================== */
  const STORAGE_KEYS = {
    theme: 'cetpro_theme',
    hero: 'cetpro_hero_data',
    steps: 'cetpro_steps_data',
    tests: 'cetpro_tests_data',
    control: 'cetpro_control_table',
    inventory: 'cetpro_inventory_data',
    photoMeta: 'cetpro_photo_meta'
  };

  function safeStorageGet(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('localStorage no disponible al leer:', err);
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('localStorage no disponible al guardar:', err);
      return false;
    }
  }

  function safeStorageClearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        if (key !== STORAGE_KEYS.theme) {
          window.localStorage.removeItem(key);
        }
      });
      return true;
    } catch (err) {
      console.warn('Error al limpiar localStorage:', err);
      return false;
    }
  }

  let toastTimer = null;
  const toastEl = document.getElementById('toast');

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  /* ========================================================================
     2. MODO CLARO / OSCURO
     ======================================================================== */
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    safeStorageSet(STORAGE_KEYS.theme, theme);
  }

  const savedTheme = safeStorageGet(STORAGE_KEYS.theme, 'light');
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
    });
  }

  /* ========================================================================
     3. MENÚ HAMBURGUESA, PROGRESO DE LECTURA, SCROLL-SPY Y VOLVER ARRIBA
     ======================================================================== */
  const menuToggleBtn = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const readingBar = document.getElementById('reading-progress-bar');
  const readingRole = document.querySelector('.reading-progress');
  const backToTopBtn = document.getElementById('btn-back-to-top');

  function closeMobileMenu() {
    if (!mainNav || !menuToggleBtn) return;
    mainNav.classList.remove('is-open');
    menuToggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (menuToggleBtn && mainNav) {
    menuToggleBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      menuToggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  // Progreso de lectura y botón volver arriba
  function handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

    if (readingBar && readingRole) {
      readingBar.style.width = `${pct}%`;
      readingRole.setAttribute('aria-valuenow', String(pct));
    }

    if (backToTopBtn) {
      backToTopBtn.hidden = scrollTop < 360;
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Scroll-spy para resaltar la sección activa en la barra de navegación
  const observedSections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && observedSections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
            });
          }
        });
      },
      { rootMargin: '-25% 0px -65% 0px' }
    );
    observedSections.forEach((sec) => spyObserver.observe(sec));
  }

  // Animación sutil fade-in al hacer scroll
  const fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fadeEls.forEach((el) => fadeObserver.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ========================================================================
     4. PORTADA (ESTUDIANTE Y FECHA) SINCRONIZADA CON FIRMAS
     ======================================================================== */
  const inputEstudiante = document.getElementById('input-estudiante');
  const inputFecha = document.getElementById('input-fecha');
  const firmaEstudiante = document.getElementById('firma-estudiante');
  const firmaFecha = document.getElementById('firma-fecha');

  function formatDateSpanish(isoDate) {
    if (!isoDate) return 'Sin especificar';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function syncHeroAndSignatures() {
    const estudiante = inputEstudiante ? inputEstudiante.value.trim() : '';
    const fecha = inputFecha ? inputFecha.value : '';

    if (firmaEstudiante) {
      firmaEstudiante.textContent = estudiante || 'Sin especificar';
    }
    if (firmaFecha) {
      firmaFecha.textContent = formatDateSpanish(fecha);
    }

    safeStorageSet(STORAGE_KEYS.hero, { estudiante, fecha });
  }

  // Cargar datos iniciales de portada
  const savedHero = safeStorageGet(STORAGE_KEYS.hero, {});
  if (inputEstudiante && savedHero.estudiante) {
    inputEstudiante.value = savedHero.estudiante;
  }
  if (inputFecha) {
    if (savedHero.fecha) {
      inputFecha.value = savedHero.fecha;
    } else {
      // Fecha actual por defecto si no hay fecha guardada
      const today = new Date().toISOString().split('T')[0];
      inputFecha.value = today;
    }
  }
  syncHeroAndSignatures();

  if (inputEstudiante) inputEstudiante.addEventListener('input', syncHeroAndSignatures);
  if (inputFecha) inputFecha.addEventListener('change', syncHeroAndSignatures);

  /* ========================================================================
     5. ACORDEONES Y CHECKLIST DE PROCEDIMIENTO + PRUEBAS + PROGRESO GLOBAL
     ======================================================================== */
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  const btnExpandAll = document.getElementById('btn-expand-all');
  const btnCollapseAll = document.getElementById('btn-collapse-all');

  function setAccordionState(trigger, expand) {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    trigger.setAttribute('aria-expanded', String(expand));
    if (panel) panel.hidden = !expand;
  }

  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      setAccordionState(trigger, !isExpanded);
    });
  });

  if (btnExpandAll) {
    btnExpandAll.addEventListener('click', () => {
      accordionTriggers.forEach((t) => setAccordionState(t, true));
    });
  }
  if (btnCollapseAll) {
    btnCollapseAll.addEventListener('click', () => {
      accordionTriggers.forEach((t) => setAccordionState(t, false));
    });
  }

  // Checklists de pasos y pruebas
  const stepCheckboxes = document.querySelectorAll('.step-checkbox');
  const testCheckboxes = document.querySelectorAll('.test-checkbox');
  const headerProgressPct = document.getElementById('header-progress-pct');
  const globalProgressText = document.getElementById('global-progress-text');
  const globalProgressBar = document.getElementById('global-progress-bar');
  const globalProgressRole = document.getElementById('global-progress-role');
  const testsProgressLabel = document.getElementById('tests-progress-label');
  const testsProgressBar = document.getElementById('tests-progress-bar');
  const testsProgressRole = document.getElementById('tests-progress-role');

  function updateAllProgress() {
    // 1. Progreso por componente (A - F)
    const groups = ['placa-madre', 'cpu', 'cooler', 'ram', 'hdd', 'ssd'];
    let totalSteps = 0;
    let doneSteps = 0;

    groups.forEach((group) => {
      const items = document.querySelectorAll(`.step-checkbox[data-group="${group}"]`);
      const checked = Array.from(items).filter((cb) => cb.checked).length;
      const pct = items.length > 0 ? Math.round((checked / items.length) * 100) : 0;

      totalSteps += items.length;
      doneSteps += checked;

      const labelEl = document.querySelector(`[data-progress-label="${group}"]`);
      const barEl = document.querySelector(`[data-progress-bar="${group}"]`);

      if (labelEl) {
        labelEl.textContent = `${checked}/${items.length}`;
        labelEl.classList.toggle('is-complete', checked === items.length && items.length > 0);
      }
      if (barEl) {
        barEl.style.width = `${pct}%`;
      }
    });

    // 2. Progreso de pruebas de funcionamiento
    const totalTests = testCheckboxes.length;
    const doneTests = Array.from(testCheckboxes).filter((cb) => cb.checked).length;
    const testsPct = totalTests > 0 ? Math.round((doneTests / totalTests) * 100) : 0;

    if (testsProgressLabel) {
      testsProgressLabel.textContent = `${doneTests}/${totalTests} (${testsPct}%)`;
      testsProgressLabel.classList.toggle('is-complete', doneTests === totalTests && totalTests > 0);
    }
    if (testsProgressBar && testsProgressRole) {
      testsProgressBar.style.width = `${testsPct}%`;
      testsProgressRole.setAttribute('aria-valuenow', String(testsPct));
    }

    // 3. Progreso global del informe
    const grandTotal = totalSteps + totalTests;
    const grandDone = doneSteps + doneTests;
    const grandPct = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0;

    if (headerProgressPct) headerProgressPct.textContent = `${grandPct}%`;
    if (globalProgressText) {
      globalProgressText.textContent = `${grandDone} de ${grandTotal} verificaciones (${grandPct}%)`;
    }
    if (globalProgressBar && globalProgressRole) {
      globalProgressBar.style.width = `${grandPct}%`;
      globalProgressRole.setAttribute('aria-valuenow', String(grandPct));
    }
  }

  function saveStepsState() {
    const state = {};
    stepCheckboxes.forEach((cb) => {
      state[cb.id] = cb.checked;
    });
    safeStorageSet(STORAGE_KEYS.steps, state);
  }

  function saveTestsState() {
    const state = {};
    testCheckboxes.forEach((cb) => {
      state[cb.id] = cb.checked;
    });
    safeStorageSet(STORAGE_KEYS.tests, state);
  }

  // Restaurar pasos y pruebas guardados
  const savedSteps = safeStorageGet(STORAGE_KEYS.steps, {});
  stepCheckboxes.forEach((cb) => {
    if (savedSteps[cb.id]) cb.checked = true;
    cb.addEventListener('change', () => {
      saveStepsState();
      updateAllProgress();
    });
  });

  const savedTests = safeStorageGet(STORAGE_KEYS.tests, {});
  testCheckboxes.forEach((cb) => {
    if (savedTests[cb.id]) cb.checked = true;
    cb.addEventListener('change', () => {
      saveTestsState();
      updateAllProgress();
    });
  });

  updateAllProgress();

  /* ========================================================================
     6. CUADRO DE CONTROL DEL MANTENIMIENTO (TABLA INTERACTIVA)
     ======================================================================== */
  const statusSelects = document.querySelectorAll('[data-control-status]');
  const controlNotes = document.querySelectorAll('[data-control-note]');
  const btnClearTable = document.getElementById('btn-clear-table');

  function applyStatusColor(selectEl) {
    selectEl.classList.remove('status-bueno', 'status-regular', 'status-malo');
    const val = selectEl.value;
    if (val === 'Bueno') selectEl.classList.add('status-bueno');
    else if (val === 'Regular') selectEl.classList.add('status-regular');
    else if (val === 'Malo') selectEl.classList.add('status-malo');
  }

  function saveControlTable() {
    const data = {};
    statusSelects.forEach((sel) => {
      const key = sel.getAttribute('data-control-status');
      const noteEl = document.querySelector(`[data-control-note="${key}"]`);
      data[key] = {
        status: sel.value,
        note: noteEl ? noteEl.value : ''
      };
    });
    safeStorageSet(STORAGE_KEYS.control, data);
  }

  // Restaurar tabla de control
  const savedControl = safeStorageGet(STORAGE_KEYS.control, {});
  statusSelects.forEach((sel) => {
    const key = sel.getAttribute('data-control-status');
    if (savedControl[key] && savedControl[key].status) {
      sel.value = savedControl[key].status;
    }
    applyStatusColor(sel);
    sel.addEventListener('change', () => {
      applyStatusColor(sel);
      saveControlTable();
    });
  });

  controlNotes.forEach((inp) => {
    const key = inp.getAttribute('data-control-note');
    if (savedControl[key] && typeof savedControl[key].note === 'string') {
      inp.value = savedControl[key].note;
    }
    inp.addEventListener('input', saveControlTable);
  });

  if (btnClearTable) {
    btnClearTable.addEventListener('click', () => {
      if (!window.confirm('¿Deseas limpiar todos los registros del cuadro de control?')) return;
      statusSelects.forEach((sel) => {
        sel.value = 'Sin revisar';
        applyStatusColor(sel);
      });
      controlNotes.forEach((inp) => {
        inp.value = '';
      });
      saveControlTable();
      showToast('Cuadro de control limpiado');
    });
  }

  /* ========================================================================
     7. EVIDENCIAS FOTOGRÁFICAS (FILEREADER LOCAL) Y LIGHTBOX
     ======================================================================== */
  const photoInputs = document.querySelectorAll('.photo-file-input');
  const photoStages = document.querySelectorAll('.photo-stage');
  const photoDescs = document.querySelectorAll('.photo-desc');
  const photoRemoveBtns = document.querySelectorAll('.photo-remove-btn');

  // Lightbox elementos
  const lightbox = document.getElementById('lightbox');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  function openLightbox(src, caption) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;
    lightboxImg.src = src;
    lightboxImg.alt = caption;
    lightboxCaption.textContent = caption;
    lightbox.hidden = false;
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  function savePhotoMeta() {
    const meta = {};
    for (let i = 1; i <= 5; i += 1) {
      const stageEl = document.getElementById(`photo-stage-${i}`);
      const descEl = document.getElementById(`photo-desc-${i}`);
      meta[i] = {
        stage: stageEl ? stageEl.value : '',
        desc: descEl ? descEl.value : ''
      };
    }
    safeStorageSet(STORAGE_KEYS.photoMeta, meta);
  }

  // Restaurar metadatos (etapa y descripción) de las 5 fotos
  const savedPhotoMeta = safeStorageGet(STORAGE_KEYS.photoMeta, {});
  for (let i = 1; i <= 5; i += 1) {
    const stageEl = document.getElementById(`photo-stage-${i}`);
    const descEl = document.getElementById(`photo-desc-${i}`);
    if (stageEl && savedPhotoMeta[i] && savedPhotoMeta[i].stage) {
      stageEl.value = savedPhotoMeta[i].stage;
    }
    if (descEl && savedPhotoMeta[i] && savedPhotoMeta[i].desc) {
      descEl.value = savedPhotoMeta[i].desc;
    }
  }

  photoStages.forEach((el) => el.addEventListener('change', savePhotoMeta));
  photoDescs.forEach((el) => el.addEventListener('input', savePhotoMeta));

  photoInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Por favor selecciona un archivo de imagen válido.');
        input.value = '';
        return;
      }

      const slot = input.getAttribute('data-slot');
      const card = document.querySelector(`[data-photo-slot="${slot}"]`);
      const previewImg = card.querySelector('.photo-preview');
      const placeholder = card.querySelector('.photo-placeholder');
      const zoomBtn = card.querySelector('.photo-zoom-btn');
      const removeBtn = card.querySelector('.photo-remove-btn');
      const titleText = card.querySelector('.evidence-card__title').textContent;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        previewImg.src = dataUrl;
        previewImg.hidden = false;
        placeholder.hidden = true;
        zoomBtn.hidden = false;
        removeBtn.hidden = false;

        const openHandler = () => {
          const stage = document.getElementById(`photo-stage-${slot}`).value;
          const desc = document.getElementById(`photo-desc-${slot}`).value.trim();
          const details = [titleText, stage ? `(${stage})` : '', desc].filter(Boolean).join(' — ');
          openLightbox(dataUrl, details);
        };

        previewImg.onclick = openHandler;
        zoomBtn.onclick = openHandler;
      };
      reader.readAsDataURL(file);
    });
  });

  photoRemoveBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = btn.getAttribute('data-remove-slot');
      const card = document.querySelector(`[data-photo-slot="${slot}"]`);
      const input = document.getElementById(`photo-input-${slot}`);
      const previewImg = card.querySelector('.photo-preview');
      const placeholder = card.querySelector('.photo-placeholder');
      const zoomBtn = card.querySelector('.photo-zoom-btn');

      input.value = '';
      previewImg.src = '';
      previewImg.hidden = true;
      placeholder.hidden = false;
      zoomBtn.hidden = true;
      btn.hidden = true;
    });
  });

  /* ========================================================================
     8. INVENTARIO DE COMPONENTES (GUARDADO, VALIDACIÓN Y EXPORTACIÓN JSON)
     ======================================================================== */
  const inventoryForm = document.getElementById('inventory-form');
  const btnClearInventory = document.getElementById('btn-clear-inventory');
  const btnExportInventory = document.getElementById('btn-export-inventory');

  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  function validateInventoryField(input) {
    if (!input) return true;
    const val = input.value.trim();
    let errorMsg = '';

    if (input.classList.contains('ip-field') && val !== '' && !ipv4Regex.test(val)) {
      errorMsg = 'Ingresa una dirección IPv4 válida (ej. 192.168.137.1).';
    }

    if (input.type === 'number' && val !== '') {
      const num = Number(val);
      const min = Number(input.min);
      const max = Number(input.max);
      if (Number.isNaN(num) || !Number.isInteger(num) || num < min || num > max) {
        errorMsg = `Ingresa un número entero entre ${min} y ${max}.`;
      }
    }

    const errIdMap = {
      'inv-net-ipv4': 'err-net-ipv4',
      'inv-net-mask': 'err-net-mask',
      'inv-net-gateway': 'err-net-gateway',
      'inv-switch-puertos': 'err-switch-puertos',
      'inv-tv-pulgadas': 'err-tv-pulgadas'
    };

    const errEl = document.getElementById(errIdMap[input.id]);
    if (errEl) errEl.textContent = errorMsg;
    input.classList.toggle('is-invalid', Boolean(errorMsg));

    return !errorMsg;
  }

  function getInventoryObject() {
    const data = {};
    if (!inventoryForm) return data;
    const formData = new FormData(inventoryForm);
    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }
    return data;
  }

  function saveInventory() {
    safeStorageSet(STORAGE_KEYS.inventory, getInventoryObject());
  }

  // Restaurar inventario guardado
  const savedInventory = safeStorageGet(STORAGE_KEYS.inventory, null);
  if (inventoryForm && savedInventory) {
    Object.entries(savedInventory).forEach(([name, value]) => {
      const fields = inventoryForm.querySelectorAll(`[name="${name}"]`);
      fields.forEach((field) => {
        if (field.type === 'radio') {
          field.checked = field.value === value;
        } else {
          field.value = value;
        }
      });
    });
  }

  if (inventoryForm) {
    inventoryForm.addEventListener('input', (e) => {
      validateInventoryField(e.target);
      saveInventory();
    });

    inventoryForm.addEventListener('change', (e) => {
      validateInventoryField(e.target);
      saveInventory();
    });

    inventoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fieldsToValidate = inventoryForm.querySelectorAll('.ip-field, input[type="number"]');
      let allValid = true;
      fieldsToValidate.forEach((f) => {
        if (!validateInventoryField(f)) allValid = false;
      });

      if (!allValid) {
        showToast('Revisa los campos marcados en rojo antes de guardar.');
        return;
      }

      saveInventory();
      showToast('Inventario guardado correctamente en este navegador.');
    });
  }

  if (btnClearInventory) {
    btnClearInventory.addEventListener('click', () => {
      if (!window.confirm('¿Estás seguro de borrar todos los datos del inventario?')) return;
      inventoryForm.reset();
      const gatewayInput = document.getElementById('inv-net-gateway');
      if (gatewayInput) gatewayInput.value = '192.168.137.1';
      inventoryForm.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
      inventoryForm.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
      saveInventory();
      showToast('Inventario restablecido');
    });
  }

  if (btnExportInventory) {
    btnExportInventory.addEventListener('click', () => {
      const exportPayload = {
        institucion: 'CETPRO Jesús Obrero',
        especialidad: 'Plataformas y Servicios de las TI',
        modulo: 'Gestión de Soporte Técnico y Herramientas Informáticas',
        docente: 'Prof. Marco Rivas L.',
        estudiante: inputEstudiante ? inputEstudiante.value.trim() : '',
        fecha: inputFecha ? inputFecha.value : '',
        inventario: getInventoryObject()
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeDate = (exportPayload.fecha || 'sin-fecha').replace(/[^0-9-]/g, '');
      a.href = url;
      a.download = `inventario-cetpro-${safeDate}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Archivo JSON de inventario descargado');
    });
  }

  /* ========================================================================
     9. FUNCIONES GLOBALES: IMPRIMIR / PDF Y REINICIAR TODO
     ======================================================================== */
  const btnPrint = document.getElementById('btn-print');
  const btnResetAll = document.getElementById('btn-reset-all');

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      const ok = window.confirm(
        '¿Deseas reiniciar todo el informe? Se borrarán el nombre del estudiante, los checklists, el cuadro de control, las fotos cargadas y el inventario.'
      );
      if (!ok) return;

      safeStorageClearAll();
      window.location.reload();
    });
  }
});