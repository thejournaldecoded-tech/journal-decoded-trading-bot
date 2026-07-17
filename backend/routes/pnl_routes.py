from fastapi import APIRouter, WebSocket
import asyncio
from services.pnl_service import calculate_live_pnl

router = APIRouter()


@router.websocket("/ws/pnl")
async def pnl_stream(websocket: WebSocket):

    await websocket.accept()

    while True:

        data = calculate_live_pnl()

        await websocket.send_json(data)

        await asyncio.sleep(2)