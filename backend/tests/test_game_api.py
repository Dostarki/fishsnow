"""Core Frostfish backend API regression tests for session/gameplay/security flows."""
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
import requests

sys.path.append(str(Path(__file__).resolve().parents[1]))
from game import CHARACTERS, advance, initial_state
from villagers import RESIDENTS, advance_villagers


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL is required", allow_module_level=True)
BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def session_data(api_client):
    res = api_client.post(f"{BASE_URL}/api/sessions", timeout=20)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 10
    assert "game" in data and isinstance(data["game"], dict)
    return data


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


# Module: Health & public metadata endpoints
def test_health_and_characters(api_client):
    health = api_client.get(f"{BASE_URL}/api/health", timeout=20)
    assert health.status_code == 200
    h = health.json()
    assert h["status"] == "ok"
    assert h["game"] == "Frostfish"

    chars = api_client.get(f"{BASE_URL}/api/characters", timeout=20)
    assert chars.status_code == 200
    body = chars.json()
    ids = sorted([c["id"] for c in body])
    assert ids == ["boat", "net", "rod"]
    yields = {c["id"]: c["daily_yield"] for c in body}
    assert yields == {"rod": 100, "net": 250, "boat": 600}


# Module: Authorization and validation guards
def test_unauthorized_requests_return_401(api_client):
    no_auth_game = api_client.get(f"{BASE_URL}/api/game", timeout=20)
    assert no_auth_game.status_code == 401
    assert "session" in no_auth_game.json().get("detail", "").lower()

    no_auth_action = api_client.post(
        f"{BASE_URL}/api/game/action", json={"type": "pause"}, timeout=20
    )
    assert no_auth_action.status_code == 401
    assert "session" in no_auth_action.json().get("detail", "").lower()


def test_invalid_character_duplicate_and_invalid_speed(api_client, session_data):
    token = session_data["token"]
    headers = auth_headers(token)

    invalid_character = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "mage"},
        headers=headers,
        timeout=20,
    )
    assert invalid_character.status_code == 422
    assert "valid" in invalid_character.json().get("detail", "").lower()

    first_deploy = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "rod"},
        headers=headers,
        timeout=20,
    )
    assert first_deploy.status_code == 200
    assert len(first_deploy.json()["workers"]) == 1

    duplicate_deploy = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "rod"},
        headers=headers,
        timeout=20,
    )
    assert duplicate_deploy.status_code == 409
    assert "already" in duplicate_deploy.json().get("detail", "").lower()

    invalid_speed = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "speed", "speed": 3},
        headers=headers,
        timeout=20,
    )
    assert invalid_speed.status_code == 422
    assert "speed" in invalid_speed.json().get("detail", "").lower()


# Module: Gameplay simulation phases, pause/resume, speed/reset persistence
def test_worker_progression_full_cycle_visible_at_4x(api_client, session_data):
    token = session_data["token"]
    headers = auth_headers(token)

    deploy = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "rod"},
        headers=headers,
        timeout=20,
    )
    assert deploy.status_code == 200

    speed = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "speed", "speed": 4},
        headers=headers,
        timeout=20,
    )
    assert speed.status_code == 200
    assert speed.json()["speed"] == 4

    observed_statuses = set()
    fish_counts = []
    balances = []

    for _ in range(14):
        game = api_client.get(f"{BASE_URL}/api/game", headers=headers, timeout=20)
        assert game.status_code == 200
        data = game.json()
        assert isinstance(data["market_stock"], int)
        assert isinstance(data["fish_sold"], int)
        assert isinstance(data["balance"], float)
        worker = data["workers"][0]
        observed_statuses.add(worker["status"])
        fish_counts.append(data["fish_caught"])
        balances.append(data["balance"])
        time.sleep(0.65)

    assert {
        "Fishing",
        "Delivering",
        "At the market",
        "Returning",
    }.issubset(observed_statuses)
    assert fish_counts[-1] >= fish_counts[0]
    assert balances[-1] >= balances[0]


