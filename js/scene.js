/* ================================================================
 * Conflux Desk · 办公室场景
 * 工位渲染 / 人物走动（waypoint 过道寻路）/ 对话气泡 / 状态动画
 * ================================================================ */
window.CD = window.CD || {};
CD.scene = (() => {

  let ROLES, LAYOUT;                    // 惰性绑定：支持运行期热重载项目数据
  const els = { ws: {}, char: {} };
  const pos = {};          // 每个角色当前坐标 {x,y}

  function bindData() {
    ROLES = CD.data.ROLES;
    LAYOUT = CD.data.LAYOUT;
  }

  /* ---------- 几何工具 ---------- */
  const corridorX = id => LAYOUT.desks[id].x - 46;              // 工位左侧走廊
  const homeOf    = id => ({ x: LAYOUT.desks[id].x + 74, y: LAYOUT.desks[id].y + LAYOUT.deskH + 14 });
  const talkSpot  = id => ({ x: corridorX(id) + 12, y: LAYOUT.desks[id].y + LAYOUT.deskH + 12 });

  function buildPath(fromId, toId, goHome) {
    const A = pos[fromId], AY = LAYOUT.aisleY;
    const T = goHome ? homeOf(toId) : talkSpot(toId);
    const pts = [
      { x: corridorX(fromId), y: A.y },
      { x: corridorX(fromId), y: AY },
      { x: corridorX(toId),   y: AY },
      { x: corridorX(toId),   y: T.y },
      T,
    ];
    return pts.filter((p, i) =>
      i === 0 || Math.abs(p.x - pts[i-1].x) > 2 || Math.abs(p.y - pts[i-1].y) > 2);
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- 电脑仿真内容：角色 → 工作窗口类型 ---------- */
  const APP_TYPE = {
    research:'chart', product:'doc', design:'design',
    frontend:'code', backend:'code', test:'test',
    deploy:'term', ops:'dash',
  };
  const APP_CONTENT = {
    code:  '<div class="appc app-code"><i></i><i></i><i></i><i></i><i></i><i></i></div>',
    doc:   '<div class="appc app-doc"><i class="t"></i><i></i><i></i><i class="s"></i></div>',
    design:'<div class="appc app-design"><i></i><i></i><i></i></div>',
    test:  '<div class="appc app-test"><i></i><i></i><i></i><i></i></div>',
    term:  '<div class="appc app-term"><i></i><i></i><i></i><i></i></div>',
    chart: '<div class="appc app-chart"><i></i><i></i><i></i><i></i></div>',
    dash:  '<div class="appc app-dash"><i></i><i></i><i></i><i></i></div>',
  };

  /* ---------- 初始化 ---------- */
  function init() {
    bindData();
    const wsLayer = document.getElementById('wsLayer');
    const charLayer = document.getElementById('charLayer');

    for (const id in ROLES) {
      const r = ROLES[id], d = LAYOUT.desks[id];

      // 工位
      const ws = document.createElement('div');
      ws.className = 'ws';
      ws.dataset.role = id;
      ws.style.left = d.x + 'px';
      ws.style.top = d.y + 'px';
      ws.style.setProperty('--roleColor', r.color);
      ws.style.setProperty('--roleGlow', r.color);
      ws.title = `点击查看「${r.name}」的工作台详情`;
      ws.innerHTML = `
        <div class="desk">
          <div class="monitor">
            <div class="stand"></div>
            <div class="screen">
              <div class="dicons">
                <i class="ic folder" title="项目文件夹"></i>
                <i class="ic feishu" title="飞书">飞</i>
                <i class="ic wechat" title="微信">微</i>
                <i class="ic browser" title="浏览器"></i>
              </div>
              <div class="taskbar"><i></i><i></i><i></i><b></b></div>
              <div class="appwin rolewin">${APP_CONTENT[APP_TYPE[id]] || ''}</div>
              <div class="appwin chatwin"><div class="appc app-chat"><i class="cb in"></i><i class="cb out"></i><i class="cb in s"></i></div></div>
            </div>
          </div>
          <div class="keyboard"></div>
          <div class="mug"></div>
          <div class="pile"></div>
        </div>
        <div class="plate">
          <i class="dot"></i><span>${escB(r.name)}</span>
          <em class="task"></em>
          <div class="pbar"><i></i></div>
        </div>`;
      ws.addEventListener('click', () => CD.panel.openRole(id));
      wsLayer.appendChild(ws);
      els.ws[id] = ws;

      // 椅子（留在工位，人走开后空着）
      const chair = document.createElement('div');
      chair.className = 'chair';
      chair.style.left = (d.x + 57) + 'px';
      chair.style.top = (d.y + LAYOUT.deskH + 2) + 'px';
      wsLayer.appendChild(chair);

      // 人物
      const home = homeOf(id);
      pos[id] = { ...home };
      const ch = document.createElement('div');
      ch.className = 'char';
      ch.dataset.role = id;
      ch.style.left = home.x + 'px';
      ch.style.top = home.y + 'px';
      ch.style.setProperty('--roleColor', r.color);
      ch.innerHTML = `
        <div class="figure">
          <div class="bubble"></div>
          <div class="badge"></div>
          <div class="head"><i class="hair"></i><i class="eye l"></i><i class="eye r"></i><i class="mouth"></i></div>
          <div class="torso"></div>
          <div class="shadow"></div>
        </div>`;
      ch.addEventListener('click', () => CD.panel.openRole(id));
      charLayer.appendChild(ch);
      els.char[id] = ch;
    }
  }

  /* ---------- 人物移动 ---------- */
  async function walkTo(roleId, pts) {
    const el = els.char[roleId];
    el.classList.add('st-walk');
    for (const p of pts) {
      const cur = pos[roleId];
      const dist = Math.hypot(p.x - cur.x, p.y - cur.y);
      if (dist < 3) continue;
      const dur = Math.max(140, Math.round(dist / (0.26 * (CD.clock ? CD.clock.speed : 1))));
      el.style.transition = `left ${dur}ms linear, top ${dur}ms linear`;
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      pos[roleId] = { ...p };
      await sleep(dur + 40);
    }
    el.classList.remove('st-walk');
  }

  /* ---------- 对话气泡（人物左上角；贴近上边界时自动翻到下方） ---------- */
  const escB = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function clampBubble(el) {
    const stageEl = document.getElementById('stage');
    const sr = stageEl.getBoundingClientRect();
    const scale = sr.width / LAYOUT.stageW;
    const br = el.getBoundingClientRect();
    let dx = 0;
    if (br.left < sr.left + 8) dx = (sr.left + 8 - br.left) / scale;
    else if (br.right > sr.right - 8) dx = (sr.right - 8 - br.right) / scale;
    el.style.left = dx ? `calc(-18px + ${dx.toFixed(1)}px)` : '';
  }

  function showBubble(roleId, text, kind, ms, titleOverride) {
    const el = els.char[roleId].querySelector('.bubble');
    const r = ROLES[roleId];
    const k = (kind && kind !== 'normal') ? kind : '';
    el.className = 'bubble' + (k ? ' ' + k : '');
    // 估算气泡高度：若朝上会伸进墙面带（窗户/白板区域，y<170）或超出舞台顶端，
    // 则翻转到人物下方显示，避免北排角色的对话被遮挡
    const plain = String(text).replace(/<[^>]+>/g, '');
    const lines = Math.max(1, Math.ceil(plain.length / 18));
    const estH = 52 + lines * 20;
    const flip = (pos[roleId].y - 67 - estH) < 170;
    el.classList.toggle('flip', flip);
    const titleColor = k === 'bug' ? '#c92a2a' : k === 'sup' ? '#d9480f'
                     : k === 'ack' ? '#2b8a3e' : r.color;
    const title = titleOverride || (k === 'bug' ? '🐞 反馈缺陷' : `${r.name} → 交接`);
    el.innerHTML = `<div class="btitle" style="color:${titleColor}">${title}</div>${escB(text)}`;
    el.style.left = '';
    requestAnimationFrame(() => {
      el.classList.add('show');
      requestAnimationFrame(() => clampBubble(el));
    });
    return new Promise(res => setTimeout(() => {
      el.classList.remove('show');
      setTimeout(res, 220);
    }, ms));
  }

  /* ---------- 状态 ---------- */
  const BADGE = {
    idle:'☕', working:'⌨️', walk:'🚶', talk:'💬',
    review:'📦', done:'✅', listen:'💬',
  };
  function setStatus(roleId, st, label) {
    const el = els.char[roleId];
    el.className = 'char' + (st === 'working' ? ' st-working' : '');
    const badge = el.querySelector('.badge');
    badge.textContent = label || BADGE[st] || '';
    badge.classList.toggle('show', !!badge.textContent);
    badge.classList.toggle('pulse', st === 'working' || st === 'review');
    els.ws[roleId].classList.toggle('working', st === 'working');
    els.ws[roleId].classList.toggle('listening', st === 'listen');
  }

  function setTask(roleId, task, progress) {
    const t = els.ws[roleId].querySelector('.plate .task');
    const bar = els.ws[roleId].querySelector('.pbar i');
    if (task !== undefined) t.textContent = task;
    if (progress !== undefined) bar.style.width = progress + '%';
  }

  function setPile(roleId, n) {
    const pile = els.ws[roleId].querySelector('.pile');
    pile.innerHTML = '';
    for (let i = 0; i < Math.min(n, 5); i++) {
      const s = document.createElement('div');
      s.className = 'sheet';
      pile.appendChild(s);
    }
  }

  function flash(roleId) {
    const ws = els.ws[roleId];
    ws.classList.remove('flash');
    void ws.offsetWidth;
    ws.classList.add('flash');
    setTimeout(() => ws.classList.remove('flash'), 1200);
  }

  function board(text) {
    document.getElementById('phaseBoard').textContent = '📌 ' + text;
  }

  function banner(main, sub) {
    const b = document.getElementById('banner');
    b.innerHTML = `${main}<p>${sub || ''}</p>`;
    b.classList.remove('hidden');
  }
  function hideBanner() { document.getElementById('banner').classList.add('hidden'); }

  function wallClock(min) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    document.getElementById('wallClock').textContent = `🕐 ${h}:${m}`;
  }

  function reset() {
    for (const id in ROLES) {
      const home = homeOf(id);
      pos[id] = { ...home };
      const el = els.char[id];
      el.style.transition = 'none';
      el.style.left = home.x + 'px';
      el.style.top = home.y + 'px';
      el.classList.remove('st-walk', 'st-working');
      el.querySelector('.bubble').className = 'bubble';
      els.ws[id].classList.remove('working', 'flash');
      setTask(id, '', 0);
      setPile(id, 0);
    }
    board('准备中…');
    wallClock(9 * 60);
    hideBanner();
  }

  /* ---------- 重建（项目数据热替换后调用） ---------- */
  function rebuild() {
    document.getElementById('wsLayer').innerHTML = '';
    document.getElementById('charLayer').innerHTML = '';
    els.ws = {}; els.char = {};
    for (const k in pos) delete pos[k];
    init();
  }

  return { init, rebuild, buildPath, walkTo, showBubble, setStatus, setTask, setPile,
           flash, board, banner, hideBanner, wallClock, reset, homeOf, talkSpot };
})();
