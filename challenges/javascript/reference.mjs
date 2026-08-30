// Independent JavaScript reference lane for ADAPTER_CHALLENGE_CASES/1.

export class ChallengeError extends Error {
  constructor(code, detail = "") {
    super(detail || code);
    this.code = code;
  }
}

const clone = value => JSON.parse(JSON.stringify(value));

export function helloWorld(payload) {
  return `Hello, ${payload.name ?? "World"}!`;
}

const DIRECTIONS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
const OPPOSITE = {up: "down", down: "up", left: "right", right: "left"};
const sameCell = (left, right) => left?.[0] === right?.[0] && left?.[1] === right?.[1];

export function snakeStep(payload) {
  const state = clone(payload.state);
  if (state.alive === false) return state;
  const requested = payload.direction ?? state.direction;
  if (!DIRECTIONS[requested]) throw new ChallengeError("INVALID_DIRECTION");
  let direction = state.direction;
  if (state.snake.length === 1 || requested !== OPPOSITE[direction]) direction = requested;
  const [dx, dy] = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = [head[0] + dx, head[1] + dy];
  const ate = sameCell(state.food, nextHead);
  const nextSnake = ate
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];
  const outside = nextHead[0] < 0 || nextHead[0] >= state.width || nextHead[1] < 0 || nextHead[1] >= state.height;
  const collided = nextSnake.slice(1).some(cell => sameCell(cell, nextHead));
  state.snake = nextSnake;
  state.direction = direction;
  state.alive = !(outside || collided);
  if (ate) state.food = null;
  return state;
}

function overlapsPaddle(ball, paddle) {
  return ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h;
}

export function pongStep(payload) {
  const state = clone(payload.state);
  const dt = Number(payload.dt ?? 1);
  const ball = state.ball;
  const oldX = ball.x;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.y - ball.r < 0) {
    ball.y = ball.r + (ball.r - ball.y);
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.r > state.height) {
    const boundary = state.height - ball.r;
    ball.y = boundary - (ball.y - boundary);
    ball.vy = -Math.abs(ball.vy);
  }

  const left = state.paddles.left;
  const right = state.paddles.right;
  const leftEdge = left.x + left.w;
  if (ball.vx < 0 && oldX - ball.r >= leftEdge && ball.x - ball.r <= leftEdge && overlapsPaddle(ball, left)) {
    ball.x = leftEdge + ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.vx > 0 && oldX + ball.r <= right.x && ball.x + ball.r >= right.x && overlapsPaddle(ball, right)) {
    ball.x = right.x - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.x + ball.r < 0) {
    state.score.right += 1;
    Object.assign(ball, {x: state.width / 2, y: state.height / 2, vx: -Math.abs(ball.vx)});
  } else if (ball.x - ball.r > state.width) {
    state.score.left += 1;
    Object.assign(ball, {x: state.width / 2, y: state.height / 2, vx: Math.abs(ball.vx)});
  }
  return state;
}

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["C", "D", "H", "S"];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 1]));

export function standardDeck() {
  return SUITS.flatMap(suit => RANKS.map(rank => rank + suit));
}

export function solitaireDeal(deck = null) {
  const cards = [...(deck ?? standardDeck())];
  if (cards.length !== 52 || new Set(cards).size !== 52) throw new ChallengeError("INVALID_DECK");
  const tableau = Array.from({length: 7}, () => []);
  let cursor = 0;
  for (let row = 0; row < 7; row += 1) {
    for (let column = row; column < 7; column += 1) {
      tableau[column].push({card: cards[cursor], face_up: false});
      cursor += 1;
    }
  }
  for (const column of tableau) column[column.length - 1].face_up = true;
  return {tableau, stock: cards.slice(cursor)};
}

export function solitaireCanStack(moving, target) {
  const rank = moving.slice(0, -1);
  const suit = moving.slice(-1);
  if (!(rank in RANK_VALUE) || !SUITS.includes(suit)) throw new ChallengeError("INVALID_CARD");
  if (target === null || target === undefined) return rank === "K";
  const targetRank = target.slice(0, -1);
  const targetSuit = target.slice(-1);
  if (!(targetRank in RANK_VALUE) || !SUITS.includes(targetSuit)) throw new ChallengeError("INVALID_CARD");
  const red = suit === "D" || suit === "H";
  const targetRed = targetSuit === "D" || targetSuit === "H";
  return red !== targetRed && RANK_VALUE[rank] + 1 === RANK_VALUE[targetRank];
}

export function solitaire(payload) {
  if (payload.operation === "can_stack") return solitaireCanStack(payload.moving, payload.target);
  if (payload.operation === "deal_summary") {
    const deal = solitaireDeal();
    return {
      column_sizes: deal.tableau.map(column => column.length),
      top_cards: deal.tableau.map(column => column.at(-1).card),
      stock_count: deal.stock.length,
    };
  }
  throw new ChallengeError("UNKNOWN_OPERATION");
}

