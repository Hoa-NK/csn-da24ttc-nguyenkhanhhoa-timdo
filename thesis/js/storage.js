/* ReFind demo storage. Posts are saved in this browser's localStorage. */
const STORE_KEYS = {
  posts: 'refind_posts',
};

const DEFAULT_POST_IMAGE = '../assets/default-post.png';

const readStore = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    alert('Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy. Hãy dùng ảnh nhỏ hơn.');
    return false;
  }
};

const getPosts = () => {
  const storedPosts = readStore(STORE_KEYS.posts, null);
  const posts = Array.isArray(storedPosts) ? storedPosts : [];
  const now = Date.now();
  const day = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
  const demos = [
    {
      id: 'sample-found', type: 'found', title: 'Ví da màu đen',
      description: 'Nhặt được ở căng tin B3. Người nhận vui lòng mô tả đặc điểm bên trong.',
      place: 'Căng tin B3', date: day(1), contact: '0327237617', image: '../assets/vida.png',
      status: 'open', created: now - 86400000,
    },
    {
      id: 'sample-lost', type: 'lost', title: 'Tai nghe không dây màu trắng',
      description: 'Thất lạc sau giờ học ở phòng B21.202.',
      place: 'Phòng B21.202', date: day(3), contact: '0383640212', image: '../assets/tainghe.png',
      status: 'open', created: now - 3 * 86400000,
    },
    {
      id: 'sample-found-umbrella', type: 'found', title: 'Ô gấp màu cam',
      description: 'Nhặt được chiếc ô gấp ở phòng C6.201. Vui lòng liên hệ để nhận lại.',
      place: 'phòng C6.201', date: day(2), contact: '0384385353', image: '../assets/dugap.png',
      status: 'open', created: now - 2 * 86400000,
    },
    {
      id: 'sample-lost-keys', type: 'lost', title: 'Chùm chìa khóa',
      description: 'Làm rơi chùm chìa khóa nhỏ trên đường từ thư viện đến căn tin.',
      place: 'Thư viện hoặc căn tin', date: day(4), contact: '0972283316', image: '../assets/chiakhoa.png',
      status: 'open', created: now - 4 * 86400000,
    },
    {
      id: 'sample-found-bottle', type: 'found', title: 'Bình nước inox màu bạc',
      description: 'Tìm thấy bình nước inox ở phòng thực hành. Có dán nhãn tên ở đáy bình.',
      place: 'Phòng thực hành B203', date: day(5), contact: '0379423178', image: '../assets/binhnuoc.png',
      status: 'open', created: now - 5 * 86400000,
    },
  ];

  let changed = !Array.isArray(storedPosts);
  for (const demo of demos) {
    const index = posts.findIndex((post) => post.id === demo.id);
    if (index === -1) {
      posts.push(demo);
      changed = true;
    } else if (demo.image && posts[index].image !== demo.image) {
      posts[index] = { ...posts[index], image: demo.image };
      changed = true;
    }
  }

  if (changed) writeStore(STORE_KEYS.posts, posts);

  return posts.map((post) => ({
    ...post,
    description: post.description ?? post.desc ?? '',
    image: post.image || post.img || DEFAULT_POST_IMAGE,
  }));
};

const savePosts = (posts) => writeStore(STORE_KEYS.posts, posts);

const escapeHTML = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const queryParam = (key) => new URLSearchParams(location.search).get(key);

const displayDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString('vi-VN');
};

