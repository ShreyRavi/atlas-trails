'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into #modal-root (appended after all app content in <body>).
 * This guarantees modals are always painted on top of the Leaflet map,
 * regardless of any stacking context the map creates.
 */
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(document.getElementById('modal-root') ?? document.body);
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