export function diffSnapshots(payload) {
  const before = payload.before ?? {};
  const after = payload.after ?? {};
  const beforePaths = new Set(Object.keys(before));
  const afterPaths = new Set(Object.keys(after));
  return {
    created: [...afterPaths].filter(path => !beforePaths.has(path)).sort(),
    modified: [...beforePaths].filter(path => afterPaths.has(path) && before[path] !== after[path]).sort(),
    deleted: [...beforePaths].filter(path => !afterPaths.has(path)).sort(),
  };
}

class Calculator {
  static functions = {
    sin: Math.sin,
    cos: Math.cos,
    sqrt: Math.sqrt,
    log: Math.log,
    abs: Math.abs,
  };
  static constants = {pi: Math.PI, e: Math.E};
  static precedence = {"+": 10, "-": 10, "*": 20, "/": 20, "^": 30};

  constructor(source) {
    this.tokens = [];
    let position = 0;
    while (position < source.length) {
      const whitespace = /^\s+/.exec(source.slice(position));
      if (whitespace) {
        position += whitespace[0].length;
        continue;
      }
      const number = /^\d+(?:\.\d+)?/.exec(source.slice(position));
      if (number) {
        this.tokens.push(["number", Number(number[0])]);
        position += number[0].length;
        continue;
      }
      const name = /^[A-Za-z_][A-Za-z_0-9]*/.exec(source.slice(position));
      if (name) {
        this.tokens.push(["name", name[0]]);
        position += name[0].length;
        continue;
      }
      const symbol = source[position];
      if ("+-*/^(),".includes(symbol)) {
        this.tokens.push([symbol, symbol]);
        position += 1;
        continue;
      }
      throw new ChallengeError("INVALID_TOKEN");
    }
    this.tokens.push(["end", null]);
    this.index = 0;
  }

  peek() {
    return this.tokens[this.index][0];
  }

  take(kind = null) {
    const token = this.tokens[this.index];
    if (kind !== null && token[0] !== kind) throw new ChallengeError("UNEXPECTED_TOKEN");
    this.index += 1;
    return token;
  }

  parse() {
    const result = this.expression();
    if (this.peek() !== "end") throw new ChallengeError("UNEXPECTED_TOKEN");
    if (!Number.isFinite(result)) throw new ChallengeError("NON_FINITE_RESULT");
    return Math.round((result + Number.EPSILON) * 1e12) / 1e12;
  }

  expression(minimum = 0) {
    let left = this.prefix();
    while (this.peek() in Calculator.precedence && Calculator.precedence[this.peek()] >= minimum) {
      const operator = this.take()[0];
      const precedence = Calculator.precedence[operator];
      const right = this.expression(operator === "^" ? precedence : precedence + 1);
      if (operator === "+") left += right;
      else if (operator === "-") left -= right;
      else if (operator === "*") left *= right;
      else if (operator === "/") {
        if (right === 0) throw new ChallengeError("DIVISION_BY_ZERO");
        left /= right;
      } else left **= right;
    }
    return left;
  }

  prefix() {
    if (this.peek() === "-") {
      this.take("-");
      return -this.expression(30);
    }
    if (this.peek() === "+") {
      this.take("+");
      return this.expression(30);
    }
    if (this.peek() === "number") return this.take("number")[1];
    if (this.peek() === "(") {
      this.take("(");
      const value = this.expression();
      this.take(")");
      return value;
    }
    if (this.peek() === "name") {
      const name = this.take("name")[1];
      if (this.peek() !== "(") {
        if (!(name in Calculator.constants)) throw new ChallengeError("UNKNOWN_NAME");
        return Calculator.constants[name];
      }
      this.take("(");
      const value = this.expression();
      this.take(")");
      if (!(name in Calculator.functions)) throw new ChallengeError("UNKNOWN_FUNCTION");
      const result = Calculator.functions[name](value);
      if (Number.isNaN(result)) throw new ChallengeError("DOMAIN_ERROR");
      return result;
    }
    throw new ChallengeError("UNEXPECTED_TOKEN");
  }
}

export function calculate(payload) {
  if (typeof payload.expression !== "string" || !payload.expression.trim()) throw new ChallengeError("EXPRESSION_REQUIRED");
  return new Calculator(payload.expression).parse();
}

