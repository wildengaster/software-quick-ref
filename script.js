// ===== 前台交互逻辑（接入后端 API）=====

const API = '/api';

// ===== API 请求封装 =====
async function fetchData(path, options = {}) {
  try {
    const res = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    return await res.json();
  } catch (e) {
    console.error('API请求失败:', path, e);
    return null;
  }
}

// ===== 全局数据缓存 =====
let softwareData = {};
let allTutorials = [];
let allErrors = [];
let tutorialIndexMap = [];

// ===== 初始化页面 =====
document.addEventListener('DOMContentLoaded', async function() {
  await loadData();
  renderStats();
  renderFeatures();
  renderSoftwareCards();
  renderTutorialFilters();
  renderTutorialsFromData('all');
  renderErrorFilters();
  renderErrorsFromData('all');
  initScrollEffects();
  initNavScroll();
  recordView('首页');
});

// ===== 从后端加载数据 =====
async function loadData() {
  const [software, tutorials, errors] = await Promise.all([
    fetchData(`${API}/software`),
    fetchData(`${API}/tutorials`),
    fetchData(`${API}/errors`)
  ]);

  if (software) {
    software.forEach(sw => {
      softwareData[sw.id] = sw;
      softwareData[sw.id].tutorials = tutorials ? tutorials.filter(t => t.softwareId === sw.id) : [];
    });
  }

  allTutorials = tutorials || [];
  allErrors = errors || [];
}

// ===== 记录页面访问 =====
function recordView(page) {
  fetchData(`${API}/stats/view`, {
    method: 'POST',
    body: JSON.stringify({ page })
  });
}

