# Việc Nhẹ Lương Cao (bản chạy offline)

Game xuất từ Google Playground, đã thêm bộ build Vite + React + TypeScript + Tailwind để chạy độc lập.

## Chơi bản đã build (thư mục `dist` / file play zip)
- Windows: giải nén, bấm đúp `CHAY_GAME.bat` (cần Python), hoặc mở cmd trong thư mục rồi chạy
  `python -m http.server 8000` và vào http://localhost:8000
- Không mở trực tiếp `index.html` bằng file:// (trình duyệt sẽ chặn tải ảnh/nhạc).

## Sửa code
```
npm install
npm run dev      # chạy thử, tự reload khi sửa code (http://localhost:5173)
npm run build    # đóng gói ra thư mục dist/
```

## Ghi chú kỹ thuật
- `index.html` đặt `window.__PLAYGROUND_PREVIEW__ = true` để dùng Fake Playground SDK (utils/playground-fake.ts) thay vì tải SDK từ máy chủ Google.
- Ảnh/nhạc nằm trong `assets/`, được copy nguyên vào `dist/assets` khi build (xem vite.config.ts).
- Màn "Kho Phế Liệu" (khều đồ bằng cần tre) nằm ở `JunkStorageScene.tsx`.
