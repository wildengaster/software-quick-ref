// ===== 后端服务器 =====
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { loadDB, saveDB, getDB, initAdminPassword } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'quick-ref-secret-key-2024';

// ===== 中间件 =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// 请求日志中间件
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ===== JWT 验证中间件 =====
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// ===== 访问统计中间件 =====
function recordPageView(page) {
  const db = getDB();
  if (!db.stats.pageViews[page]) {
    db.stats.pageViews[page] = 0;
  }
  db.stats.pageViews[page]++;
  saveDB();
}

// ===== 限流 =====
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每小时最多10次投稿
  message: { error: '投稿过于频繁，请稍后再试' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5,
  message: { error: '登录尝试过多，请15分钟后再试' }
});

// ========================================================================
// 公开 API - 前台使用
// ========================================================================

// 获取所有软件分类
app.get('/api/software', (req, res) => {
  const db = getDB();
  res.json(db.software);
});

// 获取所有教程
app.get('/api/tutorials', (req, res) => {
  const db = getDB();
  const { softwareId } = req.query;
  let tutorials = db.tutorials;
  if (softwareId && softwareId !== 'all') {
    tutorials = tutorials.filter(t => t.softwareId === softwareId);
  }
  // 关联软件信息
  const result = tutorials.map(t => {
    const sw = db.software.find(s => s.id === t.softwareId);
    return { ...t, software: sw };
  });
  res.json(result);
});

// 获取所有报错方案（已审核的）
app.get('/api/errors', (req, res) => {
  const db = getDB();
  const { softwareId, search } = req.query;
  let errors = db.errors;
  if (softwareId && softwareId !== 'all') {
    errors = errors.filter(e => e.softwareId === softwareId);
  }
  if (search) {
    const q = search.toLowerCase();
    errors = errors.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.keyword.toLowerCase().includes(q) ||
      e.solution.some(s => s.toLowerCase().includes(q))
    );
  }
  const result = errors.map(e => {
    const sw = db.software.find(s => s.id === e.softwareId);
    return { ...e, software: sw };
  });
  res.json(result);
});

// 全局搜索
app.get('/api/search', (req, res) => {
  const db = getDB();
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.json({ tutorials: [], errors: [], total: 0 });
  }

  // 记录搜索日志
  db.stats.searchLogs.push({
    query: q.trim(),
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
  // 只保留最近1000条
  if (db.stats.searchLogs.length > 1000) {
    db.stats.searchLogs = db.stats.searchLogs.slice(-1000);
  }
  saveDB();

  const query = q.toLowerCase().trim();
  
  // 搜索教程
  const tutorials = db.tutorials
    .filter(t => {
      const sw = db.software.find(s => s.id === t.softwareId);
      return t.title.toLowerCase().includes(query) ||
        t.steps.some(s => s.text.toLowerCase().includes(query)) ||
        sw.name.toLowerCase().includes(query);
    })
    .map(t => {
      const sw = db.software.find(s => s.id === t.softwareId);
      return { type: 'tutorial', id: t.id, title: t.title, software: sw, difficulty: t.difficulty };
    });

  // 搜索报错
  const errors = db.errors
    .filter(e =>
      e.title.toLowerCase().includes(query) ||
      e.keyword.toLowerCase().includes(query) ||
      e.solution.some(s => s.toLowerCase().includes(query))
    )
    .map(e => {
      const sw = db.software.find(s => s.id === e.softwareId);
      return { type: 'error', id: e.id, title: e.title, software: sw, keyword: e.keyword };
    });

  res.json({ tutorials, errors, total: tutorials.length + errors.length });
});

// 记录页面访问
app.post('/api/stats/view', (req, res) => {
  const { page } = req.body;
  if (page) {
    recordPageView(page);
  }
  res.json({ success: true });
});

// ========================================================================
// 学生投稿 API
// ========================================================================

// 提交报错方案投稿
app.post('/api/submissions', submitLimiter, (req, res) => {
  const db = getDB();
  const { softwareId, title, keyword, version, severity, solution, contributor } = req.body;

  // 验证
  if (!softwareId || !title || !keyword || !solution || !Array.isArray(solution) || solution.length === 0) {
    return res.status(400).json({ error: '请填写完整的投稿信息' });
  }

  const sw = db.software.find(s => s.id === softwareId);
  if (!sw) {
    return res.status(400).json({ error: '无效的软件分类' });
  }

  const submission = {
    id: db.meta.nextSubmissionId++,
    softwareId,
    title: title.trim(),
    keyword: keyword.trim(),
    version: version?.trim() || sw.version,
    severity: severity || 'medium',
    solution: solution.filter(s => s.trim()),
    contributor: contributor?.trim() || '匿名同学',
    status: 'pending', // pending / approved / rejected
    reviewNote: '',
    createdAt: new Date().toISOString(),
    reviewedAt: null
  };

  db.submissions.push(submission);
  saveDB();

  res.json({ success: true, message: '投稿成功！管理员审核通过后将显示在报错专区', id: submission.id });
});

// 查看自己的投稿状态
app.get('/api/submissions/status/:id', (req, res) => {
  const db = getDB();
  const sub = db.submissions.find(s => s.id === parseInt(req.params.id));
  if (!sub) {
    return res.status(404).json({ error: '未找到该投稿' });
  }
  res.json({
    id: sub.id,
    title: sub.title,
    status: sub.status,
    reviewNote: sub.reviewNote,
    createdAt: sub.createdAt,
    reviewedAt: sub.reviewedAt
  });
});

// ========================================================================
// 管理员认证 API
// ========================================================================

// 管理员登录
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const db = getDB();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const admin = db.admins.find(a => a.username === username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ success: true, token, admin: { id: admin.id, username: admin.username } });
});

