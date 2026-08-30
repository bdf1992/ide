"""Independent Python reference lane for ADAPTER_CHALLENGE_CASES/1."""

from __future__ import annotations

import copy
import math
import re
from collections import deque
from typing import Any


class ChallengeError(Exception):
    def __init__(self, code: str, detail: str = ""):
        super().__init__(detail or code)
        self.code = code


def hello_world(payload: dict[str, Any]) -> str:
    return f"Hello, {payload.get('name', 'World')}!"


DIRECTIONS = {
    "up": (0, -1),
    "down": (0, 1),
    "left": (-1, 0),
    "right": (1, 0),
}
OPPOSITE = {"up": "down", "down": "up", "left": "right", "right": "left"}


def snake_step(payload: dict[str, Any]) -> dict[str, Any]:
    state = copy.deepcopy(payload["state"])
    if not state.get("alive", True):
        return state
    requested = payload.get("direction", state["direction"])
    if requested not in DIRECTIONS:
        raise ChallengeError("INVALID_DIRECTION")
    direction = state["direction"]
    if len(state["snake"]) == 1 or requested != OPPOSITE[direction]:
        direction = requested
    dx, dy = DIRECTIONS[direction]
    head = state["snake"][0]
    next_head = [head[0] + dx, head[1] + dy]
    ate = state.get("food") == next_head
    next_snake = [next_head, *state["snake"]] if ate else [next_head, *state["snake"][:-1]]
    outside = not (0 <= next_head[0] < state["width"] and 0 <= next_head[1] < state["height"])
    collided = next_head in next_snake[1:]
    state["snake"] = next_snake
    state["direction"] = direction
    state["alive"] = not (outside or collided)
    if ate:
        state["food"] = None
    return state


def _overlaps_paddle(ball: dict[str, float], paddle: dict[str, float]) -> bool:
    return ball["y"] + ball["r"] >= paddle["y"] and ball["y"] - ball["r"] <= paddle["y"] + paddle["h"]


def pong_step(payload: dict[str, Any]) -> dict[str, Any]:
    state = copy.deepcopy(payload["state"])
    dt = float(payload.get("dt", 1))
    ball = state["ball"]
    old_x = ball["x"]
    ball["x"] += ball["vx"] * dt
    ball["y"] += ball["vy"] * dt

    if ball["y"] - ball["r"] < 0:
        ball["y"] = ball["r"] + (ball["r"] - ball["y"])
        ball["vy"] = abs(ball["vy"])
    elif ball["y"] + ball["r"] > state["height"]:
        boundary = state["height"] - ball["r"]
        ball["y"] = boundary - (ball["y"] - boundary)
        ball["vy"] = -abs(ball["vy"])

    left = state["paddles"]["left"]
    right = state["paddles"]["right"]
    left_edge = left["x"] + left["w"]
    if ball["vx"] < 0 and old_x - ball["r"] >= left_edge and ball["x"] - ball["r"] <= left_edge and _overlaps_paddle(ball, left):
        ball["x"] = left_edge + ball["r"]
        ball["vx"] = abs(ball["vx"])
    elif ball["vx"] > 0 and old_x + ball["r"] <= right["x"] and ball["x"] + ball["r"] >= right["x"] and _overlaps_paddle(ball, right):
        ball["x"] = right["x"] - ball["r"]
        ball["vx"] = -abs(ball["vx"])

    if ball["x"] + ball["r"] < 0:
        state["score"]["right"] += 1
        ball.update(x=state["width"] / 2, y=state["height"] / 2, vx=-abs(ball["vx"]))
    elif ball["x"] - ball["r"] > state["width"]:
        state["score"]["left"] += 1
        ball.update(x=state["width"] / 2, y=state["height"] / 2, vx=abs(ball["vx"]))
    return state


RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
SUITS = ["C", "D", "H", "S"]
RANK_VALUE = {rank: index + 1 for index, rank in enumerate(RANKS)}


def standard_deck() -> list[str]:
    return [rank + suit for suit in SUITS for rank in RANKS]


def solitaire_deal(deck: list[str] | None = None) -> dict[str, Any]:
    cards = list(deck or standard_deck())
    if len(cards) != 52 or len(set(cards)) != 52:
        raise ChallengeError("INVALID_DECK")
    tableau: list[list[dict[str, Any]]] = [[] for _ in range(7)]
    cursor = 0
    for row in range(7):
        for column in range(row, 7):
            tableau[column].append({"card": cards[cursor], "face_up": False})
            cursor += 1
    for column in tableau:
        column[-1]["face_up"] = True
    return {"tableau": tableau, "stock": cards[cursor:]}


def solitaire_can_stack(moving: str, target: str | None) -> bool:
    rank, suit = moving[:-1], moving[-1]
    if rank not in RANK_VALUE or suit not in SUITS:
        raise ChallengeError("INVALID_CARD")
    if target is None:
        return rank == "K"
    target_rank, target_suit = target[:-1], target[-1]
    if target_rank not in RANK_VALUE or target_suit not in SUITS:
        raise ChallengeError("INVALID_CARD")
    red = suit in {"D", "H"}
    target_red = target_suit in {"D", "H"}
    return red != target_red and RANK_VALUE[rank] + 1 == RANK_VALUE[target_rank]


