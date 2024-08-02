'use client'
import { useState, useEffect } from 'react'
import { auth, firestore } from '@/firebase'
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import LoginForm from './components/LoginForm'
import Dashboard from './components/dashboard'
import EditInventory from './components/editinventory'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState(null)
  const [inventoryData, setInventoryData] = useState([])
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('/')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await fetchInventoryData()
        setCurrentPath('/dashboard') // Set the default route to /dashboard
      } else {
        setUser(null)
        setCurrentPath('/') // Redirect to login page if not authenticated
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchInventoryData = async () => {
    const querySnapshot = await getDocs(collection(firestore, 'inventory'))
    const data = querySnapshot.docs.map(doc => doc.data())
    setInventoryData(data)
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error logging in with Google:', error)
    }
  }

  const handleEmailSignup = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      console.log('Signup successful')
    } catch (error) {
      console.error('Error signing up with email:', error)
    }
  }

  const handleEmailLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log('Login successful')
    } catch (error) {
      console.error('Error logging in with email:', error)
    }
  }

  if (!user) {
    return (
      <LoginForm
        onGoogleLogin={handleGoogleLogin}
        onEmailSignup={handleEmailSignup}
        onEmailLogin={handleEmailLogin}
      />
    )
  }

  switch (currentPath) {
    case '/dashboard':
      return <Dashboard inventoryData={inventoryData} />
    case '/editinventory':
      return <EditInventory />
    default:
      return <Dashboard inventoryData={inventoryData} />
  }
}
