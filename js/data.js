/* ================================================================
 * Conflux Desk · 通用数据层
 * 项目数据来自 projects/<id>/project.js 定义的 window.PROJECT，
 * 本文件负责：校验 → 应用 → 按角色数自动排布工位。
 * 新项目只需新建文件夹写 project.js，不需要改这里。
 * ================================================================ */
window.CD = window.CD || {};
CD.data = {};

/* ---------- 工位自动布局：角色分两排，居中分布 ---------- */
function buildLayout(roleIds) {
  const stageW = 1400, stageH = 700, deskW = 168, deskH = 96, margin = 70;
  const north = Math.ceil(roleIds.length / 2), south = roleIds.length - north;
  const desks = {};
  let idx = 0;
  [[north, 150, 'north'], [south, 470, 'south']].forEach(([k, y, row]) => {
    if (!k) return;
    const maxGap = (stageW - margin * 2 - k * deskW) / Math.max(1, k - 1);
    const gap = k > 1 ? Math.min(240, Math.max(24, maxGap)) : 0;
    const totalW = k * deskW + (k - 1) * gap;
    const startX = (stageW - totalW) / 2;
    for (let c = 0; c < k; c++) {
      const id = roleIds[idx++];
      desks[id] = { x: Math.round(startX + c * (deskW + gap)), y, row };
    }
  });
  return { stageW, stageH, deskW, deskH, aisleY: 405, desks };
}

/* ---------- 应用并校验项目定义 ---------- */
CD.data.applyProject = function (P) {
  const err = (m) => { throw new Error('[project] ' + m); };
  if (!P || !P.id || !P.name) err('缺少 id / name');
  if (!P.roles || !Object.keys(P.roles).length) err('roles 不能为空');
  if (P.script == null) err('script 不能为空');
  const ids = Object.keys(P.roles);
  if (ids.length > 10) err('角色数量建议 2~10 个（当前 ' + ids.length + '）');

  for (const id of ids) {
    const r = P.roles[id];
    if (r.id !== id) err(`roles.${id}.id 与键名不一致`);
    if (!r.name || !r.color) err(`角色 ${id} 缺少 name / color`);
    // 颜色会被拼进 style 属性 / CSS 变量：只允许十六进制色值，防样式注入
    if (!/^#[0-9a-fA-F]{3,8}$/.test(String(r.color))) err(`角色 ${id} 的 color 必须是十六进制颜色（如 #1c7ed6）`);
    r.color = String(r.color).toLowerCase();
    for (const u of (r.up || [])) if (!P.roles[u]) err(`角色 ${id} 的上游 ${u} 不存在`);
    for (const d of (r.down || [])) if (!P.roles[d]) err(`角色 ${id} 的下游 ${d} 不存在`);
  }
  // 文件图标 / 名称等将在渲染层统一转义；此处限制基本类型
  for (const fid in (P.files || {})) {
    const f = P.files[fid];
    if (typeof f.name !== 'string' || !f.name) err(`文件 ${fid} 缺少 name`);
    if (!Array.isArray(f.versions) || !f.versions.length) err(`文件 ${fid} 缺少 versions`);
    if (!P.roles[f.owner]) err(`文件 ${fid} 的 owner 角色 ${f.owner} 不存在`);
  }
  P.script.forEach((s, i) => {
    const at = `剧本第 ${i + 1} 步`;
    if (s.type === 'phase' && !s.name) err(at + '：phase 缺少 name');
    if (s.type === 'work') {
      if (!P.roles[s.role]) err(at + `：未知角色 ${s.role}`);
      for (const p of (s.produce || [])) if (!P.files[p.fid]) err(at + `：未知文件 ${p.fid}`);
    }
    if (s.type === 'handoff') {
      if (!P.roles[s.from] || !P.roles[s.to]) err(at + `：未知角色 ${s.from}→${s.to}`);
      for (const a of (s.att || [])) if (!P.files[a.fid]) err(at + `：未知附件 ${a.fid}`);
    }
  });

  CD.data.PROJECT = { id: P.id, name: P.name, desc: P.desc || '' };
  CD.data.ROLES = P.roles;
  CD.data.FILES = P.files || {};
  CD.data.REFS = P.refs || {};
  CD.data.SCRIPT = P.script;
  /* 虚拟身份（没有工位，仅用于消息展示）：人工介入时以「主管」身份发言 */
  CD.data.PEERS = {
    supervisor: { id: 'supervisor', name: '主管', emoji: '👔', color: '#d9480f', desc: '人工介入' },
  };
  CD.data.PHASES = (P.phases && P.phases.length)
    ? P.phases
    : [...new Set(P.script.filter(s => s.type === 'phase').map(s => s.name))];
  CD.data.LAYOUT = buildLayout(ids);
};

/* ---------- 应用当前加载的项目 ---------- */
if (!window.PROJECT) {
  throw new Error('项目数据未加载：缺少 window.PROJECT（请检查 projects/<id>/project.js 是否存在）');
}
CD.data.applyProject(window.PROJECT);
