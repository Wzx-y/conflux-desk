/* ================================================================
 * Conflux Desk · 启动加载器
 *
 * projectID 就是 projects/ 下的文件夹名，无需在别处申请或查询：
 *   1. 复制 projects/_template → projects/<文件夹名>/（英文）
 *   2. 编辑其中的 project.js（角色 / 文件 / 剧本）
 *   3.（可选）在 projects/registry.js 注册一行，让项目出现在下拉框
 * 访问 index.html?project=<文件夹名>，或用顶栏下拉框切换。
 * ================================================================ */
(function () {
  const base = String(document.currentScript.src).replace(/[^/]*$/, '');   // .../js/
  const root = base + '../';                                               // 站点根

  /* 运行期错误可视化（便于排查项目数据问题） */
  window.addEventListener('error', e => {
    const d = document.createElement('div');
    d.id = 'bootError';
    d.style.cssText = 'position:fixed;left:12px;top:70px;z-index:9999;background:#5c1010;' +
      'color:#ffd9d9;padding:10px 14px;border-radius:8px;font:12px/1.7 monospace;max-width:640px';
    d.textContent = '⚠️ ' + (e.message || '脚本错误') + '  @  ' + (e.filename || '') + ':' + (e.lineno || '');
    document.body.appendChild(d);
  });

  const qs = new URLSearchParams(location.search);
  const pid = qs.get('project') || 'order-tracking';

  window.CD = window.CD || {};
  CD.PROJECTS = {};

  const seq = [
    'projects/registry.js',            // 0 注册表（缺失不阻断，仅下拉框为空）
    `projects/${pid}/project.js`,      // 1 项目数据
    'js/data.js', 'js/scene.js', 'js/panel.js', 'js/sim.js', 'js/main.js',
    'js/bridge.js',                    // 嵌入模式 postMessage 桥（独立打开时自动禁用）
  ];

  (function load(i) {
    if (i >= seq.length) return;
    const s = document.createElement('script');
    s.src = root + seq[i];
    s.onload = () => {
      if (i === 0) CD.PROJECTS = window.PROJECT_REGISTRY || {};
      if (i === 1 && window.PROJECT) window.PROJECT.id = pid;   // projectID 以文件夹名为准
      load(i + 1);
    };
    s.onerror = () => {
      if (i === 0) { CD.PROJECTS = {}; return load(1); }        // 注册表可省略
      if (i === 1) return showError();                          // 项目文件夹不存在
      showError();                                              // 引擎脚本缺失
    };
    document.head.appendChild(s);
  })(0);

  function showError() {
    const d = document.createElement('div');
    d.style.cssText = 'margin:80px auto;max-width:560px;padding:26px 30px;background:#1b2333;' +
      'color:#e8edf7;border-radius:12px;font-size:14px;line-height:2.2;box-shadow:0 12px 40px rgba(0,0,0,.4)';
    const reg = Object.keys(CD.PROJECTS);
    d.innerHTML = '⚠️ 项目 <b>' + pid + '</b> 加载失败：projects/' + pid + '/project.js 不存在。<br>' +
      (reg.length ? '已注册的项目：<br>' + reg.map(k =>
        `<a style="color:#7aa2f7" href="?project=${k}">${CD.PROJECTS[k]}</a>`).join('<br>')
        : 'projects/registry.js 未注册任何项目。');
    document.body.appendChild(d);
  }
})();