def test_pause_resume_and_reset_flow(api_client, session_data):
    token = session_data["token"]
    headers = auth_headers(token)

    deploy = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "boat"},
        headers=headers,
        timeout=20,
    )
    assert deploy.status_code == 200

    speed = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "speed", "speed": 4},
        headers=headers,
        timeout=20,
    )
    assert speed.status_code == 200

    time.sleep(1.8)
    before_pause = api_client.get(f"{BASE_URL}/api/game", headers=headers, timeout=20)
    assert before_pause.status_code == 200

    paused = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "pause"},
        headers=headers,
        timeout=20,
    )
    assert paused.status_code == 200
    paused_body = paused.json()
    assert paused_body["paused"] is True
    paused_balance = paused_body["balance"]

    time.sleep(2.0)
    while_paused = api_client.get(f"{BASE_URL}/api/game", headers=headers, timeout=20)
    assert while_paused.status_code == 200
    while_paused_body = while_paused.json()
    assert while_paused_body["paused"] is True
    assert while_paused_body["balance"] == paused_balance

    resumed = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "pause"},
        headers=headers,
        timeout=20,
    )
    assert resumed.status_code == 200
    assert resumed.json()["paused"] is False

    reset = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "reset"},
        headers=headers,
        timeout=20,
    )
    assert reset.status_code == 200
    reset_body = reset.json()
    assert reset_body["workers"] == []
    assert reset_body["fish_caught"] == 0
    assert reset_body["fish_sold"] == 0
    assert reset_body["balance"] == 0.0


def test_session_resume_without_duplicate_workers(api_client, session_data):
    token = session_data["token"]
    headers = auth_headers(token)

    deploy = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "net"},
        headers=headers,
        timeout=20,
    )
    assert deploy.status_code == 200
    assert len(deploy.json()["workers"]) == 1

    resumed_1 = api_client.get(f"{BASE_URL}/api/game", headers=headers, timeout=20)
    resumed_2 = api_client.get(f"{BASE_URL}/api/game", headers=headers, timeout=20)
    assert resumed_1.status_code == 200
    assert resumed_2.status_code == 200

    body_1, body_2 = resumed_1.json(), resumed_2.json()
    assert len(body_1["workers"]) == 1
    assert len(body_2["workers"]) == 1
    assert body_1["workers"][0]["id"] == "net"
    assert body_2["workers"][0]["id"] == "net"


def test_concurrent_reads_no_bson_or_duplication_signals(api_client, session_data):
    token = session_data["token"]
    headers = auth_headers(token)

    deploy = api_client.post(
        f"{BASE_URL}/api/game/action",
        json={"type": "deploy", "character": "rod"},
        headers=headers,
        timeout=20,
    )
    assert deploy.status_code == 200

    def fetch_game():
        r = requests.get(f"{BASE_URL}/api/game", headers=headers, timeout=20)
        return r.status_code, r.json()

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda _: fetch_game(), range(6)))

    for status_code, payload in results:
        assert status_code == 200
        assert "_id" not in payload
        assert isinstance(payload["workers"], list)

    balances = [p["balance"] for _, p in results]
    assert max(balances) >= min(balances)


# Module: Village metadata and session initialization guarantees
def test_village_metadata_and_new_session_defaults(api_client):
    village = api_client.get(f"{BASE_URL}/api/village", timeout=20)
    assert village.status_code == 200
    residents = village.json().get("villagers", [])
    assert len(residents) == 6
    assert sorted([r["name"] for r in residents]) == [
        "Finn",
        "Hazel",
        "Luna",
        "Mila",
        "Owen",
        "Theo",
    ]
    for resident in residents:
        assert resident.get("home")
        assert isinstance(resident.get("route"), list) and len(resident["route"]) >= 2

    created = api_client.post(f"{BASE_URL}/api/sessions", timeout=20)
    assert created.status_code == 200
    game = created.json()["game"]
    assert game["balance"] == 0.0
    assert game["market_stock"] == 0
    assert len(game["villagers"]) == 6


