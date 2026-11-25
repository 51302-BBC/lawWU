# 請假模組前端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 可互動的請假前端（登入、員工申請/撤銷/紀錄/行事曆、主管審核/團隊概況），Apple 風格，Docker 包裝。

**Architecture:** Vite + React SPA。`domain/` 放純函式規則（時數、簽核路徑、撤銷、衝突），全部有單元測試；`api/` 提供與未來 FastAPI 同形狀的 async 函式，目前以 localStorage 假資料實作；`features/` 為畫面。

**Tech Stack:** React 18、TypeScript、Vite、React Router 6、Vitest + Testing Library、純 CSS（CSS variables + CSS modules）、nginx:alpine Docker。不引入 UI 套件與日期套件（日期用原生 Date + 自寫 helper）。

**Spec:** `docs/superpowers/specs/2026-11-25-leave-frontend-design.md`

## Global Constraints

- 時數以小時計，最小單位 0.5 小時，一日 8 小時；上班 09:00–18:00，12:00–13:00 不計；週六日與國定假日不計。
- 簽核：申請時數 ≤ 24 → 直屬主管一關；> 24 → 直屬主管 + 其上一層。
- 代理人必選、不可選自己，只通知不審核。
- 忙季（報稅季 5/1–5/31）送單只提醒不擋。
- 撤銷：pending → 員工直接撤回；approved 且未開始 → 送撤銷申請給主管；開始時間已過 → 不可撤銷。
- 主管 = 員工 + 「待審核」「團隊概況」兩頁；無身分切換。
- 登入為假驗證，示範密碼 `demo1234`，記於 `frontend/src/mock/README.md`，登入頁可一鍵填入示範帳號。
- 介面文字一律繁體中文，口語化。淺色/深色跟隨系統；支援 `prefers-reduced-motion`。
- 不是 git repo：跳過 commit 步驟（使用者要求時才 `git init`）。

## Review Focus

1. 跨週末 / 國定假日的多日假：時數只算工作日 → Task 2 `calcLeaveHours` 測試。
2. 結束早於或等於開始、或區間全在假日 → 時數 0，送出按鈕停用並提示 → Task 2 + Task 6。
3. 申請時數超過剩餘（有上限假別）→ 擋送出並顯示剩餘；公假無上限 → Task 3 `validateRequest` 測試。
4. 經理（直屬主管是老闆）請 > 3 天：路徑只有老闆一關，不可出現 null 審核者 → Task 3 測試。
5. 主管不可審核自己的假單；同一張單被核准後不可重複核准 → Task 3 `applyDecision` 測試。

---

### Task 1: 專案骨架 + Docker

**Files:**
- Create: `frontend/` (Vite react-ts template)、`frontend/vitest.config.ts`、`frontend/src/test/setup.ts`
- Create: `frontend/Dockerfile`、`frontend/nginx.conf`、`docker-compose.yml`、`.dockerignore`、`README.md`

- [ ] **Step 1:** `npm create vite@latest frontend -- --template react-ts`，加入 `react-router-dom`、`vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom`；`package.json` scripts 加 `"test": "vitest run"`。
- [ ] **Step 2:** Dockerfile：`node:22-alpine` build → `nginx:alpine` 提供 `dist`；`nginx.conf` 對 SPA 做 `try_files $uri /index.html`。compose 服務名 `frontend`，對外 `8080:80`。
- [ ] **Step 3:** 驗證：`npm run build` 成功、`npm test` 可執行（0 個測試也算通過，`--passWithNoTests`）。

### Task 2: 型別與時數計算

**Files:**
- Create: `frontend/src/domain/types.ts`、`frontend/src/domain/hours.ts`、`frontend/src/domain/hours.test.ts`

