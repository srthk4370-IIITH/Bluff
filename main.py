from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
import random, json
from threading import Timer
import asyncio

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

    async def append(self, cards : list):
        self.cards.extend(cards)
        await self.ws.send_json({"action": "takeCards", "cards": self.cards})
    
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
        self.objected : bool = False
        self.inGame : bool = False
        self.winners : list = []

    async def move(self, cards, claim, uid):
        if self.inGame:
            if self.currP == uid:
                if cards is not None:
                    if self.players.get(uid).move(cards):
                        self.currentStack.extend(cards)
                        self.lastMove = cards
                        self.lastClaim = claim
                        self.lastMoveP = 0
                        return {"status": True, "empty": False, "claim": claim, "New Round": False}
                    else:
                        return {"status": False, "detail": "Wrong Cards"}
                else:
                    self.lastMove = []
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
                await self.append(uid, self.currentStack)
                await rm.broadcast(self.roomid, {"action": "Object", "judge": "Lost", "detail": f"{self.players.get(uid).name} lost the judgement. New Round begins"})
            else:
                await self.append(self.currP, self.currentStack)
                await rm.broadcast(self.roomid, {"action": "Object", "judge": "Won", "detail": f"{self.players.get(self.currP).name} lost the judgement. New Round begins"})
            await asyncio.create_task(self.nextRound(3))
        else:
            await rm.sendMsg(self.roomid, uid, {"action": "error", "detail": "Not In Game"})

    async def append(self, uid, cards : list):
        await self.players.get(uid).append(cards)
        
    async def nextPlayer(self, time):
        if time != 0:
            await asyncio.sleep(time)
        if self.objected and time > 4:
            self.objected = False
            return True
        self.canObject = False
        a = None
        b = False
        for uid in self.order:
            print(uid, b)
            if uid == self.currP:
                b = True
                continue
            if b:
                a = uid
                break
        if a is None:
            a = self.order[0]
        self.currP = a
        await self.winner()
        if(len(self.order) == 1): 
            self.winners.append(self.players.get(self.order[0]).name)
            await rm.broadcast(self.roomid, {"action":"done", "winners" : self.winners});
            self.reset()
            return True
        await rm.broadcast(self.roomid, {"action":"nextTurn", "uid": a, "nextRound": False, "card": self.lastClaim[1], "name": self.players.get(a).name})

    async def nextRound(self, time):
        if time != 0:
            await asyncio.sleep(time)
        if self.objected and time > 4:
            self.objected = False
            return True
        self.canObject = False
        self.currentStack = []
        self.lastMove = []
        self.lastClaim = None
        a = None
        b = False
        for uid in self.order:
            if uid == self.startingP:
                b = True
                continue
            if b:
                a = uid
                break
        if a is None:
            a = self.order[0]
        self.startingP = a
        self.currP = a
        await self.winner()
        if(len(self.order) == 1): 
            self.winners.append(self.players.get(self.order[0]).name)
            await rm.broadcast(self.roomid, {"action":"done", "winners" : self.winners});
            self.reset()
            return True
        
        await rm.broadcast(self.roomid, {"action":"nextTurn", "uid": a, "nextRound": True, "name": self.players.get(a).name})

    async def startPlay(self, num):
        if len(self.order) > 1:
            self.inGame = True
            self.currP = self.order[0]
            if num == 0: num = 100
            await self.give(min(num, 52//len(self.order)))
            await self.nextRound(0)
            return True
        else:
            return False
    
    async def give(self, num):
        global cards
        random.shuffle(cards)
        t = cards.copy()
        for p in self.players.values():
            p.cards = t[:num] #TODO: Give correct no. of cards
            await rm.sendMsg(self.roomid, p.uid, {"action": "takeCards", "cards": p.cards})
            t = t[num:]

    async def winner(self):
        l = []
        for uid in self.order:
            pl = self.players.get(uid)
            if pl is not None and len(pl.cards) == 0:
                await rm.broadcast(self.roomid, {"action": "winner", "name": pl.name, "uid": pl.uid})
                self.winners.append(pl.name)
                continue
            l.append(uid)
        self.order = l

    def reset(self):
        print("Resetting")
        self.roomid = self.roomid
        self.players : dict[int, Player] = {}
        self.order: list = [] #Store UIDs
        self.currentStack : list = []
        self.lastMove : list = []
        self.lastClaim: tuple = None
        self.currP : int = None
        self.lastMoveP : int = None
        self.startingP : int = None
        self.canObject = False
        self.objected = False
        self.inGame = False
        self.winners : list = []
    




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
            print(room.order)
            msg = [{"id":x, "name":y.name} for x,y in room.players.items()]
            await self.broadcast(roomid, {"players": str(json.dumps(msg)), "action": "connection", "master": room.order[0]})
        else:
            await websocket.send_json({"action": "error", "detail": "In-game"})

    async def disconnect(self, uid, roomid):
        global rooms
        room = self.games.get(roomid)
        if room == None: return False
        if room.players.get(uid) != None:
            room.players.pop(uid)
            l = []
            p1 = None
            prev = None
            for p in room.order:
                if p == uid:
                    prev = p1
                    continue
                l.append(p)
                p1 = p
            room.order = l
            if len(room.players.values()) > 0:
                msg = [{"id":x, "name":y.name} for x,y in room.players.items()]
                await self.broadcast(roomid, {"players": str(json.dumps(msg)), "action": "connection", "master": room.order[0] if len(room.order) > 0 else 0})
                if room.currP == uid:
                    room.currP = prev
                    await room.nextPlayer(0)
        if len(room.players.values()) == 0:
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
        l = self.games.get(roomid).players.values()
        for p in l:
            try:
                await p.ws.send_json(msg)
            except Exception:
                await self.disconnect(roomid, p.uid)

    async def move(self, roomid, uid, cards, claim):
        return await self.games.get(roomid).move(cards, claim, uid)

rm = RoomManager()

@app.websocket("/ws/{roomid}/{uid}/{name}")
async def RoomConnection(websocket: WebSocket, uid : int, name : str, roomid : int):
    await rm.connect(uid, roomid, name+"#"+str(uid), websocket)
    t = None
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            print(data)
            if action == "move":
                c = []
                for x in data.get("cards"):
                    c.append((x[0], x[1]))
                if c == []:
                    c = None
                claim = (data.get("claim")[0], data.get("claim")[1])
                res = await rm.move(roomid, uid, c, claim)
                print(res)
                if res.get("status"):
                    await rm.broadcast(roomid, {"action": "moved", "uid": uid, "empty":res.get("empty"), "claim": res.get("claim"), "name": name})
                    room = rm.games.get(roomid)
                    time = 0.5
                    if not res.get("empty"):
                        room.canObject = True   
                        await rm.broadcast(roomid, {"action": "object?", "claim": claim})
                        time = 6.0
                    if res.get("New Round"):
                        t = asyncio.create_task(room.nextRound(time))
                        await t
                    else:
                        t = asyncio.create_task(room.nextPlayer(time))
                        await t
                else:
                    await rm.sendMsg(roomid, uid, {"action": "error", "detail": res.get("detail")})
                #TODO: Return Response Based on Res
            elif action == "object":
                room = rm.games.get(roomid)
                if room.canObject:
                    room.canObject = False
                    room.objected = True
                    await room.object(uid)
                    t = None
            elif action == "play":
                if not await rm.games.get(roomid).startPlay(int(data.get("no"))):
                    await websocket.send_json({"action": "error", "detail": "There should be atleast 2 people to play the game."})
    except WebSocketDisconnect:
        pass
    finally:
        await rm.disconnect(uid, roomid)


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
    