const mock = import.meta.env.VITE_USE_MOCK_API !== 'false'
const STORAGE_KEY = 'krishi_conversations'
const pause = v => new Promise(r => setTimeout(() => r(v), 80))

const defaultConversations = [
  {
    id: 'CONV-101',
    productId: '1',
    productName: 'Organic Tomatoes',
    farmerName: 'Ravi Kumar',
    farmerEmail: 'ravi@farm.com',
    consumerName: 'Priya Sharma',
    consumerEmail: 'priya@example.com',
    lastMessage: 'Hello Priya! They were harvested this morning.',
    lastTime: '10:35 AM',
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        sender: 'Priya Sharma',
        senderEmail: 'priya@example.com',
        text: 'Hello, I am interested in your organic tomatoes.',
        time: '10:30 AM'
      },
      {
        sender: 'Ravi Kumar',
        senderEmail: 'ravi@farm.com',
        text: 'Hello Priya! They were harvested this morning.',
        time: '10:35 AM'
      }
    ]
  },
  {
    id: 'CONV-102',
    productId: '2',
    productName: 'Premium Basmati Rice',
    farmerName: 'Aman Singh',
    farmerEmail: 'aman@farm.com',
    consumerName: 'Arjun Mehta',
    consumerEmail: 'arjun@example.com',
    lastMessage: 'Thank you for the update.',
    lastTime: 'Yesterday',
    updatedAt: Date.now() - 86400000,
    messages: [
      {
        sender: 'Arjun Mehta',
        senderEmail: 'arjun@example.com',
        text: 'Hi Aman, is the Basmati rice aged for 2 years?',
        time: 'Yesterday 2:15 PM'
      },
      {
        sender: 'Aman Singh',
        senderEmail: 'aman@farm.com',
        text: 'Yes Arjun, it is aged 24 months and cleaned at our mill.',
        time: 'Yesterday 2:30 PM'
      },
      {
        sender: 'Arjun Mehta',
        senderEmail: 'arjun@example.com',
        text: 'Thank you for the update.',
        time: 'Yesterday 2:35 PM'
      }
    ]
  }
]

let activeCache = null

const getStoredConversations = () => {
  if (activeCache && Array.isArray(activeCache) && activeCache.length > 0) {
    return activeCache
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        activeCache = parsed
        return parsed
      }
    }
  } catch (e) {
    console.warn('Unable to read conversations from localStorage:', e)
  }

  activeCache = [...defaultConversations]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConversations))
  } catch (e) {
    console.warn('Unable to initialize conversations in localStorage:', e)
  }
  return activeCache
}

const setStoredConversations = list => {
  activeCache = [...list]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.warn('Unable to write conversations to localStorage:', e)
  }
}

export const getConversations = user => {
  const all = getStoredConversations()
  if (!user) return pause([])
  if (user.role === 'ADMIN') return pause(all)

  const userName = (user.name || '').trim().toLowerCase()
  const userEmail = (user.email || '').trim().toLowerCase()

  const filtered = all.filter(c => {
    const fName = (c.farmerName || '').trim().toLowerCase()
    const fEmail = (c.farmerEmail || '').trim().toLowerCase()
    const cName = (c.consumerName || '').trim().toLowerCase()
    const cEmail = (c.consumerEmail || '').trim().toLowerCase()

    const isFarmer = (fEmail && fEmail === userEmail) || (fName && fName === userName) || (fName && userName && (fName.includes(userName) || userName.includes(fName)))
    const isConsumer = (cEmail && cEmail === userEmail) || (cName && cName === userName) || (cName && userName && (cName.includes(userName) || userName.includes(cName)))

    return isFarmer || isConsumer
  })

  // Sort by latest message
  filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return pause(filtered)
}

