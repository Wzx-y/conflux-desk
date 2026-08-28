/* ================================================================
 * 📋 新项目模板 —— 复制本文件夹并重命名，改这个文件即可
 *
 * projectID = 文件夹名（自动识别，不需要去别处查询或注册）。
 * 对接一个新需求只需要 3 步：
 *   1. 复制 projects/_template → projects/<文件夹名>/（英文命名）
 *   2. 按下方注释填写 project.js：角色 → 文件 → 剧本
 *   3.（可选）在 projects/registry.js 加一行，项目就出现在顶栏下拉框
 * 然后访问 index.html?project=<文件夹名>。
 *
 * 规则：
 *   - 角色数量建议 2~10 个，工位会自动分成两排摆放
 *   - 角色的 up/down 决定详情抽屉里的"流水线"链路展示
 *   - 剧本按顺序执行：phase（换阶段）→ work（干活）→ handoff（走动交接）
 * ================================================================ */
window.PROJECT = {

  /* ---- 基本信息（name 必填；id 可省略，系统以文件夹名为准）---- */
  id: 'my-project',
  name: '我的新需求 v1.0',                 // 显示在顶栏徽标与结束横幅
  desc: '一句话描述',                       // 备注用

  /* ---- 角色（必填，2~10 个）----
   * id     角色唯一标识（英文，剧本里引用它）
   * name   工位牌显示的中文名
   * emoji  详情抽屉头像（场景人物是自动绘制的，不用管）
   * color  主题色：头发/衣服/屏幕光/工位牌圆点都会用它
   * desc   一句话职责
   * up/down 上/下游角色 id 数组 → 抽屉里"流水线"链路
   */
  roles: {
    product: { id:'product', name:'产品经理', emoji:'🧑‍💼', color:'#1c7ed6',
      desc:'需求定义', up:[], down:['dev'] },
    dev:     { id:'dev', name:'研发工程师', emoji:'👨‍💻', color:'#0ca678',
      desc:'功能开发', up:['product'], down:['test'] },
    test:    { id:'test', name:'测试工程师', emoji:'🧑‍🔬', color:'#f08c00',
      desc:'质量保障', up:['dev'], down:[] },
  },

  /* ---- 只读引用文件（可选）：每个角色"引用"分组里展示的静态文件 ---- */
  refs: {
    product: [ { name:'roadmap.md', path:'docs', icon:'📄' } ],
  },

  /* ---- 阶段（可选）：不填会按剧本里 phase 步骤自动生成 ---- */
  phases: ['产品', '开发', '测试'],

  /* ---- 文件版本库（剧本引用的文件都在这定义）----
   * type: 'md'（文档渲染）| 'code'（diff 视图）| 'fig'（设计稿线框）| 'log'（终端文本）
   * icon: 文件卡片左侧图标
   * owner: 负责角色 id（出现在"我的产出"分组）
   * versions[]: 版本从 v1 递增，每个版本三种内容二选一：
   *   md/log   → content / text 字符串
   *   code     → diff: [['+/-/空格', '代码行'], ...]  （v1 建议整文件全 '+'）
   *   fig      → mock: [{label, h, bg, tag?, tagColor?, isNew?}]
   * reason   版本时间线上的修改说明
   */
  files: {
    'my-prd': {
      name:'prd.md', path:'docs', type:'md', icon:'📄', owner:'product',
      versions:[
        { v:1, time:'10-01 09:00', by:'产品经理', reason:'初稿',
          content:'# PRD\n## 目标\n- …' },
      ],
    },
    'my-code': {
      name:'main.py', path:'src', type:'code', icon:'🐍', owner:'dev',
      versions:[
        { v:1, time:'10-02 10:00', by:'研发工程师', reason:'首次提交',
          diff:[ ['+','def main():'], ['+','    pass'] ] },
        { v:2, time:'10-03 10:00', by:'研发工程师', reason:'按测试反馈修复',
          diff:[ [' ','def main():'], ['-','    pass'], ['+','    run()'] ] },
      ],
    },
    'my-bug': {
      name:'bug-1.md', path:'qa', type:'md', icon:'🐞', owner:'test',
      versions:[
        { v:1, time:'10-03 11:00', by:'测试工程师', reason:'提 BUG',
          content:'# BUG 单\n**级别**：P2\n**复现**：…' },
      ],
    },
  },

  /* ---- 剧本（必填）：按数组顺序执行的三个动作 ----
   * phase   { type:'phase', name:'阶段名' }            顶栏 chips + 白板切换
   * work    { type:'work', role, dur, task,
   *           produce:[{fid, ver, status}],            干完活产出的文件（进入"我的产出"）
   *           sourceFrom:'last-in' }                   可选：产出挂到最近收到的消息上
   *         dur 是 1x 倍速下的毫秒数（用户可 1/2/4 倍速播放）
   * handoff { type:'handoff', from, to, text,          角色走过去 + 左上角气泡 + 消息入档
   *           kind:'bug',                              可选：红色缺陷气泡
   *           att:[{fid, ver}],                        气泡附件（进入对方"输入"分组）
   *           deliver:[{fid, status}],                 交付时文件的落位状态
   *           mark:[{fid, status}] }                   可选：把某文件标记为 defect（被打回）
   *
   * status 可选值：draft 草稿 / wip 修改中 / review 待验收 /
   *               delivered 已交付 / defect 有缺陷 / online 已上线
   */
  script: [
    { type:'phase', name:'产品' },
    { type:'work', role:'product', dur:2400, task:'撰写 PRD',
      produce:[{fid:'my-prd', ver:1, status:'review'}] },
    { type:'handoff', from:'product', to:'dev',
      text:'PRD 已评审通过，请开发。',
      att:[{fid:'my-prd', ver:1}], deliver:[{fid:'my-prd', status:'delivered'}] },

    { type:'phase', name:'开发' },
    { type:'work', role:'dev', dur:2800, task:'功能开发', sourceFrom:'last-in',
      produce:[{fid:'my-code', ver:1, status:'review'}] },
    { type:'handoff', from:'dev', to:'test',
      text:'开发完成，提测。',
      att:[{fid:'my-code', ver:1}], deliver:[{fid:'my-code', status:'delivered'}] },

    { type:'phase', name:'测试' },
    { type:'handoff', from:'test', to:'dev', kind:'bug',
      text:'🐞 发现缺陷，请修复。',
      att:[{fid:'my-bug', ver:1}],
      deliver:[{fid:'my-bug', status:'delivered'}],
      mark:[{fid:'my-code', status:'defect'}] },
    { type:'work', role:'dev', dur:1800, task:'修复缺陷', sourceFrom:'last-in',
      produce:[{fid:'my-code', ver:2, status:'review'}] },
    { type:'handoff', from:'dev', to:'test',
      text:'已修复，请回归。',
      att:[{fid:'my-code', ver:2}], deliver:[{fid:'my-code', status:'delivered'}] },
    { type:'handoff', from:'test', to:'product',
      text:'回归通过，项目交付 🎉', att:[], deliver:[] },
  ],
};
