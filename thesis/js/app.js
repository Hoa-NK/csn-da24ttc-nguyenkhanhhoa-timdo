const $=selector=>document.querySelector(selector);
const page=document.body.dataset.page;
const DEFAULT_ADMIN_USERNAME='admin';
const DEFAULT_ADMIN_PASSWORD='ReFind@Admin2026!';
function ensureDefaultAdmin(){
  const users=getUsers();
  if(users.some(user=>user.id==='refind-admin'))return;
  users.push({id:'refind-admin',name:'Quản trị viên',username:DEFAULT_ADMIN_USERNAME,email:'admin@refind.local',passwordHash:hashPassword(DEFAULT_ADMIN_PASSWORD),role:'admin'});
  saveUsers(users);
}
ensureDefaultAdmin();
const currentUser=getMe();
const isAdmin=()=>Boolean(currentUser&&getUsers().some(user=>user.id===currentUser.id&&user.role==='admin'));
const safeNext=()=>{const next=queryParam('next')||'index.html';
  return ['index.html','my-posts.html','account.html'].includes(next)||/^post-form\.html(?:\?type=(?:lost|found))?$/.test(next)?next:'index.html'};

function renderLayout(){
  const header=$('#site-header');
  if(header){
    const actions=$('#nav-actions');
    if(currentUser)actions.innerHTML=`<div class="account-menu"><button type="button" class="account-trigger" id="account-trigger" aria-expanded="false" aria-controls="account-dropdown"><svg class="person-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/><path d="M4.8 20c.6-3.6 3.2-5.5 7.2-5.5s6.6 1.9 7.2 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="account-name">${escapeHTML(currentUser.name)}</span><span class="chevron" aria-hidden="true">▼</span></button><div class="account-dropdown" id="account-dropdown" hidden><a href="account.html">Thông tin tài khoản</a><a href="my-posts.html">${isAdmin()?'Quản lý bài đăng':'Bài đăng của tôi'}</a><button type="button" class="logout-item" id="logout-button">Đăng xuất</button></div></div>`;
    const lostLink=$('#report-lost'),foundLink=$('#report-found');
    if(currentUser&&lostLink&&foundLink){lostLink.href='post-form.html?type=lost';
      foundLink.href='post-form.html?type=found'}
    const q=$('#search-query'),date=$('#search-date');
    const datePicker=$('#search-date-native');
    q.value=queryParam('q')||'';
    date.value=queryParam('date')?displayDate(queryParam('date')):'';
    datePicker.value=queryParam('date')||'';
    date.addEventListener('input',()=>{
      date.setCustomValidity('');
      datePicker.value=parseFormDate(date.value)||'';
    });
    datePicker.addEventListener('change',()=>{
      date.value=datePicker.value?displayDate(datePicker.value):'';
      date.setCustomValidity('');
    });
    $('#search-form').addEventListener('submit',event=>{event.preventDefault();
      goSearch(q.value,date.value)});
    $('#date-toggle').addEventListener('click',()=>{const pop=$('#date-popover'),show=pop.hidden;
      pop.hidden=!show;
      $('#date-toggle').setAttribute('aria-expanded',String(show));
      if(show)date.focus()});
    $('.apply-date').addEventListener('click',()=>goSearch(q.value,date.value));
    $('#clear-date').addEventListener('click',()=>{date.value='';
      datePicker.value='';
      goSearch(q.value,'')});
    if(currentUser){
      const trigger=$('#account-trigger'),menu=$('#account-dropdown');
      trigger.addEventListener('click',()=>{const open=menu.hidden;
        menu.hidden=!open;
        trigger.setAttribute('aria-expanded',String(open))});
      $('#logout-button').addEventListener('click',()=>{if(confirm('Bạn có chắc muốn đăng xuất khỏi ReFind?'))signOut()});
      document.addEventListener('click',event=>{if(!event.target.closest('.account-menu')){menu.hidden=true;
          trigger.setAttribute('aria-expanded','false')}});
      document.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.hidden=true;
          trigger.setAttribute('aria-expanded','false')}});
    }
  }
  const footer=$('#site-footer');
  if(footer)footer.textContent='ReFind';
}
function goSearch(q,date){const dateInput=$('#search-date'),normalizedDate=date?parseFormDate(date):'';
  if(date&&!normalizedDate){dateInput.setCustomValidity('Ngày cần đúng định dạng dd/mm/yyyy và là ngày hợp lệ.');
    dateInput.reportValidity();
    return}
  const target=new URL('index.html',location.href);
  if(q.trim())target.searchParams.set('q',q.trim());
  if(normalizedDate)target.searchParams.set('date',normalizedDate);
  location.href=target.href}
