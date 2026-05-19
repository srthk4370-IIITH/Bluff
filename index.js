const create = document.getElementById("Create")
const join = document.getElementById("Join")
const baseURL = "http://localhost:8000"
let uid = sessionStorage.getItem("uid")
const close = new CloseWatcher()

async function getUID()
{
    let data = await fetch(baseURL+"/uid",{
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    data = await data.json()
    uid = data.uid
    sessionStorage.setItem("uid", uid)
    console.log(uid)
}

create.addEventListener("click", async () => {
    let data = await fetch(baseURL+"/create",{
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    data = await data.json()
    ri = data.roomid
    sessionStorage.setItem("roomid", ri)
    window.location.href = "/room/"
})

join.addEventListener("click", async () => {
    let ri = prompt("Enter Room ID")
    let data = await fetch(baseURL+"/join/"+ri,{
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    data =  await data.json()
    console.log(data)
    if(data.join)
    {
        sessionStorage.setItem("roomid", ri)
        window.location.href = "/room/"
    }
})

if(uid == null)
    getUID();

if(sessionStorage.getItem("roomid") != null)
{
    windowURL = "/room"
    const o = window.open(windowURL, "_blank")
    if(!o)
        window.location.href = windowURL
}

window.addEventListener("beforeunload", async () => {
    let d = await fetch(baseURL+"/logout/"+uid, {
        method: "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        keepalive: true
    })
})