**Interfaces — Produces:**
```ts
type LeaveTypeId = 'annual'|'personal'|'sick'|'menstrual'|'marriage'|'funeral'|'official'|'family_care'|'maternity'|'paternity'
type LeaveStatus = 'pending'|'approved'|'rejected'|'withdrawn'|'cancel_pending'|'cancelled'
type Role = 'staff'|'supervisor'|'manager'|'owner'
interface Employee { id: string; name: string; title: string; teamId: string; managerId: string|null; role: Role; avatarColor: string }
interface LeaveType { id: LeaveTypeId; name: string; paid: string; capHours: number|null; needsProof: boolean; note: string }
interface ApprovalStep { approverId: string; status: 'waiting'|'approved'|'rejected'; decidedAt?: string; note?: string }
interface LeaveRequest { id: string; employeeId: string; typeId: LeaveTypeId; start: string; end: string; hours: number; deputyId: string; reason: string; status: LeaveStatus; steps: ApprovalStep[]; createdAt: string; cancelSteps?: ApprovalStep[] }
interface Balance { typeId: LeaveTypeId; grantedHours: number|null; usedHours: number; pendingHours: number }
// 時間字串格式一律本地時間 'YYYY-MM-DDTHH:mm'
function calcLeaveHours(start: string, end: string, holidays: Set<string>): number
```

- [ ] **Step 1: 寫失敗測試** `hours.test.ts`：
  - `calcLeaveHours('2026-12-01T09:00','2026-12-01T18:00', ∅) === 8`
  - `'2026-12-01T09:00'..'2026-12-01T12:00' === 3`；`'…T13:00'..'…T18:00' === 5`；`'…T11:00'..'…T14:00' === 2`（跨午休）
  - 週五 09:00 → 下週一 18:00（2026-12-04 → 2026-12-07）`=== 16`
  - 區間含國定假日 `holidays={'2026-12-25'}`：12-24 09:00 → 12-28 18:00 `=== 16`（24、28；25 假日，26/27 週末）
  - `end <= start` → `0`；全在週末 → `0`
  - `'…T09:00'..'…T09:20'` → `0.5`（不足 0.5 無條件進位到 0.5）
- [ ] **Step 2:** `npm test -- hours` → FAIL（function not defined）。
- [ ] **Step 3:** 實作：逐日迭代，每個工作日取 [09:00,12:00]∪[13:00,18:00] 與請假區間交集分鐘數，總和 /60 後向上取到 0.5。
- [ ] **Step 4:** `npm test -- hours` → PASS。

### Task 3: 簽核、撤銷、驗證規則

**Files:**
- Create: `frontend/src/domain/rules.ts`、`frontend/src/domain/rules.test.ts`

**Interfaces — Consumes:** Task 2 型別。**Produces:**
```ts
function buildApprovalRoute(applicant: Employee, hours: number, employees: Employee[]): ApprovalStep[]
function canWithdraw(req: LeaveRequest): boolean                     // status==='pending'
function canRequestCancel(req: LeaveRequest, now: Date): boolean      // approved && start > now
function findDeputyConflicts(deputyId: string, start: string, end: string, requests: LeaveRequest[]): LeaveRequest[] // 代理人 pending/approved 且時間重疊
function busySeasonOverlap(start: string, end: string): { name: string; range: string } | null  // 5/1–5/31
function validateRequest(input: { typeId: LeaveTypeId; start: string; end: string; deputyId: string; applicantId: string; hours: number }, balance: Balance): string[] // 錯誤訊息陣列，空=可送出
function currentApproverId(req: LeaveRequest): string | null          // 第一個 waiting 的 step（含 cancelSteps）
function applyDecision(req: LeaveRequest, approverId: string, decision: 'approve'|'reject', note: string|undefined, now: Date): LeaveRequest // 不合法時 throw Error
```

- [ ] **Step 1: 寫失敗測試**（使用測試內建小型 employees：staff s1 → supervisor m1 → manager g1 → owner o1）：
  - `buildApprovalRoute(s1, 24, …)` → 1 step approver `m1`；`(s1, 24.5)` → `[m1, g1]`
  - `buildApprovalRoute(g1, 40, …)` → `[o1]`（上一層不存在時不產生 null step）
  - `canRequestCancel` approved 且 start 在 now 之後 → true；start 已過 → false
  - `findDeputyConflicts` 重疊 approved → 回傳 1 筆；rejected/withdrawn → 0 筆
  - `busySeasonOverlap('2027-05-10T09:00','2027-05-10T18:00')` 非 null；12 月 → null
  - `validateRequest`：hours 0 → 含「請選擇有效的時間」；deputyId===applicantId → 含「代理人不能是自己」；hours > granted−used−pending（granted 非 null）→ 含「剩餘時數不足」；official（granted null）不檢查餘額
  - `applyDecision`：非 currentApprover → throw；第一關核准且還有第二關 → status 仍 pending；最後一關核准 → approved；任一關 reject → rejected；`cancel_pending` 最後核准 → cancelled，reject → 回到 approved
