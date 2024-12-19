import express from "express"

const app = express();
const port = process.env.PORT || 3000

// app.get("/", (req, res) => {
//     res.send("Satyabrat Jha")
// })

app.get("/api/jokes", (req, res) => {
    const jokes = [
        {
            "id": 1,
            "name": "ashes",
            "joke": "When the window fell into the incinerator, it was a pane in the ash to retrieve."
          },
          {
            "id": 2,
            "name": "pirate's favorite letter",
            "joke": "What's a pirate's favorite letter? It be the Sea"
          },
          {
            "id": 3,
            "name": "counting cows",
            "joke": "How do you count cows? A 'Cow'culator"
          },
          {
            "id": 4,
            "name": "He's Alright",
            "joke": "Did you hear about the guy whose whole left side was cut off? He's all right now."
          },
          {
            "id": 5,
            "name": "Bakery Fire",
            "joke": "My friend's bakery burned down last night. Now his business is toast."
          },
    ];
    res.send(jokes)
})

app.listen(port, () => {
    console.log(`Server is serving at http://localhost:${port}`)
})