export const startConversation = ({ productId, productName, farmerName, farmerEmail, consumerName, consumerEmail, initialMessage }) => {
  const list = getStoredConversations()
  const fNameLower = (farmerName || '').trim().toLowerCase()
  const fEmailLower = (farmerEmail || '').trim().toLowerCase()
  const cNameLower = (consumerName || '').trim().toLowerCase()
  const cEmailLower = (consumerEmail || '').trim().toLowerCase()

  // Find any existing conversation between this farmer and customer (reuses same chat thread)
  let conv = list.find(c => {
    const cFarmerEmail = (c.farmerEmail || '').trim().toLowerCase()
    const cFarmerName = (c.farmerName || '').trim().toLowerCase()
    const cConsumerEmail = (c.consumerEmail || '').trim().toLowerCase()
    const cConsumerName = (c.consumerName || '').trim().toLowerCase()

    // Check direct pairing
    const matchDirectFarmer =
      (fEmailLower && cFarmerEmail === fEmailLower) ||
      (fNameLower && cFarmerName === fNameLower)
    const matchDirectConsumer =
      (cEmailLower && cConsumerEmail === cEmailLower) ||
      (cNameLower && cConsumerName === cNameLower)
    if (matchDirectFarmer && matchDirectConsumer) return true

    // Check reverse pairing
    const matchReverseFarmer =
      (fEmailLower && cConsumerEmail === fEmailLower) ||
      (fNameLower && cConsumerName === fNameLower)
    const matchReverseConsumer =
      (cEmailLower && cFarmerEmail === cEmailLower) ||
      (cNameLower && cFarmerName === cNameLower)
    if (matchReverseFarmer && matchReverseConsumer) return true

    return false
  })

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (conv) {
    // If a new message was passed, append it to the existing thread
    if (initialMessage && !conv.messages.some(m => m.text === initialMessage)) {
      conv.messages.push({
        sender: consumerName,
        senderEmail: consumerEmail,
        text: initialMessage,
        time: currentTime
      })
      conv.lastMessage = initialMessage
      conv.lastTime = currentTime
      conv.updatedAt = Date.now()
    }
    // Update product context to latest crop topic
    if (productName) {
      conv.productName = productName
    }
    if (productId) {
      conv.productId = String(productId)
    }

    // Move to front of inbox
    const remaining = list.filter(c => String(c.id) !== String(conv.id))
    const updatedList = [conv, ...remaining]
    setStoredConversations(updatedList)
    return pause(conv)
  }

  // Create a new conversation only if this is the first interaction between them
  const newConv = {
    id: `CONV-${Date.now().toString().slice(-4)}`,
    productId: String(productId || ''),
    productName: productName || 'Crop inquiry',
    farmerName: farmerName || 'Farmer',
    farmerEmail: farmerEmail || '',
    consumerName: consumerName || 'Customer',
    consumerEmail: consumerEmail || '',
    lastMessage: initialMessage || 'Started conversation',
    lastTime: currentTime,
    updatedAt: Date.now(),
    messages: initialMessage
      ? [
          {
            sender: consumerName,
            senderEmail: consumerEmail,
            text: initialMessage,
            time: currentTime
          }
        ]
      : []
  }

  const updatedList = [newConv, ...list]
  setStoredConversations(updatedList)
  return pause(newConv)
}


export const sendMessage = (conversationId, { sender, senderEmail, text }) => {
  const list = getStoredConversations()
  const conv = list.find(c => String(c.id) === String(conversationId))
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (conv) {
    conv.messages.push({
      sender,
      senderEmail,
      text,
      time: currentTime
    })
    conv.lastMessage = text
    conv.lastTime = currentTime
    conv.updatedAt = Date.now()

    // Move to front
    const filtered = list.filter(c => String(c.id) !== String(conversationId))
    const updatedList = [conv, ...filtered]
    setStoredConversations(updatedList)
    return pause(conv)
  }

  return pause(null)
}

export const deleteMessage = (conversationId, messageIndex) => {
  const list = getStoredConversations()
  const conv = list.find(c => String(c.id) === String(conversationId))

  if (conv && conv.messages && conv.messages.length > messageIndex) {
    conv.messages.splice(messageIndex, 1)

    if (conv.messages.length > 0) {
      const last = conv.messages[conv.messages.length - 1]
      conv.lastMessage = last.text
      conv.lastTime = last.time
    } else {
      conv.lastMessage = 'No messages yet'
      conv.lastTime = ''
    }
    conv.updatedAt = Date.now()

    setStoredConversations([...list])
    return pause(conv)
  }

  return pause(null)
}

export const deleteConversation = conversationId => {
  const list = getStoredConversations()
  const updatedList = list.filter(c => String(c.id) !== String(conversationId))
  setStoredConversations(updatedList)
  return pause(true)
}

