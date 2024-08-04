'use client'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { auth, firestore } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaSortUp, FaSortDown } from 'react-icons/fa'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [inventoryData, setInventoryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [filter, setFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' })
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await fetchInventoryData(user)
      } else {
        router.push('/')
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchInventoryData = async (currentUser) => {
    if (!currentUser) return
    const userInventoryRef = collection(firestore, 'users', currentUser.uid, 'inventory')
    const querySnapshot = await getDocs(userInventoryRef)
    const data = querySnapshot.docs.map(doc => doc.data())
    setInventoryData(data)
    setFilteredData(data)
  }

  const applyFilter = (filter) => {
    let filtered = inventoryData
    if (filter === 'lowStock') {
      filtered = inventoryData.filter(item => item.count <= 5)
    } else if (filter === 'outOfStock') {
      filtered = inventoryData.filter(item => item.count <= 0)
    }
    setFilter(filter)
    setFilteredData(filtered)
  }

  const sortData = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })

    const sortedData = [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1
      return 0
    })

    setFilteredData(sortedData)
  }

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
    }
    return null
  }

  const totalItems = inventoryData.length
  const lowStock = inventoryData.filter(item => item.count <= 5).length
  const outOfStock = inventoryData.filter(item => item.count <= 0).length

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />

      <main className="p-8">
        <section id="overview" className="mb-12">
          <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-100 to-purple-950">
            Inventory Overview
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => applyFilter('all')}
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-200">Total Items</h2>
              <p className="text-4xl font-bold text-gray-100">{totalItems}</p>
            </motion.div>
            <motion.div
              className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => applyFilter('lowStock')}
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-200">Low Stock</h2>
              <p className="text-4xl font-bold text-gray-100">{lowStock}</p>
            </motion.div>
            <motion.div
              className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center cursor-pointer transition-transform transform hover:scale-105"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => applyFilter('outOfStock')}
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-200">Out of Stock</h2>
              <p className="text-4xl font-bold text-gray-100">{outOfStock}</p>
            </motion.div>
          </div>
        </section>

        <section id="inventory" className="mt-12">
          <div className="w-full max-w-6xl mx-auto overflow-x-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-300">Inventory List</h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <table className="w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <thead>
                  <tr className="bg-gray-700">
                    <th 
                      className="py-4 px-6 border-b border-gray-600 text-left text-gray-300 cursor-pointer"
                      onClick={() => sortData('name')}
                    >
                      Name {getSortIcon('name')}
                    </th>
                    <th 
                      className="py-4 px-6 border-b border-gray-600 text-left text-gray-300 cursor-pointer"
                      onClick={() => sortData('count')}
                    >
                      Count {getSortIcon('count')}
                    </th>
                    <th 
                      className="py-4 px-6 border-b border-gray-600 text-left text-gray-300 cursor-pointer"
                      onClick={() => sortData('expirationDate')}
                    >
                      Expiration Date {getSortIcon('expirationDate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-6 border-b border-gray-600 text-gray-100">{item.name}</td>
                      <td className="py-3 px-6 border-b border-gray-600 text-gray-100">{item.count}</td>
                      <td className="py-3 px-6 border-b border-gray-600 text-gray-100">{item.expirationDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  )
}
