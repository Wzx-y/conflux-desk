/* ================================================================
 * Conflux Desk · 模拟引擎
 * 可暂停 / 变速的时钟 + 状态存储 + 剧本执行器 + 协作动态日志
 * ================================================================ */
window.CD = window.CD || {};

/* ---------------- 时钟 ---------------- */
CD.clock = {
  speed: 2, paused: false,
  waits: new Set(),
  wait(ms) {
    return new Promise((res, rej) => this.waits.add({ remain: ms, res, rej }));
  },
  tick() {
    if (this.paused) return;
    for (const w of [...this.waits]) {
      w.remain -= 50 * this.speed;
      if (w.remain <= 0) { this.waits.delete(w); w.res(); }
    }
  },
  abortAll() {
    for (const w of this.waits) { try { w.rej(new Error('abort')); } catch (e) {} }
    this.waits.clear();
  },
};
setInterval(() => CD.clock.tick(), 50);

/* ---------------- 状态 ---------------- */
CD.state = {};
let msgSeq = 0;
let simMin = 9 * 60;      // 模拟项目时间，从 09:00 起
let aborted = false;
let phaseIdx = -1;

function initState() {
  CD.state = {
    roles: {}, msgs: {}, files: {}, fileInst: {}, fileSource: {}, produceSource: {},
    msgIndex: {}, events: [], done: false, handoffCount: 0,
  };
  for (const id in CD.data.ROLES) {
    CD.state.roles[id] = { status:'idle', task:'', progress:0 };
    CD.state.msgs[id] = [];
    CD.state.files[id] = { input:[], output:[] };
  }
  msgSeq = 0; simMin = 9 * 60; phaseIdx = -1;
}

const scene = () => CD.scene;
const advance = min => { simMin += min; CD.scene.wallClock(simMin); };

