const $ = (selector) => document.querySelector(selector);
const page = document.body.dataset.page;

function renderLayout() {
  const query = $('#search-query');
  const date = $('#search-date');

  if (query) query.value = queryParam('q') || '';
  if (date) date.value = queryParam('date') || '';

  const searchForm = $('#search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      goSearch(query.value, date.value);
    });
  }

  const dateToggle = $('#date-toggle');
  if (dateToggle) {
    dateToggle.addEventListener('click', () => {
      const popover = $('#date-popover');
      const show = popover.hidden;
      popover.hidden = !show;
      dateToggle.setAttribute('aria-expanded', String(show));
      if (show) date.focus();
    });
  }

  const applyDate = $('.apply-date');
  if (applyDate) applyDate.addEventListener('click', () => goSearch(query.value, date.value));

  const clearDate = $('#clear-date');
  if (clearDate) {
    clearDate.addEventListener('click', () => {
      date.value = '';
      goSearch(query.value, '');
    });
  }

  const footer = $('#site-footer');
  if (footer) footer.textContent = 'ReFind';
}

function goSearch(query, date) {
  const target = new URL('index.html', location.href);
  if (query.trim()) target.searchParams.set('q', query.trim());
  if (date) target.searchParams.set('date', date);
  location.href = target.href;
}

renderLayout();

function renderPostCard(post) {
  const image = post.image
    ? `<img class="post-image-file" src="${escapeHTML(post.image)}" alt="Ảnh ${escapeHTML(post.title)}" loading="lazy">`
    : '';

  return `<article class="post-card"><a class="post-card-link" href="post.html?id=${encodeURIComponent(post.id)}"><div class="post-image">${image || `<span aria-hidden="true">${post.type === 'found' ? '🎒' : '🔍'}</span>`}</div><div class="post-content"><h3>${escapeHTML(post.title)}</h3><p class="post-description">${escapeHTML(post.description || 'Chưa có mô tả')}</p><p>📍 ${escapeHTML(post.place || 'Chưa cập nhật địa điểm')}</p><p>🗓 ${displayDate(post.date)}</p></div></a></article>`;
}

function bindFilters() {
  const grid = $('#post-grid');
  if (!grid) return;

  const isManagePage = page === 'my-posts';
  let filter = 'all';
  const searchTerm = (queryParam('q') || '').trim();
  const query = searchTerm.toLocaleLowerCase('vi');
  const date = queryParam('date') || '';
  const posts = getPosts();

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
      draw();
    });
  });

  function draw() {
    const cutoff = Date.now() - 7 * 86400000;
    const found = posts
      .filter((post) => {
        const haystack = [post.title, post.description, post.place].join(' ').toLocaleLowerCase('vi');
        return (filter === 'all' || filter === 'recent' || post.type === filter)
          && (!query || haystack.includes(query))
          && (!date || post.date === date)
          && (filter !== 'recent' || Number(post.created) >= cutoff);
      })
      .sort((first, second) => Number(second.created) - Number(first.created));

    const title = $('#listing-title');
    const count = $('#result-count');
    if (title && (query || date)) {
      const terms = [searchTerm, date ? displayDate(date) : ''].filter(Boolean);
      title.textContent = `Tìm kiếm: ${terms.join(' · ')}`;
    } else if (title && isManagePage) {
      title.textContent = 'Quản lý bài đăng';
    } else if (title) {
      title.textContent = ({ all: 'Tất cả bài đăng', found: 'Đồ nhặt được', lost: 'Đồ thất lạc', recent: 'Mới nhất' })[filter];
    }
    if (count) count.textContent = `${found.length} bài đăng`;
    grid.innerHTML = found.length
      ? found.map((post) => renderPostCard(post)).join('')
      : '<div class="empty-state">Không tìm thấy bài đăng nào</div>';
  }

  draw();
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function bindPostForm() {
  const id = queryParam('id');
  const form = $('#post-form');
  if (id) {
    form.innerHTML = '<h2>Chức năng chỉnh sửa đã được tắt</h2><p>Bạn vẫn có thể đăng một tin mới.</p><a class="button" href="my-posts.html">Quay lại danh sách</a>';
    return;
  }

  const posts = getPosts();
  const message = $('#form-message');
  let imageData = DEFAULT_POST_IMAGE;
  $('#post-date').value = new Date().toISOString().slice(0, 10);
  $('#post-type').value = queryParam('type') === 'lost' ? 'lost' : 'found';

  const preview = $('#image-preview');
  const showImage = () => {
    preview.innerHTML = imageData ? `<img src="${escapeHTML(imageData)}" alt="Xem trước ảnh bài đăng">` : '';
  };
  showImage();

  $('#post-image').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      imageData = await readImage(file);
      showImage();
      message.textContent = '';
    } catch (error) {
      message.textContent = error.message;
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('#post-title').value.trim();
    const contact = $('#post-contact').value.trim();
    if (!title || !contact) {
      message.textContent = 'Vui lòng nhập tên đồ vật và thông tin liên hệ.';
      return;
    }

    const data = {
      type: $('#post-type').value,
      title,
      description: $('#post-description').value.trim(),
      place: $('#post-place').value.trim(),
      date: $('#post-date').value,
      contact,
      image: imageData,
    };

    const post = {
      id: `p${Date.now()}`,
      ...data,
      status: 'open',
      created: Date.now(),
    };
    if (savePosts([...posts, post])) location.href = 'my-posts.html';
  });
}

function bindPostDetail() {
  const id = queryParam('id');
  const box = $('#post-detail');
  const post = getPosts().find((item) => item.id === id);
  if (!post) {
    box.innerHTML = '<section class="not-found panel"><h1>Không tìm thấy bài đăng</h1><p>Bài đăng có thể đã được xóa.</p><a class="button" href="index.html">Về trang chủ</a></section>';
    return;
  }

  document.title = `${post.title} – ReFind`;
  const image = post.image
    ? `<img class="post-image-file" src="${escapeHTML(post.image)}" alt="Ảnh ${escapeHTML(post.title)}">`
    : '';
  box.innerHTML = `<a class="detail-back" href="index.html">Quay lại</a><section class="detail-layout"><div class="detail-image">${image || `<span aria-hidden="true">${post.type === 'found' ? '🎒' : '🔍'}</span>`}</div><div class="detail-copy"><h1>${escapeHTML(post.title)}</h1><p class="description">${escapeHTML(post.description || 'Chưa có mô tả.')}</p><p><strong>Địa điểm:</strong> ${escapeHTML(post.place || 'Chưa cập nhật')}</p><p><strong>Ngày xảy ra:</strong> ${displayDate(post.date)}</p><p><strong>Liên hệ:</strong> ${escapeHTML(post.contact)}</p></div></section>`;
}

if (page === 'home' || page === 'my-posts') bindFilters();
if (page === 'post-form') bindPostForm();
if (page === 'post') bindPostDetail();
