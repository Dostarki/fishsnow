"""Request-driven, server-authoritative DEMO economy; no blockchain transactions."""
import math
import time
from datetime import datetime, timezone
from villagers import advance_villagers, initial_villagers, migrate_village, public_villagers

CHARACTERS = {
    'rod': {'id': 'rod', 'name': 'The Angler', 'role': 'Rod fisherman', 'daily_yield': 100, 'capacity': 5, 'location': 'Whispering Bank'},
    'net': {'id': 'net', 'name': 'The Netter', 'role': 'Net fisherman', 'daily_yield': 250, 'capacity': 8, 'location': 'Frostwater Dock'},
    'boat': {'id': 'boat', 'name': 'The Captain', 'role': 'Boat fisherman', 'daily_yield': 600, 'capacity': 12, 'location': 'Driftwood Harbor'},
}
CYCLE = 30


def initial_state():
    return {'workers': [], 'balance_micro': 0, 'fish_sold': 0, 'fish_caught': 0,
            'paused': False, 'speed': 1, 'events': [], 'revision': 0,
            'last_tick': time.time(), 'created_at': datetime.now(timezone.utc).isoformat(),
            'villagers': initial_villagers(), 'market_batches': [], 'customers_served': 0,
            'simulation_time': 0.0, 'next_sale_at': 0.0}


def worker_view(worker, state):
    data = CHARACTERS[worker['character']]
    phase, capacity = worker['elapsed'] % CYCLE, data['capacity']
    bucket = math.floor(phase / 12 * capacity) if phase < 12 else capacity if phase < 18 else 0
    status = 'Fishing' if phase < 12 else 'Delivering' if phase < 18 else 'At the market' if phase < 24 else 'Returning'
    return {**data, 'elapsed': worker['elapsed'], 'phase': phase, 'status': status, 'bucket': bucket,
            'stock': sum(b['quantity'] for b in state['market_batches'] if b['character'] == worker['character']),
            'sold': worker['sold'], 'earned': worker['earned_micro'] / 1_000_000}


def advance(state):
    migrate_village(state)
    now = time.time()
    delta = min(8, max(0, now - state['last_tick']))
    state['last_tick'] = now
    if state['paused']:
        return
    remaining = delta * state['speed']
    # Small deterministic simulation steps preserve purchases and arrivals across slow polls.
    while remaining > .000001:
        dt = min(.2, remaining)
        remaining -= dt
        state['simulation_time'] += dt
        for worker in state['workers']:
            worker.setdefault('delivered_batches', int((worker['elapsed'] + 12) // CYCLE))
            worker['elapsed'] += dt
            delivered = int((worker['elapsed'] + 12) // CYCLE)
            if delivered > worker['delivered_batches']:
                state['market_batches'].append({'character': worker['character'], 'quantity': (delivered - worker['delivered_batches']) * CHARACTERS[worker['character']]['capacity']})
                worker['delivered_batches'] = delivered
        advance_villagers(state, dt, CHARACTERS)
    state['fish_caught'] = sum(math.floor(w['elapsed'] / CYCLE) * CHARACTERS[w['character']]['capacity'] + min(CHARACTERS[w['character']]['capacity'], math.floor((w['elapsed'] % CYCLE) / 12 * CHARACTERS[w['character']]['capacity'])) for w in state['workers'])


def public_state(state):
    migrate_village(state)
    return {'workers': [worker_view(w, state) for w in state['workers']],
            'balance': state['balance_micro'] / 1_000_000, 'fish_sold': state['fish_sold'],
            'fish_caught': state['fish_caught'], 'customers_served': state['customers_served'],
            'market_stock': sum(b['quantity'] for b in state['market_batches']),
            'paused': state['paused'], 'speed': state['speed'], 'events': state['events'][:12],
            'revision': state['revision'], 'created_at': state['created_at'], 'demo': True,
            'villagers': public_villagers(state), 'simulation_time': state['simulation_time']}