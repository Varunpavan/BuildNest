import { useRef, useEffect } from 'react'
import '../styles/builder.css'

let suggestions = [
  'A portfolio page for a photographer',
  'A pomodoro timer with a clean look',
  'A landing page for a small chai stall',
]

function ChatPanel({ messages, prompt, setPrompt, onSend, generating }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, generating])

  function handleChange(event) {
    setPrompt(event.target.value)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  function handleSuggestion(text) {
    setPrompt(text)
  }

  return (
    <section className="chat" aria-label="Chat with the builder">
      <div className="chat-scroll">
        {messages.length === 0 && !generating && (
          <div className="chat-empty">
            <h2 className="chat-empty-title">What should we build?</h2>
            <p className="chat-empty-text">
              Describe the page in your own words. After it appears, keep chatting to change it.
            </p>
            <div className="chip-column">
              {suggestions.map((text) => (
                <button key={text} className="chip" onClick={() => handleSuggestion(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`bubble-row bubble-row-${message.role}`}>
            <p className={message.isError ? 'bubble bubble-ai bubble-error' : `bubble bubble-${message.role}`}>
              {message.text}
            </p>
          </div>
        ))}

        {generating && (
          <div className="bubble-row bubble-row-ai">
            <p className="bubble bubble-ai bubble-working">
              <span className="working-blocks">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Building your page
            </p>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          rows="3"
          maxLength="2000"
          placeholder={messages.length === 0 ? 'Describe the page you want...' : 'Ask for a change...'}
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={generating}
          aria-label="Your message"
        />
        <button className="btn btn-primary btn-small" onClick={onSend} disabled={generating || prompt.trim() === ''}>
          {generating ? 'Building...' : 'Send'}
        </button>
      </div>
    </section>
  )
}

export default ChatPanel