// 验证 token 是否有效
app.get('/api/admin/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// ========================================================================
// 管理员 API - 投稿审核
// ========================================================================

// 获取所有投稿
app.get('/api/admin/submissions', authMiddleware, (req, res) => {
  const db = getDB();
  const { status } = req.query;
  let submissions = db.submissions;
  if (status) {
    submissions = submissions.filter(s => s.status === status);
  }
  // 关联软件信息
  const result = submissions.map(s => {
    const sw = db.software.find(sw => sw.id === s.softwareId);
    return { ...s, software: sw };
  });
  res.json(result);
});

// 审核通过 - 将投稿转为正式报错
app.post('/api/admin/submissions/:id/approve', authMiddleware, (req, res) => {
  const db = getDB();
  const sub = db.submissions.find(s => s.id === parseInt(req.params.id));
  if (!sub) {
    return res.status(404).json({ error: '未找到该投稿' });
  }
  if (sub.status !== 'pending') {
    return res.status(400).json({ error: '该投稿已被审核' });
  }

  // 创建正式报错
  const newError = {
    id: db.meta.nextErrorId++,
    softwareId: sub.softwareId,
    keyword: sub.keyword,
    title: sub.title,
    version: sub.version,
    severity: sub.severity,
    solution: sub.solution,
    contributor: sub.contributor,
    createdAt: new Date().toISOString()
  };
  db.errors.push(newError);

  // 更新投稿状态
  sub.status = 'approved';
  sub.reviewNote = req.body.note || '';
  sub.reviewedAt = new Date().toISOString();
  saveDB();

  res.json({ success: true, message: '已通过审核并发布', errorId: newError.id });
});

// 审核拒绝
app.post('/api/admin/submissions/:id/reject', authMiddleware, (req, res) => {
  const db = getDB();
  const sub = db.submissions.find(s => s.id === parseInt(req.params.id));
  if (!sub) {
    return res.status(404).json({ error: '未找到该投稿' });
  }
  if (sub.status !== 'pending') {
    return res.status(400).json({ error: '该投稿已被审核' });
  }

  sub.status = 'rejected';
  sub.reviewNote = req.body.note || '内容不符合要求';
  sub.reviewedAt = new Date().toISOString();
  saveDB();

  res.json({ success: true, message: '已拒绝该投稿' });
});

// ========================================================================
// 管理员 API - 内容管理 (CRUD)
// ========================================================================

// --- 教程管理 ---

// 新增教程
app.post('/api/admin/tutorials', authMiddleware, (req, res) => {
  const db = getDB();
  const { softwareId, title, difficulty, steps } = req.body;

  if (!softwareId || !title || !steps || !Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: '请填写完整教程信息' });
  }

  const tutorial = {
    id: db.meta.nextTutorialId++,
    softwareId,
    title: title.trim(),
    difficulty: difficulty || '入门',
    steps: steps.map(s => ({ text: s.text || s })),
    createdAt: new Date().toISOString()
  };
  db.tutorials.push(tutorial);
  saveDB();

  res.json({ success: true, message: '教程添加成功', id: tutorial.id });
});

// 更新教程
app.put('/api/admin/tutorials/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const t = db.tutorials.find(t => t.id === parseInt(req.params.id));
  if (!t) return res.status(404).json({ error: '未找到该教程' });

  const { softwareId, title, difficulty, steps } = req.body;
  if (softwareId) t.softwareId = softwareId;
  if (title) t.title = title.trim();
  if (difficulty) t.difficulty = difficulty;
  if (steps && Array.isArray(steps)) t.steps = steps.map(s => ({ text: s.text || s }));
  t.updatedAt = new Date().toISOString();
  saveDB();

  res.json({ success: true, message: '教程更新成功' });
});

