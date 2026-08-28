/* ================================================================
 * Conflux Desk · 主控
 * 舞台自适应缩放 / 顶栏控件 / 项目 UI 刷新 / 数据热重载入口
 * ================================================================ */
(function () {

  const btnPlay = document.getElementById('btnPlay');
  const ivPanel = document.getElementById('intervene');
  const ivRole = document.getElementById('ivRole');
  const ivText = document.getElementById('ivText');
  const ivSend = document.getElementById('ivSend');
  const ivResume = document.getElementById('ivResume');

  /* ---------- 播放 / 暂停 ---------- */
  function setPause(p) {
    CD.clock.paused = p;
    btnPlay.textContent = p ? '▶ 播放' : '⏸ 暂停';
    ivPanel.classList.toggle('show', p);
    if (p) setTimeout(() => ivText.focus(), 180);
  }
  btnPlay.addEventListener('click', () => setPause(!CD.clock.paused));
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      setPause(!CD.clock.paused);
    }
  });

  /* ---------- 倍速 / 重播 / 日志折叠 ---------- */
  document.getElementById('speedSeg').addEventListener('click', e => {
    const b = e.target.closest('button[data-speed]');
    if (!b) return;
    CD.clock.speed = +b.dataset.speed;
    document.querySelectorAll('#speedSeg button').forEach(x => x.classList.toggle('active', x === b));
  });
  document.getElementById('btnReplay').addEventListener('click', () => {
    CD.sim.reset();
    setTimeout(() => CD.sim.start(), 120);
  });
  document.getElementById('logToggle').addEventListener('click', () => {
    document.getElementById('eventLog').classList.toggle('collapsed');
  });

  /* ---------- 项目切换 / 人工介入 ---------- */
  const sel = document.getElementById('projectSel');
  sel.addEventListener('change', () => { location.search = '?project=' + sel.value; });

  function sendIntervene() {
    if (ivSend.disabled) return;
    let text = ivText.value.trim();
    if (!text) return;
    let role = ivRole.value;
    const m = text.match(/^@(.+?)\s+([\s\S]*)$/);   // 支持「@角色名 内容」写法
    if (m) {
      const hit = Object.values(CD.data.ROLES).find(r => r.name === m[1]);
      if (hit) { role = hit.id; text = m[2].trim(); ivRole.value = role; }
    }
    if (!text) return;
    ivSend.disabled = true;
    CD.sim.intervene(role, text).finally(() => {
      ivSend.disabled = false;
      ivText.value = '';
      ivText.focus();
    });
  }
  ivSend.addEventListener('click', sendIntervene);
  ivText.addEventListener('keydown', e => { if (e.key === 'Enter') sendIntervene(); });
  ivResume.addEventListener('click', () => setPause(false));

  /* ---------- 舞台等比缩放 ---------- */
  const stage = document.getElementById('stage');
  const wrap = document.getElementById('stageWrap');
  function fit() {
    const s = Math.min(wrap.clientWidth / CD.data.LAYOUT.stageW,
                       wrap.clientHeight / CD.data.LAYOUT.stageH, 1.15);
    stage.style.transform = `scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- 项目 UI（可重复刷新：数据热重载后调用） ---------- */
  function refreshProjectUI() {
    document.getElementById('projName').textContent = CD.data.PROJECT.name;
    document.title = CD.data.PROJECT.name + ' · Conflux Desk';

    const chips = document.getElementById('phaseChips');
    chips.innerHTML = '';
    CD.data.PHASES.forEach(p => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = p;
      chips.appendChild(c);
    });

    sel.innerHTML = '';
    Object.entries(CD.PROJECTS || {}).forEach(([k, v]) => {
      const o = document.createElement('option');
      o.value = k; o.textContent = v;
      sel.appendChild(o);
    });
    if (!CD.PROJECTS[CD.data.PROJECT.id]) {
      const o = document.createElement('option');
      o.value = CD.data.PROJECT.id;
      o.textContent = `🚀 当前项目 ${CD.data.PROJECT.id}（未在 projects/registry.js 注册）`;
      sel.appendChild(o);
    }
    sel.value = CD.data.PROJECT.id;

    ivRole.innerHTML = '';
    Object.values(CD.data.ROLES).forEach(r => {
      const o = document.createElement('option');
      o.value = r.id; o.textContent = r.emoji + ' ' + r.name;
      ivRole.appendChild(o);
    });
  }

  /* ---------- 对外暴露 ---------- */
  CD.ui = { setPause };

  /* 项目数据热重载：嵌入模式由 bridge 调用，独立模式一般整页切换 */
  CD.reloadProject = function (P) {
    CD.sim.reset();               // 停止剧本 + 清空状态 + 关闭抽屉 + 清日志
    CD.data.applyProject(P);      // 校验并应用新数据（含工位自动布局）
    CD.scene.rebuild();           // 重建工位与人物
    refreshProjectUI();
    setTimeout(() => CD.sim.start(), 200);
  };

  /* ---------- 启动 ---------- */
  refreshProjectUI();
  CD.scene.init();
  CD.panel.init();
  setTimeout(() => CD.sim.start(), 800);
})();
