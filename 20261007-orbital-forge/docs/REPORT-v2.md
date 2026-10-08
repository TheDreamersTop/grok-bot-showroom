# 星鍛 Orbital Forge v2 — 視覺重建報告

> 📁 公開版備註（2026-10-08 匯入 showroom）：原始 ship.page 認領 token（`spc_…`）已移除；下列 ship.place 網址為匿名部署，約 2026-11-07 到期，僅作歷史紀錄。目前正式 demo：https://thedreamerstop.github.io/grok-bot-showroom/20261007-orbital-forge/ 。截圖除 `hero.png`、`before-after.png` 外已轉存為 JPEG（`.jpg`）以縮小 repo。


**Live URL:** https://rural-ceder-yohyx.ship.place/  （第 2 輪精修，10/08 12:44；前一版 https://regal-shame-b8nzs.ship.place/ ）
**Final deploy:** 2026-10-08 11:39 (Asia/Taipei) · 匿名 ship.page drop，約 30 天到期（2026-11-07 11:39 台北時間）
**v1（對照）:** https://burly-belief-ipm9p.ship.place/

## 相較 v1 的改變 (What changed vs v1)
| 面向 | v1 | v2 |
|---|---|---|
| 粒子 | 6,000 顆 CPU 粒子 + 加法 sprite 假 bloom | GPU 模擬（GPGPU ping-pong）262,144 顆（HIGH）/ 589,824（ULTRA），開普勒軌道 + curl noise + 密度波旋臂 |
| 光影 | sprite 疊加 | HDR（HalfFloat + MSAA）→ 多層 mip bloom（CoD 13-tap 下採樣 + Karis 平均 + tent 上採樣）→ ACES 色調映射、色差、鏡頭髒污、暗角、底片顆粒 |
| 星核 | 簡單球體 | 三種程序化材質：電漿（沸騰 fbm + 脈絡 + 米粒組織 + 臨邊昏暗）、晶核（Voronoi 晶面 + 高光）、灰燼（熔岩裂縫外殼）＋ 日冕（流光、射線、日珥） |
| 背景 | 星點 | 每模式各自烘焙的 raymarch 星雲 cubemap（domain-warped fbm + ridged 纖維 + 暗塵帶），切模式時交叉淡入；星野含閃爍與繞射星芒 |
| 氣體/塵埃 | 無 | 發光氣體 splat + 吸光塵埃 splat（暗塵帶、Hubble 式對比） |
| 震波 | 粒子推開 | 3D 物理推擠 + 螢幕空間折射漣漪 + 色差 + 發光殼層 |
| 超新星 | 爆發 | 內爆 → 閃光 → 盤面衝擊環 → 噴出物 → 約 10 秒重新凝聚成盤 |
| 重力井 | 吸引 | 吸引 + 漩渦 + 螢幕空間重力透鏡、事件視界、光子環 |
| 開場 | 標題 + 爆發 | 0.1s 內點火閃光，旋臂從核心螺旋展開，鏡頭 4.4s 拉遠，書法感標題卡 |
| 品質 | 粒子縮小 | Q 切換 LOW/MED/HIGH/ULTRA + 自動降級（平均 FPS < 42） |
| 聲音 | 無 | WebAudio 合成：低頻 drone、殘響、震波重擊、超新星上升音、噴灑嘶聲、重力嗡鳴（首次互動後啟用，M 切換） |

## 操作 (Controls)
| 輸入 | 動作 |
|---|---|
| 拖曳 Drag | 軌道旋轉鏡頭 Orbit |
| 移動滑鼠 Move | 噴灑／雕塑星塵 Spray |
| 點擊 Click | 震波 Shockwave |
| 按住 Shift | 重力井 Gravity well |
| 滾輪 Wheel | 縮放 Zoom |
| 1 / 2 / 3 | 電漿 Plasma / 晶核 Crystal / 灰燼 Ember |
| Space | 超新星 Supernova |
| F | 全螢幕 Fullscreen |
| H | 隱藏介面 Hide HUD |
| R | 重置 Reset |
| Q | 畫質切換 Quality |
| M | 聲音開關 Sound |
| C / 「複製種子」 | 複製種子 `OF2-XXXXXXXX` 與參數 |

URL 參數：`?seed=HEX`、`?mode=1..3`、`?q=0..3`（`?shot=1` 僅供截圖用：固定 dt、較少粒子）。

## 技術 (Techniques)
- Three.js r160（本地 vendor：`vendor/three.module.js`、`GPUComputationRenderer.js`），importmap，無建置步驟。
- GPGPU：position(xyz+life)/velocity(xyz+temperature) Float 紋理；每粒子以 hash 決定軌道參數；20% 傾斜軌道光暈；bitangent curl noise（解析梯度 simplex）；對數螺旋密度波；溫度模型（越靠核越熱、超速加熱、隨時間冷卻）→ 調色盤。
- 粒子渲染：instanced quad 依速度拉伸（只有快的粒子才拉長）、次像素能量守恆、溫度→色彩、旋臂亮度調制。
- 後製：自寫 bloom 鏈、震波與重力井的螢幕空間折射、ACES（Hill fit）、每模式調色、手動 sRGB。
- 開場：頂點著色器內的螺旋展開 + 點火閃光 + 鏡頭拉遠。

