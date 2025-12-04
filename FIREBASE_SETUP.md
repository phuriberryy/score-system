# 🔥 วิธี Setup Firebase สำหรับ Real-time Sync

## ขั้นตอนการ Setup (ใช้เวลา 5 นาที)

### 1. สร้าง Firebase Project

1. ไปที่ https://console.firebase.google.com/
2. คลิก **"Add project"** หรือ **"สร้างโปรเจ็กต์"**
3. ตั้งชื่อโปรเจ็กต์: `score-system-sync` (หรือชื่ออื่น)
4. คลิก **Continue** → **Continue** → **Create project**

### 2. สร้าง Realtime Database

1. ใน Firebase Console คลิก **Realtime Database** (ด้านซ้าย)
2. คลิก **Create Database**
3. เลือก **Asia Pacific (asia-southeast1)** หรือ location ที่ใกล้ที่สุด
4. เลือก **Start in test mode** (สำหรับการใช้งานแบบ public)
5. คลิก **Enable**

### 3. ตั้งค่า Database Rules (สำคัญ!)

1. ไปที่แท็บ **Rules**
2. แก้ไข rules เป็น:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. คลิก **Publish**

⚠️ **หมายเหตุ**: Rules นี้เปิดให้ทุกคนอ่าน/เขียนได้ (เหมาะสำหรับการใช้งานภายใน)

### 4. ดู Database URL

1. ในหน้า Realtime Database คลิกแท็บ **Data**
2. คัดลอก **Database URL** (จะเหมือน: `https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app`)

### 5. ดู Web App Config

1. คลิกไอคอน ⚙️ (Settings) → **Project settings**
2. เลื่อนลงไปที่ **Your apps** → คลิกไอคอน **</>** (Web)
3. ตั้งชื่อ app: `Score System`
4. คลิก **Register app**
5. คัดลอก **Firebase SDK snippet** → เลือก **Config**

### 6. แก้ไขไฟล์ firebase-config.js

เปิดไฟล์ `firebase-config.js` และแทนที่ด้วย config ที่คัดลอกมา:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...", // จาก Firebase Console
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app", // Database URL
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
```

### 7. ทดสอบ

1. เปิดเว็บไซต์ใน 2 browser หรือ 2 devices
2. กรอกข้อมูลใน browser แรก
3. ดู browser ที่สอง - ข้อมูลควร sync อัตโนมัติ! ✨

## ✅ เสร็จแล้ว!

ตอนนี้ผู้คุม 4 คนสามารถเปิดลิงก์เดียวกันและข้อมูลจะ sync แบบ real-time อัตโนมัติ!

## 🔒 ความปลอดภัย (ถ้าต้องการ)

ถ้าต้องการความปลอดภัยมากขึ้น สามารถตั้งค่า Rules แบบมี authentication:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

แต่ต้องเพิ่ม Firebase Authentication ด้วย

