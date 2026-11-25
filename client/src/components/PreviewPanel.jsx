import { useState, useEffect, useRef } from 'react'
import '../styles/builder.css'

function PreviewPanel({ code, setCode, tab, setTab, device, setDevice, generating }) {
  const stageRef = useRef(null)
  const [stageWidth, setStageWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 600 ? window.innerWidth - 20 : window.innerWidth - 40
    }
    return 360
  })

  // Measure stage dimensions to dynamically scale desktop/tablet views to fit small mobile screens
  useEffect(() => {
    function measureStage() {
      if (stageRef.current && stageRef.current.clientWidth > 0) {
        const computed = window.getComputedStyle(stageRef.current)
        const paddingX = parseFloat(computed.paddingLeft || 0) + parseFloat(computed.paddingRight || 0)
        const width = stageRef.current.clientWidth - paddingX
        if (width > 0) {
          setStageWidth(width)
        }
      }
    }

    measureStage()
    window.addEventListener('resize', measureStage)

    let observer = null
    if (typeof ResizeObserver !== 'undefined' && stageRef.current) {
      observer = new ResizeObserver(() => {
        measureStage()
      })
      observer.observe(stageRef.current)
    }

    return () => {
      window.removeEventListener('resize', measureStage)
      if (observer) observer.disconnect()
    }
  }, [tab])

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

  // Device Scaling Architecture:
  // On mobile screens (<= 768px), true desktop (1024px) and tablet (768px) viewports are 2x to 2.6x
  // wider than the phone screen (e.g. 393px). To display the full unclipped layout without horizontal
  // overflow, we scale the frame down by: scale = availableWidth / targetWidth.
  // The outer stage-scaler wrapper maintains the visual scaled width (targetWidth * scale),
  // while stage-scaler-inner renders at unscaled dimensions with transform: scale(scale).
  // Phone view (390px) and large laptop screens render natively at 100% without scaling.
  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth <= 768
  const availableWidth = stageWidth > 0 ? stageWidth : (typeof window !== 'undefined' ? (window.innerWidth <= 600 ? window.innerWidth - 20 : window.innerWidth - 40) : 360)

  let targetWidth = 1024
  let scale = 1
  let isScaled = false

  if (isMobileScreen) {
    if (device === 'desktop') {
      targetWidth = 1024
      scale = Math.min(1, availableWidth / 1024)
      isScaled = scale < 1
    } else if (device === 'tablet') {
      targetWidth = 768
      scale = Math.min(1, availableWidth / 768)
      isScaled = scale < 1
    }
  }

  let previewCode = code
  if (code) {
    // Replace any legacy NxtBuild mentions in generated output with BuildNest
    previewCode = previewCode.replace(/nxt\s*[-_]?\s*build/gi, 'BuildNest')

    // Force embedded document viewport to match selected device mode
    let targetViewportWidth = 'device-width'
    if (device === 'desktop') targetViewportWidth = '1024'
    else if (device === 'tablet') targetViewportWidth = '768'
    else if (device === 'phone') targetViewportWidth = '390'

    if (previewCode.includes('<meta name="viewport"')) {
      previewCode = previewCode.replace(
        /<meta\s+name=["']viewport["'][^>]*>/i,
        `<meta name="viewport" content="width=${targetViewportWidth}, initial-scale=1.0">`
      )
    } else if (previewCode.includes('</head>')) {
      previewCode = previewCode.replace(
        '</head>',
        `<meta name="viewport" content="width=${targetViewportWidth}, initial-scale=1.0"></head>`
      )
    }

    // Standard native browser smooth scrolling CSS (clean, no JS listener overhead)
    let scrollStyle = `<style id="buildnest-scroll">
      *, *::before, *::after {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      html, body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        touch-action: pan-y !important;
        min-height: 100% !important;
        height: auto !important;
      }
    </style>`

    if (previewCode.includes('</head>')) {
      previewCode = previewCode.replace('</head>', `${scrollStyle}</head>`)
    } else {
      previewCode = scrollStyle + previewCode
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
          <div className="stage" ref={stageRef}>
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
            ) : isScaled ? (
              <div
                className="stage-scaler"
                style={{
                  width: `${targetWidth * scale}px`,
                }}
              >
                <div
                  className="stage-scaler-inner"
                  style={{
                    width: `${targetWidth}px`,
                    minWidth: `${targetWidth}px`,
                    maxWidth: `${targetWidth}px`,
                    height: `${100 / scale}%`,
                    transform: `scale(${scale})`,
                  }}
                >
                  <iframe
                    className={`stage-frame stage-frame-${device}`}
                    title="Live preview of your page"
                    srcDoc={previewCode}
                    scrolling="yes"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups"
                    style={{
                      width: '100%',
                      height: '100%',
                      minWidth: '100%',
                      maxWidth: '100%',
                      border: 'none',
                      borderRadius: 0,
                      boxShadow: 'none',
                    }}
                  />
                </div>
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
