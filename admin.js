// ===== 后台管理系统 JS =====

const API_BASE = '';
let adminToken = localStorage.getItem('adminToken') || '';
let adminInfo = JSON.parse(localStorage.getItem('adminInfo') || 'null');
let softwareList = [];

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  if (adminToken) {
    verifyToken();
  } else {
    showLogin();
  }
});

// ===== Token 验证 =====
async function verifyToken() {
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      showAdmin(data.admin);
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      adminToken = '';
      showLogin();
    }
  } catch (e) {
    showLogin();
  }
}

// ===== 显示登录页 =====
function showLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminPage').style.display = 'none';
}

// ===== 显示管理后台 =====
function showAdmin(admin) {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminPage').style.display = 'flex';
  if (admin) {
    adminInfo = admin;
    document.getElementById('adminName').textContent = admin.username;
  }
  loadDashboard();
}

// ===== 登录 =====
async function doLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      adminToken = data.token;
      adminInfo = data.admin;
      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
      showAdmin(data.admin);
    } else {
      errEl.textContent = data.error || '登录失败';
    }
  } catch (e) {
    errEl.textContent = '网络错误，请检查后端服务是否启动';
  }
  return false;
}

// ===== 退出登录 =====
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminInfo');
  adminToken = '';
  adminInfo = null;
  showLogin();
}

// ===== 侧边栏切换 =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('show');
}

// ===== Tab 切换 =====
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  const titles = {
    dashboard: '数据看板',
    submissions: '投稿审核',
    tutorials: '教程管理',
    errors: '报错管理',
    stats: '访问统计'
  };
  document.getElementById('pageTitle').textContent = titles[tab];

  // 加载对应数据
  if (tab === 'dashboard') loadDashboard();
  if (tab === 'submissions') loadSubmissions('pending');
  if (tab === 'tutorials') loadTutorialsManage();
  if (tab === 'errors') loadErrorsManage();
  if (tab === 'stats') loadStats();

  // 移动端关闭侧边栏
  document.getElementById('sidebar').classList.remove('show');
}

// ===== API 请求封装 =====
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    logout();
    throw new Error('登录已过期');
  }
  return res.json();
}

// ===== 加载软件列表（用于下拉选择） =====
async function loadSoftwareList() {
  if (softwareList.length > 0) return softwareList;
  softwareList = await api('/api/software');
  return softwareList;
}

