from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/admin")
async def admin_notifications(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Validate token before accepting
    from jose import jwt, JWTError
    import os

    SECRET_KEY = os.getenv("SECRET_KEY", "secret")
    ALGORITHM = "HS256"

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        if role != "ADMIN":
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)
    print(f"✅ Admin WebSocket connected. Active connections: {len(manager.active_connections)}")

    try:
        while True:
            # Keep connection alive — handle ping from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")  # ✅ respond to ping

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Admin WebSocket disconnected. Active connections: {len(manager.active_connections)}")

    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)