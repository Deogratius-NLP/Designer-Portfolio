(() => {
  const showcase = document.querySelector('.showcase');
  const frame = document.querySelector('.showcase-frame');
  const track = document.querySelector('#gallery-track');
  const count = document.querySelector('#gallery-count');
  let totalCards = track ? track.querySelectorAll('.project-card').length : 0;
  const orbit = document.querySelector('#tool-orbit');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameRequest = 0;

  function updateGallery() {
    frameRequest = 0;
    if (!showcase || !track) return;
    const bounds = showcase.getBoundingClientRect();
    const travel = Math.max(0, bounds.height - frame.offsetHeight);
    const progress = Math.min(1, Math.max(0, -bounds.top / (travel || 1)));
    const width = frame.clientWidth;
    const center = width / 2;
    const cards = [...track.children];
    const first = cards[0];
    const last = cards.at(-1);
    const start = width <= 850 && first
      ? center - first.offsetLeft - first.offsetWidth / 2
      : -Math.max(0, track.scrollWidth - width * 0.9);
    const end = width <= 850 && last ? center - last.offsetLeft - last.offsetWidth / 2 : 0;
    const x = start + (end - start) * progress;

    if (!reducedMotion) {
      for (const card of cards) {
        const position = (x + card.offsetLeft + card.offsetWidth / 2 - center) / center;
        const edge = Math.min(1, Math.max(0, (Math.abs(position) - 0.35) / 0.65));
        card.style.setProperty('--gallery-angle', `${Math.sign(position) * edge * 32}deg`);
        card.style.setProperty('--gallery-scale', 1 - edge * 0.17);
      }
    }
    track.style.transform = `translate3d(${x}px, 0, 0)`;
    if (count && totalCards) {
      const active = Math.min(totalCards, Math.floor(progress * totalCards) + 1);
      count.textContent = `${String(active).padStart(2, '0')} — ${String(totalCards).padStart(2, '0')}`;
    }
  }

  function requestGalleryUpdate() {
    if (!frameRequest) frameRequest = requestAnimationFrame(updateGallery);
  }

  window.addEventListener('scroll', requestGalleryUpdate, { passive: true });
  window.addEventListener('resize', requestGalleryUpdate, { passive: true });
  window.addEventListener('portfolio:cards-updated', () => {
    totalCards = track ? track.querySelectorAll('.project-card').length : 0;
    requestGalleryUpdate();
  });
  requestGalleryUpdate();

  if (orbit && !reducedMotion) {
    const steerOrbit = (event) => {
      if (!event.isPrimary) return;
      const bounds = orbit.getBoundingClientRect();
      const normalize = (position, size) => Math.max(-1, Math.min(1, position / size * 2 - 1));
      const x = normalize(event.clientX - bounds.left, bounds.width);
      const y = normalize(event.clientY - bounds.top, bounds.height);
      orbit.dataset.tracking = '';
      orbit.style.setProperty('--orbit-pitch', `${-y * 12}deg`);
      orbit.style.setProperty('--orbit-yaw', `${x * 16}deg`);
      orbit.style.setProperty('--orbit-light-x', `${50 + x * 42}%`);
      orbit.style.setProperty('--orbit-light-y', `${42 + y * 38}%`);
    };

    const resetOrbit = () => {
      delete orbit.dataset.tracking;
      orbit.style.removeProperty('--orbit-pitch');
      orbit.style.removeProperty('--orbit-yaw');
      orbit.style.removeProperty('--orbit-light-x');
      orbit.style.removeProperty('--orbit-light-y');
    };

    orbit.addEventListener('pointerdown', steerOrbit);
    orbit.addEventListener('pointermove', steerOrbit);
    orbit.addEventListener('pointerleave', resetOrbit);
    orbit.addEventListener('pointercancel', resetOrbit);
    orbit.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse') resetOrbit();
    });
  }
})();

