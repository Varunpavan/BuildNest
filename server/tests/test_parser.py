import pytest
from app.services.gemini_service import remove_code_fences, read_reply


def test_strip_markdown_code_fences():
    input_with_fences = "```html\n<!DOCTYPE html><html><body><h1>Hello</h1></body></html>\n```"
    cleaned = remove_code_fences(input_with_fences)

    assert not cleaned.startswith("```")
    assert not cleaned.endswith("```")
    assert "<h1>Hello</h1>" in cleaned


def test_parse_standard_response():
    raw_ai_reply = """TITLE: Coffee Shop
SUMMARY: Created a specialty coffee shop landing page.
---HTML---
<!DOCTYPE html>
<html lang="en">
<head><title>Coffee</title></head>
<body><h1>Roast & Brew</h1></body>
</html>"""

    parsed = read_reply(raw_ai_reply)

    assert parsed["title"] == "Coffee Shop"
    assert parsed["summary"] == "Created a specialty coffee shop landing page."
    assert "<h1>Roast & Brew</h1>" in parsed["html"]
    assert parsed["html"].startswith("<!DOCTYPE html>")


def test_auto_wrap_html_fragment():
    fragment_reply = """---HTML---
<div class="card">
  <h2>Quick Card</h2>
  <p>Clean content</p>
</div>"""

    parsed = read_reply(fragment_reply)

    assert "<!DOCTYPE html>" in parsed["html"]
    assert '<html lang="en">' in parsed["html"]
    assert "<h2>Quick Card</h2>" in parsed["html"]


def test_reject_response_without_html():
    bad_reply = """---HTML---
I am an AI assistant and I cannot build web pages today."""

    with pytest.raises(ValueError, match="The AI reply did not contain a web page"):
        read_reply(bad_reply)
