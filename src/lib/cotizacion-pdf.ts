import { Cotizacion } from '@/types'
import { SERVICIOS } from '@/lib/pricing'
import { formatCurrency, formatDate } from '@/lib/utils'

export function abrirPDFCotizacion(c: Cotizacion) {
  const serv = SERVICIOS[c.servicio]
  const fecha = c.created_at
    ? formatDate(c.created_at)
    : new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
  const precio =
    c.precio_min > 0
      ? `${formatCurrency(c.precio_min)} – ${formatCurrency(c.precio_max)}`
      : 'Cotización personalizada'
  const medida = c.metros_cuadrados
    ? `${c.metros_cuadrados} m²`
    : c.metros_lineales
    ? `${c.metros_lineales} ML`
    : '—'

  const colorItem =
    c.color_seleccionado
      ? `<div class="service-item"><label>Color / Referencia</label><span>${c.color_seleccionado}</span></div>`
      : ''
  const fechaProyItem =
    c.lead?.fecha_proyecto
      ? `<div class="service-item"><label>Fecha estimada del proyecto</label><span>${c.lead.fecha_proyecto}</span></div>`
      : ''
  const detallesBloque =
    c.detalles_adicionales
      ? `<div class="details-box"><label>Comentarios del cliente</label><p>"${c.detalles_adicionales}"</p></div>`
      : ''

  const html = [
    '<!DOCTYPE html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>Cotización Kersa Design – ${c.lead?.name ?? 'Cliente'}</title>`,
    '<base href="https://cotizador.kersadesign.com/">',
    '<style>',
    "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');",
    '* { margin: 0; padding: 0; box-sizing: border-box; }',
    "body { font-family: 'Inter', Arial, sans-serif; color: #111827; background: #fff; }",
    '.top-bar { height: 8px; background: #1B6AEB; }',
    '.page { max-width: 720px; margin: 0 auto; padding: 36px 40px 48px; }',

    // Header con logo real
    '.header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6; margin-bottom: 28px; }',
    '.logo-img { height: 44px; width: auto; display: block; }',
    '.doc-info { text-align: right; }',
    '.doc-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }',
    '.doc-date { font-size: 14px; font-weight: 700; color: #111827; margin-top: 3px; }',
    '.doc-location { font-size: 11px; color: #9ca3af; margin-top: 3px; }',

    // Título
    '.title-section { margin-bottom: 24px; }',
    '.title-section h1 { font-size: 22px; font-weight: 800; color: #060D1C; letter-spacing: -0.3px; }',
    '.title-section p { font-size: 13px; color: #6b7280; margin-top: 4px; }',

    // Cliente
    '.client-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 22px; margin-bottom: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }',
    '.field label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 3px; }',
    '.field span { font-size: 14px; font-weight: 500; color: #111827; }',

    // Servicio
    '.section { margin-bottom: 22px; }',
    '.section-title { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }',
    '.service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }',
    '.service-item { background: #f9fafb; border-radius: 10px; padding: 12px 16px; }',
    '.service-item label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 4px; }',
    '.service-item span { font-size: 14px; font-weight: 600; color: #111827; }',

    // Comentarios
    '.details-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; }',
    '.details-box label { font-size: 10px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px; }',
    '.details-box p { font-size: 13px; color: #1e40af; line-height: 1.6; font-style: italic; }',

    // Precio
    '.price-box { background: #060D1C; border-radius: 14px; padding: 22px 28px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }',
    '.price-left { }',
    '.price-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }',
    '.price-value { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }',
    '.price-right { text-align: right; }',
    '.price-badge { background: #1B6AEB; color: #fff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }',
    '.price-note { font-size: 11px; color: #9ca3af; margin-top: 6px; line-height: 1.5; }',

    // Validez
    '.validity { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 16px; text-align: center; margin-bottom: 24px; font-size: 12px; color: #6b7280; }',
    '.validity strong { color: #374151; }',

    // Footer
    '.footer { border-top: 1px solid #e5e7eb; padding-top: 18px; display: flex; justify-content: space-between; align-items: center; }',
    '.footer-logo { height: 28px; width: auto; opacity: 0.7; }',
    '.footer-contact { font-size: 11px; color: #9ca3af; text-align: right; line-height: 1.7; }',

    '@media print {',
    '  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
    '  .top-bar { display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
    '  .page { padding: 28px 36px; }',
    '}',
    '</style>',
    '</head>',
    '<body>',

    // Barra azul superior (fuera del .page para ser full-width)
    '<div class="top-bar"></div>',
    '<div class="page">',

    // Header con logo real
    '<div class="header">',
    '<img class="logo-img" src="/logo-kersa.png" alt="Kersa Design" onerror="this.style.display=\'none\'">',
    '<div class="doc-info">',
    '<div class="doc-label">Cotización</div>',
    `<div class="doc-date">${fecha}</div>`,
    '<div class="doc-location">La Campiña, Caracas, Venezuela</div>',
    '</div>',
    '</div>',

    // Título
    '<div class="title-section">',
    `<h1>Cotización · ${serv.icono} ${serv.nombre}</h1>`,
    `<p>Preparada para <strong>${c.lead?.name ?? 'el cliente'}</strong></p>`,
    '</div>',

    // Cliente
    '<div class="client-card">',
    `<div class="field"><label>Nombre</label><span>${c.lead?.name ?? '—'}</span></div>`,
    `<div class="field"><label>Teléfono</label><span>${c.lead?.telefono ?? '—'}</span></div>`,
    `<div class="field"><label>Email</label><span>${c.lead?.email ?? '—'}</span></div>`,
    `<div class="field"><label>Ubicación</label><span>${c.lead?.ciudad ?? '—'}</span></div>`,
    '</div>',

    // Servicio
    '<div class="section">',
    '<div class="section-title">Detalles del servicio</div>',
    '<div class="service-grid">',
    `<div class="service-item"><label>Servicio</label><span>${serv.icono} ${serv.nombre}</span></div>`,
    `<div class="service-item"><label>Metraje</label><span>${medida}</span></div>`,
    colorItem,
    fechaProyItem,
    '</div>',
    '</div>',

    detallesBloque,

    // Precio
    '<div class="price-box">',
    '<div class="price-left">',
    '<div class="price-label">Rango de cotización estimado</div>',
    `<div class="price-value">${precio}</div>`,
    '</div>',
    '<div class="price-right">',
    '<div class="price-badge">Kersa Design</div>',
    '<div class="price-note">Precio referencial<br>sujeto a visita técnica</div>',
    '</div>',
    '</div>',

    '<div class="validity"><strong>Validez:</strong> Esta cotización tiene una validez de <strong>15 días hábiles</strong> a partir de la fecha de emisión.</div>',

    // Footer
    '<div class="footer">',
    '<img class="footer-logo" src="/logo-kersa.png" alt="Kersa Design" onerror="this.style.display=\'none\'">',
    '<div class="footer-contact">@kersadesign · kersadesign.com<br>La Campiña, Caracas, Venezuela</div>',
    '</div>',

    '</div>',
    '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<' + '/script>',
    '</body>',
    '</html>',
  ].join('\n')

  const win = window.open('', '_blank', 'width=820,height=950')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
