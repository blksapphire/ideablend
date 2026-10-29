import { useEffect } from 'react';

const SITE_NAME = 'Idea Blend';

export default function useDocumentMeta({ title, description } = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = `${title} · ${SITE_NAME}`;

    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta ? meta.getAttribute('content') : null;
    let created = false;

    if (description) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
        created = true;
      }
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = previousTitle;
      if (description) {
        if (created) meta.remove();
        else if (previousDescription != null) meta.setAttribute('content', previousDescription);
        else meta.removeAttribute('content');
      }
    };
  }, [title, description]);
}
