# 🧬 CellCollab

<img alt="demo" src="./demo.gif"/>

**CellCollab** is a multiplayer sandbox implementation of **Conway's Game of Life** with real-time interaction and **custom brushes**! This project is built with **React.js** and **Socket.IO**, allowing users to collaborate and simulate cellular automata together in real-time.

🔗 **Live demo (CellCollab)**: [https://pixelhypercube.github.io/CellCollab/](https://pixelhypercube.github.io/CellCollab/)

---

## 🧠 What is Conway's Game of Life?

Conway's Game of Life is a zero-player game where a grid of cells evolves over time based on a simple set of rules. It's a classic example of **cellular automata**.

> 📖 Learn more: [Wikipedia - Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)

---

## 🚀 Features

- 🧑‍🤝‍🧑 **Multiplayer Support**: Collaborate in real-time with friends via WebSockets
- ⚙️ **Simulation Modes**: Start, pause, step-by-step, and reset functionality
- 🖱️ **Interactive Grid**: Click cells to toggle alive/dead state
- 🖌️ **Brushes**: Stamp patterns (gliders, blinkers, etc.) on the grid
- 📡 **Room System**: Create or join unique rooms for shared simulations
- 📱 **Responsive UI**: Built with Bootstrap for clean layout

---

## ✨ What’s New?

### 🖌️ Brush Tool

Choose from a palette of predefined brushes (e.g. Glider, Toad, Pulsar) to stamp more complex patterns directly onto the board.

- Brush hover preview shows where the stamp will apply
- Patterns toggle when clicked
- Synchronized across all users in a room

---

## 🧪 Beginner Tutorial: How to Use CellCollab

### ✅ Step 1: Join or Create a Room

1. Visit the [Live Demo](https://pixelhypercube.github.io/mp-conway-sandbox/)
2. Enter a **Room ID** (any string, e.g. `my-room`)
3. Set **Board Width** and **Board Height** (optional)
4. Click **"Join Room"**

> Anyone using the same Room ID will see and interact with the same board!

---

### 🎮 Step 2: Interact with the Grid

Once inside a room, you’ll see:

- A live **grid** of cells
- Control buttons:
  - ▶️ **Play / Pause**
  - ⏭️ **Step** (advance one generation)
  - 🔄 **Reset**

Click on any cell to toggle its state. Changes are broadcast in real-time to all users.

---

### 🖌️ Step 3: Use Brushes

- Scroll down to the **Palette** section
- Click a **brush** to select it
- Hover over the grid to preview the pattern
- Click to **stamp** the pattern

---

## 📐 Game of Life Rules

1. A live cell with 2 or 3 live neighbors survives.
2. A dead cell with exactly 3 live neighbors becomes a live cell.
3. All other live cells die in the next generation. All other dead cells stay dead.

---

## 👥 Multiplayer Tips

- Share your Room ID with friends
- All players in the same room:
  - See the same grid
  - Can place brushes and toggle cells
  - Sync simulation states in real-time

---

## 🛠️ Tech Stack

- 💻 **React.js** – UI and component logic
- 🌐 **Socket.IO** – Real-time client-server communication
- 🧠 **Custom Brush Engine** – Hover detection and stamping
- 🎨 **Bootstrap** – Layout and responsive styling
- 🧩 **Express (Node.js)** – Backend server (if running locally)

---

## 📦 Getting Started (Local Setup)

```
git clone https://github.com/pixelhypercube/CellCollab.git
cd CellCollab
npm install
npm start
```
Open http://localhost:3000 in your browser. Make sure the backend server (Socket.IO) is also running.

---

## 🙌 Contributions

Pull requests are welcome! If you'd like to add brushes, enhance performance, or expand multiplayer capabilities, feel free to fork and improve.