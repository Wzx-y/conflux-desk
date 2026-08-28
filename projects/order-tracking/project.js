/* ================================================================
 * 项目：订单跟踪功能 v1.2.0
 * ================================================================ */
window.PROJECT = {
  id: 'order-tracking',
  name: '订单跟踪功能 v1.2.0',
  desc: '8 角色全流程演示',

  roles: {
    research: { id:'research', name:'需求调研', emoji:'🧐', color:'#7048e8',
      desc:'用户访谈 · 市场与竞品分析', up:[], down:['product'] },
    product:  { id:'product',  name:'产品经理', emoji:'🧑‍💼', color:'#1c7ed6',
      desc:'需求定义 · PRD 与评审', up:['research'], down:['design'] },
    design:   { id:'design',   name:'UI 设计', emoji:'👩‍🎨', color:'#e64980',
      desc:'交互与视觉 · 高保真稿', up:['product'], down:['frontend','backend'] },
    frontend: { id:'frontend', name:'前端研发', emoji:'👨‍💻', color:'#0ca678',
      desc:'Web 前端 · 订单页面', up:['design','backend'], down:['test'] },
    backend:  { id:'backend',  name:'后端研发', emoji:'👩‍💻', color:'#4263eb',
      desc:'服务端 · 订单接口', up:['design'], down:['test','frontend'] },
    test:     { id:'test',     name:'测试工程师', emoji:'🧑‍🔬', color:'#f08c00',
      desc:'质量保障 · 用例与回归', up:['frontend','backend'], down:['deploy'] },
    deploy:   { id:'deploy',   name:'部署工程师', emoji:'🧑‍🚀', color:'#37b24d',
      desc:'CI/CD · 构建与发布', up:['test'], down:['ops'] },
    ops:      { id:'ops',      name:'运维工程师', emoji:'👨‍🔧', color:'#64748b',
      desc:'监控告警 · 稳定性保障', up:['deploy'], down:['product'] },
  },

  refs: {
    research: [ {name:'user-pool.csv', path:'data', icon:'📊'},
                {name:'interview-guide.md', path:'docs/research', icon:'📄'} ],
    product:  [ {name:'dau-metrics.csv', path:'data', icon:'📊'},
                {name:'roadmap-q3.md', path:'docs/product', icon:'📄'} ],
    design:   [ {name:'guideline.fig', path:'design/brand', icon:'🎨'},
                {name:'tokens.css', path:'design/brand', icon:'🧾'} ],
    frontend: [ {name:'client.ts', path:'web/src/api', icon:'🧾'},
                {name:'format.ts', path:'web/src/utils', icon:'🧾'},
                {name:'tokens.css', path:'design/brand', icon:'🧾'} ],
    backend:  [ {name:'base.py', path:'server/models', icon:'🐍'},
                {name:'db.py', path:'server/services', icon:'🐍'} ],
    test:     [ {name:'template.yaml', path:'qa/cases', icon:'🧾'} ],
    deploy:   [ {name:'k8s-base.yaml', path:'deploy/k8s', icon:'🧾'} ],
    ops:      [ {name:'oncall.md', path:'ops/runbooks', icon:'📄'} ],
  },

  phases: ['调研','产品','设计','开发','测试','发布','交付'],

  files: {
    'research-report': {
      name:'research-report.md', path:'docs/research', type:'md', icon:'📄', owner:'research',
      versions:[
        { v:1, time:'08-20 14:10', by:'需求调研', reason:'完成首轮 21 位用户访谈，整理核心痛点',
          content:`# 订单跟踪需求调研报告 v1
## 一、调研背景
物流信息不透明是本季度客诉 **TOP1**（占比 41%），其中"不知道订单到哪了"占物流类咨询的 76%。
## 二、用户访谈（21 人）
- 78% 的受访者表示"下单后不知道到哪了"是最大痛点
- 核心场景：给长辈代买药品、跨城搬家寄物
- 期望能力：地图轨迹、异常提醒、预计送达时间
## 三、初步结论
> 建议立项"订单实时跟踪"功能，优先覆盖标快与冷链两条线路。` },
        { v:2, time:'08-21 09:30', by:'需求调研', reason:'补充竞品对比与规模估算，交付产品',
          content:`# 订单跟踪需求调研报告 v2
## 一、调研背景
物流信息不透明是本季度客诉 **TOP1**（占比 41%），其中"不知道订单到哪了"占物流类咨询的 76%。
## 二、用户访谈（32 人）
- 78% 的受访者表示"下单后不知道到哪了"是最大痛点
- 核心场景：给长辈代买药品、跨城搬家寄物
- 期望能力：地图轨迹、异常提醒、预计送达时间
## 三、竞品对比（新增）
- 竞品 A：有轨迹无异常提醒，客诉率高于我们 12%
- 竞品 B：推送过密（每次节点都推），用户关闭率 34%
## 四、规模估算（新增）
- 预计日均查询 +210 万次，需评估读扩散
> 建议立项"订单实时跟踪"功能，优先覆盖标快与冷链两条线路。` },
      ],
    },
    'prd': {
      name:'prd.md', path:'docs/product', type:'md', icon:'📄', owner:'product',
      versions:[
        { v:1, time:'08-21 15:00', by:'产品经理', reason:'PRD 初稿：订单跟踪功能（FR-01~04）',
          content:`# PRD：订单实时跟踪（v1 初稿）
## 目标
将"物流咨询"类客服量降低 30%，到期复购率提升 5%。
## 功能需求
- FR-01 订单列表：展示物流状态徽章
- FR-02 订单详情：物流时间线 + 地图轨迹
- FR-03 订阅推送：状态变更通知
- FR-04 异常订单：置顶 + 红色高亮
## 非目标
本期不做快递员实时位置展示。` },
        { v:2, time:'08-22 10:20', by:'产品经理', reason:'评审修订：明确推送触发规则，新增埋点 FR-06',
          content:`# PRD：订单实时跟踪（v2 评审稿）
## 目标
将"物流咨询"类客服量降低 30%，到期复购率提升 5%。
## 功能需求
- FR-01 订单列表：展示物流状态徽章
- FR-02 订单详情：物流时间线 + 地图轨迹
- FR-03 订阅推送：**仅在「揽收 / 派送 / 签收 / 异常」四类节点推送**（评审新增规则）
- FR-04 异常订单：置顶 + 红色高亮
- FR-06 埋点（新增）：轨迹曝光、订阅开关、推送点击
## 非目标
本期不做快递员实时位置展示。
## 里程碑
设计 08-25 · 提测 08-28 · 发布 08-30` },
      ],
    },
    'ui-list': {
      name:'ui-order-list.fig', path:'design/order', type:'fig', icon:'🎨', owner:'design',
      versions:[
        { v:1, time:'08-23 11:40', by:'UI 设计', reason:'订单列表页高保真 v1',
          mock:[ {label:'搜索栏', h:26, bg:'#e7f0ff'},
                 {label:'订单卡片 · 状态徽章（灰）', h:52, bg:'#f6f8ff', tag:'v1 灰色徽章'},
                 {label:'订单卡片', h:52, bg:'#f6f8ff'},
                 {label:'订单卡片', h:52, bg:'#f6f8ff'},
                 {label:'底部 Tab', h:30, bg:'#eef1f6'} ] },
        { v:2, time:'08-23 16:05', by:'UI 设计', reason:'走查修订：状态徽章改为彩色 token，卡片圆角 12px',
          mock:[ {label:'搜索栏', h:26, bg:'#e7f0ff'},
                 {label:'订单卡片 · 状态徽章（彩色 token）', h:52, bg:'#f6f8ff', tag:'v2 彩色徽章', tagColor:'#e8590c'},
                 {label:'订单卡片 · 圆角 12px', h:52, bg:'#f6f8ff', tag:'v2', tagColor:'#e8590c'},
                 {label:'订单卡片', h:52, bg:'#f6f8ff'},
                 {label:'底部 Tab', h:30, bg:'#eef1f6'} ],
          note:'✏️ v2 变化：徽章配色与圆角调整（点击版本可对比 v1）' },
      ],
    },
    'ui-detail': {
      name:'ui-order-detail.fig', path:'design/order', type:'fig', icon:'🎨', owner:'design',
      versions:[
        { v:1, time:'08-23 11:55', by:'UI 设计', reason:'订单详情页高保真 v1',
          mock:[ {label:'导航栏', h:26, bg:'#e7f0ff'},
                 {label:'状态大徽章', h:44, bg:'#fff4e6'},
                 {label:'商品摘要', h:40, bg:'#f6f8ff'},
                 {label:'地图轨迹（占位）', h:64, bg:'#e6f4ec'},
                 {label:'操作栏', h:30, bg:'#eef1f6'} ] },
        { v:2, time:'08-23 16:20', by:'UI 设计', reason:'新增「物流时间线」模块（配合 FR-02）',
          mock:[ {label:'导航栏', h:26, bg:'#e7f0ff'},
                 {label:'状态大徽章', h:44, bg:'#fff4e6'},
                 {label:'物流时间线（时间轴竖排）', h:56, bg:'#eef7ff', tag:'v2 新增', tagColor:'#e8590c', isNew:true},
                 {label:'商品摘要', h:40, bg:'#f6f8ff'},
                 {label:'地图轨迹（占位）', h:64, bg:'#e6f4ec'},
                 {label:'操作栏', h:30, bg:'#eef1f6'} ],
          note:'✏️ v2 变化：新增物流时间线模块，接口需支持物流节点数据' },
      ],
    },
    'api-spec': {
      name:'api-spec.md', path:'docs/api', type:'md', icon:'📄', owner:'backend',
      versions:[
        { v:1, time:'08-24 09:10', by:'后端研发', reason:'输出接口契约 v1：订单查询与订阅',
          content:`# 订单接口契约 v1
## GET /api/orders
返回订单列表（分页），每项含 \`logistics_status\` 枚举：
\`pending | shipping | delivered | exception\`
## POST /api/orders/subscribe
- body: \`{ "order_id": "SO-1024", "channels": ["sms","app"] }\`
- 幂等：重复订阅不重复推送
## 错误码
- 404 \`ORDER_NOT_FOUND\`
- 400 \`PARAM_INVALID\`` },
        { v:2, time:'08-24 14:30', by:'后端研发', reason:'新增 logistics_timeline 字段（配合详情页 v2）',
          content:`# 订单接口契约 v2
## GET /api/orders
返回订单列表（分页），每项含 \`logistics_status\` 枚举：
\`pending | shipping | delivered | exception\`
## GET /api/orders/:id（v2 新增）
- 返回 \`logistics_timeline\`：物流节点数组 \`[{node, time, desc}]\`
- 返回 \`eta\`：预计送达时间
## POST /api/orders/subscribe
- body: \`{ "order_id": "SO-1024", "channels": ["sms","app"] }\`
- 幂等：重复订阅不重复推送
## 错误码
- 404 \`ORDER_NOT_FOUND\`
- 400 \`PARAM_INVALID\`` },
      ],
    },
    'order-page': {
      name:'order-page.tsx', path:'web/src/pages', type:'code', icon:'⚛️', owner:'frontend',
      versions:[
        { v:1, time:'08-26 09:40', by:'前端研发', reason:'订单页面开发完成（列表 + 详情 + 订阅），提测',
          diff:[ ['+','import { useOrder, useOrderList, useSubscribe } from \'@/api/client\';'],
                 ['+',"import { StatusBadge } from '@/components/StatusBadge';"],
                 ['+',"import { Timeline } from '@/components/Timeline';"],
                 ['+',''],
                 ['+','export function OrderDetail({ orderId }: Props) {'],
                 ['+','  const { order } = useOrder(orderId);'],
                 ['+','  useSubscribe(orderId, [\'app\']);'],
                 ['+',''],
                 ['+','  return ('],
                 ['+','    <div className="order-detail">'],
                 ['+','      <StatusBadge status={order.logistics_status} />'],
                 ['+','      <Timeline events={order.logistics_timeline} />'],
                 ['+','      <MapTrack eta={order.eta} />'],
                 ['+','    </div>'],
                 ['+','  );'],
                 ['+','}'] ] },
        { v:2, time:'08-26 11:05', by:'前端研发', reason:'走查修订：状态徽章配色对齐设计 token v2',
          diff:[ [' ','export function OrderDetail({ orderId }: Props) {'],
                 [' ','  const { order } = useOrder(orderId);'],
                 [' ','  useSubscribe(orderId, [\'app\']);'],
                 [' ','  return ('],
                 [' ','    <div className="order-detail">'],
                 ['-','      <StatusBadge variant="legacy" status={order.logistics_status} />'],
                 ['+','      <StatusBadge variant="token-v2" status={order.logistics_status} />'],
                 ['+','      {/* 圆角 radius-12 对齐 ui-order-list.fig v2 */}'],
                 [' ','      <Timeline events={order.logistics_timeline} />'],
                 [' ','      <MapTrack eta={order.eta} />'],
                 [' ','    </div>'],
                 [' ','  );'],
                 [' ','}'] ] },
      ],
    },
    'order-api': {
      name:'order_api.py', path:'server/orders', type:'code', icon:'🐍', owner:'backend',
      versions:[
        { v:1, time:'08-26 09:35', by:'后端研发', reason:'订单接口开发完成，提测',
          diff:[ ['+','from services.db import query, db'],
                 ['+','from models.order import Order, Subscription'],
                 ['+','from utils.push import push'],
                 ['+',''],
                 ['+','def get_order(order_id):'],
                 ['+','    order = query(Order, order_id)'],
                 ['+','    return order.to_dict()'],
                 ['+',''],
                 ['+','def subscribe(user_id, order_id):'],
                 ['+','    sub = Subscription(user_id=user_id, order_id=order_id)'],
                 ['+','    db.save(sub)'],
                 ['+','    push.bind(user_id, f\'order:{order_id}\')'],
                 ['+','    return {"ok": True}'] ] },
        { v:2, time:'08-26 10:12', by:'后端研发', reason:'排查 BUG#1024：增加入口日志与参数打印',
          diff:[ [' ','def get_order(order_id):'],
                 ['+','    log.debug("get_order order_id=%r", order_id)'],
                 [' ','    order = query(Order, order_id)'],
                 [' ','    return order.to_dict()'] ] },
        { v:3, time:'08-26 10:40', by:'后端研发', reason:'修复 BUG#1024：空订单防御 + 404 语义 + 安全序列化',
          diff:[ [' ','def get_order(order_id):'],
                 [' ','    log.debug("get_order order_id=%r", order_id)'],
                 ['+','    if not order_id:'],
                 ['+','        raise ParamInvalid("order_id required")'],
                 [' ','    order = query(Order, order_id)'],
                 ['+','    if order is None:'],
                 ['+','        raise OrderNotFound(order_id)'],
                 ['-','    return order.to_dict()'],
                 ['+','    return order.to_dict(safe=True)'] ] },
      ],
    },
    'bug-500': {
      name:'bug-500.md', path:'qa/bugs', type:'md', icon:'🐞', owner:'test',
      versions:[
        { v:1, time:'08-26 10:00', by:'测试工程师', reason:'提 BUG：订单查询接口 500（P1 阻塞回归）',
          content:`# BUG 单 #1024
**级别**：P1 · 阻塞回归
**接口**：\`GET /api/orders?order_id=\`
**复现**：order_id 为空字符串时返回 500
**堆栈**：
> TypeError: NoneType has no attribute 'to_dict'
> at get_order (order_api.py:6)
**期望**：空 / 不存在订单返回 **404**，参数非法返回 400` },
      ],
    },
    'test-report': {
      name:'test-report.md', path:'qa/reports', type:'md', icon:'📄', owner:'test',
      versions:[
        { v:1, time:'08-26 11:20', by:'测试工程师', reason:'回归测试报告：12/12 通过，准予发布',
          content:`# 回归测试报告
- 用例总数：12（核心 8 · 边界 4）
- 通过：**12**  失败：0  阻塞：0
- 缺陷回归：#1024 已验证通过（空参返回 404）
> 结论：准予发布 v1.2.0` },
      ],
    },
    'release-log': {
      name:'release-v1.2.0.log', path:'deploy/releases', type:'log', icon:'🧾', owner:'deploy',
      versions:[
        { v:1, time:'08-26 11:35', by:'部署工程师', reason:'构建镜像并完成灰度 → 全量发布',
          text:`[11:30] checkout tag v1.2.0 ................ OK
[11:31] build image order-api:1.2.0 ........ OK (42s)
[11:32] build image order-web:1.2.0 ........ OK (38s)
[11:33] deploy canary 5% ................... OK
[11:34] canary 5xx = 0.00% 观测通过 ........ OK
[11:35] rollout 100% ....................... OK ✅` },
      ],
    },
    'ops-report': {
      name:'ops-report.md', path:'ops/reports', type:'md', icon:'📄', owner:'ops',
      versions:[
        { v:1, time:'08-26 14:00', by:'运维工程师', reason:'上线后 24h 稳定性报告：SLO 达标',
          content:`# 上线后 24h 稳定性报告
- 可用性 **99.97%**（SLO 99.9% · 达标）
- P99 延迟 182ms · QPS 峰值 3.2k
- 5xx 共 3 起：均为非法参数触发，已加限流
- 告警规则：5 分钟 5xx > 1% 触发电话告警
> v1.2.0 运行平稳，项目交付 🎉` },
      ],
    },
  },

  script: [
    { type:'phase', name:'调研' },
    { type:'work', role:'research', dur:2600, task:'用户访谈与痛点分析',
      produce:[{fid:'research-report', ver:1, status:'draft'}] },
    { type:'work', role:'research', dur:1400, task:'补充竞品对比与规模估算',
      produce:[{fid:'research-report', ver:2, status:'review'}] },
    { type:'handoff', from:'research', to:'product',
      text:'调研完成：78% 用户最关心「订单实时跟踪」，客诉 TOP1 与物流不透明直接相关。',
      att:[{fid:'research-report', ver:2}], deliver:[{fid:'research-report', status:'delivered'}] },

    { type:'phase', name:'产品' },
    { type:'work', role:'product', dur:3000, task:'撰写 PRD：订单实时跟踪',
      produce:[{fid:'prd', ver:1, status:'draft'}] },
    { type:'work', role:'product', dur:1200, task:'评审修订：推送规则与埋点',
      produce:[{fid:'prd', ver:2, status:'review'}] },
    { type:'handoff', from:'product', to:'design',
      text:'PRD v2 评审通过，重点看 FR-02 物流时间线与 FR-03 推送规则，麻烦出高保真。',
      att:[{fid:'prd', ver:2}], deliver:[{fid:'prd', status:'delivered'}] },

    { type:'phase', name:'设计' },
    { type:'work', role:'design', dur:3200, task:'高保真设计：列表页 + 详情页',
      produce:[{fid:'ui-list', ver:1, status:'review'}, {fid:'ui-detail', ver:1, status:'review'}] },
    { type:'handoff', from:'design', to:'frontend',
      text:'设计稿交付：列表页 v1 + 详情页 v1。详情页含地图轨迹，注意布局比例。',
      att:[{fid:'ui-list', ver:1}, {fid:'ui-detail', ver:1}],
      deliver:[{fid:'ui-list', status:'delivered'}, {fid:'ui-detail', status:'delivered'}] },
    { type:'handoff', from:'design', to:'backend',
      text:'详情页 v2 会加「物流时间线」模块，接口需要支持物流节点数据（node/time/desc）。',
      att:[{fid:'ui-detail', ver:1}], deliver:[] },

    { type:'phase', name:'开发' },
    { type:'work', role:'backend', dur:1800, task:'输出接口契约 api-spec',
      produce:[{fid:'api-spec', ver:1, status:'draft'}] },
    { type:'work', role:'backend', dur:1400, task:'契约补充 logistics_timeline',
      produce:[{fid:'api-spec', ver:2, status:'review'}] },
    { type:'handoff', from:'backend', to:'frontend',
      text:'契约 v2 出来了：GET /api/orders/:id 返回 logistics_timeline + eta，可以并联调。',
      att:[{fid:'api-spec', ver:2}], deliver:[{fid:'api-spec', status:'delivered'}] },
    { type:'work', role:'frontend', dur:3200, task:'开发订单页面（列表/详情/订阅）', sourceFrom:'last-in',
      produce:[{fid:'order-page', ver:1, status:'review'}] },
    { type:'work', role:'backend', dur:3200, task:'开发订单接口（查询/订阅）', sourceFrom:'last-in',
      produce:[{fid:'order-api', ver:1, status:'review'}] },

    { type:'phase', name:'测试' },
    { type:'handoff', from:'frontend', to:'test',
      text:'前端提测：订单页面 v1，覆盖列表 / 详情 / 订阅开关，请重点关注空订单场景。',
      att:[{fid:'order-page', ver:1}], deliver:[{fid:'order-page', status:'delivered'}] },
    { type:'handoff', from:'backend', to:'test',
      text:'后端提测：订单接口 v1，含 logistics_timeline 字段。',
      att:[{fid:'order-api', ver:1}], deliver:[{fid:'order-api', status:'delivered'}] },
    { type:'work', role:'test', dur:3000, task:'执行核心用例（12 条）' },
    { type:'handoff', from:'test', to:'backend', kind:'bug',
      text:'🐞 P1：order_id 为空时 GET /api/orders 返回 500，堆栈见附件，阻塞回归，请尽快修复！',
      att:[{fid:'bug-500', ver:1}],
      deliver:[{fid:'bug-500', status:'delivered'}],
      mark:[{fid:'order-api', status:'defect'}] },
    { type:'work', role:'backend', dur:1500, task:'定位 BUG#1024：空指针', sourceFrom:'last-in',
      produce:[{fid:'order-api', ver:2, status:'wip'}] },
    { type:'work', role:'backend', dur:1500, task:'修复并自测：空参防御 + 404 语义', sourceFrom:'last-in',
      produce:[{fid:'order-api', ver:3, status:'review'}] },
    { type:'handoff', from:'backend', to:'test',
      text:'已修复：空 order_id 返回 400，不存在订单返回 404，序列化改 safe 模式，请回归 #1024。',
      att:[{fid:'order-api', ver:3}], deliver:[{fid:'order-api', status:'delivered'}] },
    { type:'work', role:'test', dur:2600, task:'回归测试 12 条',
      produce:[{fid:'test-report', ver:1, status:'review'}] },
    { type:'handoff', from:'test', to:'deploy',
      text:'回归 12/12 通过，#1024 已验证，准予发布 v1.2.0。',
      att:[{fid:'test-report', ver:1}], deliver:[{fid:'test-report', status:'delivered'}] },

    { type:'phase', name:'发布' },
    { type:'work', role:'deploy', dur:3200, task:'构建镜像 · 灰度发布 v1.2.0', sourceFrom:'last-in',
      produce:[{fid:'release-log', ver:1, status:'online'}] },
    { type:'handoff', from:'deploy', to:'ops',
      text:'v1.2.0 已全量上线，灰度 5xx 为 0，麻烦开启监控大盘与告警规则。',
      att:[{fid:'release-log', ver:1}], deliver:[{fid:'release-log', status:'delivered'}] },

    { type:'phase', name:'交付' },
    { type:'work', role:'ops', dur:2400, task:'配置监控大盘与 SLO 告警', sourceFrom:'last-in',
      produce:[{fid:'ops-report', ver:1, status:'review'}] },
    { type:'handoff', from:'ops', to:'product',
      text:'上线 24h：可用性 99.97%，SLO 达标，项目交付 🎉',
      att:[{fid:'ops-report', ver:1}], deliver:[{fid:'ops-report', status:'delivered'}] },
  ],
};
