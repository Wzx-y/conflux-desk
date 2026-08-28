/* ================================================================
 * Conflux Desk · 嵌入桥（安全加固版）
 * 当页面以 iframe 形式嵌入宿主项目时启用（独立打开时自动禁用）。
 *
 * 安全策略：
 *   1. 只接受「直接宿主」(e.source === window.parent) 发来的消息；
 *   2. 若挂载时通过 URL hash (#origins=a,b) 传入了白名单，则同时校验
 *      e.origin 必须在名单内（未传名单时仅做第 1 条校验，便于本地/静态托管）；
 *   3. 上报消息使用握手捕获的宿主 origin 定向发送，而非 '*' 广播。
 *
 * 接收（宿主 → 插件）：
 *   desk:ping / desk:load / desk:event / desk:pause / desk:resume /
 *   desk:intervene / desk:replay
 * 上报（插件 → 宿主）：
 *   desk:ready / desk:phase / desk:handoff / desk:done / desk:error
 * ================================================================ */
(function () {
  if (window.parent === window) return;      // 独立打开：不启用
  CD.bridge = true;

  let parentOrigin = null;                    // 握手捕获的宿主 origin（定向回执目标）
  let allowed = null;                         // 宿主 origin 白名单（可选）
  try {
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const o = h.get('origins');
    if (o) allowed = decodeURIComponent(o).split(',').map(s => s.trim()).filter(Boolean);
  } catch (e) {}

  const safeTarget = o => (o && o !== 'null') ? o : '*';
  const send = m => { try { window.parent.postMessage(m, safeTarget(parentOrigin)); } catch (e) {} };
  CD.notify = send;                           // 引擎事件上报钩子（阶段/交接/完成）

  function handle(m) {
    switch (m.type) {
      case 'desk:ping':                       // 握手：定向化后续上报
        send({ type: 'desk:ready', project: CD.data.PROJECT });
        break;

      case 'desk:load':
        CD.reloadProject(m.project);
        break;

      case 'desk:event': {
        const ev = m.event;
        // 交接事件缺省：附件自动按已交付落位
        if (ev && ev.type === 'handoff' && !ev.deliver && Array.isArray(ev.att)) {
          ev.deliver = ev.att.map(a => ({ fid: a.fid, status: a.status || 'delivered' }));
        }
        CD.sim.enqueue(ev);
        break;
      }

      case 'desk:pause':
        CD.ui.setPause(true);
        break;
      case 'desk:resume':
        CD.ui.setPause(false);
        break;

      case 'desk:intervene':
        if (!CD.clock.paused) CD.ui.setPause(true);
        CD.sim.intervene(m.role, m.text);
        break;

      case 'desk:replay':
        CD.sim.reset();
        setTimeout(() => CD.sim.start(), 120);
        break;
    }
  }

  window.addEventListener('message', e => {
    const m = e.data;
    if (!m || typeof m.type !== 'string' || m.type.indexOf('desk:') !== 0) return;
    if (e.source !== window.parent) return;                       // ① 只信任直接宿主
    if (allowed && e.origin && e.origin !== 'null' && !allowed.includes(e.origin)) {
      send({ type: 'desk:error', message: 'origin 不在白名单: ' + e.origin });
      return;                                                     // ② 白名单校验
    }
    if (!parentOrigin && e.origin && e.origin !== 'null') parentOrigin = e.origin;
    try {
      handle(m);
    } catch (err) {
      send({ type: 'desk:error', message: String(err && err.message || err) });
    }
  });

  /* 引擎就绪后通知宿主（尚未握手时用 '*'，内容不含敏感数据；握手后转定向） */
  const readyTimer = setInterval(() => {
    if (CD.data && CD.data.ROLES && CD.sim && CD.ui && typeof CD.reloadProject === 'function') {
      clearInterval(readyTimer);
      send({ type: 'desk:ready', project: CD.data.PROJECT });
    }
  }, 100);
})();
