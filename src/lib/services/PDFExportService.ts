import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Trip, Pin } from '@/types';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function exportTripToPDF(trip: Trip, pins: Pin[]): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 612;
  const H = 792;
  const margin = 50;

  // Title page
  const titlePage = doc.addPage([W, H]);
  const { width, height } = titlePage.getSize();

  // Background gradient simulation (solid color)
  titlePage.drawRectangle({ x: 0, y: 0, width, height, color: hexToRgb('#1e3a5f') });
  titlePage.drawRectangle({ x: 0, y: 0, width, height: height * 0.4, color: hexToRgb('#2563eb') });

  // Title
  titlePage.drawText('AtlasTrail', {
    x: margin,
    y: height - 100,
    size: 14,
    font,
    color: rgb(1, 1, 1),
    opacity: 0.6,
  });

  titlePage.drawText(trip.title, {
    x: margin,
    y: height - 160,
    size: 36,
    font: fontBold,
    color: rgb(1, 1, 1),
    maxWidth: width - margin * 2,
  });

  titlePage.drawText(`${trip.start_date} — ${trip.end_date}`, {
    x: margin,
    y: height - 210,
    size: 16,
    font,
    color: rgb(0.8, 0.9, 1),
  });

  if (trip.countries_visited?.length > 0) {
    titlePage.drawText(`Countries: ${trip.countries_visited.join(', ')}`, {
      x: margin,
      y: height - 240,
      size: 12,
      font,
      color: rgb(0.7, 0.85, 1),
    });
  }

  if (trip.description) {
    titlePage.drawText(trip.description, {
      x: margin,
      y: height - 280,
      size: 12,
      font,
      color: rgb(0.9, 0.95, 1),
      maxWidth: width - margin * 2,
      lineHeight: 18,
    });
  }

  titlePage.drawText(`${pins.length} destinations`, {
    x: margin,
    y: 100,
    size: 14,
    font,
    color: rgb(0.8, 0.9, 1),
  });

  // Pin pages
  const sorted = [...pins].sort((a, b) => a.order_index - b.order_index);

  for (let i = 0; i < sorted.length; i++) {
    const pin = sorted[i];
    const page = doc.addPage([W, H]);

    // Header strip
    page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: hexToRgb('#2563eb') });

    // Pin number
    page.drawText(`${i + 1}`, {
      x: margin,
      y: H - 55,
      size: 28,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Title
    page.drawText(pin.title || `Stop ${i + 1}`, {
      x: margin + 50,
      y: H - 45,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
      maxWidth: W - margin * 2 - 50,
    });

    const loc = [pin.city, pin.province, pin.country].filter(Boolean).join(', ');
    page.drawText(loc, {
      x: margin + 50,
      y: H - 65,
      size: 11,
      font,
      color: rgb(0.85, 0.92, 1),
    });

    let y = H - 110;

    const section = (label: string, content: string) => {
      if (!content) return;
      if (y < 100) return; // prevent overflow
      page.drawText(label, { x: margin, y, size: 10, font: fontBold, color: hexToRgb('#2563eb') });
      y -= 16;

      const lines = content.split('\n');
      for (const line of lines) {
        if (y < 80) break;
        const chunks = line.match(/.{1,80}/g) || [line];
        for (const chunk of chunks) {
          page.drawText(chunk, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 15;
        }
      }
      y -= 10;
    };

    section('DATE', pin.visit_date);
    section('LOCATION', `${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`);
    section('LODGING', pin.lodging_name);
    section('ATTRACTIONS', pin.attractions);
    section('FOOD & DRINK', pin.food_drink);
    section('NOTES', pin.tips_notes);
  }

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.title.replace(/[^a-z0-9]/gi, '_')}_AtlasTrail.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
