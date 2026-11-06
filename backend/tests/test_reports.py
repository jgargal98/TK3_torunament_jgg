from tests.test_matches import pending, start_tournament, win


def play_all(client, tournament: dict) -> dict:
    while tournament["status"] != "FINALIZADO":
        tournament = win(client, pending(tournament)[0]).json()
    return tournament


def stats_by_id(client) -> dict[int, dict]:
    stats = client.get("/api/stats/participants").json()
    return {item["participant"]["id"]: item for item in stats}


def test_stats_of_a_finished_tournament(client):
    tournament = play_all(client, start_tournament(client, 4))
    stats = stats_by_id(client)
    champion = stats[tournament["champion"]["id"]]

    assert (champion["wins"], champion["losses"], champion["matches_played"]) == (2, 0, 2)
    assert champion["win_rate"] == 100
    assert champion["tournaments_won"] == 1
    assert sum(item["wins"] for item in stats.values()) == 3
    assert sum(item["losses"] for item in stats.values()) == 3
    assert sum(item["tournaments_won"] for item in stats.values()) == 1


def test_a_bye_is_neither_a_win_nor_a_match(client):
    tournament = start_tournament(client, 3)
    bye_player = next(m for m in tournament["matches"] if m["is_bye"])["participant1"]["id"]
    stats = stats_by_id(client)
    assert stats[bye_player]["matches_played"] == 0
    assert stats[bye_player]["wins"] == 0
    assert stats[bye_player]["win_rate"] == 0


def test_best_record_comes_first(client):
    tournament = play_all(client, start_tournament(client, 4))
    ranking = client.get("/api/stats/participants").json()
    assert ranking[0]["participant"]["id"] == tournament["champion"]["id"]


def test_deactivated_participants_keep_their_stats(client):
    tournament = play_all(client, start_tournament(client, 2))
    champion_id = tournament["champion"]["id"]
    client.patch(f"/api/participants/{champion_id}/active", json={"active": False})
    assert stats_by_id(client)[champion_id]["wins"] == 1


def test_stats_of_one_participant(client):
    tournament = play_all(client, start_tournament(client, 4))
    champion_id = tournament["champion"]["id"]

    stats = client.get(f"/api/participants/{champion_id}/stats").json()
    assert stats["participant"]["id"] == champion_id
    assert (stats["wins"], stats["losses"], stats["tournaments_won"]) == (2, 0, 1)

    assert client.get("/api/participants/999/stats").status_code == 404


def test_history_lists_only_played_matches_in_order(client):
    tournament = start_tournament(client, 3)
    url = f"/api/tournaments/{tournament['id']}/history"
    assert client.get(url).json() == []  # the BYE is not a match

    tournament = play_all(client, tournament)
    history = client.get(url).json()
    assert [item["round_name"] for item in history] == ["Semifinales", "Final"]
    assert history[-1]["winner"]["id"] == tournament["champion"]["id"]
    assert history[0]["winner"]["id"] != history[0]["loser"]["id"]


def test_history_of_unknown_tournament(client):
    assert client.get("/api/tournaments/999/history").status_code == 404
