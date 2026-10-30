def test_create_and_list(client):
    response = client.post("/api/participants", json={"nick": "  Neo  ", "logo": "🦊"})
    assert response.status_code == 201
    created = response.json()
    assert created["nick"] == "Neo"
    assert created["logo"] == "🦊"
    assert created["active"] is True

    listed = client.get("/api/participants").json()
    assert [p["nick"] for p in listed] == ["Neo"]


def test_nick_must_be_unique(client):
    client.post("/api/participants", json={"nick": "Neo", "logo": "🦊"})
    duplicated = client.post("/api/participants", json={"nick": "Neo", "logo": "🐺"})
    assert duplicated.status_code == 409


def test_invalid_input(client):
    assert client.post("/api/participants", json={"nick": " ", "logo": "🦊"}).status_code == 422
    assert client.post("/api/participants", json={"nick": "Neo", "logo": ""}).status_code == 422


def test_edit(client):
    created = client.post("/api/participants", json={"nick": "Neo", "logo": "🦊"}).json()
    response = client.put(
        f"/api/participants/{created['id']}", json={"nick": "Trinity", "logo": "🐉"}
    )
    assert response.status_code == 200
    assert client.get(f"/api/participants/{created['id']}").json()["nick"] == "Trinity"


def test_activate_and_deactivate(client):
    created = client.post("/api/participants", json={"nick": "Neo", "logo": "🦊"}).json()

    response = client.patch(f"/api/participants/{created['id']}/active", json={"active": False})
    assert response.json()["active"] is False
    assert client.get("/api/participants?active=true").json() == []
    assert len(client.get("/api/participants?active=false").json()) == 1

    client.patch(f"/api/participants/{created['id']}/active", json={"active": True})
    assert len(client.get("/api/participants?active=true").json()) == 1


def test_not_found(client):
    assert client.get("/api/participants/999").status_code == 404
