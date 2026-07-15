import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
import {
  addDoc,
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA8onEy9P7irpJ1V1sufKl1JOabNZn7J1E',
  authDomain: 'portfolio2026-987e6.firebaseapp.com',
  projectId: 'portfolio2026-987e6',
  storageBucket: 'portfolio2026-987e6.firebasestorage.app',
  messagingSenderId: '606722676468',
  appId: '1:606722676468:web:afeb52c1b05ea2a444b0a1',
  measurementId: 'G-2DB036WBT6'
};

const form = document.querySelector('#guestbook-form');
const nameInput = document.querySelector('#guestbook-name');
const messageInput = document.querySelector('#guestbook-message');
const countEl = document.querySelector('#guestbook-count');
const submitButton = document.querySelector('#guestbook-submit');
const statusEl = document.querySelector('#guestbook-status');
const listEl = document.querySelector('#guestbook-list');

if (form && nameInput && messageInput && listEl) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const messagesRef = collection(db, 'guestbook');
  let currentUser = null;

  form.querySelectorAll('input, textarea, button').forEach(element => {
    element.addEventListener('mouseenter', () => document.body.classList.add('ch'));
    element.addEventListener('mouseleave', () => document.body.classList.remove('ch'));
  });

  const setStatus = (message, isError = false) => {
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', isError);
  };

  const formatDate = timestamp => {
    if (!timestamp?.toDate) return '방금 전';
    return new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp.toDate());
  };

  const renderMessages = snapshot => {
    listEl.replaceChildren();
    if (snapshot.empty) {
      const empty = document.createElement('p');
      empty.className = 'guestbook-empty';
      empty.textContent = '첫 번째 메시지를 남겨주세요.';
      listEl.append(empty);
      return;
    }

    snapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const item = document.createElement('article');
      item.className = 'guestbook-item';

      const head = document.createElement('div');
      head.className = 'guestbook-item-head';

      const name = document.createElement('strong');
      name.className = 'guestbook-name';
      name.textContent = data.nickname || 'Anonymous';

      const date = document.createElement('time');
      date.className = 'guestbook-date';
      date.textContent = formatDate(data.createdAt);

      const message = document.createElement('p');
      message.className = 'guestbook-message';
      message.textContent = data.message || '';

      head.append(name, date);
      item.append(head, message);
      listEl.append(item);
    });
  };

  messageInput.addEventListener('input', () => {
    countEl.textContent = `${messageInput.value.length} / 200`;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const nickname = nameInput.value.trim();
    const message = messageInput.value.trim();
    const honeypot = form.elements.website.value;

    if (honeypot) return;
    if (!currentUser) {
      setStatus('Firebase 인증 연결을 확인해주세요.', true);
      return;
    }
    if (!nickname || nickname.length > 20 || !message || message.length > 200) {
      setStatus('닉네임과 200자 이내의 메시지를 확인해주세요.', true);
      return;
    }

    const lastSentAt = Number(localStorage.getItem('guestbookLastSentAt') || 0);
    if (Date.now() - lastSentAt < 60000) {
      setStatus('메시지는 1분에 한 번 등록할 수 있습니다.', true);
      return;
    }

    submitButton.disabled = true;
    setStatus('메시지를 등록하고 있습니다...');

    try {
      await addDoc(messagesRef, {
        nickname,
        message,
        authorId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      localStorage.setItem('guestbookLastSentAt', String(Date.now()));
      messageInput.value = '';
      countEl.textContent = '0 / 200';
      setStatus('메시지가 등록되었습니다. 감사합니다!');
    } catch (error) {
      console.error('Guestbook write failed:', error);
      setStatus('등록하지 못했습니다. Firebase 설정을 확인해주세요.', true);
    } finally {
      submitButton.disabled = false;
    }
  });

  try {
    const credential = await signInAnonymously(auth);
    currentUser = credential.user;
    setStatus('공개 메시지는 최근 8개까지 표시됩니다.');

    const recentMessages = query(messagesRef, orderBy('createdAt', 'desc'), limit(8));
    onSnapshot(recentMessages, renderMessages, error => {
      console.error('Guestbook read failed:', error);
      listEl.innerHTML = '<p class="guestbook-empty">메시지를 불러오지 못했습니다.</p>';
      setStatus('Firestore 보안 규칙과 데이터베이스 상태를 확인해주세요.', true);
    });
  } catch (error) {
    console.error('Anonymous sign-in failed:', error);
    submitButton.disabled = true;
    listEl.innerHTML = '<p class="guestbook-empty">Firebase 연결 설정이 필요합니다.</p>';
    setStatus('Firebase Console에서 익명 로그인을 활성화해주세요.', true);
  }
}