def solitaire(payload: dict[str, Any]) -> Any:
    operation = payload.get("operation")
    if operation == "can_stack":
        return solitaire_can_stack(payload["moving"], payload.get("target"))
    if operation == "deal_summary":
        deal = solitaire_deal()
        return {
            "column_sizes": [len(column) for column in deal["tableau"]],
            "top_cards": [column[-1]["card"] for column in deal["tableau"]],
            "stock_count": len(deal["stock"]),
        }
    raise ChallengeError("UNKNOWN_OPERATION")


def diff_snapshots(payload: dict[str, Any]) -> dict[str, list[str]]:
    before = payload.get("before", {})
    after = payload.get("after", {})
    return {
        "created": sorted(set(after) - set(before)),
        "modified": sorted(path for path in set(before) & set(after) if before[path] != after[path]),
        "deleted": sorted(set(before) - set(after)),
    }


TOKEN = re.compile(r"\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(.))")


class Calculator:
    functions = {
        "sin": math.sin,
        "cos": math.cos,
        "sqrt": math.sqrt,
        "log": math.log,
        "abs": abs,
    }
    constants = {"pi": math.pi, "e": math.e}
    precedence = {"+": 10, "-": 10, "*": 20, "/": 20, "^": 30}

    def __init__(self, source: str):
        self.tokens: list[tuple[str, Any]] = []
        position = 0
        for match in TOKEN.finditer(source):
            if match.start() != position and source[position : match.start()].strip():
                raise ChallengeError("INVALID_TOKEN")
            position = match.end()
            number, name, symbol = match.groups()
            if number is not None:
                self.tokens.append(("number", float(number)))
            elif name is not None:
                self.tokens.append(("name", name))
            elif symbol in "+-*/^(),":
                self.tokens.append((symbol, symbol))
            else:
                raise ChallengeError("INVALID_TOKEN")
        if source[position:].strip():
            raise ChallengeError("INVALID_TOKEN")
        self.tokens.append(("end", None))
        self.index = 0

    def peek(self) -> str:
        return self.tokens[self.index][0]

    def take(self, kind: str | None = None) -> tuple[str, Any]:
        token = self.tokens[self.index]
        if kind is not None and token[0] != kind:
            raise ChallengeError("UNEXPECTED_TOKEN")
        self.index += 1
        return token

    def parse(self) -> float:
        result = self.expression()
        if self.peek() != "end":
            raise ChallengeError("UNEXPECTED_TOKEN")
        if not math.isfinite(result):
            raise ChallengeError("NON_FINITE_RESULT")
        return round(result, 12)

    def expression(self, minimum: int = 0) -> float:
        left = self.prefix()
        while self.peek() in self.precedence and self.precedence[self.peek()] >= minimum:
            operator = self.take()[0]
            precedence = self.precedence[operator]
            right = self.expression(precedence if operator == "^" else precedence + 1)
            if operator == "+":
                left += right
            elif operator == "-":
                left -= right
            elif operator == "*":
                left *= right
            elif operator == "/":
                if right == 0:
                    raise ChallengeError("DIVISION_BY_ZERO")
                left /= right
            else:
                left = left**right
        return left

    def prefix(self) -> float:
        if self.peek() == "-":
            self.take("-")
            return -self.expression(30)
        if self.peek() == "+":
            self.take("+")
            return self.expression(30)
        if self.peek() == "number":
            return self.take("number")[1]
        if self.peek() == "(":
            self.take("(")
            value = self.expression()
            self.take(")")
            return value
        if self.peek() == "name":
            name = self.take("name")[1]
            if self.peek() != "(":
                if name not in self.constants:
                    raise ChallengeError("UNKNOWN_NAME")
                return self.constants[name]
            self.take("(")
            value = self.expression()
            self.take(")")
            if name not in self.functions:
                raise ChallengeError("UNKNOWN_FUNCTION")
            try:
                return float(self.functions[name](value))
            except ValueError as exc:
                raise ChallengeError("DOMAIN_ERROR") from exc
        raise ChallengeError("UNEXPECTED_TOKEN")


def calculate(payload: dict[str, Any]) -> float:
    expression = payload.get("expression")
    if not isinstance(expression, str) or not expression.strip():
        raise ChallengeError("EXPRESSION_REQUIRED")
    return Calculator(expression).parse()


