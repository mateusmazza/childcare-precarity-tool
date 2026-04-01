import { initializeApp } from 'firebase/app'
import { getFirestore }  from 'firebase/firestore'
import { getAuth }       from 'firebase/auth'

// Firebase web config is intentionally public — security is enforced by
// Firestore security rules, not by hiding this config. See:
// https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey:            'AIzaSyDTZ0WmhlWw9I52vSJ1XRo9zNByT0VlNXg',
  authDomain:        'caremometer-45e0b.firebaseapp.com',
  projectId:         'caremometer-45e0b',
  storageBucket:     'caremometer-45e0b.firebasestorage.app',
  messagingSenderId: '64014723350',
  appId:             '1:64014723350:web:af8d69f55a4f58395e0837',
  measurementId:     'G-93310XZ65J',
}

const app = initializeApp(firebaseConfig)

export const db   = getFirestore(app)
export const auth = getAuth(app)