export function kanbanApply(payload) {
  const board = clone(payload.board);
  const event = payload.event;
  const columns = board.columns;
  const columnById = new Map(columns.map(column => [column.id, column]));
  const cards = columns.flatMap(column => column.cards.map(card => [column, card]));
  const cardIds = cards.map(([, card]) => card.id);
  if (new Set(cardIds).size !== cardIds.length) throw new ChallengeError("DUPLICATE_CARD");

  if (event.type === "add") {
    if (cardIds.includes(event.card.id)) throw new ChallengeError("DUPLICATE_CARD");
    const column = columnById.get(event.column_id);
    if (!column) throw new ChallengeError("COLUMN_NOT_FOUND");
    column.cards.push(clone(event.card));
  } else if (event.type === "move") {
    const match = cards.find(([, card]) => card.id === event.card_id);
    if (!match) throw new ChallengeError("CARD_NOT_FOUND");
    const target = columnById.get(event.to_column);
    if (!target) throw new ChallengeError("COLUMN_NOT_FOUND");
    const [source, card] = match;
    source.cards.splice(source.cards.indexOf(card), 1);
    const requested = Number(event.index ?? target.cards.length);
    const index = Math.max(0, Math.min(requested, target.cards.length));
    target.cards.splice(index, 0, card);
  } else if (event.type === "rename") {
    const match = cards.find(([, card]) => card.id === event.card_id);
    if (!match) throw new ChallengeError("CARD_NOT_FOUND");
    match[1].title = event.title;
  } else if (event.type === "remove") {
    const match = cards.find(([, card]) => card.id === event.card_id);
    if (!match) throw new ChallengeError("CARD_NOT_FOUND");
    match[0].cards.splice(match[0].cards.indexOf(match[1]), 1);
  } else throw new ChallengeError("UNKNOWN_EVENT");
  return board;
}

const key = cell => `${Number(cell[0])},${Number(cell[1])}`;
const fromKey = value => value.split(",").map(Number);

function neighbors(cell, width, height) {
  const [x, y] = cell;
  const result = [];
  for (let ny = Math.max(0, y - 1); ny < Math.min(height, y + 2); ny += 1) {
    for (let nx = Math.max(0, x - 1); nx < Math.min(width, x + 2); nx += 1) {
      if (nx !== x || ny !== y) result.push([nx, ny]);
    }
  }
  return result;
}

function sortedCells(values) {
  return [...values].map(fromKey).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

export function minesweeperApply(payload) {
  const state = clone(payload.state);
  if (state.status !== "active") return state;
  const {width, height} = state;
  const mines = new Set(state.mines.map(key));
  const revealed = new Set(state.revealed.map(key));
  const flags = new Set(state.flags.map(key));
  const action = payload.action;
  const cell = action.cell.map(Number);
  const cellKey = key(cell);
  if (cell[0] < 0 || cell[0] >= width || cell[1] < 0 || cell[1] >= height) throw new ChallengeError("CELL_OUT_OF_BOUNDS");

  if (action.type === "flag") {
    if (!revealed.has(cellKey)) {
      if (flags.has(cellKey)) flags.delete(cellKey);
      else flags.add(cellKey);
    }
  } else if (action.type === "reveal") {
    if (flags.has(cellKey)) return state;
    if (mines.has(cellKey)) {
      revealed.add(cellKey);
      state.status = "lost";
    } else {
      const queue = [cell];
      while (queue.length) {
        const current = queue.shift();
        const currentKey = key(current);
        if (revealed.has(currentKey) || flags.has(currentKey) || mines.has(currentKey)) continue;
        revealed.add(currentKey);
        const adjacent = neighbors(current, width, height);
        if (!adjacent.some(item => mines.has(key(item)))) {
          queue.push(...adjacent.filter(item => !revealed.has(key(item))));
        }
      }
      if (revealed.size === width * height - mines.size) state.status = "won";
    }
  } else throw new ChallengeError("UNKNOWN_ACTION");

  state.revealed = sortedCells(revealed);
  state.flags = sortedCells(flags);
  return state;
}

export function recommendModels(payload) {
  const requirements = payload.requirements ?? {};
  const weights = requirements.weights ?? {};
  const corrections = new Map((payload.corrections ?? []).map(item => [item.id, Number(item.delta)]));
  const ranked = [];
  for (const model of payload.models ?? []) {
    if (requirements.needs_vision && !model.vision) continue;
    if (requirements.local_only && !model.local) continue;
    const score =
      Number(weights.quality ?? 0) * Number(model.quality ?? 0)
      + Number(weights.speed ?? 0) * Number(model.speed ?? 0)
      + Number(weights.context ?? 0) * Number(model.context ?? 0)
      + Number(weights.cost ?? 0) * (1 - Number(model.cost ?? 1))
      + Number(corrections.get(model.id) ?? 0);
    ranked.push({id: model.id, score: Math.round((score + Number.EPSILON) * 1e6) / 1e6});
  }
  return ranked.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export const SOLVERS = {
  hello_world: helloWorld,
  snake: snakeStep,
  pong: pongStep,
  solitaire,
  file_watcher: diffSnapshots,
  scientific_calculator: calculate,
  kanban: kanbanApply,
  minesweeper: minesweeperApply,
  model_recommendations: recommendModels,
};

export function solve(challenge, payload) {
  const solver = SOLVERS[challenge];
  if (!solver) throw new ChallengeError("UNKNOWN_CHALLENGE");
  return solver(payload);
}
