# Informe Técnico de Mantenimiento Preventivo — CETPRO Jesús Obrero

Página web estática, moderna y 100% responsive (PC, tablet y celular) elaborada con **HTML5, CSS3 y JavaScript puro (vanilla)** para el módulo **Gestión de Soporte Técnico y Herramientas Informáticas** de la especialidad **Plataformas y Servicios de las TI** del **CETPRO Jesús Obrero** (Lima, Perú).

Funciona sin servidor ni base de datos: los datos ingresados (estudiante, fecha, checklists, cuadro de control e inventario) se guardan automáticamente en el navegador (`localStorage`) y el informe puede imprimirse o guardarse como PDF.

---

## Estructura de archivos

```text
/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── assets/
    └── img/
        ├── logo.png      (opcional: logo del CETPRO)
        └── favicon.png   (opcional: ícono de la pestaña)