(() => {
  const track = document.querySelector('#gallery-track');
  const dialog = document.querySelector('#design-manager');
  const closeButton = document.querySelector('#close-design-manager');
  const uploadInput = document.querySelector('#design-upload');
  const list = document.querySelector('#design-list');
  const status = document.querySelector('#manager-status');
  if (!track || !dialog || !uploadInput || !list || !status) return;

  const storageKey = 'deogratius-portfolio-designs-v1';
  const passphraseKey = `${storageKey}:passphrase`;
  const originalCards = [...track.querySelectorAll('.project-card')];
  const builtInCards = new Map();
  originalCards.forEach((card) => {
    const id = `built-in:${card.getAttribute('href')}`;
    card.dataset.designId = id;
    builtInCards.set(id, card);
  });

  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
  } catch {
    status.textContent = 'Saved work could not be read. Your original designs are still available.';
  }
  let customDesigns = Array.isArray(stored.custom) ? stored.custom.filter((item) => item && item.id && item.src) : [];
  const hiddenBuiltIns = new Set(Array.isArray(stored.hidden) ? stored.hidden : []);
  const customCards = new Map();

  function makeCustomCard(item) {
    const card = document.createElement('a');
    card.className = 'project-card card-tall';
    card.href = item.src;
    card.dataset.designId = item.id;
    card.dataset.category = item.category || 'NEW DESIGN';
    card.setAttribute('aria-label', `${item.title} artwork`);
    const image = document.createElement('img');
    image.src = item.src;
    image.alt = item.title;
    const index = document.createElement('span');
    index.className = 'card-index';
    card.append(image, index);
    return card;
  }

  customDesigns.forEach((item) => customCards.set(item.id, makeCustomCard(item)));
  const available = new Map([...builtInCards, ...customCards]);
  let orderedIds = Array.isArray(stored.order) ? stored.order.filter((id) => available.has(id) && !hiddenBuiltIns.has(id)) : [];
  const orderedSet = new Set(orderedIds);
  [...builtInCards.keys(), ...customCards.keys()].forEach((id) => {
    if (!orderedSet.has(id) && !hiddenBuiltIns.has(id)) orderedIds.push(id);
  });
  track.replaceChildren(...orderedIds.map((id) => available.get(id)));

  function updateCardNumbers() {
    [...track.children].forEach((card, index) => {
      const category = card.dataset.category || card.querySelector('.card-index')?.textContent.split('/').slice(1).join('/').trim() || 'DESIGN';
      card.dataset.category = category;
      const label = card.querySelector('.card-index');
      if (label) label.textContent = `${String(index + 1).padStart(2, '0')} / ${category}`;
    });
  }

  function persist(message = 'Saved in this browser.') {
    const order = [...track.children].map((card) => card.dataset.designId);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ order, custom: customDesigns, hidden: [...hiddenBuiltIns] }));
      status.textContent = message;
      return true;
    } catch {
      status.textContent = 'This browser is out of storage space. Try smaller image files.';
      return false;
    }
  }

  function makeRow(card, index, total) {
    const item = document.createElement('li');
    item.className = 'design-row';
    item.draggable = true;
    item.dataset.designId = card.dataset.designId;
    const image = document.createElement('img');
    image.src = card.querySelector('img').src;
    image.alt = '';
    const details = document.createElement('div');
    details.className = 'design-row-details';
    const title = document.createElement('strong');
    title.textContent = card.querySelector('img').alt || card.getAttribute('aria-label') || 'Design';
    const category = document.createElement('small');
    category.textContent = card.dataset.category || 'DESIGN';
    details.append(title, category);
    const actions = document.createElement('div');
    actions.className = 'design-row-actions';
    const up = document.createElement('button');
    up.type = 'button';
    up.textContent = '↑';
    up.setAttribute('aria-label', `Move ${title.textContent} up`);
    up.disabled = index === 0;
    up.addEventListener('click', () => moveDesign(index, index - 1));
    const down = document.createElement('button');
    down.type = 'button';
    down.textContent = '↓';
    down.setAttribute('aria-label', `Move ${title.textContent} down`);
    down.disabled = index === total - 1;
    down.addEventListener('click', () => moveDesign(index, index + 1));
    actions.append(up, down);
    const isCustom = customCards.has(card.dataset.designId);
    if (isCustom) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.className = 'remove-design';
      remove.addEventListener('click', () => {
        customDesigns = customDesigns.filter((design) => design.id !== card.dataset.designId);
        customCards.delete(card.dataset.designId);
        card.remove();
        updateCardNumbers();
        renderManager();
        persist('Design removed.');
        window.dispatchEvent(new Event('portfolio:cards-updated'));
      });
      actions.append(remove);
    }
    item.append(image, details, actions);
    item.addEventListener('dragstart', (event) => {
      item.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.dataset.designId);
    });
    item.addEventListener('dragend', () => item.classList.remove('is-dragging'));
    item.addEventListener('dragover', (event) => event.preventDefault());
    item.addEventListener('drop', (event) => {
      event.preventDefault();
      const movingId = event.dataTransfer.getData('text/plain');
      const movingIndex = [...track.children].findIndex((node) => node.dataset.designId === movingId);
      const targetIndex = [...track.children].findIndex((node) => node.dataset.designId === item.dataset.designId);
      if (movingIndex >= 0 && targetIndex >= 0 && movingIndex !== targetIndex) {
        moveDesign(movingIndex, targetIndex);
      }
    });
    return item;
  }

  function renderManager() {
    list.replaceChildren(...[...track.children].map((card, index, cards) => makeRow(card, index, cards.length)));
  }

  function moveDesign(from, to) {
    const cards = [...track.children];
    if (to < 0 || to >= cards.length || from < 0 || from >= cards.length) return;
    const [moving] = cards.splice(from, 1);
    cards.splice(to, 0, moving);
    track.replaceChildren(...cards);
    updateCardNumbers();
    renderManager();
    persist('Order saved in this browser.');
    window.dispatchEvent(new Event('portfolio:cards-updated'));
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        const maxWidth = 1400;
        const maxHeight = 1750;
        const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Image compression failed.'));
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Could not read the image.'));
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.84);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Could not open ${file.name}.`));
      };
      image.src = objectUrl;
    });
  }

  function cleanTitle(filename) {
    return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'New design';
  }

  uploadInput.addEventListener('change', async () => {
    const files = [...uploadInput.files].filter((file) => file.type.startsWith('image/'));
    for (const file of files) {
      status.textContent = `Adding ${file.name}…`;
      try {
        const src = await compressImage(file);
        const id = `upload:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
        const item = { id, title: cleanTitle(file.name), category: 'NEW DESIGN', src };
        customDesigns.push(item);
        const card = makeCustomCard(item);
        card.dataset.category = item.category;
        customCards.set(id, card);
        track.append(card);
      } catch (error) {
        status.textContent = error.message || 'Could not add that image.';
      }
    }
    uploadInput.value = '';
    updateCardNumbers();
    renderManager();
    if (files.length) {
      persist(`${files.length} design${files.length === 1 ? '' : 's'} added. Saved in this browser.`);
      window.dispatchEvent(new Event('portfolio:cards-updated'));
    }
  });

  async function hashPassphrase(passphrase) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passphrase));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function unlockManager() {
    let savedHash = '';
    try {
      savedHash = localStorage.getItem(passphraseKey) || '';
    } catch {
      status.textContent = 'Private editing is unavailable in this browser.';
      return;
    }

    if (!savedHash) {
      const firstPassphrase = window.prompt('Create a private passphrase for portfolio editing (8 or more characters):');
      if (!firstPassphrase) return;
      if (firstPassphrase.length < 8) {
        window.alert('Use at least 8 characters.');
        return;
      }
      const confirmation = window.prompt('Enter that passphrase once more:');
      if (confirmation !== firstPassphrase) {
        window.alert('The passphrases did not match. Try the shortcut again.');
        return;
      }
      try {
        savedHash = await hashPassphrase(firstPassphrase);
        localStorage.setItem(passphraseKey, savedHash);
      } catch {
        window.alert('Could not save the passphrase in this browser.');
        return;
      }
    } else {
      const passphrase = window.prompt('Enter your portfolio editing passphrase:');
      if (!passphrase) return;
      try {
        if (await hashPassphrase(passphrase) !== savedHash) {
          window.alert('That passphrase is not correct.');
          return;
        }
      } catch {
        window.alert('Passphrase checking is unavailable in this browser.');
        return;
      }
    }

    renderManager();
    dialog.showModal();
  }

  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      unlockManager();
    }
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  updateCardNumbers();
  renderManager();
  window.dispatchEvent(new Event('portfolio:cards-updated'));
})();

(() => {
  const soundtrack = document.querySelector('#portfolio-soundtrack');
  if (soundtrack) soundtrack.volume = 0.18;
})();