def kanban_apply(payload: dict[str, Any]) -> dict[str, Any]:
    board = copy.deepcopy(payload["board"])
    event = payload["event"]
    columns = board["columns"]
    column_by_id = {column["id"]: column for column in columns}
    cards = [(column, card) for column in columns for card in column["cards"]]
    card_ids = [card["id"] for _, card in cards]
    if len(card_ids) != len(set(card_ids)):
        raise ChallengeError("DUPLICATE_CARD")
    kind = event.get("type")

    if kind == "add":
        card = copy.deepcopy(event["card"])
        if card["id"] in card_ids:
            raise ChallengeError("DUPLICATE_CARD")
        column = column_by_id.get(event["column_id"])
        if column is None:
            raise ChallengeError("COLUMN_NOT_FOUND")
        column["cards"].append(card)
    elif kind == "move":
        matches = [(column, card) for column, card in cards if card["id"] == event["card_id"]]
        if not matches:
            raise ChallengeError("CARD_NOT_FOUND")
        target = column_by_id.get(event["to_column"])
        if target is None:
            raise ChallengeError("COLUMN_NOT_FOUND")
        source, card = matches[0]
        source["cards"].remove(card)
        index = max(0, min(int(event.get("index", len(target["cards"]))), len(target["cards"])))
        target["cards"].insert(index, card)
    elif kind == "rename":
        matches = [card for _, card in cards if card["id"] == event["card_id"]]
        if not matches:
            raise ChallengeError("CARD_NOT_FOUND")
        matches[0]["title"] = event["title"]
    elif kind == "remove":
        matches = [(column, card) for column, card in cards if card["id"] == event["card_id"]]
        if not matches:
            raise ChallengeError("CARD_NOT_FOUND")
        matches[0][0]["cards"].remove(matches[0][1])
    else:
        raise ChallengeError("UNKNOWN_EVENT")
    return board


def _cell_key(cell: list[int] | tuple[int, int]) -> tuple[int, int]:
    return int(cell[0]), int(cell[1])


def _neighbors(cell: tuple[int, int], width: int, height: int) -> list[tuple[int, int]]:
    x, y = cell
    return [
        (nx, ny)
        for ny in range(max(0, y - 1), min(height, y + 2))
        for nx in range(max(0, x - 1), min(width, x + 2))
        if (nx, ny) != cell
    ]


def minesweeper_apply(payload: dict[str, Any]) -> dict[str, Any]:
    state = copy.deepcopy(payload["state"])
    if state["status"] != "active":
        return state
    width, height = state["width"], state["height"]
    mines = {_cell_key(cell) for cell in state["mines"]}
    revealed = {_cell_key(cell) for cell in state["revealed"]}
    flags = {_cell_key(cell) for cell in state["flags"]}
    action = payload["action"]
    cell = _cell_key(action["cell"])
    if not (0 <= cell[0] < width and 0 <= cell[1] < height):
        raise ChallengeError("CELL_OUT_OF_BOUNDS")

    if action["type"] == "flag":
        if cell not in revealed:
            if cell in flags:
                flags.remove(cell)
            else:
                flags.add(cell)
    elif action["type"] == "reveal":
        if cell in flags:
            return state
        if cell in mines:
            revealed.add(cell)
            state["status"] = "lost"
        else:
            queue = deque([cell])
            while queue:
                current = queue.popleft()
                if current in revealed or current in flags or current in mines:
                    continue
                revealed.add(current)
                neighbors = _neighbors(current, width, height)
                if not any(neighbor in mines for neighbor in neighbors):
                    queue.extend(neighbor for neighbor in neighbors if neighbor not in revealed)
            if len(revealed) == width * height - len(mines):
                state["status"] = "won"
    else:
        raise ChallengeError("UNKNOWN_ACTION")

    state["revealed"] = [list(cell) for cell in sorted(revealed, key=lambda item: (item[1], item[0]))]
    state["flags"] = [list(cell) for cell in sorted(flags, key=lambda item: (item[1], item[0]))]
    return state


def recommend_models(payload: dict[str, Any]) -> list[dict[str, Any]]:
    requirements = payload.get("requirements", {})
    weights = requirements.get("weights", {})
    corrections = {item["id"]: float(item["delta"]) for item in payload.get("corrections", [])}
    ranked = []
    for model in payload.get("models", []):
        if requirements.get("needs_vision") and not model.get("vision"):
            continue
        if requirements.get("local_only") and not model.get("local"):
            continue
        score = (
            float(weights.get("quality", 0)) * float(model.get("quality", 0))
            + float(weights.get("speed", 0)) * float(model.get("speed", 0))
            + float(weights.get("context", 0)) * float(model.get("context", 0))
            + float(weights.get("cost", 0)) * (1 - float(model.get("cost", 1)))
            + corrections.get(model["id"], 0)
        )
        ranked.append({"id": model["id"], "score": round(score, 6)})
    return sorted(ranked, key=lambda item: (-item["score"], item["id"]))


SOLVERS = {
    "hello_world": hello_world,
    "snake": snake_step,
    "pong": pong_step,
    "solitaire": solitaire,
    "file_watcher": diff_snapshots,
    "scientific_calculator": calculate,
    "kanban": kanban_apply,
    "minesweeper": minesweeper_apply,
    "model_recommendations": recommend_models,
}


def solve(challenge: str, payload: dict[str, Any]) -> Any:
    try:
        solver = SOLVERS[challenge]
    except KeyError as exc:
        raise ChallengeError("UNKNOWN_CHALLENGE") from exc
    return solver(payload)
