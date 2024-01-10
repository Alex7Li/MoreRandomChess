# SOURCE: https://github.com/santient/GeneticChess/blob/main/GeneticChess.py
import argparse
import chess
import io
import tqdm
import itertools
import math
import numpy as np
from stockfish import Stockfish, StockfishException
import time
from typing import List, Any, Tuple
from pathlib import Path
import matplotlib.pyplot as plt

PIECES = ["", "P", "N", "B", "R", "Q", "p", "n", "b", "r", "q", "K", "k"]
est_piece_values = {
    'p': 1.0,
    'n': 3.5,
    'b': 3.5,
    'r': 5.25,
    'q': 10.0
}
CHESS_VALUE = est_piece_values['p'] * 8 + est_piece_values['n'] * 2  + est_piece_values['b'] * 2 + est_piece_values['r'] * 2 + est_piece_values['q'] 
INF = 1000.0

def generate_one_side(one_set_only, target_value):
    half_board = [[' ' for _ in range(8)] for _ in range(4)]
    # 1 king on 1st rank guaranteed
    half_board[0][np.random.randint(8)] = 'k'
    # 4 pawns on 2nd rank guaranteed
    # 2 undoubled pawns on 3rd rank guaranteed
    pawn_cols = np.random.choice(8, 6, replace=False)
    pawn_rank3 = np.random.choice(pawn_cols)
    for i in pawn_cols:
        if i == pawn_rank3:
            half_board[2][i] = 'p'
        else:
            half_board[1][i] = 'p'
    # Figure out what other pieces to add
    if one_set_only:
        pieces_to_add = 'qrrbbnn'
        n_pawns_to_add = 2
    else:
        value_left = target_value - 6 * est_piece_values['p']
        queens_to_add = np.random.randint(0, 2 + 1)
        value_left -= est_piece_values['q']  * queens_to_add
        rooks_to_add = np.random.randint(max(0, 3 - 2 * queens_to_add), 5 - 2 * queens_to_add + 1)
        value_left -= est_piece_values['r']  * rooks_to_add
        max_minors_to_add = int(value_left / est_piece_values['b'])
        minors_to_add = np.random.randint(max_minors_to_add - 1, max_minors_to_add + 1)
        bishops_to_add = int(np.sum(np.random.randint(0, 2, minors_to_add))) # binomial distribution
        knights_to_add = minors_to_add - bishops_to_add
        value_left -= est_piece_values['n'] * knights_to_add
        value_left -= est_piece_values['b'] * bishops_to_add
        pieces_to_add = 'q' * queens_to_add + 'r' * rooks_to_add + 'b' * bishops_to_add + 'n' * knights_to_add
        n_pawns_to_add = np.random.randint(int(value_left - 1), int(value_left) + 1)
    # Add pawns
    empty_pawn_locs = (np.array(half_board[1:]) == ' ').astype(np.float32)
    empty_pawn_locs[1] *= .8
    empty_pawn_locs[2] *= .6
    empty_pawn_locs = empty_pawn_locs / np.sum(empty_pawn_locs)
    if n_pawns_to_add > 0:
        to_add_coords = np.random.choice(len(empty_pawn_locs.flatten()), n_pawns_to_add, replace=False, p=empty_pawn_locs.flatten())
        for i in to_add_coords:
            half_board[1 + i //8][i % 8] = 'p'
    # Add pieces
    empty_locs = (np.array(half_board) == ' ').astype(np.float32)
    empty_locs[1] *= .8
    empty_locs[2] *= .6
    empty_locs[3] *= .4
    empty_locs = empty_locs / np.sum(empty_locs)
    if len(pieces_to_add) > 0:
        to_add_coords = np.random.choice(len(empty_locs.flatten()), len(pieces_to_add), replace=False, p=empty_locs.flatten())
        for i, coord in enumerate(to_add_coords):
            half_board[coord //8][coord % 8] = pieces_to_add[i]
    return half_board

def shuffle(board):
    board = [[e for e in r] for r in board] # copy
    # choose pieces on the sane rank and swap
    r,c1,c2=0,0,0
    while board[r][c1] == board[r][c2]:
        r = np.random.randint(0, 8)
        c1 = np.random.randint(0, 8)
        c2 = np.random.randint(0, 8)
    board[r][c1], board[r][c2] = board[r][c2], board[r][c1]
    return board

def generate_board(one_set_only):
    white = generate_one_side(one_set_only, CHESS_VALUE - est_piece_values['p'])
    black = generate_one_side(one_set_only, CHESS_VALUE)
    black[0], black[3] = black[3], black[0]
    black[1], black[2] = black[2], black[1]
    black = [[p.upper() for p in r] for r in black]
    board = white + black
    return board

def board_to_fen(board):
    with io.StringIO() as s:
        for row in board:
            empty = 0
            for cell in row:
                if cell != ' ':
                    if empty > 0:
                        s.write(str(empty))
                        empty = 0
                    s.write(cell)
                else:
                    empty += 1
            if empty > 0:
                s.write(str(empty))
            s.write("/")
        s.seek(s.tell() - 1)
        s.write(" w - - 0 1")
        return s.getvalue()

def evaluate(board, engine, related_to_last=False) -> float:
    fen = board_to_fen(board)
    board = chess.Board(fen)
    is_check = board.is_check()
    if is_check:
        return INF
    board = chess.Board(fen.replace('w', 'b'))
    is_check_black = board.is_check()
    if is_check_black:
        return -INF
    try:
        engine.set_fen_position(fen, send_ucinewgame_token=related_to_last)
        val = engine.get_evaluation()
        if val["type"] == "cp":
            if val['value'] == 0:
                # A forced draw is not desirable so return a highish value
                return -100
            return val["value"]
        elif val['type'] == 'mate':
            return INF if val["value"] > 0 else -INF
    except StockfishException as e:
        print(e)
        print(fen)
    return INF

def evaluate_position_group(board, engine, desired_eval, tries) -> Tuple[Any, float]:
    best_eval = evaluate(board, engine, related_to_last=True)
    for t in range(tries - 1):
        # print(best_eval, end=' ')
        if abs(best_eval) < desired_eval:
            # print()
            return board, best_eval
        else:
            new_board = shuffle(board)
            eval = evaluate(new_board, engine, related_to_last=True)
            if abs(eval) < best_eval:
                best_eval = abs(eval)
                board = new_board
    return board, best_eval

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stockfish", type=str, default="./stockfish", help="path to stockfish binary (default ./stockfish)")
    parser.add_argument("--depth", type=int, default=20, help="balance evaluation depth (default 20)")
    parser.add_argument("--final-depth", type=int, default=30, help="final evaluation depth (default 30)")
    parser.add_argument("--threads", type=int, default=4, help="engine CPU threads (default 4)")
    parser.add_argument("--seed", type=int, default=None, help="random seed (default random)")
    parser.add_argument("--error", type=float, default=0.25, help="target error margin for evaluation (default 0.25)")
    parser.add_argument("--lines", type=int, default=1, help="lines to evaluate (default 1)")
    parser.add_argument("--stable", action="store_true", help="search for depth-stable evaluation (default false)")
    parser.add_argument("--quiet", action="store_true", help="no noisy print statements")
    parser.add_argument("--n", type=int, default=1, help="generate multiple positions")
    parser.add_argument("--one_set", action="store_true", help="generate positions which can be created with only 1 chess set (max 1 queen, 2 rooks, etc...)")
    args = parser.parse_args()
    return args

def print_board(board):
    for r in board:
        print(str(r))

def filter_by_value(candidate_fens, eval, radius) -> Tuple[List[str], List[float]]:
    filtered = [(fen, val) for fen, val in zip(candidate_fens, eval) if abs(val) < radius]
    fens = [f[0] for f in filtered]
    vals = [f[1] for f in filtered]
    return fens, vals

def filter_unfair_boards(candidate_boards, out_f):
    stockfish_path = str(Path(__file__).parent / 'stockfish')
    fish_params = {"Threads": 12, "Hash": 4096}
    evals = []
    engine = Stockfish(path=stockfish_path, parameters=fish_params)
    good_fens = []
    board_centipawns = []
    for board in tqdm.tqdm(candidate_boards):
        is_good_enough = False
        eval = 0
        # Note: Chess 960 has an average centipawn difference of 35 +- 16
        # https://www.reddit.com/r/chess/comments/yeregq/fischer_random_all_960_starting_positions/
        for depth, radius_to_pass, desired_eval, tries in list(zip(
            [20, 14, 21, 26],
            [500, 150, 70, 200],
            [500, 50, 35, 30],
            [1, 15, 6, 1])):
            engine.set_depth(depth)
            board, eval = evaluate_position_group(board, engine, desired_eval, tries)
            is_good_enough = abs(eval) < radius_to_pass
            if not is_good_enough:
                break
        if is_good_enough:
            good_fens.append(board_to_fen(board))
            board_centipawns.append(eval)
            print(f"Good board #{len(good_fens)} found")
            print('{' + f"'fen': '{good_fens[-1]}', 'eval': {board_centipawns[-1]}" + '},\n')
    return good_fens, evals

def main():
    candidate_boards = [generate_board(False) for _ in range(500)]
    with open(parent_dir / 'rand_positions.txt', 'a+') as f:
        fens, evals = filter_unfair_boards(candidate_boards, f)
    candidate_boards = [generate_board(True) for _ in range(500)]
    with open(parent_dir / 'rand_positions_oneset.txt', 'a+') as f:
        fens, evals = filter_unfair_boards(candidate_boards, f)

if __name__ == "__main__":
    parent_dir = Path(__file__).parent
    main()
