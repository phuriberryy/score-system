// Firebase Configuration
// ⚠️ ต้อง Setup Firebase Project ก่อน! ดูคำแนะนำในไฟล์ FIREBASE_SETUP.md
// 
// หลังจาก setup Firebase แล้ว ให้แทนที่ config ด้านล่างด้วย config จาก Firebase Console

const firebaseConfig = {
    // ⚠️ แก้ไข config นี้ด้วยข้อมูลจาก Firebase Console
    // ดูวิธี setup ในไฟล์ FIREBASE_SETUP.md
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (จะทำงานถ้า config ถูกต้อง)
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        window.database = firebase.database();
        console.log('✅ Firebase initialized successfully!');
    } else {
        console.warn('⚠️ Firebase not configured. Please setup Firebase project. See FIREBASE_SETUP.md');
        // Create dummy database object to prevent errors
        window.database = null;
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    window.database = null;
}

