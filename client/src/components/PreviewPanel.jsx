import '../styles/builder.css'

function PreviewPanel({ code, setCode, tab, setTab, device, setDevice, generating }) {
  function showPreview() {
    setTab('preview')
  }

  function showCode() {
    setTab('code')
  }

  function handleCodeChange(event) {
    setCode(event.target.value)
  }

  let devices = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'phone', label: 'Phone' },
  ]

  let previewCode = code
  if (code) {
    let scrollStyle = `<style id="nxtbuild-mobile-scroll">
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        touch-action: pan-y !important;
        min-height: 100% !important;
        height: auto !important;
      }
    </style>`
    if (code.includes('</head>')) {
      previewCode = code.replace('</head>', `${scrollStyle}</head>`)
    } else {
      previewCode = scrollStyle + code
    }
  }

  return (
    <section className="preview" aria-label="Page preview">
      <div className="preview-toolbar">
        <div className="segmented" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'preview'}
            className={tab === 'preview' ? 'segment segment-active' : 'segment'}
            onClick={showPreview}
          >
            Preview
          </button>
          <button
            role="tab"
            aria-selected={tab === 'code'}
            className={tab === 'code' ? 'segment segment-active' : 'segment'}
            onClick={showCode}
          >
            Code
          </button>
        </div>

        {tab === 'preview' && (
          <div className="segmented">
            {devices.map((item) => (
              <button
                key={item.id}
                className={device === item.id ? 'segment segment-active' : 'segment'}
                onClick={() => setDevice(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="preview-body">
        {tab === 'preview' && (
          <div className="stage">
            {code === '' ? (
              <div className="stage-empty">
                <span className="stage-empty-blocks" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <h2 className="stage-empty-title">Your page will show up here</h2>
                <p className="stage-empty-text">Describe it in the chat and it appears in a few seconds.</p>
              </div>
            ) : (
              <iframe
                className={`stage-frame stage-frame-${device}`}
                title="Live preview of your page"
                srcDoc={previewCode}
                scrolling="yes"
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
              />
            )}
          </div>
        )}

        {tab === 'code' && (
          <textarea
            className="code-editor"
            value={code}
            onChange={handleCodeChange}
            spellCheck={false}
            placeholder="The code for your page will appear here once it is built."
            aria-label="Page code"
          />
        )}

        {generating && (
          <div className="stage-overlay" role="status">
            <div className="overlay-card">
              <span className="overlay-bar"></span>
              <p className="overlay-title">Building your page</p>
              <p className="overlay-text">This can take up to a minute.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default PreviewPanel
