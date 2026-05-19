from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
import random, json
from threading import Timer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

rooms = []
players = []
cards = []
num = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
for x in ["D", "H", "C", "S"]:
    for y in num:
        cards.append((x,y))

random.shuffle(cards)

class Player:
    def __init__(self, uid, name, websocket):
        self.uid = uid
        self.name = name
        self.ws = websocket
        self.cards = [] 

    def append(self, cards : list):
        self.card.extend(cards)
    
    def move(self, cards: list):
        if set(cards).issubset(set(self.cards)):
            self.cards = list(set(self.cards) - set(cards))
            return True
        else:
            return False
    
class GameRoom:
    def __init__(self, roomid):
        self.roomid = roomid
        self.players : dict[int, Player] = {}
        self.order: list = [] #Store UIDs
        self.currentStack : list = []
        self.lastMove : list = []
        self.lastClaim: tuple = None
        self.currP : int = None
        self.lastMoveP : int = None
        self.startingP : int = None
        self.canObject : bool = False
        self.inGame : bool = False

    def move(self, cards, claim, uid):
        if self.inGame:
            if self.currP == uid:
                if cards is not None:
                    if self.players.get(uid).move(cards):
                        self.currentStack.extend(cards)
                        self.lastMove = cards
                        self.lastClaim = claim
                        self.lastMoveP = 0
                        return {"status": True, "empty": False, "claim": claim}
                    else:
                        return {"status": False, "detail": "Wrong Cards"}
                else:
                    self.lastMove = []
                    self.lastClaim = None
                    self.lastMoveP += 1
                    if self.lastMoveP == len(self.order)+1:
                        return {"status": True, "New Round": True, "empty": True}
                    else:
                        return {"status" : True, "empty": True, "New Round": False}
            else:
                return {"status": False, "detail": "Not Your Move"}
        else:
            return RuntimeError
        
    async def object(self, uid):
        if self.inGame:
            c = 0
            for card in self.lastMove:
                if card[1] == self.lastClaim[1]: 
                    c += 1
            if c == self.lastClaim[0]:
                self.append(uid, self.currentStack)
                await rm.broadcast(self.roomid, {"action": "Object", "judge": "Lost", "detail": f"{self.players.get(uid).name} lost the judgement. New Round begins"})
            else:
                self.append(self.currP, self.currentStack)
                await rm.broadcast(self.roomid, {"action": "Object", "judge": "Won", "detail": f"{self.players.get(self.currP).name} lost the judgement. New Round begins"})
        else:
            await rm.sendMsg(self.roomid, uid, {"action": "error", "detail": "Not In Game"})

    def append(self, uid, cards : list):
        self.players.get(uid).append(cards)
        
    def nextPlayer(self):
        a = None
        b = False
        for uid in self.order:
            if uid == self.currP:
                b = True
            if b:
                a = uid
        if a is None:
            a = self.order[0]
        self.currP = a
        return a

    def nextRound(self):
        self.currentStack = []
        self.lastMove = []
        self.lastClaim = None
        a = None
        b = False
        for uid in self.order:
            if uid == self.startingP:
                b = True
            if b:
                a = uid
        if a is None:
            a = self.order[0]
        self.startingP = a

    async def startPlay(self):
        if len(self.order) > 1:
            self.inGame = True
            self.currP = self.order[0]
            self.startingP = self.currP
            await self.give()
            return True
        else:
            return False
    
    async def give(self):
        global cards
        random.shuffle(cards)
        t = cards.copy()
        for p in self.players.values():
            p.cards = t[:2] #TODO: Give correct no. of cards
            await rm.sendMsg(self.roomid, p.uid, {"action": "takeCards", "cards": p.cards})
            t = t[2:]




class RoomManager:
    def __init__(self):
        self.games : dict[int, GameRoom] = {}
    
    async def connect(self, uid : int, roomid : int, name : str, websocket: WebSocket):
        await websocket.accept()
        room = self.games.setdefault(roomid, GameRoom(roomid))
        if not room.inGame:
            p = Player(uid, name, websocket)
            if uid in room.players:
                await room.players.get(uid).ws.close(1000, "")
                room.players.pop(uid)
            room.players[uid] = p
            room.order.append(uid)
            print(room.players)
            msg = [{"id":x, "name":y.name} for x,y in room.players.items()]
            await self.broadcast(roomid, {"players": str(json.dumps(msg)), "action": "connection", "master": room.order[0]})
        else:
            await websocket.send_json({"action": "Not-Join", "detail": "In-game"})

    def disconnect(self, uid, roomid):
        global rooms
        room = self.games.get(roomid)
        if uid in room.players:
            room.players.pop(uid)
            l = []
            for p in room.order:
                if p == uid:
                    continue
                l.append(p)
            room.order = l 
        if not bool(room.players):
            self.games.pop(roomid)
            r = []
            for x in rooms:
                if x == roomid:
                    continue
                r.append(x)
            rooms = r

    async def sendMsg(self, roomid, uid : int, msg):
        ws = self.games.get(roomid).players.get(uid).ws
        if ws is not None:
          await ws.send_json(msg)

    async def broadcast(self, roomid, msg):
        l = self.games.get(roomid).order
        for uid in l:
            try:
                await self.sendMsg(roomid, uid, msg)
            except Exception:
                self.disconnect(roomid, uid)

    def move(self, roomid, uid, cards, claim):
        return self.games.get(roomid).move(cards, claim, uid)

rm = RoomManager()

@app.websocket("/ws/{roomid}/{uid}/{name}")
async def RoomConnection(websocket: WebSocket, uid : int, name : str, roomid : int):
    await rm.connect(uid, roomid, name+"#"+str(uid), websocket)

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            print(data)
            if action == "move":
                c = []
                for x in data.get("cards"):
                    c.append((x[0], x[1]))
                claim = (data.get("claim")[0], data.get("claim")[1])
                res = rm.move(roomid, uid, c, claim)
                if res.get("status"):
                    await rm.broadcast(roomid, {"action": "moved", "uid": uid, "empty":res.get("empty"), "claim": res.get("claim")})
                else:
                    await rm.sendMsg(roomid, uid, {"action": "notYourMove", "detail": res.get("detail")})
                #TODO: Return Response Based on Res
            elif action == "object":
                await rm.games.get(roomid).object(uid)
            elif action == "play":
                if not await rm.games.get(roomid).startPlay():
                    await websocket.send_json({"action": "error", "detail": "Too less people"})
    except WebSocketDisconnect:
        pass
    finally:
        rm.disconnect(uid, roomid)


@app.get("/create")
def createRoom():
    a = random.randint(1000, 9999)
    if a in rooms:
        createRoom()
    rooms.append(a)
    return JSONResponse(content={"roomid": a}, status_code=200)

@app.get("/join/{roomid}")
def join(roomid : int):
    print(rooms)
    return JSONResponse(content={"join": roomid in rooms}, status_code=200)

@app.get("/uid")
def getUID():
    a = random.randint(100,999)
    if a in players:
        getUID()
    players.append(a)
    return JSONResponse(content={"uid": a}, status_code=200)

@app.post("/logout/{uid}")
def logout(uid : int):
    global players
    p = []
    for x in players:
        if x == uid:
            continue
        p.append(x)
    players = p
    