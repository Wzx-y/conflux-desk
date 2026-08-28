/* ================================================================
 * Conflux Desk · 详情面板
 * 角色抽屉（消息时间线 + 文件工作台）
 * 文件抽屉（版本时间线 + diff / 文档 / 设计稿 / 日志）
 * 消息 ↔ 文件 双向联动高亮
 * ================================================================ */
window.CD = window.CD || {};
CD.panel = (() => {

  let ROLES, FILES, REFS;               // 惰性绑定：支持运行期热重载项目数据
  function rebind() {
    ROLES = CD.data.ROLES;
    FILES = CD.data.FILES;
    REFS = CD.data.REFS || {};
  }
  rebind();

  let openId = null;                 // 当前打开的角色
  let fileOpen = { fid: null, ver: null };
  const collapse = {};               // role -> {input,output,ref}
  let selMsg = null;                 // role -> msgId

  const STATUS_TEXT = {
    draft:'草稿', wip:'修改中', review:'待验收', delivered:'已交付',
    defect:'有缺陷', online:'已上线', merged:'已合并', readonly:'只读',
  };
  const ROLE_STATUS_TEXT = {
    idle:'空闲', working:'工作中', review:'待交接', walk:'移动中',
    talk:'交流中', listen:'交流中', done:'已完成',
  };
  const ROLE_STATUS_CLS = {
    working:'st-working', review:'st-waiting', done:'st-done',
  };

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fmtTime = min => `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
  const peerOf = id => CD.data.ROLES[id] || (CD.data.PEERS || {})[id] || { name: id, color: '#868e96', emoji: '👤' };
  const $ = (q, el=document) => el.querySelector(q);

  /* ---------------- 打开 / 关闭 ---------------- */
  function openRole(id) {
    openId = id;
    selMsg = null;
    renderRole();
    document.getElementById('drawer').classList.add('open');
    document.getElementById('scrim').classList.add('show');
  }
  function closeRole() {
    openId = null;
    document.getElementById('drawer').classList.remove('open');
    closeFile();
    if (!fileOpen.fid) document.getElementById('scrim').classList.remove('show');
  }
  function closeFile() {
    fileOpen = { fid: null, ver: null };
    document.getElementById('fileDrawer').classList.remove('open');
  }
  function closeAll() { closeFile(); openId = null;
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('scrim').classList.remove('show');
  }

  function openFile(fid, ver) {
    if (!FILES[fid]) return;
    fileOpen = { fid, ver: ver || (CD.state.fileInst[fid] ? CD.state.fileInst[fid].ver : FILES[fid].versions.length) };
    renderFile();
    document.getElementById('fileDrawer').classList.add('open');
  }

  /* ---------------- 角色抽屉渲染 ---------------- */
  function renderRole() {
    if (!openId) return;
    rebind();
    const r = ROLES[openId];
    const st = CD.state.roles[openId];
    const msgs = CD.state.msgs[openId] || [];
    const files = CD.state.files[openId] || { input:[], output:[] };
    const col = collapse[openId] || (collapse[openId] = { input:false, output:false, ref:true });

    const statusCls = ROLE_STATUS_CLS[st.status] || '';
    const chain = [
      ...r.up.map(u => `<span class="chainChip">${esc(ROLES[u].name)}</span>`),
      ...[1].map(() => r.up.length ? '<span class="arr">→</span>' : ''),
      `<span class="chainChip me">${esc(r.name)}（我）</span>`,
      ...r.down.map(d => `<span class="arr">→</span><span class="chainChip">${esc(ROLES[d].name)}</span>`),
    ].join('');

    const msgHtml = msgs.length ? msgs.map(m => {
      const peer = peerOf(m.peer);
      const atts = (m.att || []).map(a => {
        const f = FILES[a.fid] || { icon: '📄', name: a.fid };
        return `<span class="attChip" data-fid="${esc(a.fid)}">${esc(f.icon)} ${esc(f.name)} · v${+a.ver || 1}</span>`;
      }).join('');
      return `
      <li class="msgItem ${m.kind === 'bug' ? 'bug' : m.kind === 'sup' ? 'sup' : ''} ${selMsg === m.id ? 'sel' : ''}" data-mid="${esc(m.id)}">
        <div class="msgMeta">
          <span class="dir ${m.dir}">${m.dir === 'in' ? '收到' : '发出'}</span>
          <span class="peer" style="color:${peer.color}">${esc(peer.name)}</span>
          <span>${fmtTime(+m.time || 0)}</span>
        </div>
        <div class="msgText">${esc(m.text)}</div>
        ${atts ? `<div class="attRow">${atts}</div>` : ''}
      </li>`;
    }).join('') : `<div class="msgEmpty">暂无交接消息<br>（角色收到 / 发出的消息会出现在这里）</div>`;

    const fileCount = files.input.length + files.output.length + (REFS[openId]||[]).length;

    const groupHtml = (key, title, sub, list) => {
      if (!list.length) return '';
      return `
      <div class="fileGroup ${col[key] ? 'closed' : ''}" data-group="${key}">
        <div class="fileGroupHead">
          <span>${title}</span><span class="gc">${list.length}</span>
          <span class="sub">${sub}</span><span class="caret">▾</span>
        </div>
        <div class="fcardList">${list}</div>
      </div>`;
    };

    const cardFor = (fid, viewpoint) => {
      const f = FILES[fid] || { name: fid, path: '', type: 'md', icon: '📄', owner: Object.keys(ROLES)[0] };
      const inst = CD.state.fileInst[fid] || {};
      const owner = ROLES[f.owner] || { name: '?', color: '#868e96' };
      let src = '';
      const fs = CD.state.fileSource[fid];
      const ps = CD.state.produceSource[fid];
      if (viewpoint === 'input' && fs) src = `来源 <b>${esc((ROLES[fs.from] || {}).name || fs.from)}</b> 的交接`;
      else if (viewpoint === 'output' && fs && fs.from === openId) src = `已交付给 <b>${esc((ROLES[fs.to] || {}).name || fs.to)}</b>`;
      else if (viewpoint === 'output' && ps) {
        const pm = CD.state.msgIndex[ps];
        if (pm) src = `依据 <b>${esc((ROLES[pm.from] || {}).name || pm.from)}</b> 的消息产出`;
      }
      return `
      <div class="fcard" data-fid="${esc(fid)}" data-vp="${viewpoint}">
        <div class="ficon" style="background:${owner.color}18">${esc(f.icon)}</div>
        <div class="fmain">
          <div class="fname">${esc(f.name)}
            <span class="fver">v${+inst.ver || 1}</span>
            <span class="badge s-${esc(inst.status || 'draft')}">${STATUS_TEXT[inst.status] || ''}</span>
          </div>
          <div class="fmeta"><span class="path">${esc(f.path)}</span>${src ? `<span class="srcChip">${src}</span>` : ''}</div>
        </div>
      </div>`;
    };

    const refCards = (REFS[openId] || []).map(x => `
      <div class="fcard" style="cursor:default;opacity:.75">
        <div class="ficon">${x.icon}</div>
        <div class="fmain">
          <div class="fname">${esc(x.name)} <span class="badge s-readonly">只读</span></div>
          <div class="fmeta"><span class="path">${esc(x.path)}</span></div>
        </div>
      </div>`).join('');

    document.getElementById('drawerBody').innerHTML = `
    <div class="dHeader">
      <div class="dTop">
        <div class="dAvatar" style="background:${r.color}">${esc(r.emoji || '👤')}</div>
        <div class="dTitle">
          <h2>${esc(r.name)}
            <span class="statusPill ${statusCls}"><i class="sdot"></i>${ROLE_STATUS_TEXT[st.status] || esc(st.status)}</span>
          </h2>
          <div class="desc">${esc(r.desc)} · 点击场景空白处关闭</div>
        </div>
        <button class="dClose" data-act="closeRole" title="关闭">✕</button>
      </div>
      <div class="taskLine">
        <div class="tl-label"><b>当前任务：${esc(st.task || '— 暂无进行中任务 —')}</b><span>${+st.progress || 0}%</span></div>
        <div class="taskBar"><i style="width:${+st.progress || 0}%"></i></div>
      </div>
      <div class="chainRow"><span class="clabel">流水线</span>${chain}</div>
    </div>
    <div class="dBody">
      <div class="dCol msgCol">
        <div class="dColTitle">📨 交接消息 <span class="count">${msgs.length}</span><span class="hint">点消息 ⇨ 高亮附件</span></div>
        <div class="drawerScroll" id="msgScroll"><ul id="msgList">${msgHtml}</ul></div>
      </div>
      <div class="dCol fileCol">
        <div class="dColTitle">🗂 文件工作台 <span class="count">${fileCount}</span><span class="hint">点文件 ⇨ 版本与 diff</span></div>
        <div class="drawerScroll" id="fileScroll">
          ${groupHtml('input', '📥 输入 · 上游交付给我', '我的原料', files.input.map(f => cardFor(f, 'input')).join(''))}
          ${groupHtml('output', '📤 我的产出', '我负责的文件', files.output.map(f => cardFor(f, 'output')).join(''))}
          ${groupHtml('ref', '📖 引用 · 只读', '公共参考', refCards)}
        </div>
      </div>
    </div>`;
  }

  /* ---------------- 文件抽屉渲染 ---------------- */
  function renderFile() {
    rebind();
    const { fid, ver } = fileOpen;
    if (!fid || !FILES[fid]) return;
    const f = FILES[fid];
    const inst = CD.state.fileInst[fid] || { ver: FILES[fid].versions.length, status:'draft' };
    const owner = ROLES[f.owner];
    const versions = f.versions.filter(v => v.v <= inst.ver);
    const cur = versions.find(v => v.v === ver) || versions[versions.length - 1];

    const verList = versions.map(v => `
      <li data-ver="${+v.v || 1}" class="${v.v === cur.v ? 'sel' : ''}">
        <div class="verMeta"><span class="v">v${+v.v || 1}</span><span class="vt">${esc(v.time)}</span></div>
        <div class="verReason">${esc(v.reason)}</div>
        <div class="verBy">by ${esc(v.by)}</div>
      </li>`).join('');

    let content = '', cvTitle = '';
    if (f.type === 'code') {
      const lines = cur.diff || [];
      let la = 0, lb = 0;
      const rows = lines.map(([s, t]) => {
        let ln;
        if (s === '-') ln = ++lb;
        else { ln = ++la; if (s === ' ') lb++; }
        const cls = s === '+' ? 'add' : s === '-' ? 'del' : 'ctx';
        return `<div class="dline ${cls}"><span class="ln">${ln || ''}</span><span class="sg">${s === ' ' ? '' : s}</span><span class="code">${esc(t)}</span></div>`;
      }).join('');
      cvTitle = `🔎 ${f.path}/${f.name} · ${cur.v === 1 ? '新文件（全文）' : `对比 v${cur.v - 1} → v${cur.v}`}`;
      content = `<div class="diffBox"><div class="dfile"><span class="pm">±</span>${esc(f.path)}/${esc(f.name)}<span style="margin-left:auto">${cur.v === 1 ? 'NEW' : `v${cur.v - 1} ↔ v${cur.v}`}</span></div>${rows}</div>`;
    } else if (f.type === 'md') {
      cvTitle = `📄 ${f.path}/${f.name} · v${cur.v} 全文`;
      content = `<div class="mdView">${md(cur.content || '')}</div>`;
    } else if (f.type === 'fig') {
      cvTitle = `🎨 ${f.path}/${f.name} · v${cur.v} 线框`;
      const blocks = (cur.mock || []).map(b => `
        <div class="figBlock ${b.isNew ? 'new' : ''}" style="background:${b.bg};min-height:${b.h}px;display:flex;align-items:center">
          ${esc(b.label)}${b.tag ? `<span class="fbTag" style="color:${b.tagColor || '#9aa6bb'}">${esc(b.tag)}</span>` : ''}
        </div>`).join('');
      content = `<div class="figView"><div class="figFrame"><div class="figBar"><i></i><i></i><i></i></div>${blocks}</div>${cur.note ? `<div class="figNote">${esc(cur.note)}</div>` : ''}</div>`;
    } else if (f.type === 'log') {
      cvTitle = `🧾 ${f.path}/${f.name}`;
      content = `<div class="logView">${esc(cur.text || '')}</div>`;
    }

    document.getElementById('fileDrawerBody').innerHTML = `
    <div class="dHeader">
      <div class="dTop">
        <div class="dAvatar" style="background:${owner.color}">${esc(f.icon)}</div>
        <div class="dTitle">
          <h2 style="font-family:Consolas,monospace;font-size:16px">${esc(f.name)}
            <span class="fver">v${+inst.ver || 1}</span>
            <span class="badge s-${esc(inst.status)}">${STATUS_TEXT[inst.status]}</span>
          </h2>
          <div class="desc">${esc(f.path)} · 负责人 ${esc(owner.name)}${fileSourceNote(fid)}</div>
        </div>
        <button class="dClose" data-act="closeFile" title="关闭">✕</button>
      </div>
    </div>
    <div class="fdBody">
      <div class="verCol">
        <div class="verColTitle">🕘 版本时间线</div>
        <ul class="verList">${verList}</ul>
      </div>
      <div class="contentView">
        <div class="cvTitle">${cvTitle}</div>
        ${content}
      </div>
    </div>`;
  }

  function fileSourceNote(fid) {
    const escName = id => esc((CD.data.ROLES[id] || {}).name || String(id));
    const fs = CD.state.fileSource[fid];
    if (fs) return ` · 由 ${escName(fs.from)} 在交接中送达`;
    const ps = CD.state.produceSource[fid];
    if (ps && CD.state.msgIndex[ps]) return ` · 响应 ${escName(CD.state.msgIndex[ps].from)} 的消息`;
    return '';
  }

  /* ---------------- mini markdown ---------------- */
  function md(src) {
    let out = '';
    for (let line of src.split('\n')) {
      let e = esc(line)
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      if (e.startsWith('### ')) out += `<h4>${e.slice(4)}</h4>`;
      else if (e.startsWith('## ')) out += `<h3>${e.slice(3)}</h3>`;
      else if (e.startsWith('# ')) out += `<h2>${e.slice(2)}</h2>`;
      else if (e.startsWith('- ')) out += `<div class="li">${e.slice(2)}</div>`;
      else if (e.startsWith('> ')) out += `<div class="quote">${e.slice(2)}</div>`;
      else if (e === '') out += '<div style="height:8px"></div>';
      else out += `<p>${e}</p>`;
    }
    return out;
  }

  /* ---------------- 事件（委托绑定一次） ---------------- */
  function init() {
    document.getElementById('drawerBody').addEventListener('click', e => {
      const closer = e.target.closest('[data-act="closeRole"]');
      if (closer) return closeRole();

      const att = e.target.closest('.attChip');
      if (att) { e.stopPropagation(); return openFile(att.dataset.fid); }

      const head = e.target.closest('.fileGroupHead');
      if (head) {
        const g = head.parentElement;
        const key = g.dataset.group;
        collapse[openId][key] = !collapse[openId][key];
        g.classList.toggle('closed');
        return;
      }

      const card = e.target.closest('.fcard[data-fid]');
      if (card) {
        const fid = card.dataset.fid;
        // 反向联动：高亮产出/交付该文件的消息
        const src = CD.state.fileSource[fid] || {};
        const mid = CD.state.fileSource[fid] ? src.msgId : CD.state.produceSource[fid];
        if (mid) {
          selMsg = mid;
          document.querySelectorAll('#msgList .msgItem').forEach(li => li.classList.toggle('sel', li.dataset.mid === mid));
          const li = document.querySelector(`#msgList .msgItem[data-mid="${mid}"]`);
          if (li) { li.classList.remove('pulse'); void li.offsetWidth; li.classList.add('pulse');
                    li.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
        }
        return openFile(fid);
      }

      const msg = e.target.closest('.msgItem');
      if (msg) {
        selMsg = msg.dataset.mid;
        document.querySelectorAll('#msgList .msgItem').forEach(li => li.classList.toggle('sel', li === msg));
        // 正向联动：高亮该消息携带的附件文件
        const m = (CD.state.msgs[openId] || []).find(x => x.id === msg.dataset.mid);
        const fids = (m && m.att || []).map(a => a.fid);
        document.querySelectorAll('#fileScroll .fcard').forEach(c => {
          c.classList.toggle('hl', fids.includes(c.dataset.fid));
          if (fids.includes(c.dataset.fid)) c.scrollIntoView({ behavior:'smooth', block:'nearest' });
        });
      }
    });

    document.getElementById('fileDrawerBody').addEventListener('click', e => {
      const closer = e.target.closest('[data-act="closeFile"]');
      if (closer) return closeFile();
      const li = e.target.closest('.verList li');
      if (li) { fileOpen.ver = +li.dataset.ver; renderFile(); }
    });

    document.getElementById('scrim').addEventListener('click', closeAll);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (fileOpen.fid) closeFile(); else closeRole();
      }
    });
  }

  /* ---------------- 供模拟引擎回调：增量刷新 ---------------- */
  function onEvent(ev) {
    if (!openId || !ev.roles.includes(openId)) return;
    const msgScroll = document.getElementById('msgScroll');
    const fileScroll = document.getElementById('fileScroll');
    const mTop = msgScroll ? msgScroll.scrollTop : 0;
    const fTop = fileScroll ? fileScroll.scrollTop : 0;
    renderRole();
    const ms = document.getElementById('msgScroll');
    const fs2 = document.getElementById('fileScroll');
    if (ms) ms.scrollTop = ev.kind === 'msg' ? ms.scrollHeight : mTop;
    if (fs2) fs2.scrollTop = fTop;
  }

  return { init, openRole, closeRole, closeFile, closeAll, openFile, onEvent, renderRole };
})();
