'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import { auth, firestore } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import Papa from 'papaparse'

export default function EditInventory() {
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newItem, setNewItem] = useState({ name: '', count: '', expirationDate: '' })
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [showNewItemForm, setShowNewItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editedItem, setEditedItem] = useState({ name: '', count: '', expirationDate: '' })
  const [csvFile, setCsvFile] = useState(null)
  const router = useRouter()
  const fileInputRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        fetchInventoryData(user)
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
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setInventory(data)
    setFilteredInventory(data)
  }

  const handleSearch = (query) => {
    const filteredItems = inventory.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredInventory(filteredItems)
  }

  const handleAddItem = async () => {
    try {
      const userInventoryRef = collection(firestore, 'users', user.uid, 'inventory')
      await addDoc(userInventoryRef, newItem)
      console.log('Item added successfully')
      setNewItem({ name: '', count: '', expirationDate: '' })
      setShowNewItemForm(false)
      fetchInventoryData(user)
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      const itemRef = doc(firestore, 'users', user.uid, 'inventory', itemId)
      await deleteDoc(itemRef)
      console.log('Item deleted successfully')
      fetchInventoryData(user)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleEditItem = async (itemId) => {
    try {
      const itemRef = doc(firestore, 'users', user.uid, 'inventory', itemId)
      await updateDoc(itemRef, editedItem)
      console.log('Item updated successfully')
      setEditingItemId(null)
      setEditedItem({ name: '', count: '', expirationDate: '' })
      fetchInventoryData(user)
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleDeleteAllItems = async () => {
    if (window.confirm("Are you sure you want to delete all items? This action cannot be undone.")) {
      try {
        const batch = writeBatch(firestore);
        const userInventoryRef = collection(firestore, 'users', user.uid, 'inventory');
        const querySnapshot = await getDocs(userInventoryRef);
        
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('All items deleted successfully');
        fetchInventoryData(user);
      } catch (error) {
        console.error('Error deleting all items:', error);
      }
    }
  }

  const handleCsvUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setCsvFile(file)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log('Parsed CSV data:', results.data)
          const items = results.data.map(row => ({
            name: row['name'] || '',
            count: row['count'] || '',
            expirationDate: row['expirationDate'] || ''
          }))
          
          try {
            const batch = writeBatch(firestore);
            const userInventoryRef = collection(firestore, 'users', user.uid, 'inventory');
            
            items.forEach((item) => {
              const newDocRef = doc(userInventoryRef);
              batch.set(newDocRef, item);
            });

            await batch.commit();
            console.log('CSV items added successfully');
            fetchInventoryData(user);
          } catch (error) {
            console.error('Error adding items from CSV:', error);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error)
        }
      })
    } else {
      console.error('No file selected')
    }
  }

  const startEditing = (item) => {
    setEditingItemId(item.id)
    setEditedItem({ name: item.name, count: item.count, expirationDate: item.expirationDate })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }

  if (!user) {
    return null // Or a loading spinner
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />

      <main className="p-8 flex flex-col items-center">
        <motion.div
          className="relative w-full max-w-md mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search Inventory"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              onKeyDown={handleKeyPress}
              className="p-3 rounded border border-neutral-600 bg-neutral-800 text-white w-full mr-2"
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Search
            </button>
          </div>
        </motion.div>

        <div className="w-full max-w-md flex justify-between mb-6">
          <button
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            {showNewItemForm ? 'Hide Item Form' : 'Add Item'}
          </button>
          <button
            onClick={handleDeleteAllItems}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            Delete All Items
          </button>
        </div>

        {showNewItemForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-neutral-800 p-6 rounded shadow-md mb-6"
          >
            <h2 className="text-xl font-bold mb-4">New Item</h2>
            <input
              type="text"
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <input
              type="number"
              placeholder="Count"
              value={newItem.count}
              onChange={(e) => setNewItem({ ...newItem, count: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Expiration Date (mm/dd/yyyy)"
              value={newItem.expirationDate}
              onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <button
              onClick={handleAddItem}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mt-4 w-full"
            >
              Add Item
            </button>
            <div className="mt-4">
              <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-300 mb-2">
                Upload CSV
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600"
              />
            </div>
          </motion.div>
        )}

        <motion.div
          className="mt-6 w-full max-w-4xl overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-4">Inventory List</h2>
          <table className="w-full bg-neutral-800 rounded-lg shadow-md border border-neutral-600">
            <thead>
              <tr>
                <th className="p-3 border-b border-neutral-600">Name</th>
                <th className="p-3 border-b border-neutral-600">Count</th>
                <th className="p-3 border-b border-neutral-600">Expiration Date</th>
                <th className="p-3 border-b border-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id}>
                  <td className="p-3 border-b border-neutral-600">{item.name}</td>
                  <td className="p-3 border-b border-neutral-600">{item.count}</td>
                  <td className="p-3 border-b border-neutral-600">{item.expirationDate}</td>
                  <td className="p-3 border-b border-neutral-600">
                    <button
                      onClick={() => startEditing(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {editingItemId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-neutral-800 p-6 rounded shadow-md mt-6"
          >
            <h2 className="text-xl font-bold mb-4">Edit Item</h2>
            <input
              type="text"
              placeholder="Name"
              value={editedItem.name}
              onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <input
              type="number"
              placeholder="Count"
              value={editedItem.count}
              onChange={(e) => setEditedItem({ ...editedItem, count: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <input
              type="text"
              placeholder="Expiration Date (mm/dd/yyyy)"
              value={editedItem.expirationDate}
              onChange={(e) => setEditedItem({ ...editedItem, expirationDate: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <button
              onClick={() => handleEditItem(editingItemId)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded w-full"
            >
              Update Item
            </button>
            <button
              onClick={() => setEditingItemId(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded mt-4 w-full"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </main>
    </div>
  )
}