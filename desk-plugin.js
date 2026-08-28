/* ================================================================
 * Conflux Desk · 宿主侧嵌入助手（安全加固版）
 *
 * 安全策略：
 *   1. 发往 iframe 的消息一律定向到插件自身的 origin（由本文件 URL 推导），
 *      不使用 '*' 广播；
 *   2. 只接受「自己创建的 iframe」(e.source === frame.contentWindow) 且
 *      origin 与插件一致的回报；
 *   3. 默认把宿主页面 origin 作为白名单写入 iframe hash（#origins=...），
 *      插件侧会拒绝其他来源的指令；多域名嵌入时用 allowedOrigins 传入。
 *
 * 用法（在你的项目里）：
 *   1. 把整个 conflux-desk 文件夹复制进你的项目（可改名为 desk/ 等）
 *   2. <script src="./desk/desk-plugin.js"></script>
 *   3. <div id="desk" style="height:680px"></div>
 *      <script>const desk = Desk.mount({ container: '#desk' });</script>
 *
 * API：
 *   desk.loadProject(obj) / desk.sendEvent(step) / desk.pause() / desk.resume()
 *   desk.replay() / desk.intervene(roleId, text) / desk.on(fn)
 *
 * 可选参数：
 *   container     容器选择器或元素（必填）
 *   projectId     使用插件内置演示项目
 *   project       直接传入项目数据对象（就绪后自动加载）
 *   autoplay      false 则就绪后暂停（默认 true）
 *   allowedOrigins  允许向插件发指令的宿主 origin 数组（默认 [当前页面 origin]）
 *   sandbox       可选 iframe sandbox 属性字符串（如 'allow-scripts'），
 *                 注意：会令 origin 变为 opaque，消息 origin 校验将退化为仅校验来源窗口
 * ================================================================ */
(function () {
  const base = String(document.currentScript.src).replace(/[^/]*$/, '');
  let pluginOrigin = '*';
  try {
    const o = new URL(base).origin;
    if (o && o !== 'null') pluginOrigin = o;   // file:// 等 opaque origin 时保持 '*'
  } catch (e) {}

  function mount(opts) {
    const el = typeof opts.container === 'string'
      ? document.querySelector(opts.container)
      : opts.container;
    if (!el) throw new Error('[desk-plugin] container 不存在: ' + opts.container);

    el.innerHTML = '';
    const frame = document.createElement('iframe');
    const allowed = (opts.allowedOrigins || [location.origin]).map(String);
    const q = opts.projectId ? '?project=' + encodeURIComponent(opts.projectId) : '';
    const hash = '#origins=' + encodeURIComponent(allowed.join(','));
    frame.src = base + 'index.html' + q + hash;
    frame.style.cssText = 'width:100%;height:100%;border:0;border-radius:14px;display:block;background:#141a26';
    frame.setAttribute('allowfullscreen', 'true');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    if (opts.sandbox) frame.setAttribute('sandbox', opts.sandbox);
    el.appendChild(frame);

    let ready = false;
    const pending = [];
    const listeners = [];
    const post = m => { ready ? frame.contentWindow.postMessage(m, pluginOrigin) : pending.push(m); };

    window.addEventListener('message', e => {
      if (e.source !== frame.contentWindow) return;      // 只接受自己 iframe 的回报
      if (pluginOrigin !== '*' && e.origin !== pluginOrigin) return;
      const d = e.data;
      if (!d || typeof d.type !== 'string' || d.type.indexOf('desk:') !== 0) return;
      if (d.type === 'desk:ready') {
        if (!ready) {
          ready = true;
          pending.splice(0).forEach(post);
          if (opts.project) post({ type: 'desk:load', project: opts.project });
          if (opts.autoplay === false) post({ type: 'desk:pause' });
        }
      }
      listeners.forEach(f => { try { f(d); } catch (err) {} });
    });

    // 加载完成后握手：让插件锁定宿主 origin，后续上报转为定向发送
    frame.addEventListener('load', () => {
      try { frame.contentWindow.postMessage({ type: 'desk:ping' }, pluginOrigin); } catch (e) {}
    });

    return {
      frame,
      loadProject: p => post({ type: 'desk:load', project: p }),
      sendEvent:  ev => post({ type: 'desk:event', event: ev }),
      pause:  () => post({ type: 'desk:pause' }),
      resume: () => post({ type: 'desk:resume' }),
      replay: () => post({ type: 'desk:replay' }),
      intervene: (role, text) => post({ type: 'desk:intervene', role, text }),
      on: f => { listeners.push(f); return () => listeners.splice(listeners.indexOf(f), 1); },
      get ready() { return ready; },
    };
  }

  window.Desk = { mount, version: '1.0.0' };
})();
