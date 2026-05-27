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
const leave2 = document.getElementById("leave2")
const type = document.getElementsByClassName("type")
const msgCon = document.getElementsByClassName("msgCon")
const msgggg = document.getElementById("msg")
const objdialog = document.getElementById("obj-dialog")
const noc = document.getElementById("noc")
const nocc = document.getElementById("nocc")
const rematch = document.getElementById("Rematch")
const err = document.getElementById("error")
const okay = document.getElementById("okay")
let ws;
let cards = [];
let canMove = false;
let newR = false;
let msgEmpty = false;
let ask = true;
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
                if(msg.master == uid)
                {
                    noc.style.display = "block"
                }
            }
            else if(msg.action == "Not-Join")
            {
                ask = false
                window.location.href = "/"
            }
            else if(msg.action == "moved")
            {
                if(msg.uid != uid)
                {
                    if(msg.empty)
                    {
                        type[0].innerText = "Look Who Just Played"
                        msgCon[0].innerText = `${msg.name} wants to skip this turn. Lmao.`
                        msgggg.style.visibility = "visible";
                        msgEmpty = true
                    }
                    else
                    {
                        type[1].innerText = "Look Who Just Played"
                        msgCon[1].innerText = `${msg.name} claims to have ${msg.claim[0]} of ${msg.claim[1]}... looks fishy, no?`
                        objdialog.style.visibility = "visible";
                        setTimeout(() => {objdialog.style.visibility = "hidden";}, 2500)
                    }
                }
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
                console.log(msg.uid)
                console.log(uid)
                console.log(msg.uid == uid)
                if(msg.uid == uid)
                {
                    canMove = true
                    move.disabled = false
                    if(msg.nextRound)
                    {
                        newR = true;
                        claim.disabled = false;
                        claim.selectedIndex = 0;
                        let  t = 0
                        if(msgEmpty)
                        {
                            t =1000
                            msgEmpty = false
                        }
                        setTimeout(() => {
                        type[0].innerText = "Next Round is here"
                        msgCon[0].innerText = "Its your turn.... Ready to deceive? It's a new round beware."
                        }, t);
                        msgggg.style.visibility = "visible"
                        setTimeout(() => {msgggg.style.visibility = "hidden"}, 2000+t)
                    }
                    else
                    {
                        claim.value = msg.card
                        let  t = 0
                        if(msgEmpty)
                        {
                            t = 1000;
                            msgEmpty = false;
                        }
                        setTimeout(() => {
                            type[0].innerText = "Next Turn is here"
                            msgCon[0].innerText = "Its your turn.... Ready to deceive?"
                        }, t);
                        msgggg.style.visibility = "visible"
                        setTimeout(() => {msgggg.style.visibility = "hidden"}, 2000+t)
                    }
                }
                else
                {
                    t = 0;
                    if(msgEmpty)
                    {
                        t = 1000;
                        msgEmpty = false;
                    }
                    setTimeout(() => {
                        type[0].innerText = msg.nextRound?"Next Round":"New Turn"
                        msgCon[0].innerText = `It's ${msg.name}'s turn. Keep your eyes open.`
                    }, t);
                    msgggg.style.visibility = "visible"
                    setTimeout(() => {msgggg.style.visibility = "hidden"}, 3000+t)
                }
            }
            else if(msg.action == "object?")
            {
                object.disabled = false;
                setTimeout(() => {object.disabled = true;}, 4000)
            }
            else if(msg.action == "Object")
            {
                type[0].innerText = "Judgement"
                msgCon[0].innerText = msg.detail
                msgggg.style.visibility = "visible"
            }
            else if(msg.action == "winner") //TODO: Display Winner As They Come
            {
                if(msg.uid == uid)
                {
                    msgEmpty = true;
                    type[0].innerText = `${msg.name} Won!`
                    msgCon[0].innerText = `Yeah, ${msg.name} won, LOSERRRRRR.`
                }
                else
                {
                    msgEmpty = true;
                    type[0].innerText = `YOU Won!`
                    msgCon[0].innerText = `YLessgoo atleast you didn't come last as I expected`
                }
                msgggg.style.visibility = "visible"
            }
            else if(msg.action == "done") //Display All the winners
            {
                msgggg.style.visibility = "hidden"
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
                type[2].innerText = "ERROR"
                msgCon[2].innerText = msg.detail
                err.style.visibility = "visible"
                setTimeout(() => {err.style.visibility = "hidden"}, 3000)
            }
        }
        catch
        {
            console.error("Error")
        }
    }
}

start.addEventListener("click", () => {
    ws.send(JSON.stringify({"action": "play", "uid": uid, "no": nocc.value == "" ? 0 : nocc.value}))
})

Leave.addEventListener("click", () => {
    ask = false;
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
    if(canMove && claim.value != "" && !(newR && sel.length == 0))
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
        newR = false
    }
})

object.addEventListener("click", () => {
    ws.send(JSON.stringify({"action": "object"}))
    object.disabled = true;
})

document.getElementById("obj").addEventListener("click", () => {
    ws.send(JSON.stringify({"action": "object"}))
    object.disabled = true;
})

leave1.addEventListener("click", () => {
    ask = false;
    sessionStorage.removeItem("roomid")
    sessionStorage.removeItem("name")
    window.location = ("/")
})

leave2.addEventListener("click", () => {
    ask= false;
    sessionStorage.removeItem("roomid")
    sessionStorage.removeItem("name")
    window.location = ("/")
})

rematch.addEventListener("click", () => {
    window.location.reload();
})

okay.addEventListener("click", () => {
    objdialog.style.visibility = "hidden"
})

connect()

window.addEventListener("beforeunload", (e) => {
    if(ask)
    {
        e.preventDefault();
    }
    sessionStorage.removeItem("roomid")
    sessionStorage.removeItem("name")
})