// ===== 渲染统计数据 =====
function renderStats() {
  const container = document.getElementById('heroStats');
  const swCount = Object.keys(softwareData).length;
  const tutCount = allTutorials.length;
  const errCount = allErrors.length;
  container.innerHTML = [
    { number: swCount, label: '专业软件' },
    { number: tutCount + '+', label: '操作教程' },
    { number: errCount + '+', label: '报错方案' },
    { number: '100%', label: '手机适配' }
  ].map(stat => `
    <div class="stat-item">
      <div class="stat-number">${stat.number}</div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join('');
}

// ===== 功能特色数据 =====
const features = [
  { icon: "📂", title: "分类展示", desc: "按专业软件分类，快速定位所需工具的操作指南" },
  { icon: "🔍", title: "关键词检索", desc: "输入报错信息或操作关键词，秒级匹配解决方案" },
  { icon: "📱", title: "手机适配", desc: "响应式设计，手机横屏查看操作截图，随时随地查阅" },
  { icon: "🔒", title: "版本适配", desc: "每个教程标注适用版本，告别版本不匹配的困扰" },
  { icon: "⚡", title: "极速查阅", desc: "精简图文步骤，告别冗长视频教程，一键直达答案" },
  { icon: "🛡️", title: "报错专区", desc: "高频报错集中整理，支持学生投稿，学长学姐审核" }
];

// ===== 渲染功能特色 =====
function renderFeatures() {
  const container = document.getElementById('featuresGrid');
  container.innerHTML = features.map((f, i) => `
    <div class="feature-card fade-in" style="animation-delay: ${i * 0.1}s;">
      <span class="feature-icon">${f.icon}</span>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>
  `).join('');
}

// ===== 渲染软件分类卡片 =====
function renderSoftwareCards() {
  const container = document.getElementById('softwareGrid');
  container.innerHTML = Object.values(softwareData).map(sw => {
    const errorCount = allErrors.filter(e => e.softwareId === sw.id).length;
    return `
      <div class="software-card fade-in" style="--card-color: ${sw.color}; --card-bg: ${sw.bgColor};" onclick="scrollToSoftware('${sw.id}')">
        <span class="software-icon">${sw.icon}</span>
        <h3>${sw.name}</h3>
        <div class="software-version">${sw.version}</div>
        <p>${sw.description}</p>
        <div class="software-meta">
          <span>📖 ${sw.tutorials.length} 个教程</span>
          <span>🛡️ ${errorCount} 个报错方案</span>
        </div>
      </div>
    `;
  }).join('');
}

// ===== 滚动到指定软件教程 =====
function scrollToSoftware(key) {
  filterTutorials(key, null);
  document.getElementById('tutorials').scrollIntoView({ behavior: 'smooth' });
}

function filterBySoftware(key) {
  scrollToSoftware(key);
}

// ===== 渲染教程筛选按钮 =====
function renderTutorialFilters() {
  const container = document.getElementById('tutorialFilters');
  let html = '<button class="filter-btn active" onclick="filterTutorials(\'all\', this)">全部</button>';
  Object.values(softwareData).forEach(sw => {
    html += `<button class="filter-btn" onclick="filterTutorials('${sw.id}', this)">${sw.icon} ${sw.name.split('/')[0].trim()}</button>`;
  });
  container.innerHTML = html;
}

// ===== 筛选教程 =====
function filterTutorials(softwareKey, btn) {
  if (btn) {
    document.querySelectorAll('#tutorialFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    document.querySelectorAll('#tutorialFilters .filter-btn').forEach(b => {
      b.classList.remove('active');
      const match = b.getAttribute('onclick')?.match(/'([^']+)'/);
      if ((softwareKey === 'all' && b.textContent === '全部') || (match && match[1] === softwareKey)) {
        b.classList.add('active');
      }
    });
  }
  renderTutorialsFromData(softwareKey);
}

// ===== 渲染教程卡片 =====
function renderTutorialsFromData(softwareKey) {
  const container = document.getElementById('tutorialsContainer');
  let tutorials = [];

  if (softwareKey === 'all') {
    allTutorials.forEach(t => {
      const sw = softwareData[t.softwareId];
      tutorials.push({ ...t, software: sw });
    });
  } else {
    allTutorials.filter(t => t.softwareId === softwareKey).forEach(t => {
      const sw = softwareData[t.softwareId];
      tutorials.push({ ...t, software: sw });
    });
  }

  tutorialIndexMap = tutorials;

  container.innerHTML = tutorials.map((t, i) => `
    <div class="tutorial-card fade-in" style="--card-color: ${t.software.color}; animation-delay: ${i * 0.05}s;" onclick="openTutorial(${i})">
      <div class="tutorial-card-header">
        <span class="tutorial-software-badge" style="background: ${t.software.bgColor}; color: ${t.software.color};">
          ${t.software.icon} ${t.software.name.split('/')[0].trim()}
        </span>
        <span class="tutorial-difficulty ${t.difficulty}">${t.difficulty}</span>
      </div>
      <h4>${t.title}</h4>
      <div class="tutorial-preview">${t.steps[0].text}</div>
      <div class="tutorial-steps-count">
        <span>📋 ${t.steps.length} 步</span>
        <span class="tutorial-view-btn">查看详情 →</span>
      </div>
    </div>
  `).join('');
}

// ===== 打开教程详情 =====
function openTutorial(index) {
  const t = tutorialIndexMap[index];
  if (!t) return;

  document.getElementById('tutorialModalTitle').textContent = t.title;
  document.getElementById('tutorialModalMeta').innerHTML = `
    ${t.software.icon} ${t.software.name} · ${t.software.version} · 难度：${t.difficulty}
  `;

  const body = document.getElementById('tutorialModalBody');
  body.innerHTML = t.steps.map((step, i) => `
    <div class="tutorial-step">
      <div class="step-number">${i + 1}</div>
      <div class="step-content">
        <div class="step-text">${step.text}</div>
        <div class="step-image-placeholder"></div>
      </div>
    </div>
  `).join('');

  document.getElementById('tutorialModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTutorialModal() {
  document.getElementById('tutorialModal').style.display = 'none';
  document.body.style.overflow = '';
}

// ===== 渲染报错筛选按钮 =====
function renderErrorFilters() {
  const container = document.getElementById('errorFilters');
  let html = '<button class="filter-btn active" onclick="filterErrors(\'all\', this)">全部</button>';
  Object.values(softwareData).forEach(sw => {
    html += `<button class="filter-btn" onclick="filterErrors('${sw.id}', this)">${sw.icon} ${sw.name.split('/')[0].trim()}</button>`;
  });
  container.innerHTML = html;
}

// ===== 报错筛选状态 =====
let currentErrorFilter = 'all';
let currentErrorSearch = '';

function filterErrors(softwareKey, btn) {
  currentErrorFilter = softwareKey;
  if (btn) {
    document.querySelectorAll('#errorFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderErrorsFromData(softwareKey, currentErrorSearch);
}

function searchErrors() {
  currentErrorSearch = document.getElementById('errorSearchInput').value.toLowerCase().trim();
  renderErrorsFromData(currentErrorFilter, currentErrorSearch);
}

// ===== 渲染报错卡片 =====
function renderErrorsFromData(softwareKey, searchQuery) {
  const container = document.getElementById('errorsGrid');
  const noResults = document.getElementById('noResults');

  let errors = allErrors.filter(e => {
    const matchSoftware = softwareKey === 'all' || e.softwareId === softwareKey;
    const matchSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery) ||
      e.keyword.toLowerCase().includes(searchQuery) ||
      e.solution.some(s => s.toLowerCase().includes(searchQuery));
    return matchSoftware && matchSearch;
  });

  if (errors.length === 0) {
    container.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  const severityMap = {
    high: { label: '高频', color: '#c62828', bg: '#ffebee' },
    medium: { label: '常见', color: '#f57f17', bg: '#fff8e1' },
    low: { label: '偶尔', color: '#2e7d32', bg: '#e8f5e9' }
  };

  container.innerHTML = errors.map((e, i) => {
    const sw = softwareData[e.softwareId];
    const sev = severityMap[e.severity];
    const solutionId = `error-solution-${i}`;
    return `
      <div class="error-card fade-in" style="--severity-color: ${sev.color}; animation-delay: ${i * 0.05}s;">
        <div class="error-card-header">
          <h4>${highlightText(e.title, searchQuery)}</h4>
          <span class="error-severity ${e.severity}">${sev.label}</span>
        </div>
        <div class="error-meta">
          <span class="error-software-tag" style="background: ${sw.bgColor}; color: ${sw.color};">
            ${sw.icon} ${sw.name.split('/')[0].trim()}
          </span>
          <span class="error-version">📌 适用：${e.version}</span>
          ${e.contributor ? `<span style="color:var(--text-light);">✍️ 投稿：${e.contributor}</span>` : ''}
        </div>
        <div class="error-solution-preview" id="${solutionId}-preview">
          <ol>
            ${e.solution.slice(0, 2).map(s => `<li>${highlightText(s, searchQuery)}</li>`).join('')}
          </ol>
        </div>
        <div class="error-full-solution" id="${solutionId}-full">
          <ol>
            ${e.solution.map(s => `<li>${highlightText(s, searchQuery)}</li>`).join('')}
          </ol>
        </div>
        ${e.solution.length > 2 ? `
          <button class="error-expand-btn" onclick="toggleErrorSolution('${solutionId}', this)">
            查看全部 ${e.solution.length} 步解决方案 ↓
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ===== 高亮搜索关键词 =====
function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background: #fff59d; padding: 1px 4px; border-radius: 3px;">$1</mark>');
}

// ===== 展开/收起报错方案 =====
function toggleErrorSolution(solutionId, btn) {
  const preview = document.getElementById(`${solutionId}-preview`);
  const full = document.getElementById(`${solutionId}-full`);

  if (full.classList.contains('show')) {
    full.classList.remove('show');
    preview.style.display = 'block';
    btn.textContent = '查看全部解决方案 ↓';
  } else {
    full.classList.add('show');
    preview.style.display = 'none';
    btn.textContent = '收起 ↑';
  }
}

// ===== 全局搜索（接入后端）=====
async function performSearch(query) {
  query = query.toLowerCase().trim();
  if (!query) return;

  const data = await fetchData(`${API}/search?q=${encodeURIComponent(query)}`);

  const modal = document.getElementById('searchModal');
  const title = document.getElementById('searchModalTitle');
  const body = document.getElementById('searchModalBody');

  const total = data ? data.total : 0;
  title.textContent = `搜索 "${query}" 的结果（${total} 条）`;

  if (!data || total === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-light);">
        <p style="font-size: 48px; margin-bottom: 16px;">🔍</p>
        <p>没有找到与 "${query}" 相关的内容</p>
        <p style="font-size: 14px; margin-top: 8px;">试试搜索软件名称（如 Python、MySQL）或报错关键词（如 pip、乱码）</p>
      </div>
    `;
  } else {
    const results = [...data.tutorials, ...data.errors];
    body.innerHTML = results.map(r => `
      <div class="search-result-item" onclick="${r.type === 'tutorial' ? `openTutorialFromSearch('${r.id}')` : `closeSearchModal(); filterErrors('${r.software.id}', null); searchErrorsFromText('${r.keyword}')`}">
        <span class="search-result-type ${r.type}">${r.type === 'tutorial' ? '操作教程' : '报错方案'}</span>
        <h4>${highlightText(r.title, query)}</h4>
        <p>${r.software.icon} ${r.software.name} · ${r.type === 'tutorial' ? r.difficulty : r.keyword}</p>
      </div>
    `).join('');
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ===== 从搜索结果打开教程 =====
function openTutorialFromSearch(tutorialId) {
  closeSearchModal();
  const t = allTutorials.find(t => t.id === tutorialId);
  if (!t) return;

  filterTutorials(t.softwareId, null);

  const index = tutorialIndexMap.findIndex(item => item.id === tutorialId);
  if (index >= 0) {
    setTimeout(() => openTutorial(index), 300);
  }
}

// ===== 从搜索结果定位报错 =====
function searchErrorsFromText(query) {
  document.getElementById('errorSearchInput').value = query;
  currentErrorSearch = query.toLowerCase();
  renderErrorsFromData('all', currentErrorSearch);
  setTimeout(() => {
    document.getElementById('errors').scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ===== 从导航栏搜索 =====
function openSearchFromNav() {
  const query = document.getElementById('navSearchInput').value;
  if (query) {
    performSearch(query);
    document.getElementById('navSearchInput').value = '';
  }
}

function closeSearchModal() {
  document.getElementById('searchModal').style.display = 'none';
  document.body.style.overflow = '';
}

function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('show');
}

// ===== 滚动效果 =====
function initScrollEffects() {
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .software-card, .tutorial-card, .error-card, .about-card').forEach(el => {
    observer.observe(el);
  });
}

// ===== 导航栏滚动高亮 =====
function initNavScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 键盘快捷键 =====
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeSearchModal();
    closeTutorialModal();
    closeSubmissionModal();
  }
  if (e.key === 'Enter') {
    if (document.activeElement === document.getElementById('heroSearchInput')) {
      performSearch(document.getElementById('heroSearchInput').value);
    } else if (document.activeElement === document.getElementById('navSearchInput')) {
      openSearchFromNav();
    }
  }
});

