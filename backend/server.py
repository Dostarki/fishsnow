import hashlib
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from game import CHARACTERS, advance, initial_state, public_state
from villagers import RESIDENTS

load_dotenv(Path(__file__).parent / '.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
app = FastAPI(title='Frostfish')
app.add_middleware(CORSMiddleware, allow_origins=os.environ['CORS_ORIGINS'].split(','),
                   allow_credentials=False, allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'Authorization'])


class GameState(BaseModel):
    workers: list[dict]
    balance: float
    fish_sold: int
    fish_caught: int
    market_stock: int
    customers_served: int
    paused: bool
    speed: int
    events: list[dict]
    revision: int
    created_at: str
    demo: bool = True
    villagers: list[dict] = Field(default_factory=list)
    simulation_time: float = 0.0


class SessionResponse(BaseModel):
    token: str
    game: GameState


class Action(BaseModel):
    type: str = Field(max_length=30)
    character: str | None = Field(default=None, max_length=20)
    speed: int | None = None


def session_id(authorization):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'A game session is required.')
    return hashlib.sha256(authorization[7:].encode()).hexdigest()


@app.get('/api/health')
async def health():
    await db.command('ping')
    return {'status': 'ok', 'game': 'Frostfish'}


@app.get('/api/characters')
async def characters():
    return list(CHARACTERS.values())


@app.get('/api/village')
async def village():
    return {'villagers': RESIDENTS}


@app.post('/api/sessions', response_model=SessionResponse)
async def create_session():
    token = secrets.token_urlsafe(40)
    state = initial_state()
    state['session_id'] = hashlib.sha256(token.encode()).hexdigest()
    await db.games.insert_one(state.copy())
    return SessionResponse(token=token, game=GameState(**public_state(state)))


async def mutate(authorization, action=None):
    sid = session_id(authorization)
    for _ in range(8):
        state = await db.games.find_one({'session_id': sid}, {'_id': 0})
        if not state:
            raise HTTPException(401, 'Your session has expired. Start a new adventure.')
        revision = state['revision']
        advance(state)
        if action:
            if action.type == 'deploy':
                if action.character not in CHARACTERS:
                    raise HTTPException(422, 'Choose a valid fisherman.')
                if any(w['character'] == action.character for w in state['workers']):
                    raise HTTPException(409, 'This fisherman is already on your island.')
                state['workers'].append({'character': action.character, 'elapsed': 0, 'sold': 0, 'earned_micro': 0})
                state['events'].insert(0, {'text': f"{CHARACTERS[action.character]['name']} joined the crew", 'kind': 'crew', 'at': datetime.now(timezone.utc).isoformat()})
            elif action.type == 'pause':
                state['paused'] = not state['paused']
            elif action.type == 'speed':
                if action.speed not in (1, 2, 4):
                    raise HTTPException(422, 'Speed must be 1, 2, or 4.')
                state['speed'] = action.speed
            elif action.type == 'reset':
                state = {**initial_state(), 'session_id': sid}
            else:
                raise HTTPException(422, 'Unknown game action.')
        state['revision'] = revision + 1
        state['events'] = state['events'][:12]
        result = await db.games.replace_one({'session_id': sid, 'revision': revision}, state.copy())
        if result.modified_count:
            return GameState(**public_state(state))
    raise HTTPException(409, 'The island is busy. Please try again.')


@app.get('/api/game', response_model=GameState)
async def get_game(authorization: str | None = Header(default=None)):
    return await mutate(authorization)


@app.post('/api/game/action', response_model=GameState)
async def game_action(action: Action, authorization: str | None = Header(default=None)):
    return await mutate(authorization, action)


@app.on_event('startup')
async def indexes():
    await db.games.create_index('session_id', unique=True)


@app.on_event('shutdown')
async def shutdown():
    client.close()