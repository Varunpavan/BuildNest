import re
import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.api.routes.auth import EMAIL_REGEX


def test_password_hashing_and_verification():
    plain = "secretPassword123"
    hashed = hash_password(plain)

    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("wrongPassword", hashed) is False


def test_jwt_signing_and_decoding():
    user_id = "6713cd108f9024f0c4391e25"
    token = create_access_token(user_id)

    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded["id"] == user_id
    assert "exp" in decoded


def test_email_validation():
    assert bool(EMAIL_REGEX.match("user@example.com")) is True
    assert bool(EMAIL_REGEX.match("developer.varun@domain.co.in")) is True
    assert bool(EMAIL_REGEX.match("plainaddress")) is False
    assert bool(EMAIL_REGEX.match("user@domain")) is False
    assert bool(EMAIL_REGEX.match("user@.com")) is False