// ===== 点击弹窗外部关闭 =====
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('search-modal') || e.target.classList.contains('search-modal-overlay')) {
    closeSearchModal();
  }
  if (e.target.classList.contains('tutorial-modal') || e.target.classList.contains('tutorial-modal-overlay')) {
    closeTutorialModal();
  }
  if (e.target.classList.contains('submission-modal') || e.target.classList.contains('submission-modal-overlay')) {
    closeSubmissionModal();
  }
});

// ===== 移动端点击导航链接后关闭菜单 =====
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('show');
  });
});

// ========================================================================
// 学生投稿功能
// ========================================================================

// 打开投稿弹窗
function openSubmissionModal() {
  // 填充软件选择
  const select = document.getElementById('subSoftware');
  select.innerHTML = Object.values(softwareData).map(sw =>
    `<option value="${sw.id}">${sw.icon} ${sw.name}</option>`
  ).join('');

  // 清空表单
  document.getElementById('subTitle').value = '';
  document.getElementById('subKeyword').value = '';
  document.getElementById('subVersion').value = '';
  document.getElementById('subContributor').value = '';
  document.getElementById('subSolution').value = '';
  document.getElementById('submissionResult').style.display = 'none';

  document.getElementById('submissionModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSubmissionModal() {
  document.getElementById('submissionModal').style.display = 'none';
  document.body.style.overflow = '';
}

// 提交投稿
async function submitErrorSolution() {
  const data = {
    softwareId: document.getElementById('subSoftware').value,
    title: document.getElementById('subTitle').value.trim(),
    keyword: document.getElementById('subKeyword').value.trim(),
    version: document.getElementById('subVersion').value.trim(),
    severity: document.getElementById('subSeverity').value,
    contributor: document.getElementById('subContributor').value.trim(),
    solution: document.getElementById('subSolution').value.split('\n').filter(s => s.trim())
  };

  // 验证
  if (!data.title) { showSubmissionError('请输入报错标题'); return; }
  if (!data.keyword) { showSubmissionError('请输入搜索关键词'); return; }
  if (data.solution.length < 1) { showSubmissionError('请至少输入一个解决步骤'); return; }

  showSubmissionLoading();

  try {
    const res = await fetch(`${API}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showSubmissionSuccess(result.id);
    } else {
      showSubmissionError(result.error || '提交失败，请稍后重试');
    }
  } catch (e) {
    showSubmissionError('网络错误，请检查后端服务是否启动');
  }
}

function showSubmissionError(msg) {
  const el = document.getElementById('submissionResult');
  el.style.display = 'block';
  el.className = 'submission-result error';
  el.innerHTML = `❌ ${msg}`;
}

function showSubmissionLoading() {
  const el = document.getElementById('submissionResult');
  el.style.display = 'block';
  el.className = 'submission-result loading';
  el.innerHTML = '⏳ 提交中...';
}

function showSubmissionSuccess(id) {
  const el = document.getElementById('submissionResult');
  el.style.display = 'block';
  el.className = 'submission-result success';
  el.innerHTML = `✅ 投稿成功！编号 #${id}，管理员审核通过后将显示在报错专区。<br><a onclick="checkSubmissionStatus(${id})" style="color:var(--primary); cursor:pointer; text-decoration:underline;">查看审核状态</a>`;
}

// 查看投稿审核状态
async function checkSubmissionStatus(id) {
  const data = await fetchData(`${API}/submissions/status/${id}`);
  if (!data) {
    alert('查询失败，请稍后重试');
    return;
  }
  const statusMap = {
    pending: '⏳ 待审核',
    approved: '✅ 已通过审核（已发布到报错专区）',
    rejected: '❌ 已拒绝'
  };
  let msg = `投稿编号：#${id}\n标题：${data.title}\n状态：${statusMap[data.status] || data.status}\n提交时间：${data.createdAt}`;
  if (data.status === 'rejected' && data.reviewNote) {
    msg += `\n拒绝原因：${data.reviewNote}`;
  }
  alert(msg);
}
