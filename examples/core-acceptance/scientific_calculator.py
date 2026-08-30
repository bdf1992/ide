"""Dependency-free scientific calculator acceptance fixture."""

from __future__ import annotations

import ast
import math
import operator

BINARY = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
UNARY = {ast.UAdd: operator.pos, ast.USub: operator.neg}
FUNCTIONS = {
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
    "abs": abs,
    "round": round,
}
CONSTANTS = {"pi": math.pi, "e": math.e, "tau": math.tau}


def evaluate(expression: str) -> float:
    tree = ast.parse(expression, mode="eval")
    return float(_eval(tree.body))


def _eval(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.Name) and node.id in CONSTANTS:
        return CONSTANTS[node.id]
    if isinstance(node, ast.BinOp) and type(node.op) in BINARY:
        return BINARY[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in UNARY:
        return UNARY[type(node.op)](_eval(node.operand))
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        fn = FUNCTIONS.get(node.func.id)
        if fn is None:
            raise ValueError(f"function not allowed: {node.func.id}")
        if node.keywords:
            raise ValueError("keyword arguments are not supported")
        return fn(*(_eval(arg) for arg in node.args))
    raise ValueError(f"unsupported expression: {ast.dump(node, include_attributes=False)}")


def smoke_test() -> None:
    cases = {
        "2 + 3 * 4": 14.0,
        "sqrt(81) + 1": 10.0,
        "sin(pi / 2)": 1.0,
        "log10(1000)": 3.0,
        "2 ** 8": 256.0,
    }
    for expression, expected in cases.items():
        actual = evaluate(expression)
        assert math.isclose(actual, expected, rel_tol=1e-12), (expression, actual, expected)
        print(f"{expression} = {actual:g}")
    print("calculator: PASS")


if __name__ == "__main__":
    smoke_test()