- [ ] **Step 2:** `npm test -- rules` → FAIL。
- [ ] **Step 3:** 實作 `rules.ts`。
- [ ] **Step 4:** `npm test` → 全 PASS。

### Task 4: 假資料與 API 層（含登入）

**Files:**
- Create: `frontend/src/mock/seed.ts`、`frontend/src/mock/README.md`、`frontend/src/api/store.ts`、`frontend/src/api/leaveApi.ts`、`frontend/src/api/authApi.ts`、`frontend/src/api/leaveApi.test.ts`

**seed 內容：** 老闆 1、經理 1、主管 2（審計組、記帳組）、員工各 5 → 共 14 人，員工編號 `A001` 起；10 種假別（名稱/給薪/上限依 spec §4，日數×8）；2026–2027 國定假日；每人餘額；約 12 張分布各狀態的假單（含一張等經理第二關、一張 cancel_pending、一張代理人衝突情境）。

**Interfaces — Produces:**
```ts
// authApi
login(employeeNo: string, password: string): Promise<Employee>      // 錯誤 throw Error('帳號或密碼不正確')
logout(): Promise<void>; getSession(): Employee | null
// leaveApi（皆 async，模擬 250ms 延遲）
listLeaveTypes(): Promise<LeaveType[]>
listEmployees(): Promise<Employee[]>
getHolidays(): Promise<{ date: string; name: string }[]>
getBalances(employeeId: string): Promise<Balance[]>
listMyRequests(employeeId: string): Promise<LeaveRequest[]>
listTeamApproved(from: string, to: string): Promise<LeaveRequest[]> // 全公司 approved，給行事曆
submitRequest(input: { employeeId; typeId; start; end; deputyId; reason }): Promise<LeaveRequest> // 內部呼叫 calcLeaveHours/validateRequest/buildApprovalRoute
withdrawRequest(id: string, employeeId: string): Promise<LeaveRequest>
requestCancel(id: string, employeeId: string): Promise<LeaveRequest>
listPendingFor(approverId: string): Promise<LeaveRequest[]>
decide(id: string, approverId: string, decision: 'approve'|'reject', note?: string): Promise<LeaveRequest>
listSubordinates(managerId: string): Promise<Employee[]>             // 直屬 + 間接
resetDemoData(): void
```
`store.ts` 以 localStorage key `leave-demo-v1` 保存整份狀態；首次讀取用 seed。

- [ ] **Step 1: 寫失敗測試**：`login('A001','demo1234')` 成功、錯密碼 reject；`submitRequest` 後 `listPendingFor(主管)` 包含該單且 hours 正確；`decide` 核准後 `getBalances` 的 usedHours 增加；`withdrawRequest` 後 pendingHours 歸還；`resetDemoData` 還原。
- [ ] **Step 2:** FAIL → **Step 3:** 實作 → **Step 4:** PASS。

### Task 5: 設計基礎、外框、登入頁

先載入 `impeccable` 與 `frontend-design` skill 定視覺細節，再實作。

**Files:**
- Create: `frontend/src/ui/tokens.css`（色彩、字體、圓角、陰影、動畫曲線；`@media (prefers-color-scheme: dark)`、`prefers-reduced-motion`）
- Create: `frontend/src/ui/` 共用元件：`Button`、`Card`、`Sheet`（底部滑出、Esc/背景關閉、focus trap）、`SegmentedControl`、`StatusPill`、`ProgressTracker`、`Ring`、`Avatar`、`Toast`
- Create: `frontend/src/app/App.tsx`（Router + `RequireAuth`）、`frontend/src/app/Shell.tsx`（桌機側欄 / 手機底部 Tab、頭像選單、主管才出現的「待審核」(徽章) 與「團隊概況」）
- Create: `frontend/src/features/auth/LoginPage.tsx`（置中單欄、大標題、錯誤時搖晃、示範帳號抽屜一鍵填入）
- Test: `frontend/src/app/Shell.test.tsx`