renderLayout();

function renderPostCard(post,mine=false){
  const image=post.image?`<img class="post-image-file" src="${escapeHTML(post.image)}" alt="Ảnh ${escapeHTML(post.title)}" loading="lazy">`:'';
  return `<article class="post-card"><a class="post-card-link" href="post.html?id=${encodeURIComponent(post.id)}"><div class="post-image">${image||'<span aria-hidden="true">'+(post.type==='found'?'🎒':'🔍')+'</span>'}<div class="post-badges"><span class="tag tag-type">${typeLabel(post.type)}</span><span class="tag ${post.status==='done'?'status-done':'status-open'}">${statusLabel(post)}</span></div></div><div class="post-content"><h3>${escapeHTML(post.title)}</h3><p class="post-description">${escapeHTML(post.description||'Chưa có mô tả')}</p><p>${escapeHTML(post.place||'Chưa cập nhật địa điểm')}</p><p>${displayDate(post.date)}</p></div></a>${mine?`<div class="post-card-actions"><a class="button button-outline" href="post-form.html?id=${encodeURIComponent(post.id)}">Chỉnh sửa</a><button class="button button-danger delete-post" type="button" data-id="${escapeHTML(post.id)}">Xóa tin</button></div>`:''}</article>`;
}
function bindFilters(){
  const grid=$('#post-grid');
  if(!grid)return;
  const isMine=page==='my-posts';
  if(isMine&&!currentUser){location.replace('login.html?next=my-posts.html');
    return}let filter='all';
  const searchTerm=(queryParam('q')||'').trim(),q=searchTerm.toLocaleLowerCase('vi'),date=queryParam('date')||'';
  const all=getPosts();
  let visible=isMine?all.filter(post=>currentUser&&(isAdmin()||post.owner===currentUser.id)):all;
  if(isMine&&isAdmin()){
    const heading=document.querySelector('.my-posts-bar h1');
    if(heading)heading.textContent='Quản lý bài đăng';
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('is-active',item===button));
    draw()}));
  function draw(){
    const cutoff=Date.now()-7*86400000;
    const found=visible.filter(post=>{
      const haystack=[post.title,post.description,post.place].join(' ').toLocaleLowerCase('vi');
      return(filter==='all'||filter==='recent'?true:post.type===filter)&&(!q||haystack.includes(q))&&(!date||post.date===date)&&(filter!=='recent'||Number(post.created)>=cutoff);
    }).sort((a,b)=>Number(b.created)-Number(a.created));
    const title=$('#listing-title'),count=$('#result-count');
    if(title&&(q||date)){
      const terms=[searchTerm,date?displayDate(date):''].filter(Boolean);
      title.textContent=`Tìm kiếm: ${terms.join(' · ')}`;
    }else if(title&&isMine)title.textContent='Bài đăng của bạn';
    else if(title)title.textContent=({all:'Tất cả bài đăng',found:'Đồ nhặt được',lost:'Đồ thất lạc',recent:'Mới nhất'})[filter];
    if(count)count.textContent=`${found.length} bài đăng`;
    grid.innerHTML=found.length?found.map(post=>renderPostCard(post,isMine)).join(''):'<div class="empty-state">Không tìm thấy bài đăng nào</div>';
    grid.querySelectorAll('.delete-post').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Bạn có chắc muốn xóa bài đăng này? Hành động này không thể hoàn tác.'))return;
      const latest=getPosts().filter(post=>post.id!==button.dataset.id);
      if(savePosts(latest))draw()}));
  }
  draw();
}

