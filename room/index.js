const roomid = sessionStorage.getItem("roomid")
const uid = sessionStorage.getItem("uid")
let ws;
let cards;

if(roomid == null || uid == null)
{
    window.location.href = "/";
}

async function connect()
{
    ws = new WebSocket("ws://localhost:8000/ws/"+roomid+"/"+uid+"/Saarthak")
    ws.onopen = () => {
        document.body.innerText = roomid
        let b = document.createElement("button")
        document.body.append(b)
        b.innerText = "Play"
        b.addEventListener("click", () => {
            console.log("Here")
            ws.send(JSON.stringify({"action" : "play"}))
        })
        let b1 = document.createElement("button")
        document.body.append(b1)
        b1.innerText = "move"
        b1.addEventListener("click", () => {
            ws.send(JSON.stringify({"action" : "move", "cards": cards, "claim": [2,2]}))
        })
    }
    ws.onmessage = (e) => {
        try
        {
            let msg = JSON.parse(e.data)
            if(msg.action == "connection")
            {
                console.log(msg.players)
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
                cards = msg.cards
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

connect()
