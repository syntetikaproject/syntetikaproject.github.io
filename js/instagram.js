const INSTAGRAM_POSTS = [
  'https://www.instagram.com/p/DaD0efJhbX7/',
  'https://www.instagram.com/p/DZy-VG6Aaen/',
];

async function fetchInstagramFeed() {
  const container = document.getElementById('ig-feed');
  if (!container || !INSTAGRAM_POSTS.length) return;

  const results = await Promise.all(
    INSTAGRAM_POSTS.map(async (url) => {
      try {
        const res = await fetch(
          `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`
        );
        if (!res.ok) return null;
        return { ...(await res.json()), url };
      } catch {
        return null;
      }
    })
  );

  const valid = results.filter(Boolean);
  if (valid.length === 0) return;

  container.innerHTML = results
    .map((r) => {
      if (!r) {
        return `<a href="https://instagram.com/synt.etika" target="_blank" rel="noopener" class="ig-item ig-item--fallback">
          <div class="ig-placeholder"><i class="fab fa-instagram"></i></div>
          <div class="ig-overlay"><i class="fab fa-instagram"></i></div>
        </a>`;
      }
      return `<a href="${r.url}" target="_blank" rel="noopener" class="ig-item ig-item--loaded">
        <img src="${r.thumbnail_url}" alt="${r.title || 'Instagram post'}" loading="lazy">
        <div class="ig-overlay"><i class="fab fa-instagram"></i></div>
      </a>`;
    })
    .join('');
}

fetchInstagramFeed();
