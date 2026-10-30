import pytest

from tests.test_tournaments import create_participants, create_tournament


def start_tournament(client, count: int) -> dict:
    ids = create_participants(client, count)
    tournament = create_tournament(client, ids)
    return client.post(f"/api/tournaments/{tournament['id']}/bracket").json()


def pending(tournament: dict) -> list[dict]:
    return [m for m in tournament["matches"] if m["winner_id"] is None]


def win(client, match: dict, slot: str = "participant1"):
    return client.put(
        f"/api/matches/{match['id']}/winner", json={"winner_id": match[slot]["id"]}
    )


@pytest.mark.parametrize("count", [2, 3, 5, 6, 8, 11])
def test_play_until_champion(client, count):
    tournament = start_tournament(client, count)
    assert tournament["status"] == "GENERADO"

    while tournament["status"] != "FINALIZADO":
        response = win(client, pending(tournament)[0])
        assert response.status_code == 200, response.text
        tournament = response.json()
        assert tournament["status"] in ("EN_CURSO", "FINALIZADO")

    rounds = (count - 1).bit_length()
    final = tournament["matches"][-1]
    assert tournament["champion"]["id"] == final["winner_id"]
    assert tournament["current_round"] == rounds
    assert tournament["pending_matches"] == 0
    assert tournament["finished_at"] is not None
    # A KO bracket of N slots always has N - 1 matches (BYEs included).
    assert len(tournament["matches"]) == (1 << rounds) - 1

    # Every round has half the matches of the previous one, with no duplicated slots.
    for round_number in range(1, rounds + 1):
        positions = [m["position"] for m in tournament["matches"] if m["round"] == round_number]
        assert sorted(positions) == list(range(2 ** (rounds - round_number)))


def test_winners_follow_the_bracket_order(client):
    tournament = start_tournament(client, 4)
    first, second = tournament["matches"]
    win(client, first, "participant2")
    tournament = win(client, second, "participant1").json()

    final = next(m for m in tournament["matches"] if m["round"] == 2)
    assert final["participant1"]["id"] == first["participant2"]["id"]
    assert final["participant2"]["id"] == second["participant1"]["id"]


def test_next_round_only_when_current_is_complete(client):
    tournament = start_tournament(client, 4)
    tournament = win(client, tournament["matches"][0]).json()
    assert tournament["status"] == "EN_CURSO"
    assert tournament["current_round"] == 1
    assert len(tournament["matches"]) == 2


def test_winner_must_be_in_the_match(client):
    tournament = start_tournament(client, 4)
    match = tournament["matches"][0]
    outsider = tournament["matches"][1]["participant1"]["id"]
    response = client.put(f"/api/matches/{match['id']}/winner", json={"winner_id": outsider})
    assert response.status_code == 400


def test_resolved_and_bye_matches_cannot_change(client):
    tournament = start_tournament(client, 3)
    bye = next(m for m in tournament["matches"] if m["is_bye"])
    assert win(client, bye).status_code == 409

    match = next(m for m in tournament["matches"] if not m["is_bye"])
    assert win(client, match).status_code == 200
    assert win(client, match, "participant2").status_code == 409


def test_finished_tournament_is_locked(client):
    tournament = start_tournament(client, 2)
    match = tournament["matches"][0]
    assert win(client, match).json()["status"] == "FINALIZADO"
    assert win(client, match).status_code == 409


def test_results_need_a_generated_bracket(client):
    ids = create_participants(client, 2)
    tournament = create_tournament(client, ids)
    assert tournament["matches"] == []
    assert client.put("/api/matches/999/winner", json={"winner_id": ids[0]}).status_code == 404