function bindLogin(){
  if(getMe()){location.replace('index.html');
    return}
  $('#login-form').addEventListener('submit',event=>{event.preventDefault();
    const identity=$('#identity').value.trim().toLowerCase(),password=$('#password').value;
    const user=getUsers().find(item=>item.passwordHash===hashPassword(password)&&(item.email.toLowerCase()===identity||(item.username||'').toLowerCase()===identity));
    const message=$('#form-message');
    if(!user){message.textContent='Tên đăng nhập/email hoặc mật khẩu chưa chính xác.';
      return}if(setMe({id:user.id,name:user.name,role:user.role||'user'})){location.href=safeNext()}});
}
function bindRegister(){
  if(getMe()){location.replace('index.html');
    return}
  $('#register-form').addEventListener('submit',event=>{event.preventDefault();
    const name=$('#name').value.trim(),username=$('#username').value.trim().toLowerCase(),email=$('#email').value.trim().toLowerCase(),password=$('#password').value,message=$('#form-message');
    if(!name){message.textContent='Vui lòng nhập họ tên.';
      return}if(!/^[a-z0-9_.-]{3,24}$/.test(username)){message.textContent='Tên đăng nhập cần có 3–24 ký tự hợp lệ.';
      return}if(!/^\S+@\S+\.\S+$/.test(email)){message.textContent='Email chưa đúng định dạng.';
      return}if(password.length<6){message.textContent='Mật khẩu cần có ít nhất 6 ký tự.';
      return}if(password!==$('#password-confirm').value){message.textContent='Mật khẩu nhập lại chưa khớp.';
      return}const users=getUsers();
    if(users.some(user=>user.email.toLowerCase()===email)){message.textContent='Email này đã có tài khoản.';
      return}if(users.some(user=>(user.username||'').toLowerCase()===username)){message.textContent='Tên đăng nhập này đã được sử dụng.';
      return}const user={id:`u${Date.now()}`,name,username,email,passwordHash:hashPassword(password)};
    users.push(user);
    if(saveUsers(users)&&setMe({id:user.id,name:user.name,role:'user'}))location.href='index.html'});
}
function bindAccount(){
  const user=getUsers().find(item=>currentUser&&item.id===currentUser.id);
  if(!user){location.replace('login.html?next=account.html');
    return}
  $('#name').value=user.name;
  $('#username').value=user.username||'';
  $('#email').value=user.email;
  $('#account-form').addEventListener('submit',event=>{event.preventDefault();
    const name=$('#name').value.trim(),username=$('#username').value.trim().toLowerCase(),email=$('#email').value.trim().toLowerCase(),password=$('#password').value,message=$('#form-message');
    if(!name){message.textContent='Vui lòng nhập họ tên.';
      return}if(!/^[a-z0-9_.-]{3,24}$/.test(username)){message.textContent='Tên đăng nhập cần có 3–24 ký tự hợp lệ.';
      return}if(!/^\S+@\S+\.\S+$/.test(email)){message.textContent='Email chưa đúng định dạng.';
      return}const users=getUsers();
    if(users.some(item=>item.id!==user.id&&item.email.toLowerCase()===email)){message.textContent='Email này đã được tài khoản khác sử dụng.';
      return}if(users.some(item=>item.id!==user.id&&(item.username||'').toLowerCase()===username)){message.textContent='Tên đăng nhập này đã được sử dụng.';
      return}if(password&&password.length<6){message.textContent='Mật khẩu mới cần có ít nhất 6 ký tự.';
      return}const updated={...user,name,username,email,passwordHash:password?hashPassword(password):user.passwordHash};
    const nextUsers=users.map(item=>item.id===user.id?updated:item);
    if(!saveUsers(nextUsers))return;
    setMe({id:user.id,name});
    const posts=getPosts().map(post=>post.owner===user.id?{...post,ownerName:name}:post);
    savePosts(posts);
    message.className='form-message success';
    message.textContent='Đã lưu thông tin tài khoản.';
    $('#password').value='';
    const label=$('.account-name');
    if(label)label.textContent=name});
}
function readImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();
    reader.onerror=()=>reject(new Error('Không đọc được ảnh.'));
    reader.onload=()=>{const image=new Image();
      image.onerror=()=>reject(new Error('Tệp ảnh không hợp lệ.'));
      image.onload=()=>{const scale=Math.min(1,1200/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
        canvas.width=Math.round(image.width*scale);
        canvas.height=Math.round(image.height*scale);
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',.78))};
      image.src=reader.result};
    reader.readAsDataURL(file)})}
