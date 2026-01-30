[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/yDcMkOj1)
# Blog App Challenge 🚀

Selamat datang di Blog App Challenge! Challenge ini dirancang untuk mengasah kemampuanmu dalam membangun aplikasi web modern menggunakan **Next.js**.

## 📋 Deskripsi Challenge

Kamu diminta untuk membuat sebuah **Blog Application** yang lengkap dengan fitur-fitur berikut:

- Menampilkan daftar artikel blog
- Halaman detail artikel
- Design yang menarik dan responsif sesuai dengan Figma design yang diberikan
- Integrasi dengan backend API yang sudah disediakan

## 🎨 Design Reference

Design Figma yang harus kamu ikuti:
**https://www.figma.com/design/7Pm8MpV7weRk5VpJ2eRCV1/Blog-Project?node-id=21412-2502&t=arRBFFkF2VndyRLW-1**

⚠️ **Penting**: Pastikan design yang kamu buat sesuai dengan design di Figma. Perhatikan:
- Layout dan spacing
- Typography
- Colors
- Component structure
- Responsive design (mobile, tablet, desktop)

## 🔌 Backend API

Backend API sudah tersedia di:
**https://be-blg-production.up.railway.app/api**

### Endpoint yang Tersedia

Kamu perlu explore sendiri endpoint-endpoint yang tersedia. Gunakan tools seperti:
- Postman
- Browser DevTools Network tab
- curl command
- atau tools lainnya

Coba akses base URL untuk melihat dokumentasi atau struktur API yang tersedia.

### Tips untuk Explore API:
1. Coba akses `https://be-blg-production.up.railway.app/api` di browser
2. Cek Network tab di browser DevTools saat mengakses
3. Gunakan Postman untuk test berbagai endpoint
4. Perhatikan response format (JSON structure)

## 🛠️ Tech Stack

Project ini sudah menggunakan:
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**

Kamu bebas menambahkan library tambahan jika diperlukan, seperti:
- Axios atau fetch untuk API calls
- React Query untuk data fetching
- Form handling libraries
- UI component libraries (jika diperlukan)
- dll

## 📁 Struktur Project

```
blog-app-challenge-10/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout
│       ├── page.tsx         # Home page
│       └── globals.css      # Global styles
├── public/                  # Static assets
├── package.json
└── README.md
```

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

2. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

3. **Buka browser**
   ```
   http://localhost:3000
   ```

## 📝 Requirements & Checklist

### ✅ Minimum Requirements

- [ ] Homepage menampilkan daftar artikel blog
- [ ] Halaman detail artikel
- [ ] Design sesuai dengan Figma (layout, colors, typography)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Integrasi dengan backend API
- [ ] Loading states saat fetch data
- [ ] Error handling untuk API calls
- [ ] Clean code dan struktur folder yang rapi

### 🌟 Bonus Points

- [ ] Search functionality
- [ ] Filter/category untuk artikel
- [ ] Pagination
- [ ] Animations/transitions
- [ ] SEO optimization
- [ ] Performance optimization

## 💡 Tips & Best Practices

1. **Plan First**: Sebelum coding, buatlah plan terlebih dahulu:
   - Breakdown fitur-fitur yang perlu dibuat
   - Struktur folder dan components
   - Data flow dan state management

2. **Start Small**: Mulai dengan fitur dasar dulu, baru tambahkan fitur-fitur lainnya

3. **Component Reusability**: Buatlah components yang reusable untuk menghindari code duplication

4. **Type Safety**: Manfaatkan TypeScript untuk type safety, terutama untuk API responses

5. **Error Handling**: Jangan lupa handle error cases (network error, empty data, dll)

6. **Loading States**: Tampilkan loading indicator saat fetch data

7. **Responsive Design**: Test di berbagai ukuran screen (mobile, tablet, desktop)

8. **Code Organization**: 
   - Pisahkan components, utils, types, dll ke folder yang sesuai
   - Gunakan naming convention yang konsisten

## 📚 Resources

### Next.js Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Routing](https://nextjs.org/docs/app/building-your-application/routing)

### React Documentation
- [React Docs](https://react.dev)

### Tailwind CSS
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🎯 Submission

Setelah selesai, pastikan:
1. Code sudah clean dan well-organized
2. Semua fitur berfungsi dengan baik
3. Design sesuai dengan Figma
4. Responsive di berbagai device
5. Tidak ada console errors

## ❓ Questions?

Jika ada pertanyaan atau stuck di suatu bagian, jangan ragu untuk bertanya! 

Selamat coding! - Mentor Henry Rivardo
