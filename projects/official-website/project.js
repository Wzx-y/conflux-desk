/* ================================================================
 * 项目：官网改版 v2.0（5 角色精简流程示例）
 * ================================================================ */
window.PROJECT = {
  id: 'official-website',
  name: '官网改版 v2.0',
  desc: '5 角色精简流程演示',

  roles: {
    product:  { id:'product',  name:'产品经理', emoji:'🧑‍💼', color:'#1c7ed6',
      desc:'改版目标与 PRD', up:[], down:['design'] },
    design:   { id:'design',   name:'UI 设计', emoji:'👩‍🎨', color:'#e64980',
      desc:'品牌视觉与首屏设计', up:['product'], down:['frontend'] },
    frontend: { id:'frontend', name:'前端研发', emoji:'👨‍💻', color:'#0ca678',
      desc:'首页重构与性能优化', up:['design'], down:['test'] },
    test:     { id:'test',     name:'测试工程师', emoji:'🧑‍🔬', color:'#f08c00',
      desc:'性能与兼容性测试', up:['frontend'], down:['ops'] },
    ops:      { id:'ops',      name:'运维工程师', emoji:'👨‍🔧', color:'#64748b',
      desc:'CDN 发布与监控', up:['test'], down:['product'] },
  },

  refs: {
    product:  [ {name:'traffic-2026.csv', path:'data', icon:'📊'} ],
    design:   [ {name:'brand-guide.fig', path:'design/brand', icon:'🎨'} ],
    frontend: [ {name:'cdn.conf', path:'web/deploy', icon:'🧾'},
                {name:'next.config.js', path:'web', icon:'🧾'} ],
    test:     [ {name:'lighthouse.yml', path:'qa/perf', icon:'🧾'} ],
    ops:      [ {name:'oncall.md', path:'ops/runbooks', icon:'📄'} ],
  },

  phases: ['产品','设计','开发','测试','上线'],

  files: {
    'prd': {
      name:'prd.md', path:'docs/product', type:'md', icon:'📄', owner:'product',
      versions:[
        { v:1, time:'09-02 10:00', by:'产品经理', reason:'改版 PRD：品牌升级 + 首屏重构，转化目标 +20%',
          content:`# 官网改版 PRD v2.0
## 目标
- 品牌视觉全面升级，对齐新 VI
- 首屏重构，注册转化率 **+20%**
- 性能红线：LCP ≤ 2.5s
## 范围
- 首页 / 产品页 / 定价页
## 非目标
- 后台管理系统本期不动` },
      ],
    },
    'homepage-fig': {
      name:'homepage.fig', path:'design/site', type:'fig', icon:'🎨', owner:'design',
      versions:[
        { v:1, time:'09-03 15:20', by:'UI 设计', reason:'首页高保真：新品牌首屏',
          mock:[ {label:'导航栏（新 VI 配色）', h:26, bg:'#e7f0ff'},
                 {label:'首屏大图 Hero · CTA 按钮', h:58, bg:'#fff0f3', tag:'核心转化区'},
                 {label:'产品能力矩阵（3 列）', h:44, bg:'#f6f8ff'},
                 {label:'客户 Logo 墙', h:26, bg:'#f2f6ec'},
                 {label:'页脚', h:24, bg:'#eef1f6'} ] },
      ],
    },
    'home-v2': {
      name:'home-page.tsx', path:'web/src/pages', type:'code', icon:'⚛️', owner:'frontend',
      versions:[
        { v:1, time:'09-05 11:30', by:'前端研发', reason:'首页 v2 开发完成，新 Hero 组件，提测',
          diff:[ ['+',"import { Hero } from '@/components/Hero';"],
                 ['+',"import { ProductMatrix } from '@/components/ProductMatrix';"],
                 ['+',''],
                 ['+','export default function HomePage() {'],
                 ['+','  return ('],
                 ['+','    <>'],
                 ['+','      <Hero image="/assets/hero-banner.png" />'],
                 ['+','      <ProductMatrix items={PRODUCTS} />'],
                 ['+','    </>'],
                 ['+','  );'],
                 ['+','}'] ] },
        { v:2, time:'09-06 10:10', by:'前端研发', reason:'修复 LCP：首图压缩为 WebP 并声明尺寸',
          diff:[ [' ','export default function HomePage() {'],
                 ['-','      <Hero image="/assets/hero-banner.png" />'],
                 ['+','      <Hero image="/assets/hero-banner.webp"'],
                 ['+','             width={1920} height={720} priority />'],
                 [' ','      <ProductMatrix items={PRODUCTS} />'] ] },
        { v:3, time:'09-06 10:40', by:'前端研发', reason:'关键资源预加载 + 首屏以下内容懒加载',
          diff:[ ['+','<link rel="preload" as="image" href="/assets/hero-banner.webp" />'],
                 [' ','      <Hero image="/assets/hero-banner.webp"'],
                 [' ','             width={1920} height={720} priority />'],
                 ['-','      <ProductMatrix items={PRODUCTS} />'],
                 ['+','      <LazyBoundary>'],
                 ['+','        <ProductMatrix items={PRODUCTS} />'],
                 ['+','      </LazyBoundary>'] ] },
      ],
    },
    'bug-lcp': {
      name:'bug-lcp.md', path:'qa/bugs', type:'md', icon:'🐞', owner:'test',
      versions:[
        { v:1, time:'09-05 16:00', by:'测试工程师', reason:'提 BUG：LCP 3.9s 超出红线（P1）',
          content:`# BUG 单 #2014
**级别**：P1 · 性能红线
**指标**：LCP **3.9s**（目标 ≤ 2.5s）
**成因**：首屏 PNG 大图 4.2MB，未压缩、未声明尺寸（CLS 连带问题）
**建议**：WebP + 尺寸声明 + 预加载` },
      ],
    },
    'perf-report': {
      name:'perf-report.md', path:'qa/perf', type:'md', icon:'📄', owner:'test',
      versions:[
        { v:1, time:'09-06 14:00', by:'测试工程师', reason:'性能回归：Lighthouse 98 分，准予上线',
          content:`# 性能回归报告
- Lighthouse Performance：**98**（基线 71）
- LCP **1.9s** · CLS 0.02 · TBT 120ms
- 弱网（3G 慢速）模拟：LCP 2.3s，仍达标
> 结论：性能达标，准予上线 v2.0` },
      ],
    },
    'ops-report': {
      name:'ops-report.md', path:'ops/reports', type:'md', icon:'📄', owner:'ops',
      versions:[
        { v:1, time:'09-06 18:00', by:'运维工程师', reason:'全球 CDN 发布完成，监控大盘就绪',
          content:`# 官网 v2.0 发布报告
- 全球 6 个 CDN 节点预热完成
- 发布期间双版本灰度 30 分钟，回滚预案就绪
- 监控大盘：LCP / 转化率 / 5xx 三类核心告警
> v2.0 上线成功，转化率首日 +14% 🎉` },
      ],
    },
  },

  script: [
    { type:'phase', name:'产品' },
    { type:'work', role:'product', dur:2600, task:'撰写改版 PRD（品牌 + 转化目标）',
      produce:[{fid:'prd', ver:1, status:'review'}] },
    { type:'handoff', from:'product', to:'design',
      text:'改版 PRD：品牌升级 + 首屏重构，转化目标 +20%，性能红线 LCP ≤ 2.5s。',
      att:[{fid:'prd', ver:1}], deliver:[{fid:'prd', status:'delivered'}] },

    { type:'phase', name:'设计' },
    { type:'work', role:'design', dur:3200, task:'首页高保真设计（新 VI）',
      produce:[{fid:'homepage-fig', ver:1, status:'review'}] },
    { type:'handoff', from:'design', to:'frontend',
      text:'首页设计稿交付：Hero 大图注意压缩预算，产品矩阵用 3 列栅格。',
      att:[{fid:'homepage-fig', ver:1}], deliver:[{fid:'homepage-fig', status:'delivered'}] },

    { type:'phase', name:'开发' },
    { type:'work', role:'frontend', dur:3400, task:'首页 v2 重构（Hero + 矩阵组件）', sourceFrom:'last-in',
      produce:[{fid:'home-v2', ver:1, status:'review'}] },
    { type:'handoff', from:'frontend', to:'test',
      text:'首页 v2 提测，重点验证 LCP 与视觉还原度。',
      att:[{fid:'home-v2', ver:1}], deliver:[{fid:'home-v2', status:'delivered'}] },

    { type:'phase', name:'测试' },
    { type:'work', role:'test', dur:2600, task:'Lighthouse 性能测试' },
    { type:'handoff', from:'test', to:'frontend', kind:'bug',
      text:'🐞 P1：LCP 3.9s 超红线！首屏 PNG 4.2MB 未压缩，见附件，请优化。',
      att:[{fid:'bug-lcp', ver:1}],
      deliver:[{fid:'bug-lcp', status:'delivered'}],
      mark:[{fid:'home-v2', status:'defect'}] },
    { type:'work', role:'frontend', dur:1600, task:'首图压缩 WebP + 尺寸声明', sourceFrom:'last-in',
      produce:[{fid:'home-v2', ver:2, status:'wip'}] },
    { type:'work', role:'frontend', dur:1400, task:'关键资源预加载 + 懒加载', sourceFrom:'last-in',
      produce:[{fid:'home-v2', ver:3, status:'review'}] },
    { type:'handoff', from:'frontend', to:'test',
      text:'LCP 优化到 1.9s（WebP + preload + 懒加载），请回归。',
      att:[{fid:'home-v2', ver:3}], deliver:[{fid:'home-v2', status:'delivered'}] },
    { type:'work', role:'test', dur:2200, task:'性能回归 + 弱网模拟',
      produce:[{fid:'perf-report', ver:1, status:'review'}] },
    { type:'handoff', from:'test', to:'ops',
      text:'Lighthouse 98 分、LCP 1.9s，性能达标，准予上线。',
      att:[{fid:'perf-report', ver:1}], deliver:[{fid:'perf-report', status:'delivered'}] },

    { type:'phase', name:'上线' },
    { type:'work', role:'ops', dur:2600, task:'CDN 预热与全球发布', sourceFrom:'last-in',
      produce:[{fid:'ops-report', ver:1, status:'review'}] },
    { type:'handoff', from:'ops', to:'product',
      text:'v2.0 已上线：转化率首日 +14%，LCP 1.9s，项目交付 🎉',
      att:[{fid:'ops-report', ver:1}], deliver:[{fid:'ops-report', status:'delivered'}] },
  ],
};
