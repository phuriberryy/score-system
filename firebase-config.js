// Firebase Configuration
// ⚠️ ต้อง Setup Firebase Project ก่อน! ดูคำแนะนำในไฟล์ FIREBASE_SETUP.md
// 
// หลังจาก setup Firebase แล้ว ให้แทนที่ config ด้านล่างด้วย config จาก Firebase Console

const firebaseConfig = {
    apiKey: "AIzaSyCvAXSjCMOFT2anmd-dqkuIK9Y0azB3BQA",
    authDomain: "score-system-sync.firebaseapp.com",
    databaseURL: "https://score-system-sync-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "score-system-sync",
    storageBucket: "score-system-sync.appspot.com",
    messagingSenderId: "473799846032",
    appId: "1:473799846032:web:bfe9eb10d4970d85bad015",
    measurementId: "G-K57VQV2C8Z"
};

// Initialize Firebase (จะทำงานถ้า config ถูกต้อง)
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
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