/* ---------------- 动态日志 ---------------- */
function logEvent(html, openRoleId) {
  CD.state.events.unshift({ html, role: openRoleId, time: simMin });
  if (CD.state.events.length > 60) CD.state.events.pop();
  const list = document.getElementById('logList');
  const t = `${String(Math.floor(simMin/60)).padStart(2,'0')}:${String(simMin%60).padStart(2,'0')}`;
  const li = document.createElement('li');
  li.innerHTML = `<span class="t">${t}</span> ${html}`;
  if (openRoleId) li.addEventListener('click', () => CD.panel.openRole(openRoleId));
  list.prepend(li);
  document.getElementById('logCount').textContent = CD.state.events.length;
}
const nameChip = id => `<b style="color:${(CD.data.ROLES[id] || {}).color || '#5b6a83'}">${escHtml((CD.data.ROLES[id] || {}).name || String(id))}</b>`;
const escHtml = s => String(s).replace(/[&<>"]/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- 剧本步骤 ---------------- */
async function doPhase(name) {
  phaseIdx = CD.data.PHASES.indexOf(name);
  scene().board(`当前阶段：${name}`);
  document.querySelectorAll('#phaseChips .chip').forEach((c, i) => {
    c.classList.toggle('active', i === phaseIdx);
    c.classList.toggle('done', i < phaseIdx);
  });
  CD.notify && CD.notify({ type: 'desk:phase', name });
  await CD.clock.wait(500);
}

async function doWork(s) {
  const st = CD.state.roles[s.role];
  st.status = 'working'; st.task = s.task; st.progress = 0;
  scene().setStatus(s.role, 'working');
  scene().setTask(s.role, s.task, 0);
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    await CD.clock.wait(s.dur / steps);
    st.progress = Math.min(100, i * 20);
    scene().setTask(s.role, undefined, st.progress);
    CD.panel.onEvent({ roles:[s.role], kind:'status' });
  }
  advance(Math.round(s.dur / 400));
  for (const p of (s.produce || [])) produceFile(s.role, p, s.sourceFrom);
  if (s.produce && s.produce.length) {
    st.status = 'review';
    scene().setStatus(s.role, 'review', '📦 待交接');
    CD.panel.onEvent({ roles:[s.role], kind:'file' });
  }
}

function produceFile(role, p, sourceFrom) {
  const inst = CD.state.fileInst[p.fid] || (CD.state.fileInst[p.fid] = { ver:0, status:'draft' });
  inst.ver = p.ver; inst.status = p.status;
  const out = CD.state.files[role].output;
  if (!out.includes(p.fid)) out.push(p.fid);
  if (sourceFrom === 'last-in') {
    const ins = CD.state.msgs[role].filter(m => m.dir === 'in');
    if (ins.length) CD.state.produceSource[p.fid] = ins[ins.length - 1].id;
  }
  const f = CD.data.FILES[p.fid] || { name: p.fid };
  logEvent(`${nameChip(role)} 产出 <b>${escHtml(f.name)}</b> v${+p.ver || 1}`, role);
  updatePile(role);
}

async function doHandoff(s) {
  const { from, to } = s;
  CD.state.roles[from].status = 'walk';
  scene().setStatus(from, 'walk');

  await scene().walkTo(from, scene().buildPath(from, to));
  if (aborted) return;

  scene().setStatus(from, 'talk');
  const toSt = CD.state.roles[to];
  const toPrev = toSt.status === 'working' ? 'working' : 'listen';
  scene().setStatus(to, 'listen');

  // 落消息（双方各存一份）
  const msgId = 'm' + (++msgSeq);
  const kind = s.kind || 'normal';
  const rec = { id: msgId, time: simMin, text: s.text, kind, att: s.att || [] };
  CD.state.msgs[from].push({ ...rec, dir:'out', peer: to });
  CD.state.msgs[to].push({ ...rec, dir:'in', peer: from });
  CD.state.msgIndex[msgId] = { from, to };
  CD.state.handoffCount++;

  // 交付 / 标记文件
  for (const d of (s.deliver || [])) {
    const attVer = (s.att || []).find(a => a.fid === d.fid);
    const inst = CD.state.fileInst[d.fid] ||
      (CD.state.fileInst[d.fid] = { ver: attVer ? attVer.ver : 1, status: 'draft' });
    inst.status = d.status;
    const inp = CD.state.files[to].input;
    if (!inp.includes(d.fid)) inp.push(d.fid);
    CD.state.fileSource[d.fid] = { msgId, from, to };
  }
  for (const m of (s.mark || [])) {
    const inst = CD.state.fileInst[m.fid];
    if (inst) inst.status = m.status;
  }

  logEvent(`${nameChip(from)} <i class="arrow">→</i> ${nameChip(to)}：${escHtml(s.text)}`, to);
  updatePile(to);
  scene().flash(to);
  CD.panel.onEvent({ roles:[from, to], kind:'msg' });
  CD.notify && CD.notify({ type: 'desk:handoff', from, to, text: s.text });

  advance(3);
  await scene().showBubble(from, s.text, kind, 3200);

  // 目标恢复原状态
  toSt.status = toSt.task ? (toPrev === 'working' ? 'working' : 'idle') : 'idle';
  if (toSt.status === 'idle') toSt.task = toSt.task; // 保留任务文本供回看
  scene().setStatus(to, toSt.status);
  CD.panel.onEvent({ roles:[to], kind:'status' });

  // 走回自己的工位
  scene().setStatus(from, 'walk');
  await scene().walkTo(from, scene().buildPath(to, from, true));
  CD.state.roles[from].status = 'done';
  scene().setStatus(from, 'done');
  CD.panel.onEvent({ roles:[from], kind:'status' });
}

function updatePile(role) {
  const f = CD.state.files[role];
  CD.scene.setPile(role, f.input.length + f.output.length);
}

/* ---------------- 结束 ---------------- */
function finale() {
  CD.state.done = true;
  for (const id in CD.data.ROLES) {
    CD.state.roles[id].status = 'done';
    CD.scene.setStatus(id, 'done', '🎉');
  }
  document.querySelectorAll('#phaseChips .chip').forEach(c => {
    c.classList.remove('active'); c.classList.add('done');
  });
  const n = CD.state.handoffCount;
  const m = Object.keys(CD.state.fileInst).length;
  const pname = (CD.data.PROJECT && CD.data.PROJECT.name) || '项目';
  CD.scene.banner(`🎉 ${escHtml(pname)} 交付完成`, `${n} 次角色交接 · ${m} 个文件产出 · 点击工位电脑可回看全过程`);
  CD.panel.onEvent({ roles: Object.keys(CD.data.ROLES), kind: 'status' });
  logEvent(`<b>🏁 项目交付完成</b>：${n} 次交接 · ${m} 个文件`, null);
  CD.notify && CD.notify({ type: 'desk:done', name: pname, handoffs: n, files: m });
}

/* ---------------- 运行控制 ---------------- */
CD.sim = {
  start() {
    aborted = false;
    (async () => {
      try {
        for (const step of CD.data.SCRIPT) {
          if (aborted) return;
          await this.runStep(step);
        }
        if (!aborted) finale();
      } catch (e) {
        if (e && e.message !== 'abort') console.error('[sim]', e);
      }
    })();
  },

  /* 单步执行（剧本步骤与外部实时事件共用同一套执行器） */
  async runStep(s) {
    if (s.type === 'phase') await doPhase(s.name);
    else if (s.type === 'work') await doWork(s);
    else if (s.type === 'handoff') await doHandoff(s);
  },

  /* 外部实时事件入口：串行排队，避免与剧本/彼此并发打架 */
  enqueue(step) {
    this._q = (this._q || Promise.resolve())
      .then(() => this.runStep(step))
      .catch(e => { if (e && e.message !== 'abort') console.error('[event]', e); });
    return this._q;
  },
  abort() { aborted = true; CD.clock.abortAll(); },
  reset() {
    this.abort();
    initState();
    scene().reset();
    document.getElementById('logList').innerHTML = '';
    document.getElementById('logCount').textContent = '0';
    document.querySelectorAll('#phaseChips .chip').forEach(c => c.classList.remove('active', 'done'));
    CD.panel.closeAll();
    setTimeout(() => CD.clock.paused = false, 0);
  },

  /* 人工介入：暂停时由「👔 主管」@ 角色下达指令 */
  async intervene(targetId, text) {
    const prev = CD.state.roles[targetId].status;
    const msgId = 'm' + (++msgSeq);
    CD.state.msgs[targetId].push({
      id: msgId, time: simMin, dir: 'in', peer: 'supervisor',
      text, kind: 'sup', att: [],
    });
    CD.state.msgIndex[msgId] = { from: 'supervisor', to: targetId };
    scene().setStatus(targetId, 'listen');
    scene().flash(targetId);
    logEvent(`<b style="color:#d9480f">👔 主管</b> <i class="arrow">→</i> ${nameChip(targetId)}：${escHtml(text)}`, targetId);
    CD.panel.onEvent({ roles: [targetId], kind: 'msg' });
    await scene().showBubble(targetId, text, 'sup', 3600, '👔 主管指示');
    await scene().showBubble(targetId, '收到，马上调整 ✓', 'ack', 1800, '✅ 回复主管');
    scene().setStatus(targetId, prev === 'listen' ? 'idle' : prev);
    CD.panel.onEvent({ roles: [targetId], kind: 'status' });
  },
};

initState();
