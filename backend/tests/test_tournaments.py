import pytest


def create_participants(client, count: int) -> list[int]:
    ids = []
    for index in range(count):
        response = client.post(
            "/api/participants", json={"nick": f"Player{index + 1}", "logo": "🦊"}
        )
        assert response.status_code == 201
        ids.append(response.json()["id"])
    return ids


def create_tournament(client, ids: list[int], name: str = "Copa KO") -> dict:
    response = client.post("/api/tournaments", json={"name": name, "participant_ids": ids})
    assert response.status_code == 201, response.text
    return response.json()


def test_create_tournament_in_preparation(client):
    ids = create_participants(client, 6)
    tournament = create_tournament(client, ids)
    assert tournament["status"] == "PREPARACION"
    assert tournament["participant_count"] == 6
    assert tournament["total_rounds"] == 3
    assert tournament["bye_count"] == 2
    assert tournament["matches"] == []

    listed = client.get("/api/tournaments").json()
    assert [t["name"] for t in listed] == ["Copa KO"]


def test_only_active_and_unique_participants(client):
    ids = create_participants(client, 3)
    client.patch(f"/api/participants/{ids[0]}/active", json={"active": False})

    inactive = client.post("/api/tournaments", json={"name": "Copa", "participant_ids": ids})
    assert inactive.status_code == 400

    duplicated = client.post(
        "/api/tournaments", json={"name": "Copa", "participant_ids": [ids[1], ids[1]]}
    )
    assert duplicated.status_code == 400

    too_few = client.post("/api/tournaments", json={"name": "Copa", "participant_ids": [ids[1]]})
    assert too_few.status_code == 422


@pytest.mark.parametrize("count, byes", [(2, 0), (3, 1), (5, 3), (6, 2), (8, 0), (11, 5)])
def test_bracket_with_byes(client, count, byes):
    ids = create_participants(client, count)
    tournament = create_tournament(client, ids)

    response = client.post(f"/api/tournaments/{tournament['id']}/bracket")
    assert response.status_code == 200
    tournament = response.json()
    assert tournament["status"] == "GENERADO"

    matches = tournament["matches"]
    slots = 1 << (count - 1).bit_length()
    assert len(matches) == slots // 2
    assert all(match["round"] == 1 for match in matches)
    assert sum(match["is_bye"] for match in matches) == byes

    # Every participant appears exactly once and BYE players already go through.
    players = []
    for match in matches:
        players += [p["id"] for p in (match["participant1"], match["participant2"]) if p]
        if match["is_bye"]:
            assert match["participant2"] is None
            assert match["winner_id"] == match["participant1"]["id"]
        else:
            assert match["winner_id"] is None
    assert sorted(players) == sorted(ids)


def test_byes_are_spread_between_both_halves(client):
    ids = create_participants(client, 6)
    tournament = create_tournament(client, ids)
    matches = client.post(f"/api/tournaments/{tournament['id']}/bracket").json()["matches"]
    bye_positions = [match["position"] for match in matches if match["is_bye"]]
    assert bye_positions == [0, 2]


def test_bracket_is_saved_and_cannot_be_generated_twice(client):
    ids = create_participants(client, 4)
    tournament = create_tournament(client, ids)
    generated = client.post(f"/api/tournaments/{tournament['id']}/bracket").json()

    stored = client.get(f"/api/tournaments/{tournament['id']}").json()
    assert stored["matches"] == generated["matches"]

    again = client.post(f"/api/tournaments/{tournament['id']}/bracket")
    assert again.status_code == 409


def test_edit_and_delete_only_in_preparation(client):
    ids = create_participants(client, 4)
    tournament = create_tournament(client, ids[:3])

    edited = client.put(
        f"/api/tournaments/{tournament['id']}",
        json={"name": "Copa editada", "participant_ids": ids},
    ).json()
    assert edited["name"] == "Copa editada"
    assert edited["participant_count"] == 4

    client.post(f"/api/tournaments/{tournament['id']}/bracket")
    blocked_edit = client.put(
        f"/api/tournaments/{tournament['id']}",
        json={"name": "Otra", "participant_ids": ids},
    )
    assert blocked_edit.status_code == 409
    assert client.delete(f"/api/tournaments/{tournament['id']}").status_code == 409

    other = create_tournament(client, ids, name="Copa borrable")
    assert client.delete(f"/api/tournaments/{other['id']}").status_code == 204
    assert client.get(f"/api/tournaments/{other['id']}").status_code == 404


def test_cannot_draw_with_a_deactivated_participant(client):
    ids = create_participants(client, 3)
    tournament = create_tournament(client, ids)
    client.patch(f"/api/participants/{ids[0]}/active", json={"active": False})
    response = client.post(f"/api/tournaments/{tournament['id']}/bracket")
    assert response.status_code == 400
