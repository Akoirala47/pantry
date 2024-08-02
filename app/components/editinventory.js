'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import { auth, firestore } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { parse } from 'csv-parse';
import moment from 'moment';

export default function EditInventory() {
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newItem, setNewItem] = useState({ name: '', count: '', expirationDate: '' })
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [showNewItemForm, setShowNewItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editedItem, setEditedItem] = useState({ name: '', count: '', expirationDate: '' })
  const [csvText, setCsvText] = useState('')
  const [showCsvInput, setShowCsvInput] = useState(false)
  const router = useRouter()

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



  const handleCsvUpload = async () => {
    if (csvText.trim() === '') {
      console.error('No CSV content provided');
      alert('Please paste some CSV content before processing.');
      return;
    }
  
    console.log('CSV content:', csvText); // Debug log
  
    parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"',
    }, async (error, records) => {
      if (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV. Please check your input format.');
        return;
      }
      console.log('Parsed CSV records:', records);
  
      if (records.length === 0) {
        console.error('No valid records found in CSV');
        alert('No valid records found in the CSV. Please check your input.');
        return;
      }
  
      try {
        const batch = writeBatch(firestore);
        const userInventoryRef = collection(firestore, 'users', user.uid, 'inventory');
  
        records.forEach((record) => {
          console.log('Processing record:', record);
          const date = moment(record.expirationDate, 'DD-MM-YYYY');
          const formattedDate = date.format('YYYY-MM-DD');
          const item = {
            name: record.name || '',
            count: parseInt(record.count, 10) || 0,
            expirationDate: formattedDate
          };
          console.log('Item to be added:', item);
          const newDocRef = doc(userInventoryRef);
          batch.set(newDocRef, item);
        });
  
        await batch.commit();
        console.log('CSV items added successfully');
        alert('CSV items added successfully');
        fetchInventoryData(user);
        setCsvText('');
        setShowCsvInput(false);
      } catch (error) {
        console.error('Error adding items from CSV:', error);
        alert('Error adding items from CSV. Please try again.');
      }
    });
  };

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
              type="date"
              placeholder="Expiration Date"
              value={newItem.expirationDate}
              onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <button
              onClick={handleAddItem}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Add Item
            </button>
          </motion.div>
        )}

        <div className="w-full max-w-3xl overflow-x-auto">
          <table className="w-full border-collapse bg-neutral-900 text-white">
            <thead>
              <tr>
                <th className="border-b border-neutral-700 p-4 text-left">Name</th>
                <th className="border-b border-neutral-700 p-4 text-left">Count</th>
                <th className="border-b border-neutral-700 p-4 text-left">Expiration Date</th>
                <th className="border-b border-neutral-700 p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-neutral-800 p-4">{item.name}</td>
                  <td className="border-b border-neutral-800 p-4">{item.count}</td>
                  <td className="border-b border-neutral-800 p-4">{item.expirationDate}</td>
                  <td className="border-b border-neutral-800 p-4 flex space-x-2">
                    <button
                      onClick={() => startEditing(item)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
              type="date"
              placeholder="Expiration Date"
              value={editedItem.expirationDate}
              onChange={(e) => setEditedItem({ ...editedItem, expirationDate: e.target.value })}
              className="p-2 rounded border border-neutral-600 bg-neutral-700 text-white mb-4 w-full"
            />
            <button
              onClick={() => handleEditItem(editingItemId)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Save Changes
            </button>
          </motion.div>
        )}

        <div className="w-full max-w-md mt-6">
          <button
            onClick={() => setShowCsvInput(!showCsvInput)}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
          >
            {showCsvInput ? 'Hide CSV Input' : 'Show CSV Input'}
          </button>
          {showCsvInput && (
            <div className="mt-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste your CSV content here"
                className="w-full h-40 p-2 rounded border border-neutral-600 bg-neutral-700 text-white"
              />
              <button
                onClick={handleCsvUpload}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Process CSV
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}