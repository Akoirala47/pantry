'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import { auth, firestore } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { parse } from 'csv-parse'
import moment from 'moment'
import Webcam from 'react-webcam'

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
  const [identifiedFruit, setIdentifiedFruit] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const webcamRef = useRef(null)
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

  useEffect(() => {
    // Dynamically load TensorFlow.js and MobileNet
    const loadScripts = async () => {
      const tfScript = document.createElement('script')
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest'
      tfScript.onload = async () => {
        const mobilenetScript = document.createElement('script')
        mobilenetScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest'
        mobilenetScript.onload = async () => {
          console.log('MobileNet loaded')
        }
        document.body.appendChild(mobilenetScript)
      }
      document.body.appendChild(tfScript)
    }
    loadScripts()
  }, [])

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
        const batch = writeBatch(firestore)
        const userInventoryRef = collection(firestore, 'users', user.uid, 'inventory')
        const querySnapshot = await getDocs(userInventoryRef)

        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref)
        })

        await batch.commit()
        console.log('All items deleted successfully')
        fetchInventoryData(user)
      } catch (error) {
        console.error('Error deleting all items:', error)
      }
    }
  }

  const handleCsvUpload = async () => {
    if (csvText.trim() === '') {
      console.error('No CSV content provided')
      alert('Please paste some CSV content before processing.')
      return
    }

    console.log('CSV content:', csvText)

    parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"',
    }, async (error, records) => {
      if (error) {
        console.error('Error parsing CSV:', error)
        alert('Error parsing CSV. Please check your input format.')
        return
      }
      console.log('Parsed CSV records:', records)

      if (records.length === 0) {
        console.error('No valid records found in CSV')
        alert('No valid records found in the CSV. Please check your input.')
        return
      }

      try {
        const batch = writeBatch(firestore)
        const userInventoryRef = collection(firestore, 'users', user.uid, 'inventory')

        records.forEach((record) => {
          console.log('Processing record:', record)
          const date = moment(record.expirationDate, 'DD-MM-YYYY')
          const formattedDate = date.format('YYYY-MM-DD')
          const item = {
            name: record.name || '',
            count: parseInt(record.count, 10) || 0,
            expirationDate: formattedDate
          }
          console.log('Item to be added:', item)
          const newDocRef = doc(userInventoryRef)
          batch.set(newDocRef, item)
        })

        await batch.commit()
        console.log('CSV items added successfully')
        alert('CSV items added successfully')
        fetchInventoryData(user)
        setCsvText('')
        setShowCsvInput(false)
      } catch (error) {
        console.error('Error adding items from CSV:', error)
        alert('Error adding items from CSV. Please try again.')
      }
    })
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

  const handleIdentifyFruit = async () => {
    if (showCamera) {
      const screenshot = webcamRef.current.getScreenshot()

      if (screenshot) {
        const img = new Image()
        img.src = screenshot
        img.onload = async () => {
          try {
            // Load the MobileNet model
            const model = await window.mobilenet.load()
            // Classify the image
            const predictions = await model.classify(img)

            // Set the identified fruit to the prediction with the highest probability
            setIdentifiedFruit(predictions[0].className)
          } catch (error) {
            console.error('Error loading or predicting with the model:', error)
          }
          setShowCamera(false)
        }
      }
    }
  }

  const handleAddIdentifiedFruit = () => {
    if (identifiedFruit) {
      const fruitName = identifiedFruit.toString()
      const count = 1
      const expirationDate = ''
      setNewItem({ name: fruitName, count: count, expirationDate: expirationDate })
      setShowNewItemForm(true)
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

        <motion.div
          className="relative w-full max-w-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => setShowNewItemForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mb-4"
          >
            Add Item
          </button>

          <button
            onClick={() => setShowCsvInput(!showCsvInput)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded mb-4 ml-2"
          >
            {showCsvInput ? 'Cancel CSV Input' : 'Upload CSV'}
          </button>

          <button
            onClick={handleDeleteAllItems}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded mb-4 ml-2"
          >
            Delete All Items
          </button>

          {showCsvInput && (
            <div className="mt-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV content here"
                className="p-3 rounded border border-neutral-600 bg-neutral-800 text-white w-full h-40 mb-4"
              />
              <button
                onClick={handleCsvUpload}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Process CSV
              </button>
            </div>
          )}

          <button
            onClick={() => setShowCamera(!showCamera)}
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded mb-4"
          >
            {showCamera ? 'Close Camera' : 'Open Camera'}
          </button>

          {showCamera && (
            <div className="mt-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-64 rounded mb-4"
              />
              <button
                onClick={handleIdentifyFruit}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Identify Fruit
              </button>
              {identifiedFruit && (
                <div className="mt-4">
                  <p>Identified Fruit: {identifiedFruit}</p>
                  <button
                    onClick={handleAddIdentifiedFruit}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mt-2"
                  >
                    Add Identified Fruit
                  </button>
                </div>
              )}
            </div>
          )}

          {showNewItemForm && (
            <motion.div
              className="relative w-full max-w-md mt-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl mb-4">New Item</h2>
              <input
                type="text"
                placeholder="Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="p-3 rounded border border-neutral-600 bg-neutral-800 text-white w-full mb-2"
              />
              <input
                type="number"
                placeholder="Count"
                value={newItem.count}
                onChange={(e) => setNewItem({ ...newItem, count: e.target.value })}
                className="p-3 rounded border border-neutral-600 bg-neutral-800 text-white w-full mb-2"
              />
              <input
                type="date"
                placeholder="Expiration Date"
                value={newItem.expirationDate}
                onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                className="p-3 rounded border border-neutral-600 bg-neutral-800 text-white w-full mb-2"
              />
              <button
                onClick={handleAddItem}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mb-2"
              >
                Save
              </button>
              <button
                onClick={() => setShowNewItemForm(false)}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            </motion.div>
          )}

          <motion.div
            className="relative w-full max-w-md mt-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl mb-4">Inventory</h2>
            {filteredInventory.map(item => (
              <div key={item.id} className="border border-neutral-600 bg-neutral-800 p-4 rounded mb-2 flex justify-between">
                {editingItemId === item.id ? (
                  <div>
                    <input
                      type="text"
                      value={editedItem.name}
                      onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                      className="p-2 rounded border border-neutral-600 bg-neutral-800 text-white w-full mb-2"
                    />
                    <input
                      type="number"
                      value={editedItem.count}
                      onChange={(e) => setEditedItem({ ...editedItem, count: e.target.value })}
                      className="p-2 rounded border border-neutral-600 bg-neutral-800 text-white w-full mb-2"
                    />
                    <input
                      type="date"
                      value={editedItem.expirationDate}
                      onChange={(e) => setEditedItem({ ...editedItem, expirationDate: e.target.value })}
                      className="p-2 rounded border border-neutral-600 bg-neutral-800 text-white w-full mb-2"
                    />
                    <button
                      onClick={() => handleEditItem(item.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mb-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p>Count: {item.count}</p>
                      <p>Expiration Date: {item.expirationDate}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => startEditing(item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded mb-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
