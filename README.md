# 🃏 Bluff (Cheat / I Doubt It)

A real-time, multiplayer web implementation of the classic card game **Bluff** (also known as *Cheat*, *Bullshit*, or *I Doubt It*). Gather your friends, create a room, and put your poker face to the test!

---

## 🛠️ The "No-AI" Craftsmanship
> [!NOTE]
> This game was developed **100% manually, completely from scratch, without any AI assistance**. Every line of FastAPI WebSocket routing, Pydantic room state synchronization, and DOM manipulation was written by hand—offering a clean, structured, and rock-solid codebase.

---

## ✨ Features
- **Real-Time Multiplayer**: Built on asynchronous WebSockets for instant, low-latency action.
- **Dynamic Room Management**: Easily create a room, share a unique 4-digit room code, or join existing rooms.
- **Host Controls**: The room creator (master) can select how many cards to deal to each player (up to the maximum possible deck split).
- **Interactive Game Board**: A clean, fully interactive UI where you click to select/deselect cards from your hand.
- **Deceptive Claims**: Choose your card rank from the dropdown, specify how many cards you are playing, and let the bluffing begin.
- **The "Object!" Mechanic**: A 5-second real-time window for any opponent to call your bluff. The system automatically verifies the claim, penalizing the liar or the false accuser with the entire stack.
- **Interactive Leaderboard**: Visualizes winners in real time as they deplete their hands, culminating in a final standings screen with a rematch option.
- **Sleek, Immersive UI**: Styled with beautiful custom typography (Changa One, Berkshire Swash, Roboto), custom SVGs, and responsive overlays.

---

## 🚀 Tech Stack

### Backend
- **Python >= 3.14**: Utilizing the latest language features.
- **FastAPI**: Super-fast, modern asynchronous web framework.
- **Uvicorn**: Asynchronous ASGI web server.
- **WebSockets**: Native, full-duplex communication protocol.
- **uv**: Next-generation Python package installer and resolver.

### Frontend
- **HTML5 & CSS3**: Custom styles, responsive grid layouts, and glassmorphic dialog interfaces.
- **Vanilla JavaScript**: Pure ES6 modules, WebSocket event handlers, session storage tracking, and lightweight DOM rendering (no frameworks required).

---

## 📂 Project Structure

```text
├── main.py                # FastAPI WebSocket Server & Room Manager
├── index.html             # Main Landing / Lobby Entrance
├── index.js               # Entrance UI handlers & HTTP API fetches
├── index.css              # Landing page styling
├── pyproject.toml         # Python project configuration (dependencies)
├── uv.lock                # Pinned dependency lockfile
├── room/                  # Game Room files
│   ├── index.html         # Active Game Board Layout
│   ├── index.js           # Game WebSocket controller & UI renderer
│   ├── index.css          # In-game styling, dialog layouts
│   └── cards/             # 52 Card suit SVG assets
```

---

## 🎯 Game Rules
1. **The Goal**: Be the first player to discard all of your cards.
2. **Starting**: The game starts by dealing a set number of cards to all players in the room. The starting player chooses a card rank (e.g., Aces) and places down 1 or more cards, claiming they match that rank.
3. **The Turn**: The next player must either:
   - Place 1 or more cards face-down and claim they are of the *same* rank.
   - Or **Skip** their turn.
4. **The Bluff**: Because the cards are placed face-down, you don't actually have to play the claimed rank! You can play any card from your hand.
5. **The Challenge ("Object!")**:
   - After a player makes a move, opponents have **5 seconds** to hit **Object!**.
   - If challenged, the game reveals the cards played.
   - **If the player lied**: The bluffing player must pick up the entire discard pile.
   - **If the player told the truth**: The challenger must pick up the entire discard pile.
6. **Victory**: The round continues until only one player is left with cards (the loser). Players are ranked in order of who emptied their hands first!

---

## 🏃 Run the Game Locally

### Prerequisites
Make sure you have [uv](https://github.com/astral-sh/uv) or standard Python 3.14+ installed.

### 1. Start the Backend Server
First, navigate to the project directory and install the dependencies:
```bash
uv sync
```
Next, launch the FastAPI server using Uvicorn:
```bash
uv run uvicorn main:app --reload
```
The server will start running on **`http://localhost:8000`**.

### 2. Launch the Frontend
Simply open the main **`index.html`** in your browser of choice (or serve it using a lightweight server, like VS Code's Live Server or Python's `http.server`):
```bash
python -m http.server 8000
```
Open multiple browser tabs or windows to test playing against yourself in different rooms!

---

## 💡 Architecture & Event Flow
The game utilizes a lightweight, event-driven state machine to synchronize actions between players:
- **State Synchronization**: Players connect to a unified WebSocket channel for their room. The backend distributes state changes (turn indicator, claims, challenge outcomes) to all connected clients in real time.
- **Strict Turn Validation**: Turn pacing and move logic are fully validated on the server side, preventing out-of-order play or spoofed deck states.
- **Challenge Verification Engine**: Ranks and claims are kept secure and face-down on the server. The verification engine only exposes card values when a challenge ("Object!") is raised.
