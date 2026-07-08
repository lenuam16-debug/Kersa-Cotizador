import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCEhpmP-6DpIuf0WZ_hv7MI73gJUPncjtk',
  authDomain: 'kersa-cotizador.firebaseapp.com',
  projectId: 'kersa-cotizador',
  storageBucket: 'kersa-cotizador.firebasestorage.app',
  messagingSenderId: '772840477897',
  appId: '1:772840477897:web:32dc21c6ecb03601ffe918',
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
auth.languageCode = 'es'
