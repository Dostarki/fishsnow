"""Residents, fixed home doorways, and an authoritative home → market → home loop."""
from datetime import datetime, timezone

RESIDENTS = [
    {'id': 'mila', 'name': 'Mila', 'home': 'Cedar Cottage', 'color': '#b889ab', 'travel_time': 9.0, 'rest_time': 7.0,
     'route': [[3.38, 1.05, -9.25], [3.38, 1.05, -8.35], [7.1, 1.05, -8.35], [7.1, 1.05, 5.65], [.4, 1.05, 5.65], [.4, 1.05, 4.13]]},
    {'id': 'owen', 'name': 'Owen', 'home': 'Pine Cottage', 'color': '#baa574', 'travel_time': 8.0, 'rest_time': 9.0,
     'route': [[-.86, 1.05, -7.94], [-.86, 1.05, -7.2], [-2.6, 1.05, -7.2], [-2.6, 1.05, 4.4], [.4, 1.05, 4.4], [.4, 1.05, 4.13]]},
    {'id': 'hazel', 'name': 'Hazel', 'home': 'Rosewood House', 'color': '#82a799', 'travel_time': 6.0, 'rest_time': 8.0,
     'route': [[8.98, 1.05, -.25], [8.98, 1.05, .5], [7.1, 1.05, .5], [7.1, 1.05, 5.65], [.4, 1.05, 5.65], [.4, 1.05, 4.13]]},
    {'id': 'finn', 'name': 'Finn', 'home': 'Harbor Cottage', 'color': '#b88873', 'travel_time': 7.0, 'rest_time': 8.5,
     'route': [[2.82, 1.05, 9.65], [2.82, 1.05, 10.3], [7.1, 1.05, 10.3], [7.1, 1.05, 5.65], [.4, 1.05, 5.65], [.4, 1.05, 4.13]]},
    {'id': 'luna', 'name': 'Luna', 'home': 'Bluebell House', 'color': '#859bb7', 'travel_time': 8.0, 'rest_time': 6.0,
     'route': [[12.68, 1.05, -.95], [12.68, 1.05, .1], [11.5, 1.05, .1], [11.5, 1.05, 5.65], [.4, 1.05, 5.65], [.4, 1.05, 4.13]]},
    {'id': 'theo', 'name': 'Theo', 'home': 'Northwood Lodge', 'color': '#bca46b', 'travel_time': 10.0, 'rest_time': 6.5,
     'route': [[10.38, 1.05, -8.69], [10.38, 1.05, -7.5], [7.1, 1.05, -7.5], [7.1, 1.05, 5.65], [.4, 1.05, 5.65], [.4, 1.05, 4.13]]},
]
BY_ID = {r['id']: r for r in RESIDENTS}


def initial_villagers():
    return [{'id': r['id'], 'state': 'home', 'phase_time': 0.0,
             'home_wait': 1.0 + i * 1.3, 'carried_fish': 0, 'trips_completed': 0,
             'arrived_at': 0.0} for i, r in enumerate(RESIDENTS)]


def migrate_village(state):
    state.setdefault('villagers', initial_villagers())
    state.setdefault('simulation_time', 0.0)
    state.setdefault('next_sale_at', 0.0)
    state.setdefault('customers_served', state.get('fish_sold', 0))
    if 'market_batches' not in state:
        # Existing balances stay intact; never re-deliver historically credited catches.
        state['market_batches'] = []
        for w in state['workers']:
            w['delivered_batches'] = int((w['elapsed'] + 12) // 30)


def advance_villagers(state, dt, characters):
    for resident in state['villagers']:
        meta = BY_ID[resident['id']]
        resident['phase_time'] += dt
        if resident['state'] == 'home' and resident['phase_time'] >= resident['home_wait']:
            resident.update(state='to_market', phase_time=0.0, carried_fish=0)
        elif resident['state'] == 'to_market' and resident['phase_time'] >= meta['travel_time']:
            resident.update(state='waiting', phase_time=0.0, arrived_at=state['simulation_time'])
        elif resident['state'] == 'returning' and resident['phase_time'] >= meta['travel_time']:
            resident.update(state='home', phase_time=0.0, carried_fish=0, home_wait=meta['rest_time'])
            resident['trips_completed'] += 1

    waiting = sorted((r for r in state['villagers'] if r['state'] == 'waiting' and r['phase_time'] >= .8), key=lambda r: r['arrived_at'])
    if not waiting or not state['market_batches'] or state['simulation_time'] < state['next_sale_at']:
        return
    resident = waiting[0]
    quantity = min(3, sum(b['quantity'] for b in state['market_batches']))
    remaining, gain = quantity, 0
    workers = {w['character']: w for w in state['workers']}
    while remaining:
        batch = state['market_batches'][0]
        take = min(remaining, batch['quantity'])
        worker = workers[batch['character']]
        data = characters[batch['character']]
        worker['sold'] += take
        earned = round(worker['sold'] * data['daily_yield'] * 30 * 1_000_000 / (86400 * data['capacity']))
        gain += earned - worker['earned_micro']
        worker['earned_micro'] = earned
        batch['quantity'] -= take
        remaining -= take
        if not batch['quantity']:
            state['market_batches'].pop(0)
    state['balance_micro'] += gain
    state['fish_sold'] += quantity
    state['customers_served'] += 1
    state['next_sale_at'] = state['simulation_time'] + .9
    resident.update(state='returning', phase_time=0.0, carried_fish=quantity)
    state['events'].insert(0, {'text': f"{BY_ID[resident['id']]['name']} bought {quantity} fish · +{gain / 1_000_000:.4f} FROST", 'kind': 'sale', 'at': datetime.now(timezone.utc).isoformat()})
    state['events'] = state['events'][:12]


def public_villagers(state):
    queue = sorted((r for r in state['villagers'] if r['state'] == 'waiting'), key=lambda r: r['arrived_at'])
    slots = {r['id']: i for i, r in enumerate(queue)}
    return [{**BY_ID[r['id']], **r, 'queue_position': slots.get(r['id'], 0)} for r in state['villagers']]