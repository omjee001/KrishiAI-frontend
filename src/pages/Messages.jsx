import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { deleteConversation, deleteMessage, getConversations, sendMessage } from '../services/messageService'

export default function Messages() {
  const { user } = useContext(AuthContext)
  const location = useLocation()
  const targetConvId = location.state?.conversationId

  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    if (!user) return
    const list = await getConversations(user)
    setConversations(list || [])

    if (list && list.length > 0) {
      if (targetConvId) {
        const found = list.find(c => String(c.id) === String(targetConvId))
        setActive(found || list[0])
      } else if (!active) {
        setActive(list[0])
      } else {
        const currentActive = list.find(c => String(c.id) === String(active.id))
        setActive(currentActive || list[0])
      }
    } else {
      setActive(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user, targetConvId])

  useEffect(() => {
    scrollToBottom()
  }, [active?.messages])

  const handleSend = async e => {
    e.preventDefault()
    if (!text.trim() || !active) return

    const messageText = text.trim()
    setText('')

    const updated = await sendMessage(active.id, {
      sender: user.name || user.email?.split('@')[0] || 'User',
      senderEmail: user.email || '',
      text: messageText
    })

    if (updated) {
      setActive({ ...updated })
      // Refresh list to show latest message order
      const list = await getConversations(user)
      setConversations(list || [])
    }
  }

  const handleDeleteMessage = async msgIndex => {
    if (!active) return
    if (confirm('Delete this message?')) {
      const updated = await deleteMessage(active.id, msgIndex)
      if (updated) {
        setActive({ ...updated })
        const list = await getConversations(user)
        setConversations(list || [])
      }
    }
  }

  const handleDeleteConversation = async () => {
    if (!active) return
    if (confirm(`Are you sure you want to delete the entire conversation with ${getCounterpartyName(active)}?`)) {
      await deleteConversation(active.id)
      const list = await getConversations(user)
      setConversations(list || [])
      setActive(list && list.length > 0 ? list[0] : null)
    }
  }

  const getCounterpartyName = conv => {
    if (!conv || !user) return 'Chat'
    const isFarmer = user.role === 'FARMER' || conv.farmerEmail === user.email || conv.farmerName === user.name
    return isFarmer ? conv.consumerName || 'Customer' : conv.farmerName || 'Farmer'
  }

  return (
    <section className="container py-5">
      <p className="section-label">Communications</p>
      <h1 className="h2 mb-4">Messages & Direct Inquiries</h1>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" />
          <p className="mt-2 text-muted">Loading messages…</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="card text-center p-5">
          <i className="bi bi-chat-square-dots fs-1 text-muted" />
          <h4 className="mt-3">No conversations yet</h4>
          <p className="text-muted mb-3">
            {user?.role === 'FARMER'
              ? 'When buyers click "Contact farmer" on your crop listings, their inquiries will appear here.'
              : 'Browse products on the marketplace and click "Contact farmer" on any crop to start a conversation.'}
          </p>
          <Link className="btn btn-success align-self-center" to="/marketplace">
            <i className="bi bi-shop me-1" />
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden shadow-sm border">
          <div className="row g-0">
            {/* Conversation list */}
            <aside className="col-md-4 border-end bg-light">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <span className="fw-bold text-dark">
                  <i className="bi bi-inbox me-2 text-success" />
                  Inbox ({conversations.length})
                </span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                {conversations.map(c => {
                  const partner = getCounterpartyName(c)
                  const isCurrent = active?.id === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActive(c)}
                      className={`w-100 border-0 text-start p-3 border-bottom transition ${
                        isCurrent ? 'bg-white shadow-sm border-start border-success border-4' : 'bg-light hover-bg-white'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-baseline">
                        <strong className="text-truncate">{partner}</strong>
                        <small className="text-muted">{c.lastTime}</small>
                      </div>
                      <div className="small text-success fw-semibold text-truncate">
                        {c.productName}
                      </div>
                      <small className="text-muted text-truncate d-block">
                        {c.lastMessage}
                      </small>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Active chat pane */}
            <div className="col-md-8 d-flex flex-column" style={{ minHeight: '520px', maxHeight: '600px' }}>
              {active ? (
                <>
                  {/* Chat header */}
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
                    <div>
                      <strong className="fs-6">{getCounterpartyName(active)}</strong>
                      <div className="small text-muted d-flex align-items-center gap-1">
                        <span>Regarding:</span>
                        {active.productId ? (
                          <Link className="text-success text-decoration-none fw-semibold" to={`/products/${active.productId}`}>
                            {active.productName} <i className="bi bi-box-arrow-up-right small" />
                          </Link>
                        ) : (
                          <span className="fw-semibold">{active.productName}</span>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge text-bg-light border text-muted">
                        {active.id}
                      </span>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleDeleteConversation}
                        title="Delete this entire conversation"
                      >
                        <i className="bi bi-trash3 me-1" />
                        Delete Chat
                      </button>
                    </div>
                  </div>

                  {/* Message bubbles */}
                  <div className="message-pane p-4 flex-grow-1 overflow-auto bg-body-tertiary">
                    {active.messages && active.messages.length > 0 ? (
                      active.messages.map((m, i) => {
                        const isMine =
                          m.senderEmail?.toLowerCase() === user?.email?.toLowerCase() ||
                          m.sender?.toLowerCase() === user?.name?.toLowerCase()

                        return (
                          <div
                            key={i}
                            className={`d-flex flex-column mb-3 position-relative group ${
                              isMine ? 'align-items-end' : 'align-items-start'
                            }`}
                          >
                            <div className="small text-muted mb-1 px-1 d-flex align-items-center gap-2">
                              <span>{isMine ? 'You' : m.sender || getCounterpartyName(active)}</span>
                              <button
                                className="btn btn-link btn-sm text-danger p-0 opacity-50 hover-opacity-100 text-decoration-none"
                                onClick={() => handleDeleteMessage(i)}
                                title="Delete this message"
                                style={{ fontSize: '0.75rem' }}
                              >
                                <i className="bi bi-trash3" />
                              </button>
                            </div>
                            <div
                              className={`p-3 rounded-3 shadow-sm position-relative ${
                                isMine
                                  ? 'bg-success text-white'
                                  : 'bg-white border text-dark'
                              }`}
                              style={{ maxWidth: '75%', wordBreak: 'break-word' }}
                            >
                              <div>{m.text}</div>
                            </div>
                            <small className="text-muted opacity-75 mt-1 px-1 font-monospace" style={{ fontSize: '0.75rem' }}>
                              {m.time}
                            </small>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-5 text-muted">
                        No messages yet in this conversation. Write a note below to start chatting.
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send input */}
                  <form className="p-3 border-top d-flex gap-2 bg-white" onSubmit={handleSend}>
                    <label className="visually-hidden" htmlFor="message-input">Message</label>
                    <input
                      id="message-input"
                      className="form-control"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={`Write a message to ${getCounterpartyName(active)}…`}
                    />
                    <button className="btn btn-success px-3" type="submit" disabled={!text.trim()}>
                      <i className="bi bi-send-fill me-1" />
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-5 text-muted m-auto">
                  Select a conversation from the left to view messages.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}