// 删除教程
app.delete('/api/admin/tutorials/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const idx = db.tutorials.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '未找到该教程' });

  db.tutorials.splice(idx, 1);
  saveDB();
  res.json({ success: true, message: '教程已删除' });
});

// --- 报错管理 ---

// 新增报错
app.post('/api/admin/errors', authMiddleware, (req, res) => {
  const db = getDB();
  const { softwareId, title, keyword, version, severity, solution } = req.body;

  if (!softwareId || !title || !keyword || !solution || !Array.isArray(solution) || solution.length === 0) {
    return res.status(400).json({ error: '请填写完整报错信息' });
  }

  const error = {
    id: db.meta.nextErrorId++,
    softwareId,
    title: title.trim(),
    keyword: keyword.trim(),
    version: version || '',
    severity: severity || 'medium',
    solution: solution.filter(s => s.trim()),
    createdAt: new Date().toISOString()
  };
  db.errors.push(error);
  saveDB();

  res.json({ success: true, message: '报错方案添加成功', id: error.id });
});

// 更新报错
app.put('/api/admin/errors/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const e = db.errors.find(e => e.id === parseInt(req.params.id));
  if (!e) return res.status(404).json({ error: '未找到该报错' });

  const { softwareId, title, keyword, version, severity, solution } = req.body;
  if (softwareId) e.softwareId = softwareId;
  if (title) e.title = title.trim();
  if (keyword) e.keyword = keyword.trim();
  if (version) e.version = version;
  if (severity) e.severity = severity;
  if (solution && Array.isArray(solution)) e.solution = solution.filter(s => s.trim());
  e.updatedAt = new Date().toISOString();
  saveDB();

  res.json({ success: true, message: '报错方案更新成功' });
});

// 删除报错
app.delete('/api/admin/errors/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const idx = db.errors.findIndex(e => e.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '未找到该报错' });

  db.errors.splice(idx, 1);
  saveDB();
  res.json({ success: true, message: '报错方案已删除' });
});

// ========================================================================
// 管理员 API - 统计数据
// ========================================================================

// 获取统计数据
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const db = getDB();

  // 页面访问统计
  const pageViews = db.stats.pageViews;

  // 热门搜索词统计
  const searchCounts = {};
  db.stats.searchLogs.forEach(log => {
    const q = log.query.toLowerCase();
    searchCounts[q] = (searchCounts[q] || 0) + 1;
  });
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([query, count]) => ({ query, count }));

  // 最近搜索记录
  const recentSearches = [...db.stats.searchLogs]
    .reverse()
    .slice(0, 50)
    .map(log => ({ query: log.query, time: log.timestamp }));

  // 内容统计
  const contentStats = {
    softwareCount: db.software.length,
    tutorialCount: db.tutorials.length,
    errorCount: db.errors.length,
    pendingSubmissions: db.submissions.filter(s => s.status === 'pending').length,
    approvedSubmissions: db.submissions.filter(s => s.status === 'approved').length,
    rejectedSubmissions: db.submissions.filter(s => s.status === 'rejected').length,
    totalSubmissions: db.submissions.length
  };

  // 按软件统计内容数
  const softwareContent = db.software.map(sw => ({
    name: sw.name,
    icon: sw.icon,
    tutorials: db.tutorials.filter(t => t.softwareId === sw.id).length,
    errors: db.errors.filter(e => e.softwareId === sw.id).length
  }));

  // 报错严重程度分布
  const severityStats = {
    high: db.errors.filter(e => e.severity === 'high').length,
    medium: db.errors.filter(e => e.severity === 'medium').length,
    low: db.errors.filter(e => e.severity === 'low').length
  };

  res.json({
    pageViews,
    totalViews: Object.values(pageViews).reduce((a, b) => a + b, 0),
    topSearches,
    recentSearches,
    contentStats,
    softwareContent,
    severityStats
  });
});

// ========================================================================
// 启动服务器
// ========================================================================

app.listen(PORT, () => {
  initAdminPassword();
  console.log('=================================');
  console.log('  速查工具后端服务已启动');
  console.log('=================================');
  console.log(`  前台地址: http://localhost:${PORT}`);
  console.log(`  后台地址: http://localhost:${PORT}/admin.html`);
  console.log(`  API 地址: http://localhost:${PORT}/api`);
  console.log('  管理员账号: admin');
  console.log('  管理员密码: admin123');
  console.log('=================================');
});
