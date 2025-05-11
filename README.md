# 🧬 mp-conway-sandbox

<img alt="demo" src="./demo.gif"/>

A multiplayer sandbox implementation of **Conway's Game of Life** with real-time interaction! Built using **React.js** and **Socket.IO**, this project allows multiple users to collaborate and simulate cellular automata together in real-time.

Live demo: [https://pixelhypercube.github.io/mp-conway-sandbox/](https://pixelhypercube.github.io/mp-conway-sandbox/)

---

## 🧠 What is Conway's Game of Life?

Conway's Game of Life is a zero-player game where a grid of cells evolves based on a simple set of rules. Each cell lives, dies, or is born depending on the number of alive neighbors. It is a popular example of a cellular automaton.

> Learn more: [Wikipedia - Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)

---

## 🚀 Features

- Multiplayer support using WebSockets
- Real-time board synchronization across clients
- Start/Stop/Step simulation modes
- Clickable grid to manually activate/deactivate cells
- React-powered interactive UI

---

## 🧪 Beginner Tutorial: How to Use the Multiplayer Sandbox

Welcome to the **mp-conway-sandbox**! Here's how you and your friends can get started with simulating Conway’s Game of Life together in real time.

### ✅ Step 1: Join or Create a Room

- Open the [Live Demo](https://pixelhypercube.github.io/mp-conway-sandbox/)
- You’ll see a form labeled **"Join or Create a Room"**
- Enter a **Room ID** (this can be anything—e.g., `my-room`, `team123`, etc.)
- Adjust the **Board Width** and **Board Height** if you'd like (default is 25×25)
- Click **"Join Room"**

> 🔁 If someone else joins the same Room ID, you’ll both see the same board and can interact together in real time!

---

### 🎮 Step 2: Interact with the Grid

Once you're inside the room, you’ll see:

- A live **grid** representing cells
- Three buttons:
  - **▶️ Play/Pause** – Start or stop the simulation
  - **⏭️ Step** – Advance the simulation by one generation (only when paused)
  - **🔄 Reset** – Clear the board

You can:

- **Click any cell** to toggle it alive (🟩) or dead (⬜)
- See changes reflected instantly for all players in the room

---

### 🧬 Step 3: Watch the Game of Life in Action

Click **Play** to start the simulation. The board evolves based on the following rules:

1. A live cell with 2 or 3 neighbors survives.
2. A dead cell with exactly 3 neighbors becomes a live cell.
3. All other cells die or remain dead.

> Pause and use **Step** for fine-grained control over each generation.

---

### 👥 Multiplayer Tips

- Share your **Room ID** with a friend.
- As long as both of you join the same room, you'll share the same board.
- Actions like clicking cells or toggling play/pause are **instantly synchronized**.

---

## 🛠️ Tech Stack

- **React.js** – Frontend UI
- **Socket.IO** – WebSocket communication
- **Node.js / Express** – (if server-side included)
- **Bootstrap** – Styling and responsive layout
