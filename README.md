# Personal Task Manager API

RESTful API สำหรับจัดการงานส่วนตัว เขียนด้วย TypeScript ใช้ Express, PostgreSQL, Prisma 7 และ JWT ผู้ใช้สมัครสมาชิก เข้าสู่ระบบ และจัดการงานของตนเองได้

## เริ่มใช้งาน

ต้องมี Node.js 22 ขึ้นไป, pnpm และ PostgreSQL เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วติดตั้ง Dependencies:

```powershell
pnpm install
```

คัดลอก `.env.example` เป็น `.env` แล้วตั้งค่า `DATABASE_URL` ให้ตรงกับฐานข้อมูล PostgreSQL ที่สร้างไว้ และกำหนด `JWT_SECRET` จากนั้นรัน:

```powershell
pnpm db:deploy
pnpm db:generate
pnpm dev
```

API ใช้ `http://localhost:3000` เป็นค่าเริ่มต้น เปลี่ยนพอร์ตได้ด้วย `PORT` ใน `.env` หยุด Server ด้วย Ctrl+C

## คำสั่งหลัก

| คำสั่ง | หน้าที่ |
|---|---|
| pnpm dev | เปิดระบบและโหลดใหม่เมื่อแก้ TypeScript |
| pnpm start | เปิดระบบด้วย TypeScript |
| pnpm typecheck | ตรวจ TypeScript แบบ strict |
| pnpm test | ทดสอบ API กับ PostgreSQL จริง |
| pnpm db:migrate --name ชื่อการเปลี่ยนแปลง | สร้างและใช้ Migration ระหว่างพัฒนา |
| pnpm db:deploy | ใช้ Migration ที่มีอยู่กับฐานข้อมูลปลายทาง |
| pnpm db:generate | สร้าง Prisma Client |
| pnpm db:studio | เปิดดูข้อมูลด้วย Prisma Studio |

## โครงสร้าง

```text
src/
  app.ts                 ประกอบ Router และ Middleware
  server.ts              เริ่ม Server
  @types/express.d.ts     เพิ่ม Type ให้ Request
  config/env.ts          ตรวจ Environment Variables
  routes/                จับคู่ Method กับ URL
  controllers/           ตรวจ Request และตอบ Response
  services/              จัดการข้อมูลและ Query ฐานข้อมูล
  schemas/               Zod Validation และ Input Types
  middlewares/           Authentication, ID Validation และ Error Handling
  utils/                 AppError, Password Hash และ JWT
  lib/prisma.ts          Prisma Client กลาง
prisma/
  schema.prisma          Model User, Task และ TaskStatus
  migrations/            SQL Migration
test/api.test.ts         ชุดทดสอบ
postman/                 Collection สำหรับทดสอบ API
```

Prisma 7 ใช้ `prisma.config.ts` สำหรับ CLI และ `@prisma/adapter-pg` สำหรับเชื่อมต่อจาก Client ใช้ Import `.ts` และรันด้วย `tsx`

## API

| Method | Path | สำเร็จ |
|---|---|---|
| POST | /auth/register | 201 + User ไม่มี Password หรือ Token |
| POST | /auth/login | 200 + accessToken, tokenType |
| GET | /auth/me | 200 + User ไม่มี Password |
| POST | /tasks | 201 + Task |
| GET | /tasks | 200 + Array เรียงใหม่ก่อนเก่า |
| GET | /tasks/:id | 200 + Task |
| PATCH | /tasks/:id | 200 + Task ที่แก้ไขแล้ว |
| DELETE | /tasks/:id | 204 ไม่มี Body |

นอกจาก Register/Login ทุก Endpoint ต้องใช้ `Authorization: Bearer <token>` ลำดับตรวจคือ Token → Task ID → Body → ข้อมูลใน DB Task ของคนอื่นตอบ 404 เหมือน Task ที่ไม่มี และทุก Query จำกัดเจ้าของจาก JWT

## ทดสอบ API

Import `postman/Final-Task-Manager.postman_collection.json` แล้วเรียกตามลำดับ Register Alice/Bob → Login → สร้าง/อ่าน/แก้ Task → ตรวจสิทธิ์ข้ามเจ้าของ → ลบ Collection เก็บ Token และ taskId ให้อัตโนมัติ เปลี่ยน aliceEmail/bobEmail เมื่อเริ่มรอบสมัครใหม่ ไม่เช่นนั้นจะได้ 409 เนื่องจาก Email ซ้ำ

รันชุดทดสอบอัตโนมัติและตรวจชนิดข้อมูล:

```powershell
pnpm typecheck
pnpm test
```

ชุดทดสอบใช้ PostgreSQL ตาม `.env` สร้างบัญชีเฉพาะแต่ละรอบและลบข้อมูลของรอบนั้นเมื่อจบ ไม่ล้างข้อมูลของผู้ใช้อื่น

ไม่ Commit `.env` หรือ `node_modules` ใช้ `.env.example` สำหรับแสดงรูปแบบค่าตั้งต้น
