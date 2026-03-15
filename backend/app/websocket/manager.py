from fastapi import WebSocket
from typing import List


class ConnectionManager:

    def __init__(self):
        self.admin_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.admin_connections:
            self.admin_connections.remove(websocket)

    async def notify_admin(self, message: str):
        dead_connections = []

        for connection in self.admin_connections:
            try:
                await connection.send_text(message)
            except:
                # socket already closed
                dead_connections.append(connection)

        # cleanup dead sockets
        for conn in dead_connections:
            self.disconnect(conn)


manager = ConnectionManager()