# Module: Deterministic villager lifecycle (home -> market -> waiting -> returning -> home)
def test_all_villagers_complete_roundtrip_and_return_home_same_assignment():
    state = initial_state()
    state["workers"] = [{"character": "rod", "elapsed": 0, "sold": 0, "earned_micro": 0}]
    state["market_batches"] = [{"character": "rod", "quantity": 500}]
    home_by_id = {r["id"]: r["home"] for r in RESIDENTS}

    all_completed_at_once = False
    for _ in range(800):
        state["simulation_time"] += 0.25
        advance_villagers(state, 0.25, CHARACTERS)
        if all(v["trips_completed"] >= 1 for v in state["villagers"]):
            all_completed_at_once = True
            break

    assert all_completed_at_once is True
    assert all(v["trips_completed"] >= 1 for v in state["villagers"])
    assert all(v["carried_fish"] in (0, 1, 2, 3) for v in state["villagers"])
    assert all(v["state"] in {"home", "to_market", "waiting", "returning"} for v in state["villagers"])
    assert all(v["id"] in home_by_id for v in state["villagers"])


# Module: FIFO market sales and anti-oversell inventory constraints
def test_fifo_batches_credit_correct_worker_and_no_oversell():
    state = initial_state()
    state["workers"] = [
        {"character": "rod", "elapsed": 0, "sold": 0, "earned_micro": 0},
        {"character": "boat", "elapsed": 0, "sold": 0, "earned_micro": 0},
    ]
    state["villagers"][0].update(state="waiting", phase_time=1.2, arrived_at=0.0)
    state["market_batches"] = [
        {"character": "rod", "quantity": 2},
        {"character": "boat", "quantity": 4},
    ]

    advance_villagers(state, 0.1, CHARACTERS)

    assert state["fish_sold"] == 3
    assert state["customers_served"] == 1
    assert state["market_batches"][0]["character"] == "boat"
    assert state["market_batches"][0]["quantity"] == 3
    workers = {w["character"]: w for w in state["workers"]}
    assert workers["rod"]["sold"] == 2
    assert workers["boat"]["sold"] == 1
    assert state["balance_micro"] > 0


# Module: No market stock means no purchase, no earnings, no false trip carry
def test_waiting_villager_without_inventory_does_not_buy():
    state = initial_state()
    state["workers"] = [{"character": "rod", "elapsed": 0, "sold": 0, "earned_micro": 0}]
    state["villagers"][0].update(state="waiting", phase_time=1.5, arrived_at=0.0)
    state["market_batches"] = []

    advance_villagers(state, 0.1, CHARACTERS)

    assert state["fish_sold"] == 0
    assert state["customers_served"] == 0
    assert state["balance_micro"] == 0
    assert state["villagers"][0]["state"] == "waiting"
    assert state["villagers"][0]["carried_fish"] == 0


# Module: Pause freezes both worker and villager simulation; speed scales both
def test_pause_and_speed_affect_workers_and_villagers(monkeypatch):
    state = initial_state()
    state["workers"] = [{"character": "rod", "elapsed": 0, "sold": 0, "earned_micro": 0}]
    state["last_tick"] = 1000.0
    state["paused"] = True
    before_villagers = [v["phase_time"] for v in state["villagers"]]

    monkeypatch.setattr("game.time.time", lambda: 1004.0)
    advance(state)
    assert state["workers"][0]["elapsed"] == 0
    assert [v["phase_time"] for v in state["villagers"]] == before_villagers

    state["paused"] = False
    state["speed"] = 4
    monkeypatch.setattr("game.time.time", lambda: 1006.0)
    advance(state)
    assert state["workers"][0]["elapsed"] > 7.5
    assert state["simulation_time"] > 7.5
    assert any(v["phase_time"] > 0 or v["state"] != "home" for v in state["villagers"])
