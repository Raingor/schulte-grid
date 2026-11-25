const attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

export const icons = {
  restart: `<svg ${attrs}><path d="M4.8 9.2A7.5 7.5 0 1 1 4.5 14"/><path d="M4.2 4.4v5.2h5.2"/></svg>`,
  sound: `<svg ${attrs}><path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6"/><path d="M17.8 6.5a8 8 0 0 1 0 11"/></svg>`,
  muted: `<svg ${attrs}><path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="m16 10 4 4"/><path d="m20 10-4 4"/></svg>`,
  trophy: `<svg ${attrs}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4"/><path d="M16 6h4v2a4 4 0 0 1-4 4"/><path d="M12 13v4"/><path d="M8.5 20h7"/><path d="M10 17h4l1 3H9l1-3Z"/></svg>`,
  timer: `<svg ${attrs}><circle cx="12" cy="13" r="7"/><path d="M12 9v4l2.5 2.5"/><path d="M9 3h6"/><path d="M18.5 7.5 21 5"/></svg>`,
  spark: `<svg ${attrs}><path d="M12 3.5c.4 4.4 2.1 6.1 6.5 6.5-4.4.4-6.1 2.1-6.5 6.5-.4-4.4-2.1-6.1-6.5-6.5 4.4-.4 6.1-2.1 6.5-6.5Z"/><path d="M19 16.5c.2 2 1 2.8 3 3-2 .2-2.8 1-3 3-.2-2-1-2.8-3-3 2-.2 2.8-1 3-3Z"/></svg>`,
  paw: `<svg ${attrs}><path d="M12 20c-3.2 0-5.6-1.7-5.6-4.1 0-1.7 1.4-2.6 2.8-3.1 1.1-.4 1.8-1 2.8-1s1.7.6 2.8 1c1.4.5 2.8 1.4 2.8 3.1C17.6 18.3 15.2 20 12 20Z"/><ellipse cx="6.4" cy="10.1" rx="2.1" ry="2.6" transform="rotate(-22 6.4 10.1)"/><ellipse cx="10.1" cy="6.7" rx="1.8" ry="2.4" transform="rotate(-8 10.1 6.7)"/><ellipse cx="17.6" cy="10.1" rx="2.1" ry="2.6" transform="rotate(22 17.6 10.1)"/><ellipse cx="13.9" cy="6.7" rx="1.8" ry="2.4" transform="rotate(8 13.9 6.7)"/></svg>`,
  eye: `<svg ${attrs}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

export const icon = (name: keyof typeof icons): string => icons[name];
