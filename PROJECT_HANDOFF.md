# Project Handoff

## Project

Dashboard kinh doanh React/Vite, giao dien Tailwind, bieu do Recharts.

## Current Features

- Doc file Excel ke hoach, thuc te va ton kho ngay tren trinh duyet.
- Dashboard tai chinh theo nhom, thang, quy va nam.
- Quan tri cong viec/du an.
- Quan tri chuong trinh ban hang theo tung nhom.
- Chuong trinh ban hang:
  - Chon ky ap dung: thang, quy hoac toan nam.
  - Chon nhieu mat hang tu file Excel da upload.
  - Nhap ke hoach doanh thu chua VAT, doanh so va so luong theo mat hang.
  - Tu dong tinh thuc te theo nhom, mat hang va ky ap dung.
  - Bieu do so sanh ke hoach/thuc te va bang chi tiet.
  - Theo doi trang thai trien khai va muc do hoan thanh cong viec.
- Phan quyen nguoi dung va quyen quan ly chuong trinh ban hang.

## Important Files

- `dashboard_kinh_doanh (14).tsx`: Toan bo logic va giao dien chinh.
- `src/main.jsx`: Diem khoi dong React.
- `vite.config.js`: Cau hinh Vite.
- `vercel.json`: Cau hinh deploy Vercel.
- `README.md`: Huong dan chay va deploy.

## Run Locally

```bash
npm install
npm run dev
```

Mo `http://localhost:5173`.

## Verify

```bash
npm run build
```

## Git State

- Branch: `main`
- Initial commit: `35a287c`
- Sales period filter commit: `7801ebd`

## Cross-device Continuation

1. Push repository nay len GitHub.
2. Tren may khac, clone repository.
3. Cai Node.js 20+.
4. Chay `npm install`.
5. Mo thu muc repo trong Codex va bat dau thread moi.
6. Yeu cau Codex doc `PROJECT_HANDOFF.md` truoc khi tiep tuc.

## Firebase Integration

- Source da ho tro Firebase qua cac bien `VITE_FIREBASE_*` trong `.env`.
- Da co `.env.example`, `firebase.json` va `firestore.rules`.
- Firebase project da ket noi: `thang-dashboard-2202`.
- Web App, Anonymous Authentication va Firestore Database tai `asia-southeast1` da hoat dong.
- Firestore rules da deploy va da xac minh ghi/doc/xoa bang tai khoan an danh.
- Firebase Hosting da deploy: `https://thang-dashboard-2202.web.app`.
- Cau hinh local nam trong `.env.local` va khong duoc commit.
- Khong co `.env` thi du lieu chi ton tai trong phien trinh duyet va khong dong bo giua nguoi dung.
- Co che tai khoan hien tai luu mat khau trong Firestore, chua phu hop cho du lieu production nhay cam.
- Repository GitHub: `https://github.com/vuthangcute2202-dotcom/Thang`.
