from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.services.gemini_service import (
    generate_page,
    is_quota_or_rate_limit_error,
)


def test_is_quota_or_rate_limit_error():
    # True for rate limits, token exhaustion, and quota errors
    assert is_quota_or_rate_limit_error(Exception("429 Too Many Requests")) is True
    assert is_quota_or_rate_limit_error(Exception("ResourceExhausted: Quota exceeded for quota metric 'Tokens'")) is True
    assert is_quota_or_rate_limit_error(Exception("503 Service Unavailable")) is True
    assert is_quota_or_rate_limit_error(Exception("Rate limit reached")) is True

    # False for client errors or input validation
    assert is_quota_or_rate_limit_error(Exception("400 Bad Request")) is False
    assert is_quota_or_rate_limit_error(Exception("Invalid API key format")) is False
    assert is_quota_or_rate_limit_error(Exception("Prompt syntax error")) is False


@pytest.mark.anyio
async def test_cascades_to_fallback_on_primary_quota_error():
    """
    Verifies that when the primary model hits a 429 quota error,
    the service automatically catches it and succeeds using the fallback model.
    """
    mock_client = MagicMock()

    # Primary model throws 429, Fallback model succeeds
    success_response = MagicMock()
    success_response.text = (
        "TITLE: Bakery Shop\nSUMMARY: Built a bakery page.\n---HTML---\n"
        "<!DOCTYPE html><html><body><h1>Fresh Bread</h1></body></html>"
    )
    success_response.candidates = [MagicMock(finish_reason="STOP")]

    quota_error = Exception("429 ResourceExhausted: Quota exceeded for model")

    mock_generate = AsyncMock(side_effect=[quota_error, success_response])
    mock_client.aio.models.generate_content = mock_generate

    with patch("app.services.gemini_service.get_genai_client", return_value=mock_client):
        result = await generate_page(prompt="Build a bakery page")

    # Assertions
    assert result["title"] == "Bakery Shop"
    assert "Fresh Bread" in result["html"]
    # Verify generate_content was called twice (once for primary, once for fallback)
    assert mock_generate.call_count == 2


@pytest.mark.anyio
async def test_cascades_on_max_tokens_cutoff():
    """
    Verifies that when the primary model truncates output with MAX_TOKENS,
    the service cascades to the fallback model.
    """
    mock_client = MagicMock()

    truncated_response = MagicMock()
    truncated_response.candidates = [MagicMock(finish_reason="MAX_TOKENS")]
    truncated_response.text = "TITLE: Incomplete\nSUMMARY: Truncated\n---HTML---\n<div>half-done"

    complete_response = MagicMock()
    complete_response.candidates = [MagicMock(finish_reason="STOP")]
    complete_response.text = (
        "TITLE: Complete Store\nSUMMARY: Full page ready.\n---HTML---\n"
        "<!DOCTYPE html><html><body><h1>Store</h1></body></html>"
    )

    mock_generate = AsyncMock(side_effect=[truncated_response, complete_response])
    mock_client.aio.models.generate_content = mock_generate

    with patch("app.services.gemini_service.get_genai_client", return_value=mock_client):
        result = await generate_page(prompt="Build a massive store")

    assert result["title"] == "Complete Store"
    assert "Store" in result["html"]
    assert mock_generate.call_count == 2
