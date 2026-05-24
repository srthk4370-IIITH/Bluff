const roomid = sessionStorage.getItem("roomid")
const uid = sessionStorage.getItem("uid")
const name = sessionStorage.getItem("name")
const room = document.getElementById("room")
const nameP = document.getElementById("Name")
const start = document.getElementById("Start")
const Leave = document.getElementById("Leave")
const right = document.getElementById("right")
const board = document.getElementById("board")
const pShow = document.getElementById("playerShow")
const move = document.getElementById("move")
const object = document.getElementById("object")
const claim = document.getElementById("claim")
const info = document.getElementById("info")
const leave1 = document.getElementById("leave1")
let ws;
let cards = [];
let canMove = false;
claim.disabled = true;
let sel = []
if(roomid == null || uid == null || name == null)
{
    window.location.href = "/";
}

move.disabled = true
object.disabled = true

async function connect()
{
    ws = new WebSocket("ws://localhost:8000/ws/"+roomid+"/"+uid+"/"+name)
    ws.onopen = () => {
        /*document.body.innerText = roomid
        let b = document.createElement("button")
        document.body.append(b)
        b.innerText = "Play"
        b.addEventListener("click", () => {
            console.log("Here")
            ws.send(JSON.stringify({"action" : "play"}))
        })
        b1 = document.createElement("button")
        document.body.append(b1)
        b1.innerText = "move"
        b1.addEventListener("click", () => {
            ws.send(JSON.stringify({"action" : "move", "cards": cards, "claim": [2,2]}))
            cards = []
            b1.disabled = true
        })
        b1.disabled = true*/
        room.innerText = "Room ID : "+roomid;
        nameP.innerText = "Name : "+ name + "#" + uid;
        document.getElementById("wrapper").style.display = "flex";
    }
    // TODO: canObject = False, Win Logic in next methods and frontend
    ws.onmessage = (e) => {
        try
        {
            let msg = JSON.parse(e.data)
            console.log(msg)
            if(msg.action == "connection")
            {
                right.innerHTML =""
                pShow.innerHTML = ""
                let players = JSON.parse(msg.players)
                let i = 1
                players.forEach(p => {
                    card = document.createElement("div")
                    card.classList.add("card")
                    p1 = document.createElement("p")
                    p1.classList.add("no")
                    p1.innerText = i++
                    card.append(p1)
                    n1 = document.createElement("p")
                    n1.classList.add("name")
                    n1.innerText = p.name
                    card.append(n1)
                    p2 = document.createElement("p")
                    p2.classList.add("no2")
                    p2.innerText = i-1
                    card.append(p2)
                    right.append(card)



                    // For Play:
                    pcard = document.createElement("div")
                    pcard.classList.add("pcard")
                    pfp = document.createElement("div")
                    pfp.classList.add("pfp")
                    con = document.createElement("div")
                    con.classList.add("con")
                    pfp.append(con)
                    con.innerText = p.name[0]
                    pcard.append(pfp)
                    un = document.createElement("div")
                    un.classList.add("un")
                    un.innerText = p.name
                    pcard.append(un)
                    pShow.append(pcard)
                });
                start.disabled = !(msg.master == uid)
            }
            else if(msg.action == "Not-Join")
            {
                window.location.href = "/"
            }
            else if(msg.action == "moved")
            {
                console.log(msg);
            }
            else if(msg.action == "takeCards")
            {
                document.getElementById("room1").innerText = "ROOM : "+roomid
                document.getElementById("name1").innerText = "NAME : "+name
                document.getElementById("wrapper").style.display = "none";
                document.getElementById("game-wrapper").style.display = "flex";
                //Newcards = msg.cards
                //cards.push(...Newcards)
                board.innerHTML = ""
                cards = msg.cards
                cards.forEach(card => {
                    i = document.createElement("img")
                    i.src = `cards/${card[0]}/${card[1]}.svg`
                    i.classList.add("cards")
                    i.setAttribute("1", card[0])
                    i.setAttribute("2", card[1])
                    board.append(i)
                })
                    
            }
            else if(msg.action == "nextTurn")
            {
                info.innerText = `CURRENT PLAYER : ${msg.name}`
                if(msg.uid == uid)
                {
                    canMove = true
                    move.disabled = false
                    if(msg.nextRound)
                    {
                        claim.disabled = false;
                        claim.selected = claim.options[0]
                    }
                    else
                    {
                        claim.value = msg.card
                    }
                }
            }
            else if(msg.action == "object?")
            {
                object.disabled = false;
                setTimeout(() => {object.disabled = true;}, 3000)
            }
            else if(msg.action == "Object")
            {
                info.innerText = msg.detail
            }
            else if(msg.action == "winner") //TODO: Display Winner As They Come
            {
                if(msg.name == name)
                {
                    console.log("FUCK OFFF")
                }
                else
                {
                    console.log("LOSER LMAOO")
                }
            }
            else if(msg.action == "done") //Display All the winners
            {
                document.getElementById("winner-wrapper").style.display = "flex";
                document.getElementById("game-wrapper").style.display = "none";
                document.getElementById("winnerName").innerText = msg.winners[0];
                ul = document.getElementById("ul");
                let i = 1
                ul.innerHTML = ""
                msg.winners.forEach(win => {
                    li = document.createElement("li")
                    span = document.createElement("span")
                    span.classList.add("pos")
                    span.innerText = i++;
                    li.append(span);
                    li.append(win)
                    ul.append(li)
                })
            }
            else
            {
                console.log(msg)
            }
        }
        catch
        {
            
        }
    }
}

start.addEventListener("click", () => {
    ws.send(JSON.stringify({"action": "play", "uid": uid}))
})

Leave.addEventListener("click", () => {
    sessionStorage.removeItem("roomid")
    sessionStorage.removeItem("name")
    window.location = "/";
})

document.addEventListener("click", (e) => {
    if(canMove)
    {
        c = e.target.classList
        if(c=="cards")
        {
            e.target.classList.add("selected")
            sel.push([e.target.getAttribute(1), e.target.getAttribute(2), e.target])
            console.log(sel)
        }
        else if(c == "cards selected")
        {
            e.target.classList.remove("selected")
            sel.splice(sel.indexOf([e.target.getAttribute(1), e.target.getAttribute(2), e.target]), 1)
            console.log(sel)
        }
    }
})

move.addEventListener("click", () => {
    if(canMove && claim.value != "")
    {
        sel1 = []
        sel.forEach(card => {
            card[2].remove()
            card = card.slice(0, 2)
            sel1.push(card)
        })
        ws.send(JSON.stringify({"action" : "move", "cards": sel1, "claim": [sel1.length, claim.value]}))
        sel = []
        move.disabled= true
        canMove = false
        claim.selected = claim.options[0]
        claim.disabled = true
    }
})

object.addEventListener("click", () => {
    ws.send(JSON.stringify({"action": "object"}))
})

leave1.addEventListener("click", () => {
    sessionStorage.removeItem("roomid")
    sessionStorage.removeItem("name")
    window.location("/")
})

connect()

/*window.addEventListener("beforeunload", (e) => {
    e.preventDefault();
    sessionStorage.removeItem("roomid")
    sessionStorage.removeItem("name")
})*/
