import argparse
from ctypes import ArgumentError
import chess
import io
import tqdm
import itertools
import math
import numpy as np
from stockfish import Stockfish, StockfishException
import time
from typing import List, Any, Tuple, Literal
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

def generate_one_side(pieceset: Literal['standard', 'balanced', 'chaos'] = 'standard'):
    half_board = [[' ' for _ in range(8)] for _ in range(4)]
    # 1 king on 1st rank guaranteed
    half_board[0][np.random.randint(8)] = 'k'
    # 3 pawns on 2nd rank guaranteed
    # 2 undoubled pawns on 3rd rank guaranteed
    pawn_cols = np.random.choice(8, 5, replace=False)
    pawn_rank3 = np.random.choice(pawn_cols, 2, replace=False)
    for i in pawn_cols:
        if i in pawn_rank3:
            half_board[2][i] = 'p'
        else:
            half_board[1][i] = 'p'
    # Figure out what other pieces to add
    if pieceset == 'standard':
        # Normal chess pieces
        queens_to_add = 1
        rooks_to_add = 2
        bishops_to_add = 2
        knights_to_add = 2
        n_pawns_to_add = 2
    elif pieceset == 'balanced':
        # A set of pieces with value similar to normal chess
        value_left = CHESS_VALUE - 6 * est_piece_values['p']
        queens_to_add = np.random.choice([0,1,2], p=[.25,.5,.25])
        value_left -= est_piece_values['q']  * queens_to_add
        rooks_to_add = max(0, np.random.choice([3, 4, 5], p=[.25 + .1 * queens_to_add, .5, .25 - .1 * queens_to_add]) - 2 * queens_to_add)
        rooks_to_add = np.random.randint(max(0, 3 - 2 * queens_to_add), 5 - 2 * queens_to_add + 1)
        value_left -= est_piece_values['r']  * rooks_to_add
        max_minors_to_add = value_left / est_piece_values['b']
        minors_to_add = np.random.randint(int(max_minors_to_add - 1.5), int(max_minors_to_add + 1.5))
        bishops_to_add = int(np.sum(np.random.randint(0, 2, minors_to_add))) # binomial distribution
        knights_to_add = minors_to_add - bishops_to_add
        value_left -= est_piece_values['n'] * knights_to_add
        value_left -= est_piece_values['b'] * bishops_to_add
        n_pawns_to_add = np.random.randint(int(value_left) - 1, int(value_left) + 2)
    elif pieceset == 'chaos':
        # Can result in very different piece values. Some regularization on the number of pieces
        queens_to_add = np.random.randint(0, 3)
        rooks_to_add = np.random.randint(0, 5 - queens_to_add)
        minors_to_add = np.random.randint(5, 10) - queens_to_add - rooks_to_add
        bishops_to_add = int(np.sum(np.random.randint(0, 2, minors_to_add))) # binomial distribution
        knights_to_add = minors_to_add - bishops_to_add
        n_pawns_to_add = np.random.randint(0, 12 - minors_to_add - rooks_to_add // 2)
    pieces_to_add = 'q' * queens_to_add + 'r' * rooks_to_add + 'b' * bishops_to_add + 'n' * knights_to_add
    # Add pawns
    empty_pawn_locs = (np.array(half_board[1:]) == ' ').astype(np.float32)
    # empty_pawn_locs[1] *= .8
    # empty_pawn_locs[2] *= .6
    empty_pawn_locs = empty_pawn_locs / np.sum(empty_pawn_locs)
    if n_pawns_to_add > 0:
        to_add_coords = np.random.choice(len(empty_pawn_locs.flatten()), n_pawns_to_add, replace=False, p=empty_pawn_locs.flatten())
        for i in to_add_coords:
            half_board[1 + i //8][i % 8] = 'p'
    # Add pieces
    empty_locs = (np.array(half_board) == ' ').astype(np.float32)
    empty_locs[1] *= .8
    empty_locs[2] *= .5
    empty_locs[3] *= .3
    empty_locs = empty_locs / np.sum(empty_locs)
    if len(pieces_to_add) > 0:
        to_add_coords = np.random.choice(len(empty_locs.flatten()), len(pieces_to_add), replace=False, p=empty_locs.flatten())
        for i, coord in enumerate(to_add_coords):
            half_board[coord //8][coord % 8] = pieces_to_add[i]
    return half_board

def generate_board(pieceset: Literal['standard', 'balanced', 'chaos'] = 'standard'):
    white = generate_one_side(pieceset)
    black = generate_one_side(pieceset)
    black[0], black[3] = black[3], black[0]
    black[1], black[2] = black[2], black[1]
    black = [[p.upper() for p in r] for r in black]
    board = white + black
    if abs(check_valid(board_to_fen(board))) >= INF:
        return generate_board(pieceset)
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

def check_valid(fen):
    board = chess.Board(fen)
    is_checkmate = board.is_checkmate()
    if is_checkmate:
        return INF
    board = chess.Board(fen.replace('w', 'b'))
    is_check_black = board.is_check()
    if is_check_black:
        return -INF
    return 0

def evaluate(engine) -> float:
    try:
        val = engine.get_evaluation()
        if val["type"] == "cp":
            return val["value"]
        elif val['type'] == 'mate':
            return INF if val["value"] > 0 else -INF
    except StockfishException as e:
        print(engine.get_fen_position())
        print(e)
    return INF

class NoInterestingMoves(Exception):
    pass

def make_equalizing_moves(engine: Stockfish):
    for _ in range(2): # make 2 moves so it is still white to move
        most_equalizing = None
        best_centipawn = 100000
        engine.set_depth(15)
        for move in engine.get_top_moves(10):
            if (len(move['Move']) == 4 # Avoid promotions and checks and captures to keep it interesting
                and best_centipawn != 0 # no forced draws
                and move['Centipawn'] is not None \
                and abs(move['Centipawn']) < abs(best_centipawn)):
                best_centipawn = move['Centipawn']
                most_equalizing = move['Move']
        if most_equalizing is None:
            raise NoInterestingMoves
        engine.make_moves_from_current_position([most_equalizing])
        most_equalizing = None
    return engine

def improve_position(fen, engine: Stockfish, desired_eval, tries: int) -> Tuple[str, float]:
    engine.set_fen_position(fen)
    abs_eval = INF
    t = 0
    while abs(abs_eval) > desired_eval and t < tries:
        if abs_eval > 300:
            engine.set_depth(10)
        elif abs_eval > 200:
            engine.set_depth(13)
        elif abs_eval > 100:
            engine.set_depth(16)
        elif abs_eval > 50:
            engine.set_depth(19)

        for _ in range(2): # make 2 moves so it is still white to move
            most_equalizing = None
            best_centipawn = 100000
            for move in engine.get_top_moves(8):
                # Avoid promotions and checks and captures to keep it interesting -
                # equivalent to ensure that move['Move'] is of length 4
                if len(move['Move']) == 4 and move['Centipawn'] is not None and abs(move['Centipawn']) < abs(best_centipawn) and move['Centipawn'] != 0:
                    best_centipawn = abs(move['Centipawn'])
                    most_equalizing = move['Move']
            if most_equalizing is not None:
                engine.make_moves_from_current_position([most_equalizing])
                most_equalizing = None
                abs_eval = best_centipawn
        t += 1
        if abs_eval < desired_eval:
            # Confirm at high depth
            engine.set_depth(23)
            abs_eval = evaluate(engine)
        print(abs_eval, end=' ', flush=True)
        if abs_eval < desired_eval and abs_eval != 0:
            break
    return engine.get_fen_position(), abs_eval

def print_board(board):
    for r in board:
        print(str(object=r))

def filter_unfair_boards(candidate_boards, out_f):
    stockfish_path = str(Path(__file__).parent / 'stockfish')
    fish_params = {"Threads": 12, "Hash": 8192 * 2, "Slow Mover": 0}
    engine = Stockfish(path=stockfish_path, parameters=fish_params)
    good_fens = []
    board_centipawns = []
    for board in candidate_boards:
        eval = 0
        fen = board_to_fen(board)
        # Note: Chess 960 has an average centipawn difference of 35 +- 16
        # https://www.reddit.com/r/chess/comments/yeregq/fischer_random_all_960_starting_positions/
        try:
            new_fen, eval = improve_position(fen, engine, 35, 20)
        except NoInterestingMoves:
            continue
        is_good_enough = abs(eval) < 35 and eval != 0
        board, tomove, castling, enpassant, halfmoves, fullmoves = new_fen.split(' ')            
        if is_good_enough and tomove == 'w' and enpassant == '-':
            good_fens.append(new_fen)
            board_centipawns.append(eval)
            out_str = '{' + f"'fen': '{good_fens[-1]}', 'eval': {board_centipawns[-1]}" + '},\n'
            print(out_str)
            out_f.write(out_str)
            out_f.flush()

def main():
    for i in tqdm.tqdm(range(1, 500)):
        if i % 3 == 0:
            board = generate_board('standard')
            filename = 'rand_positions.txt' 
        elif i % 3 == 1:
            board = generate_board('chaos')
            filename = 'rand_positions_chaos.txt'
        else: # i % 3 == 2
            board = generate_board('balanced')
            filename = 'rand_positions_oneset.txt'
        with open(parent_dir / filename, 'a+') as f:
            filter_unfair_boards([board], f)

if __name__ == "__main__":
    parent_dir = Path(__file__).parent
    main()
