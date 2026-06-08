# Dashboard Kinh Doanh

## Chay local

Yeu cau Node.js 20 tro len.

```bash
npm install
npm run dev
```

Mo `http://localhost:5173`.

## Build production

```bash
npm install
npm run build
```

Thu muc ket qua: `dist`.

## Deploy Vercel

1. Tai source len GitHub hoac import truc tiep vao Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.

File `vercel.json` da khai bao san cac gia tri tren.

## Deploy Netlify

1. Build command: `npm run build`.
2. Publish directory: `dist`.

## Deploy Firebase Hosting

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Cau hinh Firebase

1. Tao Firebase project va Web App.
2. Bat `Authentication > Sign-in method > Anonymous`.
3. Tao Firestore Database.
4. Sao chep `.env.example` thanh `.env`.
5. Dien cac gia tri `VITE_FIREBASE_*` tu Firebase Web App config.
6. Deploy Firestore rules:

```bash
npx firebase-tools login
npx firebase-tools use YOUR_FIREBASE_PROJECT_ID
npx firebase-tools deploy --only firestore:rules
```

Khi khong co `.env`, ung dung tu dong chay Admin local va khong dong bo du lieu.

Luu y: co che tai khoan ung dung hien tai luu mat khau trong Firestore. Can
chuyen sang Firebase Authentication truoc khi su dung voi du lieu nhay cam.
