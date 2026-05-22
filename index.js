const create = document.getElementById("Create")
const join = document.getElementById("Join")
const name = document.getElementById("name")
const room = document.getElementById("RoomID")
const cancel = document.getElementById("Cancel")
const cont = document.getElementById("Join-Room")
const dialog = document.getElementById("dialog")
const baseURL = "http://localhost:8000"
let uid = sessionStorage.getItem("uid")
let c = false
let reload = true;

if(uid == null || uid == "")
    await getUID();

if(sessionStorage.getItem("roomid") != null)
{
    window.location.href = "/room"
}


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

cancel.addEventListener("click", () => {
    dialog.classList.add("none")
    room.classList.remove("create")
})

cont.addEventListener("click", async () => {
    let n = name.value;
    let ri = room.value;
    console.log(ri)
    if(c)
    {
        if(n.length > 0)
        {
            sessionStorage.setItem("name", n)
            let data = await fetch(baseURL+"/create",{
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            data = await data.json()
            console.log(data)
            ri = data.roomid
            dialog.classList.add("none")
            room.classList.remove("create")
            sessionStorage.setItem("roomid", ri)
            sessionStorage.setItem("name", n)
            reload = false;
            window.location.href = "/room"
        }
    }
    else
    {
        if(n.length > 0 && ri > 0)
        {
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
                dialog.classList.add("none")
                room.classList.remove("create")
                sessionStorage.setItem("roomid", ri)
                sessionStorage.setItem("name", n)
                reload = false
                window.location.href = "/room";
            }
        }
    }
})

create.addEventListener("click", () => {
    c = true;
    dialog.classList.remove("none")
    room.classList.add("create")
})

join.addEventListener("click", () => {
    c = false
    dialog.classList.remove("none")
})



window.addEventListener("beforeunload", async () => {
    if(reload)
    {
        let d = await fetch(baseURL+"/logout/"+uid, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            },
            keepalive: true
        })
    }
})