## 截圖 (shots/, 1920×1080, headless Chrome + SwiftShader)
第 2 輪精修後重拍；舊版保留為 `*-v2a.jpg` 方便對照。
- `shots/hero.png`（＝`mode-plasma.jpg`）— 主視覺（電漿模式），舊：`hero-v2a.jpg`、`mode-plasma-v2a.jpg`
- `shots/opening-ignition.jpg`、`shots/opening.jpg` — 開場（約 1s 與 1.9s，含景深），舊：`opening-ignition-v2a.jpg`、`opening-v2a.jpg`
- `shots/mode-ember.jpg`、`shots/ember-shockwave.jpg`（新）— 灰燼模式，舊：`mode-ember-v2a.jpg`
- `shots/mode-crystal.jpg` — 晶核模式，舊：`mode-crystal-v2a.jpg`
- `shots/supernova-implode.jpg`、`shots/supernova-peak-early.jpg`（新，爆發後約 0.07s）、`shots/supernova-peak.jpg`（約 0.17s）、`shots/supernova-ring.jpg`，舊：`supernova-*-v2a.jpg`
- `shots/gravity-well.jpg`（舊：`gravity-well-v2a.jpg`）、`shots/shockwave.jpg`、`shots/spray.jpg`（未受影響，沿用）

## 已知限制 (Known limits)
- 截圖為軟體 GPU（SwiftShader，約 0.3–1 FPS），使用 `?shot=1` 的 147k 粒子；實機 HIGH 為 262k。我無法在實體 GPU 上量 FPS；60 FPS 是設計目標，弱 GPU／內顯會自動降到 MED/LOW（也可按 Q）。
- 僅桌面 Chrome（WebGL2 + float render target）；無行動版（依需求）。
- ship.page 免費版右下角有 badge；匿名 drop 約 30 天到期，每次部署是新網址。
- 字體從 Google Fonts 載入（離線或被擋時退回系統字體）。
- 背景星雲為預先烘焙的 cubemap；其他模式在開場後於背景逐面烘焙，若在烘焙完成前切換，會先觸發一次同步烘焙（可能短暫卡頓）。
- 超新星峰值已改為有色閃光（藍白核心＋洋紅/琥珀殼層＋色散），但在極亮處星核表面會出現細顆粒紋理。
- 灰燼模式左下方畫面仍偏空；背景星雲整理後較乾淨但也較低調，喜歡 v2a 那種滿版雲氣的人可能覺得少了一點。
- 開場景深是單次 16-tap 圓盤模糊（只在前 ~3.8s 開啟），不是真正的散景。

## 部署歷史 (Deploy history)
| # | 時間 (Asia/Taipei) | URL（已過期或將於 ~2026-11-07 到期） |
|---|---|---|
| Stub | 10/08 09:32 | https://denim-truck-qmhtv.ship.place/ |
| M1 | 10/08 09:41 | https://plume-address-93qeo.ship.place/ |
| M2 | 10/08 10:59 | https://violet-galleon-vj8ac.ship.place/ |
| M3 | 10/08 11:25 | https://battle-pocket-unvv7.ship.place/ |
| v2a | 10/08 11:39 | https://regal-shame-b8nzs.ship.place/ |
| **Final（第 2 輪）** | 10/08 12:44 | **https://rural-ceder-yohyx.ship.place/** |

全部檔案（index.html、js/*、vendor/*）以 curl 驗證回傳 HTTP 200。

## 自評迭代 (Self-critique passes)
1. 粒子像彩色紙屑、盤面過大 → 縮小盤面、鏡頭拉遠、只拉長高速粒子。
2. 粉紅「鬆餅」雜訊 → 密度波旋臂、氣體 splat、暗塵帶、外圍紫色、藍色光暈。
3. 星核像餅乾 → 沸騰脈絡重製；灰燼模式霧化 → 更薄的盤 + 上升煙柱。
4. 震波看不見 → 光環 + 折射；超新星全白 → 降低溫度/曝光；開場過亮 → 起始鏡頭更遠。
5. 背景星雲混濁 → 調色；噴灑粒子灰白 → 熔金色。
6. 星雲改 ridged 纖維 + 中性暗帶；HUD 字太淡 → 提高對比/字級 + 陰影；重力井加上重力透鏡與光子環；超新星峰值改為有色閃光。
7. 超新星噴出物與爆發溫度降低 → 峰值帶暖色；開場標題下移並加陰影，避免壓在星核光暈上。
8. （第 2 輪精修）灰燼模式：亂流降低（0.6→0.34）讓旋臂成形；一般灰燼粒子調暗、7% 火星改為黃白高亮並閃爍；暗塵 splat 變大變濃形成煙狀暗帶；熔岩裂縫加上更細的白熱芯線 → 會 bloom；暖紅/酒紅星雲亮度 ×2；加上灰燼專屬暖色日冕光暈。
9. （第 2 輪）超新星：合成 pass 新增 `uNova` 色彩分級（以星核為中心：藍白核心 → 洋紅/琥珀交錯殼層），強度在爆發初期 ~2× 後衰減，並在爆發期改用保色相（hue-preserving）色調映射，最亮處也不會被 ACES 壓成純白；色散加強。
10. （第 2 輪）背景星雲：ridged 纖維尺度放大、對比降低；電漿模式青色改深藍 → 右上角雜亂青色細絲消失，星核周圍構圖更乾淨。HUD 文字再提亮（--mute .82、--faint .60、模式 .74）。開場加入以星核為焦點的景深，於 ~3.8s 內淡出。

