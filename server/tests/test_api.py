from starlette.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "BuildNest server is running" in data["message"]


def test_signup_missing_fields():
    response = client.post("/api/auth/signup", json={"name": "Varun"})
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "Name, email and password are all required" in data["message"]


def test_signup_invalid_email():
    response = client.post("/api/auth/signup", json={
        "name": "Varun",
        "email": "invalid-email",
        "password": "validPassword123"
    })
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "valid email address" in data["message"].lower()


def test_signup_short_password():
    response = client.post("/api/auth/signup", json={
        "name": "Varun",
        "email": "varun@example.com",
        "password": "123"
    })
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "at least 6 characters" in data["message"]


def test_login_missing_credentials():
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert "email and password" in data["message"]


def test_protected_route_without_token():
    response = client.get("/api/projects")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert "Please log in to continue" in data["message"]


def test_protected_route_with_invalid_token():
    response = client.get(
        "/api/projects",
        headers={"Authorization": "Bearer invalid_token_abc"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert "session has expired" in data["message"].lower()
