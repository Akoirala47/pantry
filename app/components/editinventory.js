'use client'
import { useState, useEffect, useRef } from 'react'
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
  const [csvText, setCsvText] = useState('')
  const [identifiedFruit, setIdentifiedFruit] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
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
      await updateDoc(itemRef, inventory.find(item => item.id === itemId))
      console.log('Item updated successfully')
      fetchInventoryData(user)
    } catch (error) {
      console.error('Error updating item:', error)
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
      } catch (error) {
        console.error('Error adding items from CSV:', error)
        alert('Error adding items from CSV. Please try again.')
      }
    })
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

  const handleEditAll = () => {
    setEditMode(!editMode)
    setDeleteMode(false)
  }

  const handleDeleteMode = () => {
    setDeleteMode(!deleteMode)
    setEditMode(false)
  }

  const updateItemField = (itemId, field, value) => {
    setInventory(inventory.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Navbar />
  
      <main className="p-8 flex flex-col items-center">
        <motion.div
          className="relative w-full max-w-lg mb-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center bg-gray-800 p-4 rounded-lg">
            <input
              type="text"
              placeholder="Search Inventory"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </motion.div>
  
        <div className="flex flex-col items-center w-full max-w-4xl">
          <motion.button
            className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none"
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {showNewItemForm ? 'Cancel' : 'Add Item'}
          </motion.button>
  
          {showNewItemForm && (
            <motion.div
              className="w-full mb-6 p-4 bg-gray-800 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="text"
                placeholder="Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full mb-2 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="Count"
                value={newItem.count}
                onChange={(e) => setNewItem({ ...newItem, count: e.target.value })}
                className="w-full mb-2 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="date"
                placeholder="Expiration Date"
                value={newItem.expirationDate}
                onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                className="w-full mb-2 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAddItem}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none mb-4"
              >
                Add Item
              </button>
  
              {/* CSV Upload Form */}
              <textarea
                rows="5"
                placeholder="Paste CSV content here..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full mb-2 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleCsvUpload}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none"
              >
                Upload CSV
              </button>
            </motion.div>
          )}
  
          <motion.div
            className="w-full mb-6 p-4 bg-gray-800 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="w-full px-4 py-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none"
            >
              Identify Product
            </button>
            {showCamera && (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-auto mb-4"
                />
                <button
                  onClick={handleIdentifyFruit}
                  className="w-full px-4 py-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none"
                >
                  Capture and Identify
                </button>
                <button
                  onClick={handleAddIdentifiedFruit}
                  className="w-full px-4 py-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none"
                  disabled={!identifiedFruit}
                >
                  Add Identified Product
                </button>
              </>
            )}
          </motion.div>
  
          <motion.div
            className="w-full p-4 bg-gray-800 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Inventory List</h2>
              <div>
                <button
                  className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-400 focus:outline-none"
                  onClick={handleEditAll}
                >
                  {editMode ? 'Save All' : 'Edit All'}
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-400 focus:outline-none"
                  onClick={handleDeleteMode}
                >
                  {deleteMode ? 'Cancel Delete' : 'Delete Mode'}
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {filteredInventory.map((item) => (
                <li key={item.id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemField(item.id, 'name', e.target.value)}
                        className="w-1/2 px-2 py-1 bg-gray-600 text-white rounded"
                      />
                      <div className="flex justify-between w-1/2">
                        <input
                          type="number"
                          value={item.count}
                          onChange={(e) => updateItemField(item.id, 'count', e.target.value)}
                          className="w-1/2 px-2 py-1 bg-gray-600 text-white rounded"
                        />
                        <input
                          type="date"
                          value={item.expirationDate}
                          onChange={(e) => updateItemField(item.id, 'expirationDate', e.target.value)}
                          className="w-1/2 px-2 py-1 bg-gray-600 text-white rounded"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="w-1/2">{item.name}</span>
                      <div className="flex justify-between w-1/2">
                        <span>Count: {item.count}</span>
                        <span>Expires: {item.expirationDate}</span>
                      </div>
                    </>
                  )}
                  {deleteMode && (
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-400 focus:outline-none"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  )
}