const TVU_CAMPUS_CENTER=[9.922,106.347];
function validCoordinates(latitude,longitude){
  return latitude!==null&&latitude!==undefined&&latitude!==''&&longitude!==null&&longitude!==undefined&&longitude!==''&&Number.isFinite(Number(latitude))&&Number.isFinite(Number(longitude))&&Math.abs(Number(latitude))<=90&&Math.abs(Number(longitude))<=180
}
function createLocationMap({container,latitude,longitude,latitudeInput,longitudeInput,feedback,readOnly=false}){
  if(!window.L){if(feedback)feedback.textContent='Không tải được thư viện bản đồ. Bạn vẫn có thể nhập địa điểm bằng chữ.';
    return null}
  const hasSavedLocation=validCoordinates(latitude,longitude);
  const initialCenter=hasSavedLocation?[Number(latitude),Number(longitude)]:TVU_CAMPUS_CENTER;
  const map=L.map(container,{scrollWheelZoom:false}).setView(initialCenter,hasSavedLocation?18:17);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  let marker=null;
  let chosenCoordinates=hasSavedLocation?{latitude:Number(latitude),longitude:Number(longitude)}:null;
  const showCoordinates=()=>{
    if(feedback)feedback.textContent=chosenCoordinates
      ?`Đã ghim vị trí: ${chosenCoordinates.latitude.toFixed(6)}, ${chosenCoordinates.longitude.toFixed(6)}`
      :'Nhấn vào bản đồ để ghim vị trí.';
  };
  const setMarker=(point,center=false)=>{
    const latlng=Array.isArray(point)?point:[point.lat,point.lng];
    chosenCoordinates={latitude:Number(latlng[0]),longitude:Number(latlng[1])};
    if(latitudeInput)latitudeInput.value=chosenCoordinates.latitude;
    if(longitudeInput)longitudeInput.value=chosenCoordinates.longitude;
    if(marker)marker.setLatLng(latlng);
    else if(!readOnly){
      marker=L.marker(latlng,{draggable:true}).addTo(map);
      marker.on('dragend',()=>setMarker(marker.getLatLng()));
    }else marker=L.marker(latlng).addTo(map);
    if(center)map.setView(latlng,18);
    showCoordinates();
  };
  if(hasSavedLocation)setMarker(initialCenter);
  if(!readOnly){
    map.on('click',event=>setMarker(event.latlng));
    const locateButton=$('#use-current-location');
    if(locateButton)locateButton.addEventListener('click',()=>{
      if(!navigator.geolocation){if(feedback)feedback.textContent='Trình duyệt này không hỗ trợ định vị.';
        return}
      locateButton.disabled=true;
      if(feedback)feedback.textContent='Đang xác định vị trí…';
      navigator.geolocation.getCurrentPosition(position=>{
        setMarker([position.coords.latitude,position.coords.longitude],true);
        locateButton.disabled=false;
      },error=>{
        const message=error.code===1?'Bạn chưa cho phép truy cập vị trí.':error.code===3?'Không nhận được vị trí kịp thời.':'Không xác định được vị trí thiết bị.';
        if(feedback)feedback.textContent=`${message} Bạn có thể nhấn trực tiếp lên bản đồ.`;
        locateButton.disabled=false;
      },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
    });
  }
  showCoordinates();
  setTimeout(()=>map.invalidateSize(),0);
  return {map,getCoordinates:()=>chosenCoordinates};
}
function bindPostForm(){
  if(!currentUser){location.replace(`login.html?next=${encodeURIComponent(location.pathname.split('/').pop()+location.search)}`);
    return}
  const id=queryParam('id'),posts=getPosts(),existing=id?posts.find(post=>post.id===id):null,message=$('#form-message'),form=$('#post-form');
  if(id&&(!existing||(existing.owner!==currentUser.id&&!isAdmin()))){form.innerHTML='<h2>Không có quyền chỉnh sửa</h2><p>Chỉ người đăng tin hoặc quản trị viên được chỉnh sửa bài này.</p><a class="button" href="my-posts.html">Quay lại bài đăng của tôi</a>';
    return}
  let imageData=existing?.image||DEFAULT_POST_IMAGE;
  if(existing){$('#post-form-title').textContent='Chỉnh sửa bài đăng';
    $('#save-post').textContent='Lưu thay đổi';
    $('#post-type').value=existing.type;
    $('#post-title').value=existing.title;
    $('#post-description').value=existing.description||'';
    $('#post-place').value=existing.place||'';
    $('#post-date').value=existing.date?displayDate(existing.date):'';
    $('#post-contact').value=existing.contact||'';
    $('#post-latitude').value=existing.latitude??'';
    $('#post-longitude').value=existing.longitude??'';
  }
  else{$('#post-date').value=displayDate(localDateInputValue());
    $('#post-type').value=queryParam('type')==='lost'?'lost':'found'}
  const mapFeedback=$('#map-feedback');
  const locationMap=createLocationMap({
    container:$('#post-location-map'),
    latitude:existing?.latitude,
    longitude:existing?.longitude,
    latitudeInput:$('#post-latitude'),
    longitudeInput:$('#post-longitude'),
    feedback:mapFeedback
  });
  const preview=$('#image-preview');
  const showImage=()=>{preview.innerHTML=imageData?`<img src="${escapeHTML(imageData)}" alt="Xem trước ảnh bài đăng">`:''};
  showImage();
  $('#post-image').addEventListener('change',async event=>{const file=event.target.files[0];
    if(!file)return;
    try{imageData=await readImage(file);
      showImage();
      message.textContent=''}catch(error){message.textContent=error.message}});
  form.addEventListener('submit',event=>{event.preventDefault();
    const title=$('#post-title').value.trim(),contact=$('#post-contact').value.trim();
    if(!title||!contact){message.textContent='Vui lòng nhập tên đồ vật và thông tin liên hệ.';
      return}const dateInput=$('#post-date').value.trim(),date=parseFormDate(dateInput);
    if(dateInput&&!date){message.textContent='Ngày cần đúng định dạng dd/mm/yyyy và là ngày hợp lệ.';
      return}const coordinates=locationMap?.getCoordinates()||(validCoordinates(existing?.latitude,existing?.longitude)?{latitude:Number(existing.latitude),longitude:Number(existing.longitude)}:null);
    const data={type:$('#post-type').value,title,description:$('#post-description').value.trim(),place:$('#post-place').value.trim(),date:date||'',contact,image:imageData,latitude:coordinates?.latitude??null,longitude:coordinates?.longitude??null};
    if(existing){const next=posts.map(post=>post.id===id?{...post,...data}:post);
      if(savePosts(next))location.href=`post.html?id=${encodeURIComponent(id)}`}else{const post={id:`p${Date.now()}`,...data,status:'open',owner:currentUser.id,ownerName:currentUser.name,created:Date.now()};
      if(savePosts([...posts,post]))location.href='my-posts.html'}});
}
function localDateInputValue(date=new Date()){
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}
function parseFormDate(value){
  const match=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match)return null;
  const [,day,month,year]=match;
  const date=new Date(Number(year),Number(month)-1,Number(day));
  if(date.getFullYear()!==Number(year)||date.getMonth()!==Number(month)-1||date.getDate()!==Number(day))return null;
  return `${year}-${month}-${day}`;
}
function bindPostDetail(){
  const id=queryParam('id'),box=$('#post-detail'),post=getPosts().find(item=>item.id===id);
  if(!post){box.innerHTML='<section class="not-found panel"><h1>Không tìm thấy bài đăng</h1><p>Bài đăng có thể đã được xóa.</p><a class="button" href="index.html">Về trang chủ</a></section>';
    return}
  document.title=`${post.title} – ReFind`;
  const own=currentUser&&currentUser.id===post.owner;
  const image=post.image?`<img class="post-image-file" src="${escapeHTML(post.image)}" alt="Ảnh ${escapeHTML(post.title)}">`:'';
  const hasLocation=validCoordinates(post.latitude,post.longitude);
  const mapLink=hasLocation?`<a class="map-open-link" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(post.latitude)}&mlon=${encodeURIComponent(post.longitude)}#map=18/${encodeURIComponent(post.latitude)}/${encodeURIComponent(post.longitude)}" target="_blank" rel="noopener">Mở vị trí trên OpenStreetMap</a>`:'';
  const canManage=Boolean(own||isAdmin());
  const management=canManage?`<div class="detail-actions"><label class="sr-only" for="post-status">Trạng thái bài đăng</label><select id="post-status"><option value="open">${post.type==='found'?'Đang giữ':'Đang tìm'}</option><option value="done">${post.type==='found'?'Đã trả lại':'Đã tìm thấy'}</option></select><a class="button button-outline" href="post-form.html?id=${encodeURIComponent(post.id)}">Chỉnh sửa</a><button class="button button-danger" id="delete-detail-post" type="button">Xóa tin</button></div>`:'';
  box.innerHTML=`<a class="detail-back" href="index.html">Quay lại</a><section class="detail-layout"><div class="detail-image">${image||'<span aria-hidden="true">'+(post.type==='found'?'🎒':'🔍')+'</span>'}</div><div class="detail-copy"><div class="detail-badges"><span class="tag tag-type">${typeLabel(post.type)}</span><span class="tag ${post.status==='done'?'status-done':'status-open'}">${statusLabel(post)}</span></div><h1>${escapeHTML(post.title)}</h1><p class="description">${escapeHTML(post.description||'Chưa có mô tả.')}</p><p><strong>Địa điểm:</strong> ${escapeHTML(post.place||'Chưa cập nhật')}</p><p><strong>Ngày xảy ra:</strong> ${displayDate(post.date)}</p><p><strong>Liên hệ:</strong> ${escapeHTML(post.contact)}</p>${management}</div></section><section class="detail-map-section"><h2>Vị trí</h2><div id="detail-location-map" class="detail-location-map" aria-label="Bản đồ vị trí bài đăng"></div>${mapLink}</section>`;
  createLocationMap({
    container:$('#detail-location-map'),
    latitude:post.latitude,
    longitude:post.longitude,
    feedback:null,
    readOnly:true
  });
  if(canManage){const status=$('#post-status');
    status.value=post.status;
    status.addEventListener('change',()=>{const posts=getPosts().map(item=>item.id===id?{...item,status:status.value}:item);
      savePosts(posts);
      location.reload()});
    $('#delete-detail-post').addEventListener('click',()=>{if(!confirm('Bạn có chắc muốn xóa bài đăng này? Hành động này không thể hoàn tác.'))return;
      if(savePosts(getPosts().filter(item=>item.id!==id)))location.href='my-posts.html'})}
}
if(page==='home'||page==='my-posts')bindFilters();
if(page==='login')bindLogin();
if(page==='register')bindRegister();
if(page==='account')bindAccount();
if(page==='post-form')bindPostForm();
if(page==='post')bindPostDetail();

