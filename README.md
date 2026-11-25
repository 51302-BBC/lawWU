# 事務所請假系統（前端）

會計事務所內部系統的請假模組，包含：登入、員工總覽、申請請假、我的紀錄、行事曆，以及主管的待審核和團隊概況。
目前資料是示範資料，存在瀏覽器 localStorage；API 函式的形狀（`frontend/src/api/leaveApi.ts`）就是之後 FastAPI 要提供的介面。

- 設計文件：`docs/superpowers/specs/2026-11-25-leave-frontend-design.md`
- 實作計畫：`docs/superpowers/plans/2026-11-25-leave-frontend.md`
- 示範帳號：`frontend/src/mock/README.md`（密碼都是 `demo1234`）

## 用 Docker 執行（建議）

```powershell
docker compose up --build -d
```

打開 http://localhost:8080 。

## 本機開發

⚠️ 專案路徑含中文（「會計」），Vite / esbuild 的原生程式在 Windows 上遇到非英文路徑會直接當掉。
請先把專案掛到一個英文磁碟代號，再從那裡執行（重開機後要再掛一次）：

```powershell
subst K: "C:\Users\Hikana\Desktop\會計project"
```

```powershell
Set-Location K:\frontend; npm install; npm run dev
```

測試：

```powershell
Set-Location K:\frontend; npm test
```

或者把整個資料夾改成英文名稱，就不需要 `subst`。

## 結構

```
frontend/src/
  domain/    時數計算、簽核路徑、撤銷與驗證規則（純函式，有測試）
  api/       leaveApi / authApi：目前用 localStorage 假資料
  mock/      員工、假別、國定假日、示範假單
  ui/        共用元件（Button、Sheet、Journey 簽核路徑…）
  app/       路由、登入狀態、側欄外框
  features/  auth、employee（總覽/申請/紀錄/行事曆）、manager（待審核/團隊）
```

## 規則摘要

- 以小時計，最小 0.5 小時；上班 09:00–18:00，午休不計；週末、國定假日不計。
- 3 天（24 小時）以內直屬主管核准即生效；超過 3 天再送上一層。
- 職務代理人必選，只通知不需同意；代理人同時請假會提醒。
- 5 月報稅季只提醒不擋。
- 審核中可直接撤回；已核准且未開始可申請撤銷（需主管確認）；已開始不可撤銷。
