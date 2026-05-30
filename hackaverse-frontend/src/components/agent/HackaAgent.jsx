import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

export default function HackaAgent() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, type: 'agent', text: 'Hello! I\'m HackaAgent, your AI assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send to backend agent
      const response = await api.post('/mcp/route', {
        agent_type: 'default',
        message: input,
        user_id: user?.id,
        context: {
          role: user?.role,
          username: user?.username
        }
      })

      const agentMessage = {
        id: messages.length + 2,
        type: 'agent',
        text: response.data?.data?.response || 'I couldn\'t process that request. Please try again.'
      }
      setMessages(prev => [...prev, agentMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: messages.length + 2,
        type: 'agent',
        text: 'Sorry, I encountered an error. Please try again later.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1128] to-[#15193B] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">HackaAgent</h1>
          <p className="text-white/60">Your AI-powered hackathon assistant</p>
        </div>

        {/* Chat Container */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-cyan-500/20 border border-cyan-500/30 text-white'
                      : 'bg-white/10 border border-white/20 text-white/90'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 text-white/90 px-4 py-2 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4 bg-white/5">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
