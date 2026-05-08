# Web-UI Deploy Guide

Phần này là project duy nhất bạn cần deploy lên Vercel.

Không deploy các thư mục sau lên Vercel:

- `AI/`
- `models/`
- `snapshots/`
- `clips/`
- `events.db`

## Cấu trúc đúng khi deploy

Nếu bạn dùng monorepo `WarehouseSupervisor`, trong Vercel hãy chọn:

- `Root Directory` = `Web-UI`

Nếu bạn tạo repo riêng cho frontend, chỉ cần đẩy đúng nội dung thư mục `Web-UI`.

## Environment variables

Tham khảo các file:

- `.env.example`
- `.env.vercel.production.example`
- `.env.vercel.preview.example`

Các biến quan trọng:

```env
AI_SERVER_URL=https://api.your-domain.com
NEXT_PUBLIC_BACKEND_HTTP=https://api.your-domain.com
NEXT_PUBLIC_BACKEND_WS=wss://api.your-domain.com/ws/events
NEXT_PUBLIC_MEDIA_MTX_WEBRTC_BASE=https://media.your-domain.com:8889
```

## Vercel settings

Framework:

- `Next.js`

Build settings:

- Install Command: `npm install`
- Build Command: `npm run build`
- Dev Command: `npm run dev`

`vercel.json` đã được thêm sẵn để dùng các lệnh trên.

## Các bước nhanh

1. Đẩy repo lên GitHub
2. Import project vào Vercel
3. Chọn `Root Directory = Web-UI`
4. Thêm environment variables theo file mẫu
5. Deploy

## Backend yêu cầu

Frontend trên Vercel chỉ chạy được nếu backend AI public ra ngoài internet hoặc qua tunnel/domain riêng.

Ví dụ:

- `https://api.your-domain.com` -> FastAPI AI
- `https://media.your-domain.com:8889` -> MediaMTX WebRTC

Backend cũng cần bật CORS cho domain frontend:

```env
CORS_ALLOW_ORIGINS=https://your-project.vercel.app,https://your-domain.com
```
