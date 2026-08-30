"""Small stateful application used as an IDE acceptance fixture."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json


@dataclass
class Task:
    id: int
    title: str
    column: str = "todo"


class Board:
    VALID_COLUMNS = ("todo", "doing", "done")

    def __init__(self) -> None:
        self._tasks: dict[int, Task] = {}
        self._next_id = 1

    def add(self, title: str) -> Task:
        title = title.strip()
        if not title:
            raise ValueError("title must not be empty")
        task = Task(self._next_id, title)
        self._tasks[task.id] = task
        self._next_id += 1
        return task

    def move(self, task_id: int, column: str) -> Task:
        if column not in self.VALID_COLUMNS:
            raise ValueError(f"unknown column: {column}")
        task = self._tasks[task_id]
        task.column = column
        return task

    def counts(self) -> dict[str, int]:
        counts = {column: 0 for column in self.VALID_COLUMNS}
        for task in self._tasks.values():
            counts[task.column] += 1
        return counts

    def snapshot(self) -> str:
        payload = {
            "tasks": [asdict(task) for task in sorted(self._tasks.values(), key=lambda item: item.id)],
            "counts": self.counts(),
        }
        return json.dumps(payload, indent=2, sort_keys=True)


def smoke_test() -> None:
    board = Board()
    design = board.add("Define provider contract")
    test = board.add("Add acceptance fixture")
    board.move(design.id, "done")
    board.move(test.id, "doing")

    assert board.counts() == {"todo": 0, "doing": 1, "done": 1}
    state = json.loads(board.snapshot())
    assert state["tasks"][0]["title"] == "Define provider contract"
    assert state["tasks"][1]["column"] == "doing"

    print(board.snapshot())
    print("kanban: PASS")


if __name__ == "__main__":
    smoke_test()
