# Apollo 11 Mission Archive + Historical Replay

## 制作规格 / AI Implementation Contract

| 字段 | 内容 |
|---|---|
| 文档版本 | 1.0 |
| 文档日期 | 2026-07-12 |
| 状态 | 可交付实施；事件表中的来源定位须在 Phase 0 再做本地归档核验 |
| 首发任务 | Apollo 11 |
| 产品形态 | 可核查的数字档案 + 按真实任务时间驱动的历史重放 |
| 参考原型 | `D:\artemis-mission-archive`（只读参考，不在其上直接改造成 Apollo） |
| 建议新项目 | `D:\apollo-11-mission-archive` |
| 技术基线 | React 19、TypeScript、Three.js / React Three Fiber、Zustand、Vite、pnpm、Node 22 |
| 文档受众 | 负责设计、研究、建模、前端实现、测试或审计的 AI / 人类协作者 |

---

## 0. 如何使用这份文档

这不是灵感稿，而是制作合同。实现方必须先完整阅读，再从 **Phase 0** 开始；不得只读取某一节后直接生成页面。

规范词义：

- **MUST / 必须**：缺失即验收失败。
- **MUST NOT / 禁止**：出现即验收失败。
- **SHOULD / 应当**：默认执行；若不执行，必须在阶段报告中说明理由和替代方案。
- **MAY / 可以**：可选，不影响基础验收。

冲突优先级：

1. 本文的“真实性红线”和“禁止事项”。
2. NASA 原始资料与已登记的 Source Manifest。
3. 验收标准。
4. 视觉与交互细则。
5. 示例代码和建议目录。

若史料、模型或技术实现与本文假设冲突，实现方不得悄悄猜测；应保留已有正确工作，登记为 `OPEN QUESTION`，并提交证据与最小可行方案。

---

# Part I — 产品定义

## 1. 一句话定义

**Apollo 11 Mission Archive + Historical Replay** 是一套当代数字系统：一侧以任务报告、工程图版、影像和来源室构成可核查档案；另一侧用同一条真实 Mission Elapsed Time（MET）重放从 Saturn V 发射到 Command Module 溅落的任务状态、飞行器构型、事件、文字记录与授权音频。

它不是：

- 自由驾驶或可改变历史结果的游戏；
- 完整轨道力学、AGC 或飞控仿真器；
- 电影预告片、NASA 营销页或“沉浸式太空体验”；
- 把现有 Artemis 界面换成 Saturn V 模型的换皮项目；
- 伪装成 1969 年真实控制台的软件复刻。

## 2. 成功标准

首版必须同时满足以下五项：

1. **可辨认**：首屏不看说明，也能判断这是 Apollo 11、AS-506、Columbia 与 Eagle，而非 Artemis 或通用航天主题。
2. **可核查**：屏幕上每个任务数字、事件、引语、图片、音频和模型都有来源或明确真实性标签。
3. **可回放**：任意跳转、倒回、拖动或重置后，同一 MET 必须得到完全一致的任务状态与飞行器构型。
4. **可解释**：3D、图表和遥测都存在文字替代；模型不可用时仍能完成档案阅读与事件浏览。
5. **可扩展**：Apollo 11 是首个 mission pack；未来 Apollo 12/13 应通过新增任务包实现，而非复制整套应用。

## 3. 首版范围

### 3.1 必做

- 两个顶层模式：`01 MISSION ARCHIVE` 与 `02 MISSION CONTROL / HISTORICAL REPLAY`。
- 从发射至溅落的真实任务事件骨架。
- Saturn V、CSM、LM 的语义化飞行器状态机。
- NASA 发布的 Saturn V 与 Lunar Module 可视化模型，以及可追溯的 Apollo 11 CSM 重建方案。
- Archive 的 13 个章节与 Source Room。
- 关键历史 transcript、影像和少量经过权利核查的原始音频片段。
- 桌面、平板、移动端重排；键盘、Reduced Motion、WebGL fallback。
- 完整的 Source / Fact / Asset / Node Manifest 和自动验证脚本。

### 3.2 明确不做

- 不做多人、账号、积分、成就、胜负、任务失败分支。
- 不做自由操纵飞船、改变轨道或“亲自登月”。
- 不宣称提供逐秒完整真实遥测；缺失值不得用平滑曲线伪装。
- 不做实时 SPICE 数值积分、完整 Apollo Guidance Computer 仿真或完整飞控岗位模拟。
- 不做写实宇航员角色动画。
- 不加入 Lunar Roving Vehicle；Apollo 11 未携带 LRV。
- 不用 Apollo-Soyuz 飞船模型冒充 Apollo 11 CSM。
- 不用背景音乐、AI 仿声或虚构无线电对话。

## 4. 与 Artemis 原型的关系

### 4.1 继承

