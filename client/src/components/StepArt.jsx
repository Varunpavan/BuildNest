import '../styles/landing.css'

// small drawings for the "how it works" steps, made with plain divs and CSS
function StepArt({ kind }) {
  if (kind === 'describe') {
    return (
      <div className="art" aria-hidden="true">
        <div className="art-input">
          <span className="art-bar art-bar-long"></span>
          <span className="art-bar art-bar-short"></span>
          <span className="art-send"></span>
        </div>
      </div>
    )
  }

  if (kind === 'build') {
    return (
      <div className="art" aria-hidden="true">
        <span className="art-nav"></span>
        <span className="art-hero">
          <i></i>
        </span>
        <span className="art-tiles">
          <i></i>
          <i></i>
          <i></i>
        </span>
      </div>
    )
  }

  if (kind === 'chat') {
    return (
      <div className="art" aria-hidden="true">
        <span className="art-bubble art-bubble-user"></span>
        <span className="art-bubble art-bubble-ai"></span>
        <span className="art-bubble art-bubble-user art-bubble-small"></span>
        <span className="art-bubble art-bubble-ai art-bubble-medium"></span>
      </div>
    )
  }

  // the last step: download a file
  return (
    <div className="art art-center" aria-hidden="true">
      <div className="art-file">
        <span className="art-file-name">.html</span>
        <span className="art-bar art-bar-long"></span>
        <span className="art-bar art-bar-short"></span>
        <span className="art-down"></span>
      </div>
    </div>
  )
}

export default StepArt