// ===== 数据看板 =====
async function loadDashboard() {
  try {
    const stats = await api('/api/admin/stats');
    const cs = stats.contentStats;

    // 统计卡片
    document.getElementById('dashboardStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-icon">📦</div>
        <div class="stat-card-value">${cs.softwareCount}</div>
        <div class="stat-card-label">软件分类</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">📖</div>
        <div class="stat-card-value">${cs.tutorialCount}</div>
        <div class="stat-card-label">操作教程</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">🛡️</div>
        <div class="stat-card-value">${cs.errorCount}</div>
        <div class="stat-card-label">报错方案</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">📝</div>
        <div class="stat-card-value">${cs.pendingSubmissions}</div>
        <div class="stat-card-label">待审核投稿</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">✅</div>
        <div class="stat-card-value">${cs.approvedSubmissions}</div>
        <div class="stat-card-label">已通过投稿</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon">👀</div>
        <div class="stat-card-value">${stats.totalViews}</div>
        <div class="stat-card-label">总访问量</div>
      </div>
    `;

    // 更新待审核 badge
    const badge = document.getElementById('pendingBadge');
    if (cs.pendingSubmissions > 0) {
      badge.style.display = 'inline-block';
      badge.textContent = cs.pendingSubmissions;
    } else {
      badge.style.display = 'none';
    }

    // 各软件内容数量
    const maxContent = Math.max(...stats.softwareContent.map(s => s.tutorials + s.errors), 1);
    document.getElementById('softwareContentChart').innerHTML = stats.softwareContent.map(s => {
      const total = s.tutorials + s.errors;
      const width = (total / maxContent) * 100;
      return `
        <div class="bar-chart-item">
          <div class="bar-chart-label">${s.icon} ${s.name.split('/')[0].trim()}</div>
          <div class="bar-chart-track">
            <div class="bar-chart-fill" style="width: ${width}%; background: var(--primary);">
              ${total}
            </div>
          </div>
          <div style="font-size:12px; color:var(--text-light); white-space:nowrap;">
            📖${s.tutorials} 🛡️${s.errors}
          </div>
        </div>
      `;
    }).join('');

    // 严重程度分布
    const sev = stats.severityStats;
    const totalErrors = sev.high + sev.medium + sev.low || 1;
    document.getElementById('severityChart').innerHTML = `
      <div class="bar-chart-item">
        <div class="bar-chart-label">🔴 高频</div>
        <div class="bar-chart-track">
          <div class="bar-chart-fill" style="width: ${(sev.high/totalErrors)*100}%; background: var(--danger);">
            ${sev.high}
          </div>
        </div>
      </div>
      <div class="bar-chart-item">
        <div class="bar-chart-label">🟡 常见</div>
        <div class="bar-chart-track">
          <div class="bar-chart-fill" style="width: ${(sev.medium/totalErrors)*100}%; background: var(--warning);">
            ${sev.medium}
          </div>
        </div>
      </div>
      <div class="bar-chart-item">
        <div class="bar-chart-label">🟢 偶尔</div>
        <div class="bar-chart-track">
          <div class="bar-chart-fill" style="width: ${(sev.low/totalErrors)*100}%; background: var(--success);">
            ${sev.low}
          </div>
        </div>
      </div>
    `;

  } catch (e) {
    console.error('加载看板失败:', e);
  }
}

// ===== 投稿审核 =====
async function loadSubmissions(status, btn) {
  if (btn) {
    document.querySelectorAll('#submissionFilters .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  try {
    const subs = await api(`/api/admin/submissions${status !== 'all' ? `?status=${status}` : ''}`);
    const container = document.getElementById('submissionsList');

    if (subs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>暂无${status === 'pending' ? '待审核' : status === 'approved' ? '已通过' : status === 'rejected' ? '已拒绝' : ''}投稿</p>
        </div>
      `;
      return;
    }

    container.innerHTML = subs.map(s => `
      <div class="list-item">
        <div class="list-item-header">
          <div class="list-item-title">${s.title}</div>
          <span class="status-badge status-${s.status}">${s.status === 'pending' ? '待审核' : s.status === 'approved' ? '已通过' : '已拒绝'}</span>
        </div>
        <div class="list-item-meta">
          <span class="tag" style="background:${s.software.bgColor}; color:${s.software.color};">${s.software.icon} ${s.software.name.split('/')[0].trim()}</span>
          <span>关键词：${s.keyword}</span>
          <span>版本：${s.version}</span>
          <span>投稿人：${s.contributor}</span>
          <span>时间：${formatDate(s.createdAt)}</span>
        </div>
        <div style="font-size:14px; color:var(--text-secondary); margin-bottom:12px;">
          ${s.solution.length} 步解决方案：${s.solution[0].substring(0, 60)}...
        </div>
        <div class="list-item-actions">
          <button class="btn-secondary btn-sm" onclick="viewSubmission(${s.id})">查看详情</button>
          ${s.status === 'pending' ? `
            <button class="btn-success btn-sm" onclick="approveSubmission(${s.id})">通过</button>
            <button class="btn-danger btn-sm" onclick="rejectSubmission(${s.id})">拒绝</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('加载投稿失败:', e);
  }
}

// 查看投稿详情
async function viewSubmission(id) {
  const subs = await api('/api/admin/submissions');
  const sub = subs.find(s => s.id === id);
  if (!sub) return;

  document.getElementById('submissionDetailBody').innerHTML = `
    <div class="form-group">
      <label>报错标题</label>
      <div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.title}</div>
    </div>
    <div class="form-group">
      <label>所属软件</label>
      <div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.software.icon} ${sub.software.name}</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>关键词</label>
        <div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.keyword}</div>
      </div>
      <div class="form-group">
        <label>适用版本</label>
        <div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.version}</div>
      </div>
    </div>
    <div class="form-group">
      <label>严重程度</label>
      <div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.severity === 'high' ? '高频' : sub.severity === 'medium' ? '常见' : '偶尔'}</div>
    </div>
    <div class="form-group">
      <label>投稿人</label>
      <div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.contributor}</div>
    </div>
    <div class="form-group">
      <label>解决方案（${sub.solution.length} 步）</label>
      <ol style="padding-left:20px; line-height:2;">
        ${sub.solution.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </div>
    ${sub.reviewNote ? `<div class="form-group"><label>审核备注</label><div style="padding:10px; background:var(--bg-gray); border-radius:8px;">${sub.reviewNote}</div></div>` : ''}
  `;

  const footer = document.getElementById('submissionDetailFooter');
  if (sub.status === 'pending') {
    footer.innerHTML = `
      <button class="btn-secondary" onclick="closeSubmissionDetail()">关闭</button>
      <button class="btn-danger" onclick="rejectSubmission(${sub.id})">拒绝</button>
      <button class="btn-success" onclick="approveSubmission(${sub.id})">通过审核</button>
    `;
  } else {
    footer.innerHTML = `<button class="btn-secondary" onclick="closeSubmissionDetail()">关闭</button>`;
  }

  document.getElementById('submissionModal').style.display = 'flex';
}

function closeSubmissionDetail() {
  document.getElementById('submissionModal').style.display = 'none';
}

// 通过审核
async function approveSubmission(id) {
  const note = prompt('审核备注（可选）：', '');
  if (note === null) return;
  try {
    await api(`/api/admin/submissions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    alert('已通过审核并发布到报错专区');
    closeSubmissionDetail();
    loadSubmissions('pending');
    loadDashboard();
  } catch (e) {
    alert('操作失败: ' + e.message);
  }
}

// 拒绝
async function rejectSubmission(id) {
  const note = prompt('拒绝原因：', '内容不符合要求');
  if (!note) return;
  try {
    await api(`/api/admin/submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    alert('已拒绝该投稿');
    closeSubmissionDetail();
    loadSubmissions('pending');
    loadDashboard();
  } catch (e) {
    alert('操作失败: ' + e.message);
  }
}

// ===== 教程管理 =====
let editingTutorialId = null;

async function loadTutorialsManage() {
  try {
    const tutorials = await api('/api/tutorials');
    const container = document.getElementById('tutorialsList');

    if (tutorials.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>暂无教程</p></div>`;
      return;
    }

    container.innerHTML = tutorials.map(t => `
      <div class="list-item">
        <div class="list-item-header">
          <div class="list-item-title">${t.title}</div>
          <div class="list-item-actions">
            <button class="btn-secondary btn-sm" onclick="openTutorialEditor(${t.id})">编辑</button>
            <button class="btn-danger btn-sm" onclick="deleteTutorial(${t.id})">删除</button>
          </div>
        </div>
        <div class="list-item-meta">
          <span class="tag" style="background:${t.software.bgColor}; color:${t.software.color};">${t.software.icon} ${t.software.name.split('/')[0].trim()}</span>
          <span class="tag" style="background:var(--bg-gray); color:var(--text-secondary);">${t.difficulty}</span>
          <span>${t.steps.length} 步</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('加载教程失败:', e);
  }
}

async function openTutorialEditor(id) {
  editingTutorialId = id || null;
  await loadSoftwareList();

  const select = document.getElementById('tutSoftware');
  select.innerHTML = softwareList.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');

  if (id) {
    const tutorials = await api('/api/tutorials');
    const t = tutorials.find(t => t.id === id);
    if (t) {
      document.getElementById('tutorialModalTitle').textContent = '编辑教程';
      select.value = t.softwareId;
      document.getElementById('tutTitle').value = t.title;
      document.getElementById('tutDifficulty').value = t.difficulty;
      document.getElementById('tutSteps').value = t.steps.map(s => s.text).join('\n');
    }
  } else {
    document.getElementById('tutorialModalTitle').textContent = '新增教程';
    document.getElementById('tutTitle').value = '';
    document.getElementById('tutDifficulty').value = '入门';
    document.getElementById('tutSteps').value = '';
  }

  document.getElementById('tutorialModal').style.display = 'flex';
}

function closeTutorialEditor() {
  document.getElementById('tutorialModal').style.display = 'none';
  editingTutorialId = null;
}

async function saveTutorial() {
  const data = {
    softwareId: document.getElementById('tutSoftware').value,
    title: document.getElementById('tutTitle').value.trim(),
    difficulty: document.getElementById('tutDifficulty').value,
    steps: document.getElementById('tutSteps').value.split('\n').filter(s => s.trim()).map(s => ({ text: s.trim() }))
  };

  if (!data.title || data.steps.length === 0) {
    alert('请填写标题和至少一个步骤');
    return;
  }

  try {
    if (editingTutorialId) {
      await api(`/api/admin/tutorials/${editingTutorialId}`, { method: 'PUT', body: JSON.stringify(data) });
      alert('教程更新成功');
    } else {
      await api('/api/admin/tutorials', { method: 'POST', body: JSON.stringify(data) });
      alert('教程添加成功');
    }
    closeTutorialEditor();
    loadTutorialsManage();
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
}

async function deleteTutorial(id) {
  if (!confirm('确定删除这个教程吗？')) return;
  try {
    await api(`/api/admin/tutorials/${id}`, { method: 'DELETE' });
    alert('教程已删除');
    loadTutorialsManage();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
}

// ===== 报错管理 =====
let editingErrorId = null;

async function loadErrorsManage() {
  try {
    const errors = await api('/api/errors');
    const container = document.getElementById('errorsManageList');

    if (errors.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>暂无报错方案</p></div>`;
      return;
    }

    const sevMap = { high: {label:'高频', bg:'var(--danger-light)', color:'#c62828'}, medium: {label:'常见', bg:'var(--warning-light)', color:'#f57f17'}, low: {label:'偶尔', bg:'var(--success-light)', color:'#2e7d32'} };

    container.innerHTML = errors.map(e => {
      const sev = sevMap[e.severity];
      return `
        <div class="list-item">
          <div class="list-item-header">
            <div class="list-item-title">${e.title}</div>
            <div class="list-item-actions">
              <button class="btn-secondary btn-sm" onclick="openErrorEditor(${e.id})">编辑</button>
              <button class="btn-danger btn-sm" onclick="deleteError(${e.id})">删除</button>
            </div>
          </div>
          <div class="list-item-meta">
            <span class="tag" style="background:${e.software.bgColor}; color:${e.software.color};">${e.software.icon} ${e.software.name.split('/')[0].trim()}</span>
            <span class="tag" style="background:${sev.bg}; color:${sev.color};">${sev.label}</span>
            <span>关键词：${e.keyword}</span>
            <span>版本：${e.version}</span>
            <span>${e.solution.length} 步</span>
            ${e.contributor ? `<span>投稿：${e.contributor}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('加载报错失败:', e);
  }
}

async function openErrorEditor(id) {
  editingErrorId = id || null;
  await loadSoftwareList();

  const select = document.getElementById('errSoftware');
  select.innerHTML = softwareList.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');

  if (id) {
    const errors = await api('/api/errors');
    const e = errors.find(e => e.id === id);
    if (e) {
      document.getElementById('errorModalTitle').textContent = '编辑报错方案';
      select.value = e.softwareId;
      document.getElementById('errTitle').value = e.title;
      document.getElementById('errKeyword').value = e.keyword;
      document.getElementById('errVersion').value = e.version;
      document.getElementById('errSeverity').value = e.severity;
      document.getElementById('errSolution').value = e.solution.join('\n');
    }
  } else {
    document.getElementById('errorModalTitle').textContent = '新增报错方案';
    document.getElementById('errTitle').value = '';
    document.getElementById('errKeyword').value = '';
    document.getElementById('errVersion').value = '';
    document.getElementById('errSeverity').value = 'medium';
    document.getElementById('errSolution').value = '';
  }

  document.getElementById('errorModal').style.display = 'flex';
}

function closeErrorEditor() {
  document.getElementById('errorModal').style.display = 'none';
  editingErrorId = null;
}

async function saveError() {
  const data = {
    softwareId: document.getElementById('errSoftware').value,
    title: document.getElementById('errTitle').value.trim(),
    keyword: document.getElementById('errKeyword').value.trim(),
    version: document.getElementById('errVersion').value.trim(),
    severity: document.getElementById('errSeverity').value,
    solution: document.getElementById('errSolution').value.split('\n').filter(s => s.trim())
  };

  if (!data.title || !data.keyword || data.solution.length === 0) {
    alert('请填写完整的报错信息');
    return;
  }

  try {
    if (editingErrorId) {
      await api(`/api/admin/errors/${editingErrorId}`, { method: 'PUT', body: JSON.stringify(data) });
      alert('报错方案更新成功');
    } else {
      await api('/api/admin/errors', { method: 'POST', body: JSON.stringify(data) });
      alert('报错方案添加成功');
    }
    closeErrorEditor();
    loadErrorsManage();
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
}

async function deleteError(id) {
  if (!confirm('确定删除这个报错方案吗？')) return;
  try {
    await api(`/api/admin/errors/${id}`, { method: 'DELETE' });
    alert('报错方案已删除');
    loadErrorsManage();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
}

// ===== 访问统计 =====
async function loadStats() {
  try {
    const stats = await api('/api/admin/stats');

    // 页面访问量
    const pageViews = stats.pageViews;
    const viewEntries = Object.entries(pageViews).sort((a, b) => b[1] - a[1]);
    document.getElementById('pageViewsStats').innerHTML = viewEntries.length > 0
      ? viewEntries.map(([page, count]) => `
          <div class="stats-list-item">
            <span>${page}</span>
            <span class="count">${count} 次</span>
          </div>
        `).join('')
      : '<div class="empty-state"><p>暂无访问数据</p></div>';

    // 热门搜索
    document.getElementById('topSearchesStats').innerHTML = stats.topSearches.length > 0
      ? stats.topSearches.map((s, i) => `
          <div class="stats-list-item">
            <span>${i + 1}. ${s.query}</span>
            <span class="count">${s.count} 次</span>
          </div>
        `).join('')
      : '<div class="empty-state"><p>暂无搜索数据</p></div>';

    // 最近搜索
    document.getElementById('recentSearchesStats').innerHTML = stats.recentSearches.length > 0
      ? stats.recentSearches.map(s => `
          <div class="stats-list-item">
            <span>${s.query}</span>
            <span class="time">${formatDate(s.time)}</span>
          </div>
        `).join('')
      : '<div class="empty-state"><p>暂无搜索记录</p></div>';

  } catch (e) {
    console.error('加载统计失败:', e);
  }
}

// ===== 工具函数 =====
function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