- Archive + Mission Control 双模式结构。
- 克制、技术、可信的视觉基调。
- 任务时间、事件日志、阶段切换、部件聚焦、来源室的产品思路。
- React / TypeScript / R3F / Zustand 的工程经验。
- 原作 [redradman/artemis](https://github.com/redradman/artemis) 的 MIT 归属链。

### 4.2 不直接继承

- 不复制 Artemis 的阶段数字、遥测数组、SLS/Orion 术语或构型。
- 不沿用 `0–1` 归一化值同时承担真实时间、播放时间、遥测和动画的做法。
- 不把真实连接关系、作者化分离位移、喷焰和镜头状态混进同一个函数。
- 不在现有 Artemis 仓库中导入高面 NASA GLB；Apollo 必须建立为独立项目。

### 4.3 归属要求

新项目 README 与 Archive Footer 必须保留：

- `Based on redradman/artemis (MIT)` 及仓库链接；
- NASA 资料、影像、音频与模型的逐项来源和使用说明；
- “非 NASA 官方产品、不暗示 NASA 背书”的清楚声明；
- 项目自身代码与派生资产的许可证说明。

---

# Part II — 真实性与资料方法

## 5. 真实性红线

1. **每个任务数字必须可追溯，或明确标为示意。** 设计尺寸、动画时长和性能预算不属于任务事实，但必须放在设计/工程 token 中，不能混入任务数据。
2. **计划值不能冒充实际值。** Flight Plan 是计划基准；Mission Report、任务后轨迹与原始记录用于 `AS-FLOWN`。
3. **没有资料不等于 0。** 使用 `NOT AVAILABLE IN SOURCE`，不得填零、占位随机值或 AI 猜测值。
4. **真实贴图不等于真实场景。** 地球/月球贴图、光照、距离、比例、轨迹、星空和镜头必须分别说明真实性。
5. **NASA 模型不等于工程 CAD。** 统一称为“NASA 发布的可视化模型”；不得宣称为飞行认证几何。
6. **引语不得凭记忆录入。** 必须来自原始 transcript，并记录说话者、频道、MET/UTC 与 locator。
7. **动画不得改写事件时间。** 分离和点火的真实 MET 与作者化动画持续时间必须分开。

## 6. 屏幕真实性标签

所有数据、图表、轨迹、模型和重建内容必须使用以下受控词汇：

| 标签 | 含义 | UI 要求 |
|---|---|---|
| `ACTUAL` | 任务后资料或原始记录直接给出的实际值/事件 | 显示引用 |
| `DERIVED` | 用已引用输入值计算 | 显示公式、输入 Fact ID 和引用 |
| `INTERPOLATED` | 两个已引用采样点之间插值 | 显示插值方法和采样边界 |
| `PLANNED` | 飞行前计划值 | 必须与 `ACTUAL` 视觉区分，禁止默认代替实际值 |
| `RECONSTRUCTED` | 依据资料重建的几何、图或缺失结构 | 显示依据、比例方法和重建者 |
| `SCHEMATIC` | 为解释关系而作者化，不代表测量或真实比例 | 持续显示 `SCHEMATIC — NOT TO SCALE`（适用时） |
| `NOT AVAILABLE IN SOURCE` | 当前资料集中没有可靠值 | 不渲染数值，不参与计算 |

状态词不能只依靠颜色。真实性标签应在两次操作内打开对应的方法与来源。

建议数据类型：

```ts
type EvidenceClass =
  | 'actual'
  | 'derived'
  | 'interpolated'
  | 'planned'
  | 'reconstructed'
  | 'schematic'

type MissingReason =
  | 'not-available-in-source'
  | 'not-applicable'
  | 'source-not-yet-reviewed'
```

## 7. 来源权威层级

出现冲突时，按“具体事实是否由更高等级资料直接支持”判断，不做简单多数投票：

1. Apollo 11 Mission Report 与正式任务后分析。
2. 任务后轨迹重建、系统评估和 Technical Crew Debriefing。
3. 原始 air-to-ground / technical transcript、任务音频和摄影记录。
4. Apollo Flight Journal / Lunar Surface Journal 的导航、校注与页面定位。
5. Apollo 11 Flight Plan、检查单及其他飞行前文件，仅作为 `PLANNED` 基准。
6. NASA 面向公众的任务概览，用于摘要和交叉检查，不优先于正式报告中的细节。
7. 第三方资料仅可帮助发现线索，不可成为首版任务数字的唯一来源。

## 8. 初始 NASA Source Manifest

Phase 0 必须下载或登记以下官方资料，并记录访问日期、原始 URL、本地路径、文件 SHA-256、权利说明及版本备注。网页也应保存可复核快照或正文摘录 locator。

| Source ID | 资料 | 用途 | 官方地址 |
|---|---|---|---|
| `NASA-A11-MR` | Apollo 11 Mission Report, MSC-00171 | 任务后实际事件、系统与性能的主来源 | <https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/19700008096.pdf> |
| `NASA-A11-FP` | Apollo 11 Flight Plan | 计划流程与 `PLANNED` 对照 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11-fltplan.html> |
| `NASA-A11-FP1` | Flight Plan PDF, part 1 | 页级计划引用 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11-fltplan1.pdf> |
| `NASA-A11-TTEC` | Technical Air-to-Ground Transcript | 真实语音事件、说话者与 MET | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.pdf> |
| `NASA-A11-TTEC-WEB` | Technical transcript HTML | 深链和快速定位 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html> |
| `NASA-A11-RAW-TRANS` | Apollo 11 transcript index / raw transcript | 原始 transcript 路由 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11trans.html> |
| `NASA-A11-AFJ` | Apollo 11 Flight Journal | 飞行阶段导航、事件解释和资料路由 | <https://www.nasa.gov/wp-content/uploads/static/history/afj/ap11fj/> |
| `NASA-A11-ALSJ` | Apollo 11 Lunar Surface Journal | 下降、月面活动与上升的导航和校注 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.html> |
| `NASA-A11-LANDING` | Apollo 11 Landing transcript/commentary | PDI、警报、着陆事件定位 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.landing.html> |
| `NASA-A11-AUDIO` | Apollo 11 Mission Audio | 原始音频候选与频道信息 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11MissionAudio.html> |
| `NASA-A11-OVERVIEW` | Apollo 11 Mission Overview | 任务摘要与交叉检查 | <https://www.nasa.gov/history/apollo-11-mission-overview/> |
| `NASA-APOLLO-NUMBERS` | Apollo by the Numbers, NASA SP-4029 | 全任务统计与事件交叉检查 | <https://www.nasa.gov/wp-content/uploads/2023/04/sp-4029.pdf> |
| `NASA-A11-SCIENCE-PRELIM` | Apollo 11 Preliminary Science Report, NASA SP-214 | 月面活动、样本与实验交叉检查 | <https://ntrs.nasa.gov/api/citations/19700000726/downloads/19700000726.pdf> |
| `NASA-A11-POSTTRAJ` | Post-launch Operational Trajectory | 任务轨迹资料 | <https://ntrs.nasa.gov/citations/19690026499> |
| `NASA-A11-TRAJ-RECON` | Apollo trajectory reconstruction/postflight analysis | 轨迹重建方法与任务后数据 | <https://ntrs.nasa.gov/api/citations/19700014995/downloads/19700014995.pdf> |
| `NASA-A11-DEBRIEF` | Apollo 11 Technical Crew Debriefing | 乘员任务后说明 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tecdbrf.html> |
| `NASA-CSM-NR` | Apollo CSM News Reference | CSM 构造、系统与图示 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/CSMNewsRef-Boothman.html> |
| `NASA-LM-HB` | LM-10 Handbook, Vol. 1 | 通用 LM 系统参考；不得冒充 LM-5 特有数据 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/lm10handbookvol1.pdf> |
| `NASA-APOLLO-EXP` | Apollo Experience Reports index | 子系统与任务经验资料路由 | <https://www.nasa.gov/wp-content/uploads/static/history/alsj/ApolExpRpts.html> |
| `NASA-A11-IMAGES` | Apollo 11 image gallery | 任务摄影和图版候选 | <https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/kippsphotos/apollo.html> |
| `NASA-A11-MEDIA50` | Apollo 50th media resources | 高质量媒体候选 | <https://www.nasa.gov/specials/apollo50th/press.html> |
| `NASA-MODEL-SATV` | Saturn V GLB | NASA 可视化模型候选 | <https://science.nasa.gov/3d-resources/saturn-v/> |
| `NASA-MODEL-LM` | Apollo Lunar Module GLB | NASA 可视化模型候选 | <https://science.nasa.gov/3d-resources/apollo-lunar-module/> |
| `NASA-MODEL-SATV-STL` | Saturn V printing kit | CM/SM 等几何重建候选零件 | <https://science.nasa.gov/3d-resources/saturn-v-rocket/> |
| `NASA-MOON-CGI-KIT` | NASA SVS CGI Moon Kit | LRO 色彩图、高程图与全球月球球体 | <https://svs.gsfc.nasa.gov/4720> |
| `NASA-A11-MOON-VIEW` | Apollo 11 – View of the Moon, AS11-44-6665 | 返航阶段真实任务图版；不得冒充接近画面 | <https://science.nasa.gov/3d-resources/apollo-11-view-of-the-moon/> |
| `NASA-A11-LANDING-SITE-LRO` | Apollo 11 Landing Site, LROC | 现代遗址影像与月面档案对照 | <https://science.nasa.gov/resource/apollo-11-landing-site/> |
| `NASA-A11-LANDING-TERRAIN` | Apollo 11 Landing Site STL | 局部地形候选；原资产 Z 轴夸张 60 倍 | <https://science.nasa.gov/3d-resources/apollo-11-landing-site/> |
| `NASA-EARTH-BLUE-MARBLE` | NASA Visible Earth – Blue Marble | 3D Earth 全球拼接贴图候选 | <https://visibleearth.nasa.gov/images/57723/the-blue-marble> |
| `NASA-MEDIA-RULES` | NASA Images and Media Guidelines | 影像、人物、标识和背书边界 | <https://www.nasa.gov/nasa-brand-center/images-and-media/> |
| `NASA-BRAND` | NASA Brand Guidelines | 标识使用边界 | <https://www.nasa.gov/nasa-brand-center/brand-guidelines/> |

> 注意：ALSJ/AFJ 页面包含编辑、校注或第三方贡献内容时，不能因为页面位于 NASA 域名就默认全部为 public domain。逐项登记 rights status；优先使用 raw transcript 与 NASA 原始媒体。

## 9. Source / Fact / Citation 数据契约

```ts
interface SourceRecord {
  id: string
  kind: 'pdf' | 'web' | 'image' | 'audio' | 'model' | 'dataset'
  title: string
  publisher: string
  publicationDate?: string
  originalUrl: string
  localPath?: string
  accessedAt: string
  sha256?: string
  rightsStatus: string
  notes?: string
}

interface CitationRef {
  sourceId: string
  pages?: string
  locator?: string
  note?: string
}

interface SourcedValue<T extends number | string> {
  id: string
  value: T
  unit?: UnitId
  evidence: EvidenceClass
  citations: CitationRef[]
  derivation?: {
    formula: string
    inputFactIds: string[]
  }
}
```

规则：

- 所有物理量内部使用 SI；英制只在显示层转换。
- 时间内部以 MET 秒为准；UTC 由受控 epoch 转换，禁止在业务逻辑中解析展示字符串。
- `derived` 必须记录公式和全部输入 Fact ID。
- `interpolated` 必须记录前后采样 Fact ID、方法和适用区间。
- `planned` 必须引用飞行前文件，并在 UI 与 `actual` 并列或明确分区。
- `schematic` 可无任务资料引用，但必须有方法说明，且不能进入“真实遥测”统计。
- JSX、CSS 和 Three 场景文件中禁止硬编码 Apollo 任务事实。

建议验证命令：

```text
pnpm validate:sources
pnpm validate:mission
pnpm validate:models
```

`validate:sources` 至少检查：引用存在、本地哈希、页码/locator、所有实际/推导/插值/计划值的证据、推导输入、物理量单位、缺失值状态，以及计划值是否被错误标成实际值。

---

# Part III — 任务结构与真实时间

## 10. 任务身份基线

界面主身份建议固定为：

```text
APOLLO 11 MISSION ARCHIVE
AS-506 · CSM-107 COLUMBIA · LM-5 EAGLE
16–24 JUL 1969
```

这些字符串属于任务数据，仍须进入 mission pack 并绑定来源，不得直接写在组件中。

禁止：

- 使用 SLS、Orion、Artemis、Gateway 等残留术语或轮廓；
- 把 `NASA Worm` 当作 1969 年视觉识别（该标识晚于 Apollo 11）；
- 用 NASA Insignia、Logotype 或 Seal 作为本项目自己的品牌；
- 使用 `LIVE`、`REAL-TIME TELEMETRY` 等暗示当前直播或完整原始遥测的词。

推荐受控词汇：

```text
REPLAY MET
HISTORICAL REPLAY
AS-FLOWN RECORD
HISTORICAL AUDIO
SOURCE VERIFIED
EDITED REPLAY
EVENT PAUSE — EDITORIAL
```

只有史料明确记录的 operational hold 才能直接称 `HOLD`。为了让用户阅读关键事件而设置的暂停必须标为编辑性暂停，不能冒充任务本身的程序状态。

## 11. 三条时间轴

系统必须把以下时间分开：

1. **MET**：真实 Mission Elapsed Time，以秒为内部单位；所有任务事实和事件以它为准。
2. **storyTime**：编辑后的观看时间，以毫秒为单位；负责把约八天任务压缩成可观看流程。
3. **visualTime**：局部分离、喷焰、面板变化和相机移动的动画时间。

浏览器墙钟只推进 `storyTime`，不能直接冒充 MET。建议契约：

```ts
interface NarrativeSegment {
  id: string
  metStart: number
  metEnd: number
  storyDurationMs: number
  easing: 'linear'
  presentationPauseMs?: number
}

metAtStoryTime(storyMs: number): number
storyTimeAtMet(metSeconds: number): number
stateAtMet(definition: MissionDefinition, metSeconds: number): MissionState
```

强制规则：

- 映射必须分段单调；事件锚点精确落在记录的 MET。
- 非等比例进度条持续标为 `EDITED REPLAY` 或 `NARRATIVE TIMELINE`。
- 任务时间栏始终显示真实 MET；不能显示归一化百分比冒充任务时间。
- 跳转、倒放、拖动、刷新和恢复后，状态必须能确定性重建。
- Archive 模式、页面隐藏或浏览器长时间失焦时自动暂停。
- 返回 Replay 时显示暂停位置并要求用户显式 `RESUME REPLAY`。
- 动画尚未播完也不能推迟真实事件发生时间。

## 12. 高层任务阶段

阶段只负责叙事、布局配置和导航；飞行器事实状态由事件归约得到。首版阶段建议：

| Phase ID | 界面名称 | 起止锚点 | 主要构型/内容 |
|---|---|---|---|
| `prelaunch` | PRELAUNCH | 页面载入 → Liftoff | Saturn V 全栈、倒计时资料、GO/NO-GO 记录 |
| `ascent` | ASCENT | Liftoff → Earth orbit insertion | S-IC、S-II、S-IVB 分级与上升事件 |
| `earth-orbit` | EARTH ORBIT | Orbit insertion → TLI ignition | 停泊轨道、系统检查、GO for TLI |
| `tli-extraction` | TLI / EXTRACTION | TLI ignition → LM extraction complete | S-IVB、CSM 转位/对接/提取 |
| `translunar` | TRANSLUNAR COAST | LM extraction → LOI | docked CSM/LM、地月转移、通信与活动 |
| `lunar-orbit` | LUNAR ORBIT | LOI → CSM/LM separation | 月轨、LM checkout、AOS/LOS、乘员位置 |
| `descent` | POWERED DESCENT | CSM/LM separation → Touchdown | Eagle 下降、PDI、AGC 警报、landing events |
| `surface` | LUNAR SURFACE OPS | Touchdown → Lunar liftoff | EVA、样本、摄影、EASEP、Eagle 状态 |
| `ascent-rendezvous` | ASCENT / RENDEZVOUS | Lunar liftoff → LM jettison | ascent stage、Columbia、交会、对接与转移 |
| `transearth` | TRANSEARTH COAST | TEI → Entry interface | CSM 返回、midcourse、通信与 crew activities |
| `entry` | ENTRY | Entry interface → Splashdown | CM/SM 分离、再入、降落伞与溅落 |
| `recovery` | RECOVERY | Splashdown → Mission complete | 回收、实际结果、来源与回看入口 |

Phase 0 必须把每个起止锚点绑定至经过核验的 Event ID；禁止用作者主观百分比作为边界。

## 13. 关键事件表的使用规则

本文附录 A 提供首轮关键 MET 清单。实现方必须在 Phase 0：

1. 用 `NASA-A11-MR` 的任务时间表逐项复核；
2. 对下降、着陆、第一步、月面起飞等事件再与 transcript / ALSJ 交叉检查；
3. 记录 PDF 页码或网页 locator；
4. 保存原始字符串与解析后的 `metSeconds`；
5. 对资料间的舍入差异保留 `precision` 与 `sourceNote`，不得自行“修正”；
6. 未完成复核的事件不得进入 `actual` 发布数据。

建议事件类型：

```ts
interface MissionEvent {
  id: string
  metSeconds: number
  utc?: string
  label: string
  tier: 'major' | 'minor' | 'detail'
  evidence: EvidenceClass
  citations: CitationRef[]
  actions: MissionAction[]
  visualCues?: VisualCue[]
  precision?: 'second' | 'tenth-second' | 'source-rounded'
}
```

## 14. 飞行器事实状态机

状态机必须为纯事件归约，而非只能向前播放的 React 动画：

```ts
stateAtMet(definition, metSeconds): MissionState
```

需要覆盖的高层构型：

1. 完整 Saturn V 发射构型。
2. S-IC 分离后的 S-II 推进构型。
3. S-II 分离后的 S-IVB 入轨构型。
4. 地球停泊轨道构型。
5. S-IVB TLI 构型。
6. CSM 转位、对接与 LM 提取。
7. CSM + LM 地月转移构型。
8. 月球轨道 CSM/LM 构型。
9. Eagle 与 Columbia 分离。
10. LM 下降级推进与登月。
11. 月面构型。
12. LM 上升级起飞；下降级留在月面。
13. 月轨交会、对接和乘员/样本转移。
14. LM 上升级抛弃。
15. CSM 地月返回。
16. Command Module / Service Module 分离。
17. Command Module 再入、降落伞与溅落。

建议组件状态：

```ts
type ComponentLifecycle =
  | 'attached'
  | 'separating'
  | 'free'
  | 'discarded'
  | 'landed'

type EngineMode = 'off' | 'ignition' | 'burning' | 'cutoff'

interface VehicleComponentState {
  lifecycle: ComponentLifecycle
  parentId: string | null
  visible: boolean
  engineMode?: EngineMode
}
```

事实与视觉必须拆开：

- `stateAtMet` 决定真实连接关系、可见构型与发动机事实状态。
- `visualStateAtStoryTime` 决定作者化分离位移、喷焰强度和相机状态。
- S-IVB、SPS、LM DPS、LM APS 必须分别归属正确的组件和事件。
- 视觉位移、喷焰形状和镜头运动无真实轨迹时必须登记为 `schematic`。

## 15. 遥测与曲线边界

首版优先展示“有来源的事件与离散读数”，而不是追求满屏连续曲线。

可以展示：

- 正式报告或 transcript 直接给出的读数（`ACTUAL`）；
- 两个实际采样点间、且有明确用途的插值（`INTERPOLATED`）；
- 由实际值按公开公式计算的结果（`DERIVED`）；
- 计划与实际对照（分别显示 `PLANNED` / `ACTUAL`）；
- 仅表达阶段与相对关系的示意图（`SCHEMATIC`）。

禁止展示：

- 为了让 strip chart 好看而生成的随机波动；
- 无来源的心率、宇航服压力、舱压、推进剂百分比或“实时系统健康”；
- 把平滑 spline 称为 recovered telemetry；
- 没有记录时显示 `0`、`NOMINAL`、`CONFIRMED`、`ACQUIRED` 或 `GO`；
- 用真实地月图片暗示轨迹、比例与照明均已物理验证。

所有曲线必须提供单位、时间基准、证据标签、来源入口和等价数据表/文字摘要。

---

# Part IV — 信息架构与体验

## 16. 顶层导航

仅保留两个顶层模式：

- `01 MISSION ARCHIVE`
- `02 MISSION CONTROL / HISTORICAL REPLAY`

`LUNAR SURFACE OPERATIONS` 是 Mission Control 随任务阶段启用的控制台配置，不是第三个顶层产品。

全局页眉持续提供：

- 项目名称；
- 两个模式入口；
- 当前任务阶段；
- `REPLAY MET`；
- 声音状态；
- Sources / Method 入口；
- Accessibility / Keyboard Help 入口。

模式行为：

- 进入 Archive 自动暂停并记住 MET。
- 返回 Replay 不得自动播放；显示 `REPLAY PAUSED AT …` 和 `RESUME REPLAY`。
- Archive 事件提供 `OPEN IN REPLAY AT MET …`。
- 两个模式分别记住滚动位置和已展开面板。
- URL 必须能深链到章节、阶段、Event ID / MET、组件、transcript 行或音频片段。

## 17. Archive 章节

Archive 使用任务报告、工程图册、索引卡和图片图版相结合的编辑设计，不做营销首页 Hero。

| 章节 | 英文标题 | 核心内容 |
|---|---|---|
| 00 | Mission Index | 任务编号、日期、飞行器、状态、阅读与 Replay 入口 |
| 01 | Mission Objectives | 任务目标、实际结果、任务摘要；计划与实际分开 |
| 02 | Crew & Flight Roles | Armstrong、Collins、Aldrin；岗位、舱位和阶段职责 |
| 03 | As-Flown Timeline | 从发射至回收的实际 MET 事件 |
| 04 | Flight Architecture | 地球轨道、TLI、LOI、下降、上升、TEI 与再入 |
| 05 | Saturn V / AS-506 | S-IC、S-II、S-IVB、IU、SLA 与分离关系 |
| 06 | Columbia & Eagle | CSM、LM 结构、推进、生命保障与任务构型 |
| 07 | Guidance & Computing | AGC、制导程序、导航平台、雷达与关键警报 |
| 08 | Mission Control & Network | 飞控岗位、通信链路、AOS/LOS、语音频道 |
| 09 | Powered Descent & Landing | PDI、下降阶段、1201/1202、着陆区与 touchdown |
| 10 | Lunar Surface Operations | EVA、检查单、样本、摄影与 EASEP |
| 11 | Rendezvous, Return & Recovery | 月面起飞、交会、TEI、再入与回收 |
| 12 | Media & Source Room | 图片、录音、transcript、PDF、模型、方法与权利状态 |

每章必须包含：

- 一句事实性摘要；
- 关键事件或结构图；
- 可核查数据；
- 图版或文档摘录；
- Source ID + 页码/locator；
- `ACTUAL / DERIVED / INTERPOLATED / PLANNED / RECONSTRUCTED / SCHEMATIC` 标签；
- 跳转至对应 Replay 时间的入口。

影像必须保留原始宽高比，并尽可能记录 NASA 图像编号、拍摄者/设备、MET/UTC、原始来源、裁切/色彩处理和 rights status。不得把历史影像作为无说明的全屏装饰背景。

## 18. Mission Control 桌面布局

### 18.1 ≥1280 px

使用 12 列网格：

- 顶栏约 56 px；
- 左区：阶段、事件、检查单；
- 中区：3D 飞行器、轨迹、月面活动图或历史影像；
- 右区：阶段专用数据、系统/通信、transcript；
- 底栏约 64 px：播放、速度、时间线、声音、上一/下一事件。

布局原则：

- 主 gutter 24–32 px，面板 gap 12–16 px，遵循 4/8 px 间距系统。
- 面板圆角 0–2 px；无玻璃、背景模糊和漂浮阴影。
- MET、阶段、播放、事件日志、真实性标签、来源、声音和当前构型在全部阶段保持稳定位置。
- 同一槽位内容可随阶段替换，但不得迫使用户重新寻找核心信息。

### 18.2 1024–1279 px

保留中部主视图和一个信息列；事件、系统和 transcript 使用带文字的 tabs。禁止仅图标抽屉。

### 18.3 768–1023 px

改为“主视图 + 下方详情区”，而非缩小三列。播放控制固定在安全区域内，正文为其预留空间。

### 18.4 <768 px

信息优先级固定为：

1. 阶段、MET、播放/暂停状态；
2. 主视图或阶段关键图；
3. 3–5 项关键数据；
4. 事件与 transcript；
5. 系统细节与来源。

移动端要求：

- 主视图最大约 40–46dvh；
- 详情使用纵向模块或 accordion；
- 根页面不得横向滚动；
- 不要求横向拖动桌面宽表；
- 触控目标至少 44×44 px，目标间距至少 8 px；
- 支持竖屏、横屏、安全区和 200% 浏览器缩放。

## 19. 阶段化控制台配置

### 19.1 Prelaunch / Ascent

中心：Saturn V 全栈、上升轨迹、当前级段与构型。

面板候选：stage / engine events、IU / guidance、报告中可核验的 altitude / velocity / downrange、countdown/MET、真实 GO/NO-GO 记录、仅在资料完整时出现的 abort mode。

禁止用镜头狂震、全屏红闪或夸张火焰把它做成发射游戏。使用地面录音时必须标注观察/录音位置，不能伪装成舱内声音。

### 19.2 Earth Orbit / TLI / Extraction

中心：地球停泊轨道、S-IVB/CSM/LM 构型、transposition / docking / extraction 关系。

面板候选：有来源的轨道参数、TLI burn 事件、S-IVB 状态、GO for TLI 语音、当前连接关系。

### 19.3 Translunar Coast

中心：CSM/LM docked 构型、地月转移示意、Earth/Moon 相对关系。

面板候选：有来源的距离/速度采样、midcourse correction、PTC、通信站/AOS/LOS、crew activity、TV events。非数值积分轨迹必须持续显示 `SCHEMATIC — NOT TO SCALE`。

### 19.4 Lunar Orbit / LM Checkout

中心：月轨图、Columbia / Eagle 双飞行器、当前 orbit/pass（仅在来源可靠时）。

面板候选：月轨参数、AOS/LOS、crew location、LM checkout、undocking/separation 事件与构型。

### 19.5 Powered Descent

中心可切换：Eagle 下降示意、landing ellipse / 月面活动图、3D、带来源历史影像。

关键面板候选：PDI / braking / approach / landing 阶段、资料中可核验的 altitude、horizontal/vertical velocity、range、landing radar、descent propellant、AGC program/alarm event log、CAPCOM transcript。

1201/1202 必须表现为有时间、有解释、有来源的历史事件，不是游戏式故障弹窗。

### 19.6 Lunar Surface Operations

Touchdown 后允许一次不超过 360 ms 的克制配置变更：

```text
CONSOLE CONFIGURATION CHANGE
LUNAR SURFACE OPERATIONS · TRANQUILITY BASE
```

顶栏、MET、事件日志与播放位置不变。下降遥测退出，替换为：surface elapsed time、crew location、EVA elapsed time、surface checklist、sample/photography log、EASEP、LM ascent readiness、surface transcript/audio、活动路线图与 Eagle 状态。

中心视图优先级：

1. 月面活动图或带标注的 Eagle；
2. 真实任务摄影；
3. 3D 月面构型。

不得凭空生成心率、宇航服压力或逐秒生命体征。

### 19.7 Lunar Ascent / Rendezvous

中心：Eagle ascent stage 与 Columbia 的相对关系。

面板候选：lunar liftoff、ascent staging、资料支持的 relative range/range rate、rendezvous maneuver sequence、crew/vehicle location、docking、transfer 与 LM jettison。

### 19.8 Transearth / Entry / Recovery

面板逐步切换：TEI、CSM-only 构型、midcourse、Earth distance/velocity、entry corridor、CM attitude、SM separation、drogue/main parachute、splashdown 与 recovery。

Mission Complete 只显示实际结果、关键时间、来源和回看入口；禁止烟花、勋章解锁、“胜利”画面或营销口号。

---

# Part V — 视觉、交互、声音与无障碍

## 20. 视觉定位

视觉目标是：**数据密集、低装饰、可核查的 1969 任务数字档案**。

Apollo 身份来自任务编号、飞行器、工程文档、摄影、飞行术语与控制台信息结构，而非复古滤镜。

必须避免：

- neon、紫蓝辉光、glassmorphism、glitch、lens flare、科幻 HUD 圆环；
- 持续 CRT 扫描线、屏闪、胶片刮痕、色差、故障字形；
- 大型营销 Hero、夸张 CTA、漂浮卡片和 SaaS dashboard 套版；
- 大段逐字打印、装饰性粒子爆发、页面级视差和自动电影镜头；
- emoji 功能图标和多个不一致的图标库。

这应当是一套“今天建造、严谨展示 1969 年资料”的系统，而不是假古董。

## 21. 色彩系统

以下色值属于设计 token，不是任务事实。

### 21.1 Archive

| Token | 色值 | 用途 |
|---|---:|---|
| `archive-paper` | `#E7E1D4` | 主纸面 |
| `archive-paper-alt` | `#D7D0C3` | 图表、索引底 |
| `archive-ink` | `#151819` | 正文、标题 |
| `archive-muted` | `#5A5E5A` | 次级说明 |
| `archive-navy` | `#233A46` | 工程图、链接、结构标识 |
| `archive-oxide` | `#9B3E32` | 重点编号、批注与警示 |
| `archive-rule` | `#B8B0A1` | 分隔线 |

### 21.2 Mission Control

| Token | 色值 | 用途 |
|---|---:|---|
| `ops-bg` | `#070908` | 全局背景 |
| `ops-panel` | `#101410` | 模块表面 |
| `ops-text` | `#D8DDD1` | 主文字 |
| `ops-phosphor` | `#A7B58F` | 正常值、选中状态 |
| `ops-amber` | `#D0A45A` | 注意、等待、编辑暂停 |
| `ops-warning` | `#D9654E` | 警告、NO-GO |
| `ops-muted` | `#8C958B` | 次级信息 |
| `ops-rule` | `#526254` | 边界 |
| `ops-focus` | `#A7B58F` | 键盘焦点 |

所有正文/背景组合须通过 WCAG AA。控制台不能整体泛绿；绿色只表示状态，主文字保持冷灰白。

状态编码：

- `NOMINAL`：绿色 + 实心圆 + 状态词；
- `CAUTION`：琥珀 + 三角 + 状态词；
- `WARNING / NO-GO`：红色 + 菱形/感叹号 + 状态词；
- `NO SOURCE`：灰色 + 空心/斜线符号 + 明确文字。

## 22. 字体与排版

最多使用三个字体家族：

- 标题、章节编号、控制台标签：`IBM Plex Sans Condensed`；
- 正文：`IBM Plex Sans`，中文回退 `Noto Sans SC`；
- MET、数据、表格和事件码：`IBM Plex Mono`。

要求：

- 字体自托管或提供可靠回退，`font-display: swap`；
- 所有数值启用 `font-variant-numeric: tabular-nums`；
- 只有短控制台标签使用全大写及 `0.08–0.12em` 字距；中文、正文和长标题不做全大写式排版；
- Archive 正文行长 60–75 个英文字符；移动端约 35–60 个；
- 移动正文不小于 16 px；控制台标签不小于 12 px；主要数值不小于 14 px。

建议字号：

| 层级 | 桌面 | 移动 |
|---|---:|---:|
| Mission title | 44–52 px | 32–36 px |
| Archive H1 | 36 px | 28 px |
| Section H2 | 24–28 px | 22–24 px |
| Body | 16–17 px | 16 px |
| Console value | 16–22 px | 15–18 px |
| Label / metadata | 12–13 px | 12–13 px |

## 23. 图标、图像和工程图

- 图标使用同一套 1.5 px 直线 SVG，端点、转角和 viewBox 一致。
- 功能不能仅由图标表达；关键按钮有文字标签或稳定 accessible name。
- Apollo 11 任务徽章只能作为带来源说明的档案对象，不能取代项目标识。
- 图片不可被无说明地 AI 扩图、上色或替换天空；所有裁切、降噪、色彩调整须登记 processing note。
- 工程图、轨迹图和月面图必须标注单位、方向、比例状态与证据等级。
- 3D 模型用于解释结构和构型，不作为自动旋转的炫技 Hero。

## 24. 播放交互

建议基础控制：

```text
1× · 10× · 100× · 1000× · PREVIOUS EVENT · NEXT EVENT
```

规则：

- `1×` 表示真实任务秒速；其他速度必须持续可见。
- 大于 `1×` 时连续历史语音自动暂停，并显示 `VOICE AUDIO PAUSED AT ACCELERATED RATE`。
- 关键事件可触发 `EVENT PAUSE — EDITORIAL`；MET 冻结，片段按原速播放，按钮为 `CONTINUE REPLAY`。
- 动画、事件、飞行器构型、数据和 transcript 由同一 MET 源驱动。
- 页面隐藏、进入 Archive、模型错误或长时间失焦时暂停。
- 禁止后台跨阶段、后台继续声音或返回后突然跳时。
- 时间线可用键盘操作；每个事件显示名称、MET、可用时的 UTC、真实性状态和来源。

建议编辑暂停事件：Liftoff、TLI、LOI、CSM/LM separation、PDI、Touchdown、First step、Lunar liftoff、Rendezvous/Docking、TEI、Entry interface、Splashdown。具体列表由叙事编辑决定，但必须标为编辑行为。

## 25. 3D 与图表交互

3D 默认相机稳定、技术性强，不自动绕飞。用户可以：

- 旋转、缩放、复位；
- 聚焦语义组件；
- 打开组件 dossier；
- 切换 textured / structure overlay（若两者均有）；
- 在性能允许时选择 low / medium / high 质量。

组件聚焦显示：名称、所属总成、当前任务状态、资料支持的尺寸/质量、几何来源与真实性标签。

要求：

- 分级、CSM/LM 分离、LM 登月与上升级起飞由真实 Event ID 触发；
- 模型尺寸如被修正，在 Method 中记录缩放与坐标依据；
- 模型失败时显示静态标注图版或可信的程序化线框，不出现空黑屏；
- 图表提供文本摘要或数据表；
- 信息不可只靠 hover；tap、focus 和键盘可获得等价内容；
- 相机聚焦 450–700 ms，可被用户操作立即打断；普通 UI 过渡 160–300 ms。

## 26. 动效

允许：任务时钟同步的构型变化、克制交叉淡入、轨迹位置更新、事件出现、状态变化、短暂可打断的相机聚焦、有操作意义的指示变化。

禁止：glitch、lens flare、neon glow、持续扫描线、无限闪烁、装饰粒子、大段打字机效果、页面视差、自动电影镜头，以及用动画掩盖加载或数据不足。

`prefers-reduced-motion: reduce` 下：

- 停止星空漂移、视差与自动相机 tween；
- 构型变化改为短淡入或直接替换；
- 数据与 MET 正常更新；
- 手动 3D 操作仍可用。

## 27. 历史声音

声音默认关闭，首次访问禁止自动播放。启用后也不使用背景音乐或持续环境嗡鸣。

历史音频记录最少包含：

```ts
interface HistoricalAudioRecord {
  assetId: string
  sourceUrl: string
  sourceChannel: string
  speaker?: string
  metStart: number
  metEnd: number
  originalFilename: string
  sha256: string
  transcriptSource: CitationRef
  rightsStatus: string
  processingNote: string
}
```

只允许非破坏性降噪、去明显数字爆音、适度响度统一及片段起止淡化。建议语音约 `-20 LUFS integrated`，true peak 不高于 `-1 dBTP`；界面声比语音低 10–12 dB。

禁止：

- AI 模仿宇航员或飞控声音；
- 重录台词冒充原声；
- 增加假无线电噪声；
- 拼接语句改变语义；
- 把地面现场声标成舱内声；
- 为静默阶段编造对话；
- 在加速回放中拉伸或变调原始语音。

每段历史语音必须有同步字幕、speaker/channel、完整 transcript 入口和 rights status。字幕不能只在开声音时可见。

界面音只允许很轻的按键确认、编辑暂停提示、警告确认和配置完成提示，并明确属于项目界面而非 NASA 原声。

## 28. 无障碍

目标：WCAG 2.2 AA。

必须满足：

- 正确使用 `header/nav/main/section/footer`，标题层级连续，并提供 Skip Link；
- 按钮、tabs、accordion、dialog 使用原生语义；
- 焦点顺序等于视觉顺序，焦点环至少 2 px；
- 状态使用文字 + 形状 + 颜色；正文对比度至少 4.5:1；
- 200% 缩放无内容/功能丢失，320 CSS px 无根级横向滚动；
- 触控目标至少 44×44 px；
- 图表有摘要和数据表，3D 有结构树/静态图版/表格替代；
- 关键图片使用描述性 alt；装饰图空 alt；
- 中文辅助文字标 `lang="zh-Hans"`；
- 中文 transcript 翻译标 `EDITORIAL TRANSLATION`，不得冒充 NASA 官方译文；
- MET 不能每秒通过 `aria-live` 播报；只播报阶段变化、编辑暂停、错误或用户主动查询；
- 关键功能不依赖 hover、拖拽、声音或颜色。

建议快捷键：

- `K`：播放/暂停；
- `J / L`：上一/下一事件；
- `[ / ]`：降低/提高速度；
- `Esc`：关闭当前面板；
- `?`：快捷键说明。

禁止把 Space 设为全局播放键；原生控件获得焦点时必须保留浏览器原始键盘行为。用户可以关闭快捷键。

## 29. 完整状态设计

| 状态 | 必须呈现 |
|---|---|
| Initial load | 项目名、具体加载对象、进度、取消或轻量模式 |
| Model loading | 保留布局尺寸、结构占位与真实加载进度 |
| WebGL unavailable | 静态标注图版；事件与档案仍完整可用 |
| Playing | 速度、MET、阶段、音频状态 |
| Paused | 明确 `PAUSED` |
| Editorial event pause | 事件标题、编辑性说明、来源、继续按钮 |
| Accelerated playback | 倍速与语音暂停说明 |
| Missing data | `NOT AVAILABLE IN SOURCE`，不显示 0 |
| Derived / interpolated | 标签及方法入口 |
| Schematic view | 持续显示 `SCHEMATIC — NOT TO SCALE` |
| Audio unavailable | transcript 仍可用，并说明缺失原因 |
| Offline / fetch failure | 已缓存内容、失败资源和重试方式 |
| Mode switch | 暂停并保存 MET，返回时显式恢复 |
| Mission complete | 实际结果、关键时间、来源与回看 |
| Reduced motion | 信息完整，仅移除非必要运动 |

加载超过 300 ms 必须有反馈；禁止用无限旋转火箭或地球掩盖不确定等待。

---

# Part VI — NASA 模型与天体资产

## 30. 模型采用策略

### 30.1 Saturn V

首选 NASA Science 3D Resources 的 Saturn V GLB：`NASA-MODEL-SATV`。

使用条件：

- 先归档原始文件、页面信息、访问日期和 SHA-256；
- 检查实际节点、单位、包围盒、材质、贴图和方向；
- 不因页面标题就假设它能独立分级；
- 如为单体几何，必须离线、可复现地拆分为语义级段；
- AS-506 标记和 Apollo 11 特有外观须逐项核查，不可把通用 Saturn V 当作无误的 AS-506 工程复制品。

### 30.2 Lunar Module

首选 NASA Science 3D Resources 的 Apollo Lunar Module GLB：`NASA-MODEL-LM`。

它是通用 Apollo LM 可视化资产；在未核对前不得宣称每个细节、材质、标记都对应 LM-5 Eagle。实现时必须：

- 能语义拆分 descent stage 与 ascent stage；
- 建立 docking、engine exhaust、camera focus 与 label anchors；
- 对 Eagle 特有标记、天线/设备和月面构型做来源核验；
- 将无依据修正标为 `RECONSTRUCTED`，保留处理日志。

### 30.3 Command and Service Module

当前已知 NASA 资源中没有可直接认定为“独立、正确 Apollo 11 CSM”的官方 GLB。最终产品禁止用 Apollo-Soyuz Test Project 构型替代 Columbia。

可接受路径，按优先级：

1. 继续检索并验证 NASA 官方发布的 Apollo 11 / Block II CSM 资产；
2. 使用 `NASA-MODEL-SATV-STL` 中可用 CM/SM 部件，结合 `NASA-CSM-NR` 与正式图纸，重建适合网页的 CSM；
3. 从 Saturn V GLB 内部可验证的 spacecraft 部分提取，并依据资料补全独立构型；
4. 自建中等细节 Block II CSM，完整记录尺寸依据、取舍、拓扑与材质来源。

无论采用哪条路径，若几何不是 NASA 直接发布的完整 Apollo 11 CSM，UI 与 Asset Manifest 都必须标 `RECONSTRUCTED FROM NASA REFERENCES`。不得写成 `NASA CAD`。

### 30.4 不采用的模型

- Apollo-Soyuz GLB：构型、对接组件与任务时代不适合作为 Apollo 11 Columbia 最终模型。
- 来历不明的 Sketchfab / Turbosquid / ripped game assets：首版禁止。
- 只适合 3D 打印、未经减面和材质重建的高面 STL：不能直接送入浏览器。
- AI 生成且无法建立尺寸/拓扑/部件来源的飞行器模型：禁止作为主模型。

## 31. 模型语义层级

渲染器只能使用稳定语义 ID，不能在 React 组件中散落 GLB 临时节点名。

```text
apollo11-vehicle
├─ launch-escape-system
├─ command-service-module
│  ├─ command-module
│  └─ service-module
├─ spacecraft-lm-adapter
│  ├─ sla-panel-1
│  ├─ sla-panel-2
│  ├─ sla-panel-3
│  └─ sla-panel-4
├─ lunar-module
│  ├─ lm-ascent-stage
│  └─ lm-descent-stage
├─ instrument-unit
├─ s-ivb
├─ s-ii-s-ivb-interstage
├─ s-ii
├─ s-ic-s-ii-interstage
└─ s-ic
```

每个语义节点声明：

- 是否可分离；
- 初始 parent；
- 相机聚焦包围盒；
- label / exhaust / docking anchors；
- 分离方向；
- LOD 策略；
- 来源模型与几何真实性；
- 适用任务阶段。

## 32. Node Manifest

每个运行时 GLB 必须附版本化 manifest：

```json
{
  "assetId": "apollo11-saturn-v",
  "version": 1,
  "sourceId": "NASA-MODEL-SATV",
  "rawSha256": "...",
  "derivedSha256": "...",
  "units": "meter",
  "coordinateSystem": {
    "up": "+Y",
    "forward": "+Z"
  },
  "normalization": {
    "scale": 1,
    "rotation": [0, 0, 0],
    "translation": [0, 0, 0],
    "method": "..."
  },
  "nodes": {
    "launchVehicle.sic": {
      "path": "/Root/SaturnV/SIC",
      "required": true,
      "detachable": true
    }
  }
}
```

Manifest 还必须记录：

- mesh、material、triangle 数；
- texture 格式、尺寸与 color space；
- 整体及关键部件的米制 bounds；
- `exhaust`、`docking`、`label`、`cameraFocus` anchors；
- 原始/派生资产 hash；
- 归一化与比例依据；
- 处理脚本、工具及版本。

使用稳定 node path 或离线生成的唯一 ID；不得只凭可能重名的 `node.name` 绑定。required node 或 anchor 缺失时构建失败，禁止静默隐藏。

## 33. 离线资产处理流水线

固定顺序：

1. 保存原始下载及 source record。
2. 检查 GLB / STL 的节点、单位、材质、贴图、法线和 bounds。
3. 统一为 Y-up、米制、受控原点和 forward axis。
4. 按语义拆分可分离节点；建立稳定命名与 anchors。
5. 执行 `dedup / prune / weld`，人工检查不能破坏硬边与 UV。
6. 生成 `high / medium / low` 三档几何。
7. 以 Draco 压缩几何。
8. 以 KTX2 压缩贴图；颜色优先 ETC1S，法线等高质量数据按需要 UASTC。
9. 输出 Asset Manifest、Node Manifest、统计报告、缩略图和处理日志。
10. 在无缓存、离线和 WebGL fallback 条件下验证。

如需 Blender，必须提供版本锁定的脚本或逐步 recipe；禁止人工改完后只提交结果文件。`assets/raw` 只读、不发布；浏览器只加载 `assets/derived`。

LOD 含义：

- `high`：近距离组件审阅，用户主动进入；
- `medium`：桌面默认 Replay；
- `low`：移动端、远景和首次加载。

LOD 按屏幕投影尺寸切换并设置迟滞。SLA 内部暂不可见的 LM high LOD 不在首屏加载；下一阶段资源可在 idle 时预取。Draco/KTX2 decoder 必须本地托管并锁定版本。

## 34. Earth / Moon 贴图

Earth 与 Moon 同样进入 Asset Manifest，不得把“真实贴图”当作不需说明的背景素材。

每套贴图需记录：

- NASA 原始页面、产品/数据集名称和下载 URL；
- 获取或合成日期、投影、覆盖范围、原始分辨率、color space；
- 是否为单次实拍、全球拼接、现代遥感产品或作者派生 map；
- downsample、seam、色彩、normal/bump 生成方法和 SHA-256；
- 运行时 1K/2K/4K 版本与 KTX2 参数。

真实性表达：

- 现代 Blue Marble/LRO 等拼接产品只能称作 NASA imagery-based texture，不能暗示是 1969 年该 MET 的即时外观。
- 月面地形或 landing site basemap 若来自现代数据，标 `RECONSTRUCTED SURFACE BASEMAP`。
- 云层、夜间灯光、星空、太阳方向和地月相对尺度若未按历史时刻计算，分别标 `SCHEMATIC`。
- Archive 页面不得为了展示纹理而提前加载 Three.js。

## 35. 模型与场景性能预算

以下是工程预算，不是任务事实：

| 指标 | 桌面默认 | 移动默认 |
|---|---:|---:|
| 可见三角面 | ≤ 400k | ≤ 120k |
| Draw calls | ≤ 200 | ≤ 100 |
| 目标帧率 | p95 ≥ 50 fps | p95 ≥ 30 fps |
| 估算 GPU 资源 | ≤ 256 MB | ≤ 128 MB |
| 默认模型传输 | ≤ 12 MB | ≤ 7 MB |
| 单张运行时纹理 | ≤ 4K | ≤ 2K |

附加门槛：

- Archive 路由不加载 Three.js、R3F 或 GLB。
- Archive 初始 JS gzip 目标 ≤ 350 KiB。
- Replay 先显示可操作 shell，再异步加载 low/medium 资产。
- 用户主动选择的 high-quality 总传输目标 ≤ 30 MB。
- 连续 10 次 reset、事件跳转和组件聚焦后，geometry/material/texture 数量不得持续增长。
- 卸载时显式 dispose；共享资源不得重复销毁。

---

# Part VII — 技术架构

## 36. 依赖方向

```text
NASA 原始资料
    ↓
Source Manifest + Apollo 11 Mission Pack
    ↓
mission-core（纯 TypeScript；无 React / Three / Zustand）
    ↓
selectors / playback adapter / vehicle adapter
    ↓
Archive UI | Mission Control UI | R3F Scene

NASA 原始模型与贴图
    ↓
离线资产处理流水线
    ↓
优化资产 + Asset Manifest + Node Manifest
    ↓
R3F Vehicle Renderer / Celestial Renderer
```

`mission-core` 禁止反向引用 Apollo 11、React、Three.js、R3F 或 Zustand。

## 37. Mission Definition

```ts
export interface MissionDefinition {
  id: string
  meta: MissionMeta
  epochs: MissionEpochs
  events: MissionEvent[]
  narrative: NarrativeSegment[]
  vehicle: VehicleDefinition
  telemetry: TelemetryChannel[]
  sources: SourceManifest
  assets: AssetManifest
}
```

核心验收：

- 在 Node 环境、无 DOM/WebGL/React 时能运行全部单元测试。
- 通用 core 内搜索不到 `apollo11`、`saturn-v`、`columbia`、`eagle` 等任务专属常量。
- 任意任务状态只由 `MissionDefinition + metSeconds` 决定。
- 任务包可以被 schema 验证，并能在测试 fixture 中替换为最小示例任务。

## 38. Store 边界

Zustand 只管理交互状态，不作为事实数据库：

```text
PlaybackSlice
  storyTimeMs
  isPlaying
  speed
  editorialPause

UISlice
  appMode
  openPanel
  selectedEventId
  selectedComponentId
  quality

CameraSlice
  focusTarget
  userHasInteracted
  resetNonce

AudioSlice
  enabled
  activeClipId
  captionsVisible
```

`metSeconds`、当前事件、阶段、飞行器构型和显示值全部通过纯 selector 派生。

R3F 每帧读取外部 clock/store，不让整个 React 页面以 60 Hz 重渲染。控制台连续数值建议限制在约 10 Hz 更新，但事件边界必须按真实 MET 精确触发。

## 39. 推荐目录

```text
src/
  mission-core/
    types/
    clock/
    narrative/
    state-machine/
    provenance/
    telemetry/
    selectors/
    validation/

  missions/
    apollo11/
      mission.ts
      meta.ts
      epochs.ts
      events.ts
      narrative.ts
      facts.ts
      telemetry/
      vehicle.ts
      archive/
      source-manifest.json
      asset-manifest.json
      node-manifests/

  features/
    archive/
    mission-control/
    timeline/
    component-dossier/
    transcript/
    source-room/

  scene/
    VehicleRenderer/
    ModelLoader/
    CelestialRenderer/
    LOD/
    effects/
    camera/
    fallbacks/

  store/
    playbackSlice.ts
    uiSlice.ts
    cameraSlice.ts
    audioSlice.ts

scripts/
  validate-sources.ts
  validate-mission.ts
  inspect-glb.ts
  optimize-models.ts
  validate-models.ts
  report-assets.ts

assets/
  raw/                  # 不发布、不可手改
  derived/

public/
  missions/apollo11/
    models/
    textures/
    images/
    audio/
    fallbacks/

tests/
  unit/
  integration/
  e2e/
  visual/
  fixtures/

docs/
  sources/apollo11/
  architecture/
  asset-reports/
  audit/
```

## 40. 路由与加载

建议路由：

```text
/archive
/archive/:chapterId
/archive/event/:eventId
/archive/component/:componentId
/control
/control/event/:eventId
/control/met/:metString
/sources/:sourceId
/transcript/:recordId
```

要求：

- Archive 与 Mission Control route-level code splitting。
- Three/R3F、模型 decoder 和 GLB 只由 Mission Control 路由加载。
- Source/mission data 可预取，但不能阻塞 Archive 第一屏正文。
- 音频不预加载整段任务；按事件/片段懒加载，尊重用户声音开关和 Data Saver。
- 模型加载错误局部降级，不使时间线、transcript 或 Archive 崩溃。
- deep link 打开 Event ID 时先展示可读 shell 与事件资料，再加载 3D。

## 41. 工程禁止事项

- 通用组件直接 import `missions/apollo11/events`。
- 在 JSX、CSS 或 scene component 中写任务数字。
- 用 `currentT: 0–1` 作为事实时间主键。
- 在 `useFrame` 中不断创建 geometry/material/object。
- 把 GLB node name 散落在 React 组件中。
- 在运行时按高度或位置“猜”单体火箭如何切级。
- 使用 CSS/Three 世界单位暗示真实比例却无说明。
- 未锁版本的 CDN decoder、远程字体或关键运行时依赖。
- 仅凭页面“看起来正确”宣告阶段完成。

---

# Part VIII — 测试与发布门禁

## 42. 单元测试

至少覆盖：

- MET 格式化、解析与 UTC 转换；
- storyTime ↔ MET 双向映射；
- 每个 segment 单调性；
- Event 排序、重复 ID、重复/冲突时间；
- 每个关键事件前后 `±0.001 s` 的边界；
- Source / Citation / Fact 完整性；
- 单位换算与显示精度；
- `stateAtMet` 确定性；
- 每次分离前、当时、之后的状态快照；
- telemetry 插值方法、边界与证据标签；
- 缺失值不得回落为 0；
- `planned` 不得通过 selector 变为 `actual`。

storyTime → MET → storyTime 的往返误差目标小于 50 ms story time。跳到事件、回到发射、再跳回同一事件时，序列化后的 MissionState 必须完全一致。

## 43. 资产测试

- GLB 可解析，Draco/KTX2 decoder 离线可用；
- required node / anchor 全部存在且唯一绑定；
- bounds、单位、朝向符合 manifest；
- triangle、texture、draw call 和文件大小不超预算；
- raw/derived hash 与 source/asset manifest 一致；
- LOD 切换不闪烁、不丢关键部件；
- 贴图 color space 与 normal map 设置正确；
- 关键组件聚焦 bounds 合理；
- WebGL/模型失败时 fallback 可用。

## 44. 集成与 E2E

至少覆盖：

- 初始完整 Saturn V；
- S-IC、S-II、S-IVB 各分离事件；
- CSM transposition、docking 与 LM extraction；
- LM separation、descent、landing、ascent；
- rendezvous、docking、crew/sample transfer 与 LM jettison；
- CSM return、CM/SM separation、entry、parachutes 与 splashdown；
- Archive / Control 切换的暂停和恢复；
- 拖动、倒回、reset、deep link 与刷新恢复；
- 编辑暂停与加速时音频行为；
- 模型加载失败、断网、低性能和 WebGL fallback；
- 键盘、焦点、200% zoom、Reduced Motion；
- 320×568、390×844、768×1024、1024×768、1280×720、1440×900。

## 45. 视觉回归

在关键 Event ID 保存稳定截图。测试环境关闭随机星空、噪声、自动旋转和非确定性时间；喷焰等动态效果使用固定 visualTime fixture。

必须提交的视觉验收画面：

1. Archive Mission Index（桌面、390 px 移动）；
2. Archive Saturn V / Spacecraft 章节；
3. Mission Control 发射/上升；
4. Translunar Coast；
5. Powered Descent；
6. Lunar Surface Operations；
7. Editorial Event Pause + Historical Audio / Transcript；
8. Entry / Recovery；
9. Mission Complete；
10. WebGL fallback；
11. Reduced Motion；
12. 390 px 移动端完整事件跳转与播放流程。

视觉直接判败条件：像游戏、电影宣传页、赛博朋克 HUD、普通 SaaS dashboard，或只是替换模型/标题的 Artemis 页面。

## 46. 性能审计

报告至少包含：

- 各路由冷启动 JS/CSS/asset transfer；
- low/medium/high 各档模型 triangles、draw calls、textures、GPU memory 估算；
- 桌面/移动 p50/p95 FPS；
- 首次可交互、模型可见与 deep link 可读时间；
- 10 次 reset/focus/event jump 前后 renderer memory；
- 关闭缓存和离线 decoder 测试；
- Archive 路由是否加载 Three.js/GLB 的 network 证明。

## 47. 发布门禁

建议 scripts：

```text
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:unit
pnpm test:integration
pnpm validate:sources
pnpm validate:mission
pnpm validate:models
pnpm build
pnpm test:e2e
pnpm test:visual
pnpm perf:budget
```

任何一项失败都不能称阶段完成。若仓库存在明确登记的 pre-existing issue，必须在 baseline 中锁定 exact count/file/rule；禁止笼统写“已有错误忽略”。

---

# Part IX — 分阶段制作计划

## 48. 总体执行规则

- 一次只实施一个 Phase；上一阶段验收通过后再继续。
- Phase 0 之前不得批量生成任务数据或制作最终 UI。
- 每阶段建立清晰 commit；不得把资料、模型处理和 UI 大改混在一个不可审计提交中。
- 不修改 `D:\artemis-mission-archive` 的既有产品代码；它只作为参考。本文档本身可保留在该仓库中。
- AI 必须主动发现并报告不确定性，但不能用“等用户确认”代替所有可完成的只读调查。
- 需要 Blender 等 GUI 操作时，先定义可复现 recipe 和输出验证，再执行。

## 49. Phase 0 — 基线、资料冻结与可行性

### 目标

建立新项目、事实边界、来源清单和模型可行性；不追求漂亮页面。

### 交付

- 新项目骨架与基础 README；
- Apollo 11 scope / non-goals；
- 完整初始 Source Manifest；
- NASA PDF/网页/模型/纹理原始文件登记、hash 与 rights notes；
- 附录 A 关键事件逐项复核表；
- Artemis 可复用概念/代码与不可复用部分清单；
- Saturn V、LM、CSM 候选资产 inspection report；
- Earth/Moon 贴图候选清单；
- 风险、未知与决策日志。

### 验收

- 未改 Artemis 产品代码；
- 每份本地原始资料可追溯至官方 URL；
- 关键事件没有未经核验的“实际”时间；
- 确定 CSM 路径，且没有把 Apollo-Soyuz 当最终替代；
- 确定模型是否能语义分级，未知项有明确实验；
- 明确 `ACTUAL / DERIVED / INTERPOLATED / PLANNED / RECONSTRUCTED / SCHEMATIC` 用法。

## 50. Phase 1 — Mission Core

### 交付

- 时间、epoch、事件、来源、单位、证据与状态类型；
- narrative time mapping；
- 纯 `stateAtMet`；
- schema 与验证 scripts；
- 最小 fixture mission；
- 单元测试。

### 验收

- Core 无 React/Three/Zustand/Apollo 专属依赖；
- 时间映射、事件边界与状态确定性测试通过；
- 缺失值、计划值与证据标签有自动检查。

## 51. Phase 2 — Apollo 11 Mission Pack

### 交付

- meta/epochs/events/phases/narrative；
- Saturn V / CSM / LM 语义组件表；
- Archive 章节内容骨架；
- transcript/audio/image records；
- 可用 telemetry channels 与真实性等级；
- 来源 locator 和派生公式。

### 验收

- 屏幕候选数字全部能通过 Fact ID 追溯；
- 不以 planned 值补 actual；
- 没有来源的频道被隐藏或显示 `NOT AVAILABLE IN SOURCE`；
- 关键 MET 与 Mission Report / transcript 完成交叉检查。

## 52. Phase 3 — 模型与天体资产管线

### 交付

- raw NASA assets 只读归档；
- 版本化 inspection/normalize/split/optimize recipes；
- Saturn V、LM 与 Apollo 11 CSM 的 high/medium/low；
- Earth/Moon 分级 KTX2 贴图；
- Asset/Node Manifests、统计与缩略图；
- decoder、offline 与 fallback 测试。

### 验收

- 所有 required nodes/anchors 可解析；
- 飞行器可形成本文列出的高层构型；
- CSM 重建边界清晰；
- 三档 LOD 与贴图正常，离线 decoder 可用；
- 资产大小和默认场景不超预算。

## 53. Phase 4 — Launch / Earth Orbit / TLI

### 交付

- Saturn V 全栈与三段推进构型；
- S-IC、S-II、S-IVB 事件和分离；
- Earth orbit 与 TLI；
- transposition/docking/extraction；
- 对应 Archive 章节、来源与 Control 配置。

### 验收

- 任意拖动正确重建构型；
- 发动机归属正确；
- 真实事件 MET 与视觉动画互不污染；
- 没有 SLS/Artemis 残留。

## 54. Phase 5 — Translunar / Lunar / Return

### 交付

- Translunar coast、LOI 与 lunar orbit；
- Eagle/Columbia separation、descent、landing；
- Lunar Surface Operations；
- ascent、rendezvous、docking、transfer、LM jettison；
- TEI、transearth、entry、splashdown/recovery。

### 验收

- LM descent/ascent stages 生命周期正确；下降级留在月面；
- 返回阶段只保留正确构型；
- surface console 不继续显示无意义的 descent/ascent telemetry；
- 轨迹、月面图与连续数据真实性标签持续可见。

## 55. Phase 6 — 完整 Archive 与 Mission Control UI

### 交付

- 两种顶层模式和全部 Archive 章节；
- 深链、Source Room、Component Dossier、Transcript；
- 阶段化 Control 布局和完整状态设计；
- 桌面/平板/移动响应式；
- 声音、字幕、键盘与 Reduced Motion。

### 验收

- Archive 不加载 3D bundle；
- 模式切换暂停且返回显式恢复；
- UI 中不存在不可追溯任务数字；
- `SCHEMATIC` / `PLANNED` / `RECONSTRUCTED` 不会被主题或小屏隐藏；
- 320 px、200% zoom、keyboard-only 通过。

## 56. Phase 7 — 审计、优化与发布候选

### 交付

- 全部自动测试与真实输出；
- performance report；
- accessibility audit；
- visual regression baseline；
- source/fact/model/rights audit；
- README、LICENSE/NOTICE、model processing notes；
- 最终截图/录屏与 known gaps。

### 验收

- 全部发布门禁通过；
- 默认性能预算通过；
- 无持续 GPU resource 增长；
- NASA、原作 MIT、派生模型/贴图处理和非背书声明完整；
- 四条最终审计链全部闭合。

---

# Part X — 交付给 AI 的工作协议

## 57. 每阶段开始时 AI 必须输出

在改文件前，先提交：

1. 当前 Phase 与明确范围；
2. 已读取的规范章节和项目指令；
3. 计划修改/新增的文件；
4. 所需 NASA Source ID 与当前可用状态；
5. 风险、未知和验证方式；
6. 明确声明本阶段不做的内容。

该输出是执行前检查，不是让用户替 AI 做研究。无风险的只读检查应直接完成。

## 58. 每阶段完成报告模板

实现方必须创建 `docs/audit/PHASE-{N}-REPORT.md`，至少包含：

```md
# Phase N Completion Report

## Scope completed

## Files changed

## Facts added
| Fact ID | Value | Evidence | Citation |

## Events added or changed
| Event ID | MET | Action | Citation |

## Schematic / reconstructed content
| ID | What is authored | Why | UI label |

## Assets processed
| Asset ID | Raw hash | Derived hash | Before | After | Recipe |

## Commands run
| Command | Exit code | Summary |

## Screenshots / recordings

## Performance delta

## Accessibility checks

## Open questions / known gaps

## Explicitly not completed
```

不得用“测试已通过”代替真实命令、exit code 和摘要；不得用“看起来正确”代替 source/model/state validation。

## 59. AI 禁止行为

- 猜测 Apollo 数字或引语；
- 自动补齐缺失遥测；
- 把平滑图称为 recovered telemetry；
- 为动画修改真实 MET；
- 看到 NASA 模型就假设单位、比例、节点或任务构型正确；
- 未留 recipe 地手改 Blender 文件；
- 先把高面模型塞进首屏，再把优化推迟到最后；
- 使用错误年代/任务的模型“临时上线，之后再换”；
- 把计划值、现代地形拼接或通用飞行器资料呈现为 Apollo 11 实际记录；
- 大范围重写不相关的用户代码；
- 隐藏失败测试、无来源内容或已知性能回退。

## 60. AI 必须暂停并报告的条件

以下情况可以停止当前实现并请求决策：

- 两份高权威资料对同一关键实际值存在无法解释的冲突；
- 计划使用的资产权利状态不明，且没有安全官方替代；
- NASA 模型结构无法满足分离要求，需要不可逆的大规模重建；
- 需求变化会突破本规范明确 non-goals；
- 需要对参考 Artemis 仓库做实质修改；
- 安全地继续需要新的外部账户、付费资源或发布权限。

报告必须包含已检查的证据、失败原因、至少一个安全替代方案和影响，不得只写“被阻塞”。

## 61. 可直接复制给实现 AI 的启动提示词

```text
你将制作一个独立的新项目：Apollo 11 Mission Archive + Historical Replay。

首先完整阅读 APOLLO_11_PRODUCTION_SPEC.md，并把它视为制作合同。当前参考项目
D:\artemis-mission-archive 只读；不要直接把它改造成 Apollo，也不要违反其“程序化
线框火箭”的项目规则。新项目目标路径为 D:\apollo-11-mission-archive。

只执行 Phase 0。不要提前制作最终 UI，不要猜任何任务数字，不要把 Flight Plan 的计划值
当成 as-flown actual。所有资料、影像、音频、模型和贴图先登记 source URL、访问日期、
rights status、local path 和 SHA-256。逐项核验附录 A 事件表；检查 NASA Saturn V / LM
模型的节点、单位、包围盒和能否分离；为 Apollo 11 CSM 给出可追溯重建方案，禁止使用
Apollo-Soyuz 模型替代。

开始前按第 57 节输出检查；结束时创建 docs/audit/PHASE-0-REPORT.md，按第 58 节提交
真实命令输出、资产报告、未知项与明确未完成内容。Phase 0 验收前不要进入 Phase 1。
```

---

# Part XI — 最终审核包

## 62. 交回本任务审核时必须包含

1. 完整仓库或可访问的工作区路径；
2. 当前 commit hash、branch、dirty status；
3. `README` 与本文档在目标仓库中的副本；
4. 所有 Phase completion reports；
5. Source / Fact / Asset / Node Manifests；
6. NASA 原始资料清单、hash 与 rights notes；
7. 模型处理 recipes 与前后统计；
8. 全部测试命令和真实输出；
9. 性能与无障碍报告；
10. 第 45 节要求的截图/录屏；
11. known gaps、开放问题和未实现范围；
12. 本地启动、build 和离线 fallback 操作说明。

## 63. 最终审计四条链

```text
屏幕数字 → Fact ID → Citation → NASA 原始资料
屏幕事件 → MET → Event ID → Citation
屏幕部件 → Semantic ID → Node Manifest → GLB Node
屏幕动画 → Visual Cue → Evidence: SCHEMATIC（若非实际轨迹）
```

四条链全部闭合，产品才是建立在 Artemis 原型经验上的 Apollo 11 数字档案，而不是只更换标题、图片和模型。

## 64. 最终验收总表

### 产品与身份

- [ ] 只有 Archive 与 Historical Replay 两个顶层模式。
- [ ] 首屏清楚属于 Apollo 11 / AS-506 / Columbia / Eagle。
- [ ] 无 Artemis/SLS/Orion 残留，无 Apollo-Soyuz 替代。
- [ ] 不使用 NASA 品牌暗示官方背书。
- [ ] 不呈现为游戏、电影营销页或赛博朋克 HUD。

### 数据与来源

- [ ] 每个任务数字都有 Fact ID、证据标签和 Citation。
- [ ] 每个关键 Event ID 有核验 MET 与 locator。
- [ ] planned 与 actual 不混淆。
- [ ] 缺失数据不显示 0，不生成假遥测。
- [ ] transcript、音频、图片、模型和贴图均有 rights / processing notes。

### 时间与构型

- [ ] MET、storyTime、visualTime 分离。
- [ ] 任意跳转/倒回得到确定性状态。
- [ ] 17 个高层飞行器构型正确。
- [ ] 下降级留在月面，返回段只保留正确飞行器。
- [ ] 作者化暂停和动画没有冒充真实任务状态。

### 模型与性能

- [ ] Saturn V / LM NASA 资产经过 inspection，不宣称 CAD。
- [ ] CSM 为 Apollo 11 正确构型并清楚标注重建边界。
- [ ] Node Manifest、LOD、KTX2、offline decoder 与 fallback 完整。
- [ ] 桌面/移动默认预算通过。
- [ ] Archive 未加载 Three/R3F/GLB。
- [ ] 10 次 reset/focus/jump 后无持续 GPU 资源增长。

### 体验、响应式与无障碍

- [ ] Archive 是严谨任务档案，Control 是当代历史重放界面。
- [ ] Powered Descent 与 Surface Operations 信息配置不同。
- [ ] 320×568 至 1440×900 无根级横向滚动和遮挡。
- [ ] keyboard-only、200% zoom、Reduced Motion 和 WebGL fallback 通过。
- [ ] 历史声音默认关闭、有字幕、不变速、不虚构。
- [ ] 所有 3D/图表存在等价文字或表格。

### 工程与交付

- [ ] 全部发布门禁通过。
- [ ] 各 Phase reports、截图、性能和无障碍报告完整。
- [ ] MIT 归属、NASA 来源、rights 与非背书声明完整。
- [ ] known gaps 诚实列出，没有以“之后再补”掩盖关键真实性缺失。

---

# Appendix A — Apollo 11 关键事件事实种子

## A.1 权威基表

下表已按 NASA **Apollo 11 Mission Report, Table 3-I, printed pp. 3-4 to 3-5（PDF pp. 18–19）** 转录，并保留原始小数精度。星号对应原表注释 `Engine ignition time`。`metSeconds` 仅是对原始 `hr:min:sec` 的机械换算。

这是一份 **Phase 0 复核种子**，不是可以不看原件直接发布的数据：实现方仍须把本地 PDF hash、printed page、PDF page、原始行文本和复核人/日期写入 Source Manifest。

| Event ID | 产品标签 | Mission Report 原始事件 | 原始 MET | `metSeconds` | Locator / 备注 |
|---|---|---|---:|---:|---|
| `a11-liftoff` | LIFTOFF | Lift-off | `00:00:00.6` | `0.6` | `NASA-A11-MR`, p. 3-4；range zero 为 1969-07-16 13:32:00 GMT |
| `a11-sic-outboard-cutoff` | S-IC OUTBOARD ENGINE CUTOFF | S-IC outboard engine cutoff | `00:02:41.7` | `161.7` | p. 3-4；**不是级间分离时间** |
| `a11-sii-ignition-command` | S-II ENGINE IGNITION CMD | S-II engine ignition (command) | `00:02:43.0` | `163.0` | p. 3-4 |
| `a11-les-jettison` | LAUNCH ESCAPE TOWER JETTISON | Launch escape tower jettison | `00:03:17.9` | `197.9` | p. 3-4 |
| `a11-sii-cutoff` | S-II ENGINE CUTOFF | S-II engine cutoff | `00:09:08.3` | `548.3` | p. 3-4；**不是级间分离时间** |
| `a11-sivb-first-ignition` | S-IVB ENGINE IGNITION CMD | S-IVB engine ignition (command) | `00:09:12.2` | `552.2` | p. 3-4 |
| `a11-sivb-first-cutoff` | S-IVB ENGINE CUTOFF | S-IVB engine cutoff | `00:11:39.3` | `699.3` | p. 3-4 |
| `a11-tli-ignition` | TRANSLUNAR INJECTION | Translunar injection maneuver | `02:44:16.2*` | `9856.2` | p. 3-4；engine ignition time |
| `a11-csm-sivb-separation` | CSM / S-IVB SEPARATION | Command and service module/S-IVB separation | `03:17:04.6` | `11824.6` | p. 3-4 |
| `a11-first-docking` | FIRST DOCKING | First docking | `03:24:03.1` | `12243.1` | p. 3-4 |
| `a11-spacecraft-ejection` | SPACECRAFT EJECTION | Spacecraft ejection | `04:16:59.1` | `15419.1` | p. 3-4；映射成 LM extraction complete 前须核对正文语义 |
| `a11-sivb-separation-maneuver` | SEPARATION MANEUVER FROM S-IVB | Separation maneuver (from S-IVB) | `04:40:01.8*` | `16801.8` | p. 3-4；engine ignition time |
| `a11-mcc1-ignition` | MIDCOURSE CORRECTION 1 | First midcourse correction | `26:44:58.7*` | `96298.7` | p. 3-4；engine ignition time |
| `a11-loi-ignition` | LUNAR ORBIT INSERTION | Lunar orbit insertion | `75:49:50.4*` | `272990.4` | p. 3-4；engine ignition time |
| `a11-lunar-orbit-circularization` | LUNAR ORBIT CIRCULARIZATION | Lunar orbit circularization | `80:11:36.8*` | `288696.8` | p. 3-4；engine ignition time |
| `a11-undocking` | COLUMBIA / EAGLE UNDOCKING | Undocking | `100:12:00` | `360720` | p. 3-4；原表精度到整秒 |
| `a11-lm-separation-maneuver` | SEPARATION MANEUVER FROM LM | Separation maneuver (from lunar module) | `100:39:52.9*` | `362392.9` | p. 3-4；engine ignition time |
| `a11-doi-ignition` | DESCENT ORBIT INSERTION | Descent orbit insertion | `101:36:14*` | `365774` | p. 3-4；engine ignition time；原表无小数 |
| `a11-pdi-ignition` | POWERED DESCENT INITIATION | Powered descent initiation | `102:33:05.2*` | `369185.2` | p. 3-4；engine ignition time |
| `a11-touchdown` | LUNAR LANDING / TOUCHDOWN | Lunar landing | `102:45:39.9` | `369939.9` | p. 3-4 |
| `a11-lm-hatch-open` | LM HATCH OPEN | Egress (hatch opening) | `109:07:33` | `392853` | p. 3-4；不是 first step |
| `a11-lm-hatch-close` | LM HATCH CLOSED | Ingress (hatch closing) | `111:39:13` | `401953` | p. 3-4 |
| `a11-lunar-liftoff` | LUNAR LIFTOFF | Lunar lift-off | `124:22:00.8*` | `447720.8` | p. 3-4；engine ignition time |
| `a11-csi-ignition` | COELLIPTIC SEQUENCE INITIATION | Coelliptic sequence initiation | `125:19:36*` | `451176` | p. 3-4；engine ignition time；原表无小数 |
| `a11-cdh-ignition` | CONSTANT DIFFERENTIAL HEIGHT | Constant differential height maneuver | `126:17:49.6*` | `454669.6` | p. 3-4；engine ignition time |
| `a11-tpi-ignition` | TERMINAL PHASE INITIATION | Terminal phase initiation | `127:03:51.8*` | `457431.8` | p. 3-4；engine ignition time |
| `a11-lm-csm-docking` | EAGLE / COLUMBIA DOCKING | Docking | `128:03:00` | `460980` | `NASA-A11-MR`, p. 3-5；原表精度到整秒 |
| `a11-ascent-stage-jettison` | ASCENT STAGE JETTISON | Ascent stage jettison | `130:09:31.2` | `468571.2` | p. 3-5 |
| `a11-ascent-stage-separation-maneuver` | SEPARATION MANEUVER FROM ASCENT STAGE | Separation maneuver (from ascent stage) | `130:30:01*` | `469801` | p. 3-5；engine ignition time；原表无小数 |
| `a11-tei-ignition` | TRANSEARTH INJECTION | Transearth injection maneuver | `135:23:42.3*` | `487422.3` | p. 3-5；engine ignition time |
| `a11-mcc2-ignition` | MIDCOURSE CORRECTION 2 | Second midcourse correction | `150:29:57.4*` | `541797.4` | p. 3-5；engine ignition time |
| `a11-cm-sm-separation` | CM / SM SEPARATION | Command module/service module separation | `194:49:12.7` | `701352.7` | p. 3-5 |
| `a11-entry-interface` | ENTRY INTERFACE | Entry interface | `195:03:05.7` | `702185.7` | p. 3-5 |
| `a11-splashdown` | SPLASHDOWN | Landing | `195:18:35` | `703115` | p. 3-5；产品标签消除与 lunar landing 的歧义 |

## A.2 First step 的秒级差异

`First step` 没有列入 Mission Report Table 3-I，NASA 官方资料对秒级标注存在差异：

- `NASA-APOLLO-NUMBERS` 的 Apollo 11 Timeline 给出 `109:24:15.00`；
- NASA SP-214 *Apollo 11 Preliminary Science Report* 写作 `109:24:19 g.e.t.`；
- NASA 托管的 ALSJ [One Small Step](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.step.html) 说明 Mission Report 的 initial contact 为 `109:24:15`，而其他发布记录曾给出约 `109:24:20`；视频/文字同步还可能出现 `109:24:18`。

因此首版事件种子为：

| Event ID | 候选 MET | `metSeconds` | 发布前要求 |
|---|---:|---:|---|
| `a11-first-step` | `109:24:15.00` | `393855` | 标记 `source-rounded / timing varies by source`；Phase 0 用 SP-4029、原始技术 transcript、可验证影像时码和 ALSJ 注释形成 decision record。不得悄悄抹平差异。 |

当产品需要同步具体音频/影像时，使用该媒体自身校准后的 clip time；事件总览使用已记录的 canonical MET，并在 Source Room 解释秒级差异。

## A.3 Table 3-I 未覆盖、但状态机必须补证的事件

以下视觉/构型事件不能从相邻 engine cutoff 或 ignition 时间“推测”：

- S-IC / S-II 物理分离；
- S-II / S-IVB 物理分离；
- SLA panel 开启/抛离的实际序列；
- docking probe、latch 与 LM extraction 的细化状态；
- PDI 内部 braking / approach / landing 子事件及 1201/1202 alarms；
- Armstrong 完全出舱、first step、Aldrin 出舱/first step、EVA 关键活动；
- LM ascent staging 的视觉定义与 engine ignition/cutoff 细节；
- drogue deployment、main parachute deployment、main inflation；
- splashdown 后 flotation、hatch opening、crew recovery / aboard ship。

Phase 0 必须从 Mission Report、launch vehicle flight evaluation、Technical Transcript、ALSJ/AFJ 和 recovery 资料中建立这些 Event ID。没有可靠 MET 时，可以保留在 Archive 叙事中，但不能驱动标为 `ACTUAL` 的精确动画。

## A.4 UTC 派生规则

Mission Report 定义 range zero 为 `1969-07-16 13:32:00 GMT`，而 liftoff 事件为 `MET 00:00:00.6`。实现方必须明确 `MissionEpochs` 是绑定 range zero 还是 liftoff，并写测试覆盖 0.6 秒偏移；禁止一边用 range zero 转 UTC、一边把 liftoff 强行显示为整秒而不说明舍入。

推荐保存：

```ts
interface MissionEpochs {
  rangeZeroUtc: '1969-07-16T13:32:00.000Z'
  liftoffMetSeconds: 0.6
  displayPrecision: 'source-preserved'
}
```

UTC 属于由 epoch + MET 机械计算的 `DERIVED` 显示值；每个事件仍以原始 MET 为主键。

---

# Appendix B — 决策记录

| Decision ID | 决策 | 理由 |
|---|---|---|
| `ADR-001` | 建立独立 Apollo 项目，不直接改 Artemis | 两个项目的火箭资产规则不同，并避免污染现有原型 |
| `ADR-002` | 首版只做 Apollo 11，但 core 支持 mission packs | 控制史料和模型范围，同时避免一次性架构 |
| `ADR-003` | 顶层只有 Archive 与 Historical Replay | 保持原型最强结构，Surface Ops 是阶段配置而非第三产品 |
| `ADR-004` | 使用真实 MET + edited storyTime + local visualTime | 防止压缩播放、事实时间与动画互相污染 |
| `ADR-005` | NASA Saturn V / LM 可视化资产先 inspection 后采用 | NASA 发布不自动等于单位、节点和任务构型完全正确 |
| `ADR-006` | Apollo 11 CSM 必须重建/验证，拒绝 Apollo-Soyuz 替代 | 外形和任务构型错误会破坏项目最核心可信度 |
| `ADR-007` | 无完整逐秒遥测时优先离散事件和有证据采样 | 可信度高于“满屏动起来” |
| `ADR-008` | 历史声音默认关闭，不使用 AI 仿声/背景音乐 | 尊重史料、权限、可访问性和产品定位 |
| `ADR-009` | Archive 不加载 3D bundle | 保证档案阅读性能和渐进增强 |
| `ADR-010` | First step 保留来源秒级差异记录 | 不用一个看似精确的数字掩盖官方资料差异 |

---

# Appendix C — 登月呈现、声音与镜头可靠性合同

## C.1 定稿选择

登月呈现不是在“月球特写、强制镜头、真实贴图、局部实拍照片”之间四选一，而是明确分工：

> **真实贴图负责空间连续性，局部地形负责下降过程，真实照片/影像负责历史证据，可取消的引导镜头负责叙事。**

月球的视觉尺度按以下顺序变化：

```text
远方天体
  → 占满视野的完整月球
  → 月轨地表与地平线
  → Tranquility Base 局部地形
  → 历史照片、电视与 16 mm 影像
```

禁止在同一个巨大世界坐标系中同时用真实比例追踪 Earth、Moon、飞行器和 landing site。飞行器尺度与月球尺度无法在同一画面同时清楚可见；需要同时展示时必须标 `SCHEMATIC SCALE`。

## C.2 三层视觉材料

| 层 | 资产 | 用途 | 真实性表达 |
|---|---|---|---|
| 全球天体层 | `NASA-MOON-CGI-KIT` 色彩/高程图生成的 Moon sphere | Translunar approach、LOI、lunar orbit | `NASA IMAGERY-BASED TEXTURE`；现代 LRO 数据，不称作 1969 实时外观 |
| 局部地形层 | 经重新生成或校正的 landing-site terrain | DOI、PDI、touchdown、surface map | `RECONSTRUCTED TERRAIN`；记录投影、垂直比例与 lighting method |
| 历史证据层 | Apollo 11 照片、电视、16 mm、LROC 遗址图 | First step、EVA、档案对照 | 显示 image/clip ID、时间、拍摄位置、来源和 processing note |

`NASA-A11-LANDING-TERRAIN` 页面明确原 STL 为便于观看将 Z 轴夸张 60 倍。它不能直接作为真实下降地形；必须撤销夸张并验证，或从原始 LRO/LOLA 数据重建。

`NASA-A11-MOON-VIEW`（AS11-44-6665）摄于返航途中，当时飞船已离月球约一万海里；它只用于 transearth Archive/Replay 图版，禁止冒充进场或 LOI 视图。

`NASA-A11-LANDING-SITE-LRO` 是数十年后 LROC 拍摄的遗址影像，必须标明拍摄年代；不能冒充 1969 年登月现场。

Earth 使用 `NASA-EARTH-BLUE-MARBLE` 作为稳定全球贴图时，须说明它是多次卫星观测拼接产品。Apollo 11 当时拍摄的 Earth 照片作为独立历史图版，不混作全球纹理的来源声明。

## C.3 登月镜头脚本

### C.3.1 Translunar approach / LOI

- Moon sphere 使用 low texture 常驻；medium/high texture 只替换 map，不替换 Object3D identity。
- LOI 前允许一次 1.5–2.5 s 引导镜头：Moon 从约 20–30% 画面直径扩大至约 65–75%。
- 飞行器为解释关系可保留，但若放大则持续显示 `SCHEMATIC SCALE`。
- 镜头结束立即归还控制；pointer、wheel、touch 或 keyboard 输入均可中断。
- Reduced Motion 下直接切至稳定构图，不 tween。

### C.3.2 Lunar orbit / LM checkout

- 切至 `MOON_ORBIT_FRAME`，Moon 固定在该 frame 原点。
- Columbia/Eagle、轨道线和相机相对于 Moon 更新。
- 主视图在 Moon limb、orbital schematic、spacecraft configuration 之间由用户切换。
- 历史月球照片只作为带编号 Evidence Plate 出现，不铺成假的动态背景。

### C.3.3 Undocking / DOI

- 用中距离构型镜头清楚展示 Columbia 与 Eagle 断开。
- 不把 undocking、separation maneuver 与 DOI 合并成一个模糊动画；分别由 Event ID 驱动。
- DOI 后开始从全球球体过渡到 landing site local frame，过渡中显示尺度变化说明。

### C.3.4 PDI / powered descent

- 主场景切至 `LANDING_SITE_FRAME`；Tranquility Base anchor 固定在原点。
- 使用稳定、低运动的 descent diagram / local terrain 视角。
- 不在 1201/1202 alarm、landing radar acquisition 或关键 crew call 时自动换镜头；张力来自历史事件、声音和读数，不来自镜头摇晃。
- 可在 inset 中同步显示经过来源登记的真实下降影像；它不取代 3D/diagram 的空间解释功能。
- terrain、landing ellipse、Eagle path 若未由任务后轨迹数值重建，持续显示 `RECONSTRUCTED / SCHEMATIC`。

### C.3.5 Touchdown

Touchdown 固定序列：

1. 停止下降相机的连续运动；
2. `EVENT PAUSE — EDITORIAL`，MET 冻结；
3. 正常速度播放已登记的 air-to-ground 片段；
4. transcript 按 speaker/channel 同步高亮；
5. Eagle 落地外部视图出现时持续标 `RECONSTRUCTED VIEW`；
6. 用户选择 `CONTINUE REPLAY`。

只允许 300–500 ms 的轻微稳定构图调整。禁止外部摄影机环绕、夸张尘云、全屏震动、英雄式音乐和虚构的地面摄影角度。

### C.3.6 First step / surface operations

- 真实电视/16 mm/照片成为中心内容；transcript 与 image/clip metadata 同屏。
- Eagle 3D、EVA route 与 surface map 退为导航和结构辅助。
- 不用 3D 宇航员重演 first step 取代历史影像。
- 如果历史影像不可播放，使用静态关键帧 + transcript + audio，不生成替代画面。

### C.3.7 Lunar ascent / return

- Apollo 11 没有外部电影摄影机记录 Eagle 从月面起飞的完整第三人称镜头；外部 3D 必须标 `RECONSTRUCTED`。
- Ascent stage 离开时，descent stage 在 `LANDING_SITE_FRAME` 永久保留。
- Transearth 阶段可使用 `NASA-A11-MOON-VIEW` 作为真实图版，使月球从“目的地”重新变成远去天体。
- Earth entry 切至独立 `EARTH_ENTRY_FRAME`；Earth 固定为该 frame 原点。

## C.4 声音状态机

声音必须拆成两个独立用户开关：

```text
HISTORICAL AUDIO  OFF / ON
INTERFACE TONES   OFF / ON
```

Historical Audio：

- 默认 `OFF`，不自动播放；
- 只在 `1×` 或 Editorial Event Pause 中按正常速度播放；
- 大于 `1×` 时暂停并显示原因，绝不 time-stretch / pitch-shift；
- 每段显示 channel、speaker、MET range、字幕、transcript source 和 rights status；
- PDI → Touchdown 可以提供完整长片段的用户主动播放入口；
- 编辑回放如选择多个连续关键片段，必须明确标出中间 gap，禁止剪接改变语义；
- 页面隐藏、切入 Archive 或设备音频中断时立即暂停，并保存 clip MET。

关键声音建议：

| 阶段 | 历史声音 | 处理原则 |
|---|---|---|
| Launch | Air-to-ground、PAO；可选地面实录 | 地面声注明观察位置，不冒充舱内声 |
| TLI / LOI | 关键 crew/CAPCOM/flight loop 片段 | 保留静默，不用环境音乐填充 |
| PDI | Air-to-ground + transcript | 允许完整 1× 播放或有 gap 标记的事件片段 |
| 1201/1202 | 原始 call 与回应 | 不叠加游戏式 alarm siren |
| Touchdown | 原始 landing exchange | Editorial pause 正常播放 |
| First step | 原始电视/air-to-ground + 字幕 | 影像、声音、transcript 使用同一 media calibration |
| Lunar liftoff / docking / TEI | 关键原始语音 | 无外部画面时也不生成声音 |
| Entry / splashdown | 原始通信与 recovery 资料 | 不做胜利音乐和掌声蒙太奇 |

Interface Tones 只允许轻微确认、编辑暂停、警告确认和配置完成提示，并明确标为项目 UI 声音。

## C.5 防止镜头错过 Earth / Moon 的参考坐标系

必须建立独立 reference frames：

| Frame | 固定原点 | 主要内容 |
|---|---|---|
| `SYSTEM_FRAME` | 地月示意系统中心 | Earth–Moon 关系与 schematic trajectory |
| `EARTH_ORBIT_FRAME` | Earth center | Launch、parking orbit、TLI |
| `MOON_ORBIT_FRAME` | Moon center | LOI、lunar orbit、undocking |
| `LANDING_SITE_FRAME` | Tranquility Base local origin | DOI、PDI、touchdown、surface/ascent |
| `EARTH_ENTRY_FRAME` | Earth center | Return approach、entry、splashdown |

规则：

- 抵达目标天体后切换 frame，使天体成为稳定原点；不要让相机追逐持续重算的 planet world position。
- Vehicle state 仍由真实 MET 决定；frame switch 只是可视化坐标变换，登记为 `SCHEMATIC`。
- Landing site 使用局部 East/North/Up 或已记录等价坐标；不得把 latitude/longitude 直接当平面 XYZ。
- Frame transition 必须可逆、确定性；同一 Event ID 多次进入得到相同对象位置。
- Earth/Moon 的低清 sphere 始终存在。高画质加载只交换 texture/material，不销毁和新建 target object。

## C.6 Camera Shot 契约

镜头不能保存一次性旧 world coordinate。它必须每帧通过 stable anchor 解析目标：

```ts
interface CameraShot {
  id: string
  activeFrame: ReferenceFrameId
  targetAnchorId: string
  framing: 'fit-sphere' | 'fit-bounds' | 'local-composition'
  projectedDiameter?: [number, number]
  durationMs: number
  interruptible: true
  fallbackShotId: string
  evidence: 'schematic'
}
```

实现要求：

- 使用 target 的当前 world position / bounding sphere，不能缓存 shot 开始时的位置后继续追踪。
- `fit-sphere` 根据天体 radius、FOV、aspect 与 safe margins 计算距离，不写死 camera XYZ。
- 引导镜头全部 `interruptible: true`；任何有效用户相机输入立即取消 tween。
- 自动引导期间显示 `SKIP CAMERA`，并保持键盘可达。
- tween 完成后不继续强锁用户相机；只有 target anchor 仍可用于用户选择的 `FOCUS`。
- Reduced Motion 直接应用终点构图。

## C.7 每帧可见性保护

在 camera update 后、render 前执行 celestial framing guard：

1. 将 target center 投影到 NDC；
2. 检查中心位于安全矩形（建议 `|x| ≤ 0.82`、`|y| ≤ 0.78`）；
3. 计算 projected sphere/bounds，确保直径达到当前 shot 的最小值；
4. 检查 near/far plane、相机是否位于目标几何内部、target 是否被意外隐藏；
5. 失败时切换 `fallbackShotId`，记录 diagnostic，禁止继续播放一个看不到目标的镜头。

不得以 camera `lookAt()` 调用成功作为“目标可见”的证明。

## C.8 加载与失败降级

- low Moon/Earth map 作为进入相关 route 的优先资源；medium/high 异步替换。
- 贴图加载期间保留同一个 sphere、anchor、bounds 与 material fallback。
- high texture 失败不移除天体；回退 medium/low，并显示非阻塞资源状态。
- local terrain 失败时回退静态 landing map + schematic descent path，不回到会错过 Moon 的 global shot。
- Historical media 失败时保留 transcript、时间、来源和静态 keyframe。

## C.9 强制验收场景

至少对以下 Event ID、视口和资源状态保存自动截图：

```text
a11-tli-ignition
a11-loi-ignition
a11-undocking
a11-pdi-ignition
a11-touchdown
a11-first-step
a11-lunar-liftoff
a11-tei-ignition
a11-entry-interface
a11-splashdown
```

视口：`1440×900`、`1024×768`、`390×844`、`320×568`。

每个场景至少测试：

- low texture；
- high texture 加载成功；
- high texture 加载失败；
- camera tween 中用户中断；
- direct deep link；
- backward scrub 后再次进入；
- Reduced Motion；
- WebGL fallback。

判定失败：

- Earth/Moon 中心离开安全画框；
- 天体投影尺寸小于 shot 规定下限；
- 贴图切换导致天体短暂消失或 anchor identity 改变；
- 到 PDI 后仍从 global frame 追逐 Moon；
- touchdown/first step 使用未标注的虚构外部摄影机；
- 历史声音在加速回放中变速；
- 用户输入无法中断引导镜头。

这组测试是发布门禁的一部分，不能只靠人工观看一次通过。
