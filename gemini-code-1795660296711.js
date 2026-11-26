/**
 * Informe Técnico de Mantenimiento Preventivo - CETPRO Jesús Obrero
 * JavaScript puro (Vanilla JS) sin dependencias externas.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cetpro_informe_mantenimiento_v1';

  // Acceso seguro a localStorage envuelto en try/catch
  const storage = {
    get() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (err) {
        return {};
      }
    },
    set(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        return false;
      }
    },
    clear() {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  let state = storage.get();

  function saveState() {
    storage.set(state);
  }

  /* ========================================================================
     1. TEMA CLARO / OSCURO
     ======================================================================== */
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  const savedTheme = state.theme || 'light';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    state.theme = next;
    saveState();
    applyTheme(next);
  });

  /* ========================================================================
     2. MENÚ MÓVIL, PROGRESO DE LECTURA, SCROLL-SPY Y VOLVER ARRIBA
     ======================================================================== */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('.nav-link');
  const readingProgressBar = document.getElementById('readingProgressBar');
  const backToTop = document.getElementById('backToTop');

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  function handleScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

    readingProgressBar.style.width = `${percent}%`;
    readingProgressBar.parentElement.setAttribute('aria-valuenow', String(percent));

    if (scrollTop > 350) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Scroll-spy y animaciones fade-in con IntersectionObserver
  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window) {
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
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((sec) => spyObserver.observe(sec));

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
    document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));
  } else {
    document.querySelectorAll('.fade-in').forEach((el) => el.classList.add('is-visible'));
  }

  /* ========================================================================
     3. PORTADA Y SINCRONIZACIÓN CON FIRMAS
     ======================================================================== */
  const studentNameInput = document.getElementById('studentName');
  const reportDateInput = document.getElementById('reportDate');
  const sigStudent = document.getElementById('sigStudent');
  const sigDate = document.getElementById('sigDate');

  function syncSignatures() {
    sigStudent.textContent = studentNameInput.value.trim() || '____________________________';
    if (reportDateInput.value) {
      const [y, m, d] = reportDateInput.value.split('-');
      sigDate.textContent = `${d}/${m}/${y}`;
    } else {
      sigDate.textContent = '____________________________';
    }
  }

  if (state.studentName) studentNameInput.value = state.studentName;
  if (state.reportDate) reportDateInput.value = state.reportDate;
  syncSignatures();

  studentNameInput.addEventListener('input', () => {
    state.studentName = studentNameInput.value;
    saveState();
    syncSignatures();
  });

  reportDateInput.addEventListener('change', () => {
    state.reportDate = reportDateInput.value;
    saveState();
    syncSignatures();
  });

  /* ========================================================================
     4. ACORDEÓN, CHECKLISTS Y PROGRESO GLOBAL
     ======================================================================== */
  document.querySelectorAll('.accordion-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  const stepChecks = document.querySelectorAll('.step-check');
  const testChecks = document.querySelectorAll('.test-check');
  const globalProgressText = document.getElementById('globalProgressText');
  const heroProgressLabel = document.getElementById('heroProgressLabel');
  const heroProgressBar = document.getElementById('heroProgressBar');
  const testsProgressText = document.getElementById('testsProgressText');
  const testsProgressBar = document.getElementById('testsProgressBar');

  state.checks = state.checks || {};

  function updateAllProgress() {
    // Progreso por componente (A - F)
    const groups = ['placa', 'cpu', 'cooler', 'ram', 'hdd', 'ssd'];
    groups.forEach((group) => {
      const boxes = document.querySelectorAll(`.step-check[data-group="${group}"]`);
      const checked = Array.from(boxes).filter((b) => b.checked).length;
      const pct = boxes.length ? Math.round((checked / boxes.length) * 100) : 0;
      const bar = document.querySelector(`[data-progress-bar="${group}"]`);
      const txt = document.querySelector(`[data-progress-text="${group}"]`);
      if (bar) bar.style.width = `${pct}%`;
      if (txt) txt.textContent = `${checked}/${boxes.length}`;
    });

    // Progreso de pruebas (Sección 5)
    const testsDone = Array.from(testChecks).filter((b) => b.checked).length;
    const testsPct = testChecks.length ? Math.round((testsDone / testChecks.length) * 100) : 0;
    testsProgressText.textContent = `${testsDone}/${testChecks.length} (${testsPct}%)`;
    testsProgressBar.style.width = `${testsPct}%`;

    // Progreso global del informe
    const totalBoxes = stepChecks.length + testChecks.length;
    const totalDone =
      Array.from(stepChecks).filter((b) => b.checked).length + testsDone;
    const globalPct = totalBoxes ? Math.round((totalDone / totalBoxes) * 100) : 0;

    globalProgressText.textContent = `${globalPct}%`;
    heroProgressLabel.textContent = `${globalPct}% completado`;
    heroProgressBar.style.width = `${globalPct}%`;
  }

  [...stepChecks, ...testChecks].forEach((checkbox) => {
    const id = checkbox.dataset.id;
    if (state.checks[id]) checkbox.checked = true;

    checkbox.addEventListener('change', () => {
      state.checks[id] = checkbox.checked;
      saveState();
      updateAllProgress();
    });
  });

  updateAllProgress();

  /* ========================================================================
     5. CUADRO DE CONTROL DEL MANTENIMIENTO (SECCIÓN 4)
     ======================================================================== */
  const statusSelects = document.querySelectorAll('.status-select');
  const mantInputs = document.querySelectorAll('.mant-input');
  const clearTableBtn = document.getElementById('clearTableBtn');

  state.controlTable = state.controlTable || {};

  function updateSelectColor(selectEl) {
    selectEl.classList.remove('status-bueno', 'status-regular', 'status-malo');
    if (selectEl.value === 'bueno') selectEl.classList.add('status-bueno');
    if (selectEl.value === 'regular') selectEl.classList.add('status-regular');
    if (selectEl.value === 'malo') selectEl.classList.add('status-malo');
  }

  statusSelects.forEach((sel) => {
    const row = sel.dataset.row;
    if (state.controlTable[row]?.estado) {
      sel.value = state.controlTable[row].estado;
    }
    updateSelectColor(sel);

    sel.addEventListener('change', () => {
      state.controlTable[row] = state.controlTable[row] || {};
      state.controlTable[row].estado = sel.value;
      updateSelectColor(sel);
      saveState();
    });
  });

  mantInputs.forEach((inp) => {
    const row = inp.dataset.row;
    if (state.controlTable[row]?.mant) {
      inp.value = state.controlTable[row].mant;
    }

    inp.addEventListener('input', () => {
      state.controlTable[row] = state.controlTable[row] || {};
      state.controlTable[row].mant = inp.value;
      saveState();
    });
  });

  clearTableBtn.addEventListener('click', () => {
    if (!confirm('¿Deseas limpiar todos los datos del Cuadro de Control?')) return;
    state.controlTable = {};
    statusSelects.forEach((sel) => {
      sel.value = 'sin-revisar';
      updateSelectColor(sel);
    });
    mantInputs.forEach((inp) => (inp.value = ''));
    saveState();
  });

  /* ========================================================================
     6. EVIDENCIAS FOTOGRÁFICAS Y LIGHTBOX (SECCIÓN 8)
     ======================================================================== */
  state.evidences = state.evidences || {};

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxCaption.textContent = caption;
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  document.querySelectorAll('.evidence-card').forEach((card) => {
    const slot = card.dataset.slot;
    const input = card.querySelector('.photo-input');
    const preview = card.querySelector('.photo-preview');
    const placeholder = card.querySelector('.photo-placeholder');
    const removeBtn = card.querySelector('.remove-photo-btn');
    const stageSelect = card.querySelector('.evidence-stage');
    const descInput = card.querySelector('.evidence-desc');

    if (state.evidences[slot]?.stage) stageSelect.value = state.evidences[slot].stage;
    if (state.evidences[slot]?.desc) descInput.value = state.evidences[slot].desc;

    stageSelect.addEventListener('change', () => {
      state.evidences[slot] = state.evidences[slot] || {};
      state.evidences[slot].stage = stageSelect.value;
      saveState();
    });

    descInput.addEventListener('input', () => {
      state.evidences[slot] = state.evidences[slot] || {};
      state.evidences[slot].desc = descInput.value;
      saveState();
    });

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.hidden = false;
        placeholder.hidden = true;
        removeBtn.hidden = false;
      };
      reader.readAsDataURL(file);
    });

    preview.addEventListener('click', () => {
      const title = card.querySelector('h3').textContent;
      const stage = stageSelect.value ? ` (${stageSelect.value})` : '';
      const desc = descInput.value ? ` - ${descInput.value}` : '';
      openLightbox(preview.src, `${title}${stage}${desc}`);
    });

    removeBtn.addEventListener('click', () => {
      input.value = '';
      preview.src = '';
      preview.hidden = true;
      placeholder.hidden = false;
      removeBtn.hidden = true;
    });
  });

  /* ========================================================================
     7. INVENTARIO DE COMPONENTES (VALIDACIÓN, GUARDADO Y EXPORTACIÓN)
     ======================================================================== */
  const inventoryForm = document.getElementById('inventoryForm');
  const invStatusMsg = document.getElementById('invStatusMsg');
  const clearInvBtn = document.getElementById('clearInvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');

  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  state.inventory = state.inventory || {};

  function validateField(field) {
    const errorEl = field.parentElement.querySelector('.field-error');
    if (!errorEl) return true;

    const val = field.value.trim();
    let msg = '';

    if (field.classList.contains('ip-field') && val !== '' && !ipv4Regex.test(val)) {
      msg = 'Ingresa una dirección IPv4 válida (ej. 192.168.137.1).';
    } else if (field.type === 'number' && val !== '') {
      const num = Number(val);
      const min = Number(field.min);
      const max = Number(field.max);
      if (Number.isNaN(num) || num < min || num > max) {
        msg = `Ingresa un número entre ${min} y ${max}.`;
      }
    }

    field.classList.toggle('is-invalid', Boolean(msg));
    errorEl.textContent = msg;
    return !msg;
  }

  const invFields = inventoryForm.querySelectorAll('input, select');
  invFields.forEach((field) => {
    const name = field.name;
    if (state.inventory[name] !== undefined) {
      field.value = state.inventory[name];
    }

    const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      validateField(field);
      state.inventory[name] = field.value;
      saveState();
    });
  });

  inventoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let allValid = true;
    invFields.forEach((f) => {
      if (!validateField(f)) allValid = false;
      state.inventory[f.name] = f.value;
    });

    if (!allValid) {
      invStatusMsg.style.color = 'var(--color-danger)';
      invStatusMsg.textContent = 'Revisa los campos marcados en rojo antes de guardar.';
      return;
    }

    saveState();
    invStatusMsg.style.color = 'var(--color-success)';
    invStatusMsg.textContent = 'Inventario guardado correctamente en este navegador.';
  });

  clearInvBtn.addEventListener('click', () => {
    if (!confirm('¿Estás seguro de borrar todos los campos del inventario?')) return;
    state.inventory = {};
    invFields.forEach((f) => {
      f.value = f.id === 'inv-net-gw' ? '192.168.137.1' : '';
      validateField(f);
    });
    saveState();
    invStatusMsg.textContent = 'Inventario restablecido.';
  });

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportJsonBtn.addEventListener('click', () => {
    const payload = {
      institucion: 'CETPRO Jesús Obrero',
      estudiante: studentNameInput.value.trim(),
      fecha: reportDateInput.value,
      inventario: state.inventory
    };
    downloadFile('inventario-cetpro.json', JSON.stringify(payload, null, 2), 'application/json');
  });

  exportTxtBtn.addEventListener('click', () => {
    const lines = [
      'INVENTARIO DE COMPONENTES ANALIZADOS - CETPRO JESÚS OBRERO',
      `Estudiante: ${studentNameInput.value.trim() || 'No registrado'}`,
      `Fecha: ${reportDateInput.value || 'No registrada'}`,
      '------------------------------------------------------------'
    ];
    invFields.forEach((f) => {
      const label = inventoryForm.querySelector(`label[for="${f.id}"]`)?.textContent || f.name;
      lines.push(`${label}: ${f.value.trim() || '-'}`);
    });
    downloadFile('inventario-cetpro.txt', lines.join('\n'), 'text/plain;charset=utf-8');
  });

  /* ========================================================================
     8. ACCIONES GLOBALES (IMPRIMIR Y REINICIAR TODO)
     ======================================================================== */
  document.getElementById('printBtn').addEventListener('click', () => window.print());

  document.getElementById('resetAllBtn').addEventListener('click', () => {
    if (!confirm('¿Deseas reiniciar todo el informe y borrar los datos guardados?')) return;
    storage.clear();
    location.reload();
  });
})();