路由：`/login`、`/`（總覽）、`/apply`（以 sheet 開在總覽上）、`/records`、`/calendar`、`/approvals`、`/team`。非主管進 `/approvals` → 導回 `/`。

- [ ] **Step 1: 測試**：未登入進 `/` 導向 `/login`；staff 登入後導覽不含「待審核」；supervisor 登入後含「待審核」與數字徽章。
- [ ] **Step 2:** FAIL → **Step 3:** 實作 → **Step 4:** PASS，`npm run dev` 目視登入流程、深色模式。

### Task 6: 員工總覽 + 申請請假

**Files:**
- Create: `frontend/src/features/employee/DashboardPage.tsx`、`BalanceGrid.tsx`、`ActiveRequests.tsx`、`ApplySheet.tsx`、`ApplySheet.test.tsx`

ApplySheet 步驟同一頁由上而下：假別卡片（顯示剩餘）→ 時段（全天 / 上午 / 下午 / 自訂，多日用起訖日期）→ 即時時數與「申請後剩餘」→ 代理人（同組優先，衝突者標「這段時間也請假」）→ 事由 → 簽核路徑預覽（「送出後，林主管會收到通知；超過 3 天會再送王經理」）→ 送出。提示：忙季（橘色 inline）、需證明假別（附件欄位僅 UI）。成功後 sheet 關閉 + Toast + 總覽進行中卡片出現。

- [ ] **Step 1: 測試**：選事假 + 全天一天 → 顯示「8 小時」；選自己以外代理人 → 送出可按；時數超過剩餘 → 送出停用並顯示「剩餘時數不足」；選 5 月日期 → 出現忙季提示但送出仍可按。
- [ ] **Step 2:** FAIL → **Step 3:** 實作 → **Step 4:** PASS。

### Task 7: 我的紀錄 + 行事曆

**Files:**
- Create: `frontend/src/features/employee/RecordsPage.tsx`、`RequestDetail.tsx`、`CalendarPage.tsx`、`RecordsPage.test.tsx`

紀錄：SegmentedControl（全部/審核中/已核准/已退回/已撤銷），點開 Sheet 看時間軸 ProgressTracker；按鈕依 `canWithdraw`/`canRequestCancel` 顯示「撤回申請」/「申請撤銷」，確認對話框後執行。行事曆：月格，國定假日紅字、忙季淡橘底、自己的假藍點、同事已核准請假列於日格（點日期看清單）。

- [ ] **Step 1: 測試**：pending 單顯示「撤回申請」，撤回後狀態變「已撤回」；已開始的 approved 單不顯示撤銷按鈕。
- [ ] **Step 2:** FAIL → **Step 3:** 實作 → **Step 4:** PASS。

### Task 8: 主管待審核 + 團隊概況

**Files:**
- Create: `frontend/src/features/manager/ApprovalsPage.tsx`、`ApprovalCard.tsx`、`TeamPage.tsx`、`ApprovalsPage.test.tsx`

ApprovalCard：請假人、假別、日期、時數、代理人、第幾關（「第 2 關，共 2 關」）、同組同期請假衝突提示；核准（直接）/ 退回（需填原因的 sheet）；撤銷申請卡片標「撤銷申請」。處理後卡片淡出、徽章數減少。TeamPage：本週誰請假（橫向時間條）、部屬剩餘特休與事病假一覽。

- [ ] **Step 1: 測試**：主管看到自己是 currentApprover 的單；核准一關單後從清單消失；退回未填原因時確認鈕停用。
- [ ] **Step 2:** FAIL → **Step 3:** 實作 → **Step 4:** PASS。

### Task 9: 收尾驗證

- [ ] **Step 1:** `npm test` 全 PASS、`npm run build` 無 TS 錯誤。
- [ ] **Step 2:** `docker compose up --build -d` → `http://localhost:8080` 可開，SPA 深層路由重新整理不 404。
- [ ] **Step 3:** 瀏覽器走一遍：員工登入 → 申請 4 天特休 → 登出 → 主管登入核准 → 經理登入核准 → 員工看到「已核准」與餘額扣除；手機寬度與深色模式截圖確認。
- [ ] **Step 4:** 交給 impeccable-finish-reviewer 式的自我檢查（對照 spec §7 視覺方向），修正明顯問題。
