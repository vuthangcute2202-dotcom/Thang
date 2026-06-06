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

## Luu y ve du lieu

Source hien tai tu dong vao quyen Admin local khi khong co Firebase. Du lieu trong
che do nay khong dong bo giua cac may.

De nhieu nguoi dung chung du lieu, can tao Firebase project, bat Anonymous
Authentication va Firestore, sau do truyen Firebase config vao ung dung.
