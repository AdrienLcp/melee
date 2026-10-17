# The target product model

What is new is not a geography game. It is an **evening**: one game made of
several challenges — questions, a blind test, a map, a buzzer — played by
teams over a whole dinner, paced by a host between two dishes. The world map
is one of its challenges.

## One concept, not two

Adrien's draft calls it a *party*: a list of challenges the host ticks, with
Teams and Board as options. The proposal here keeps that shape and refuses one
thing in it — a new object beside the room. **The room already is the party.**
It has a code, a lobby, seats, settings that move mid-game and a final board;
a second container would duplicate every one of those and split the exits.

So the evening is three additions to the room's settings, and nothing else:

| Setting | Values | Default | What it changes |
|---|---|---|---|
| **Line-up** | the games ticked, at least one | the game whose front door opened the room, or none | Which game the next round is drawn from. One tick is today's quick game, with nothing else on screen |
| **Teams** | off, drawn, chosen by the players, teams only | off | Who scores: seats, or teams of seats ([a](a-teams.md)) |
| **Board** | off, on | off; on when Teams is | How the score is shown: standings, or pawns on a track around the round ([f](f-board.md)) |

**Presets** are named line-ups with these switches set: *Soirée de Noël* ticks
the quiz, the blind test, the world map and the buzzer, Teams drawn, Board on.
A preset is data in the app, never on the wire: the room only ever holds the
resulting settings.

## Words

| Word | Means | Status |
|---|---|---|
| Room | One code, one evening, from the lobby to the closing | unchanged |
| Game | One thing on the shelf: quiz, blind test, buzzer, reflex, slate, world map | unchanged; the map is the seventh |
| Line-up | The games ticked for this room | new |
| Round | One question, one clip, one place to find, played by whoever its roster stamps | unchanged |
| Set | One game played by every team in turn, one round each, each with its own question | new ([c](c-team-turns.md)) |
| Team | A named group of seats, with a colour and a pawn on the board | new |

*Challenge* and *épreuve* are what the screens say in French; in the code a
challenge is a round or a set, so it gets no type of its own.

## How a round is played

Two ways, both chosen per round by the host, defaulted by the game:

- **Everyone at once** — every seat answers on its own phone against the same
  clock: Melee's simultaneous rounds, choice or typed, and the map's marker.
  With Teams on, each team's result is the mean of its members' (decision 2).
- **Each team in turn** — a set: team Blue gets its question, then Red its
  own, the others watching the wall. The team answers on any member's phone or
  on the wall itself.

The buzzer, the blind test and the reflex race keep their own race; with Teams
on they score the buzzing seat's team.

## Who drives

The host, from a phone or a laptop alike, with the **wall** showing the room.
The wall is the big screen — the 55–86" display at the dinner — and it is
Melee's existing third role, not a new one: paired by the host's device, it
plays the clip, draws the round and, with Board on, the track around it, and
holds no answer and no control. The host's screen stays a console; nobody has
to read it from across the room. Between rounds the
console offers **one press**: *Next round* — the game drawn at random from the
line-up, or picked by hand from a short list. Before it, each phone can press
**Ready**, and the wall shows who is back at the table; the host launches
whenever, ready or not. Nothing waits for the host but the start of a round:
every simultaneous round is judged by the server, so the host can put the
raclette down mid-round.

## Setup in a few taps

1. Open a room from a preset or a game's front door — the line-up, Teams and
   Board come from it.
2. The wall shows the code and the square; phones join by scanning it, by the
   link the host copied or sent through the phone's share sheet, or by typing
   the code ([s](s-setup-and-sharing.md)).
3. *Draw the teams* (re-draw as often as wanted) — or let each phone pick its
   own — then *Start*.

Every other setting has a default and lives in the setup's leaflet, grouped,
reachable mid-evening ([s](s-setup-and-sharing.md)).

## What the room never does

- Hold a preset, a line-up's order or a team colour as wire data beyond what a
  screen must draw.
- Send a player the answer: the map's target travels in the host and reveal
  views only, like a track's title.
- Trust a phone's clock or a phone's judgement: a marker is a point, the
  server measures it.
