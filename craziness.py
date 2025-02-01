import chess
from chess.pgn import read_game
from io import StringIO

import chess.pgn
from stockfish import Stockfish

PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 10
}

TYPICAL_PIECE_COUNTS = {
    chess.PAWN: 8,
    chess.KNIGHT: 2,
    chess.BISHOP: 2,
    chess.ROOK: 2,
    chess.QUEEN: 1,
    chess.KING: 1
}

CORNER_SQUARES = [chess.A1, chess.A8, chess.H8, chess.H1]

def opposite_colour(colour: str):
    return "black" if colour == "white" else "white"


stockfish_path = '/home/alexli/fun/stockfish/stockfish-ubuntu-x86-64-avx2'
fish_params = {"Threads": 12, "Hash": 8192 * 2, "Slow Mover": 0}
engine = Stockfish(path=stockfish_path, parameters=fish_params)
engine.set_depth(25)

# takes in a parsed PGN, estimates game craziness
# and returns a score
def estimate_game_craziness(game: chess.pgn.Game):
    game_moves = list(game.mainline())
    if game.headers['Result'] != '1/2-1/2':
        if len(game_moves) <= 50:
            engine.set_fen_position(game_moves[40].board().fen())
            evaluation = engine.get_evaluation()
            if evaluation['type'] != 'cp':
                return 0, None # It's a mate-in-N
            elif evaluation['value'] > 0.5 and game.headers['Result'] == '1-0':
                return 0, None # Black lost and black's position is worse
            elif evaluation['value'] < -0.5 and game.headers['Result'] == '0-1':
                return 0, None # White lost and white's position is worse
    offset = 20
    pieces_moved: list[chess.PieceType] = []
    move_scores = [0] * offset
    total_material = [78] * offset
    for node_index, move_node in list(enumerate(game_moves))[offset:]:
        score = 0
        if node_index >= 40 or total_material[-1] < 20:
            break

        move = move_node.move
        board = move_node.board()

        turn_colour = "white" if board.turn else "black"

        try:
            pieces_moved.append(
                board.piece_at(move.to_square).piece_type
            )
        except:
            pieces_moved.append(chess.KING)

        # get data about pieces on board
        material = {
            "white": 0,
            "black": 0
        }

        piece_counts = {
            "white": {},
            "black": {}
        }

        king_square = {
            "white": 0,
            "black": 0
        }

        pieces_remaining = 0

        for piece_type in chess.PIECE_TYPES:
            piece_counts["white"][piece_type] = 0
            piece_counts["black"][piece_type] = 0
        
        for square in chess.SQUARES:
            piece = board.piece_at(square)

            if piece is not None:
                piece_colour = "white" if piece.color else "black"

                material[piece_colour] += PIECE_VALUES[piece.piece_type]

                piece_counts[piece_colour][piece.piece_type] += 1

                if piece.piece_type == chess.KING:
                    king_square[piece_colour] = square

                pieces_remaining += 1
        total_material.append(material['white'] + material['black'])
        imbalance = 0
        for piece_type in chess.PIECE_TYPES:
            imbalance += abs(piece_counts["white"][piece_type] - piece_counts["black"][piece_type]) * PIECE_VALUES[piece_type] ** .5
        score += imbalance
        # number of simultaneously hanging pieces
        for square in chess.SQUARES:
            piece = board.piece_at(square)

            # There must be a piece in the square
            # It must be the opposite of whose turn it is
            # It cannot be a king because a king cannot have attackers
            if (
                piece is None
                or piece.color == board.turn
                or piece.piece_type == chess.KING
            ):
                continue

            # If the piece being looked at was just traded off,
            # there's no sacrifice
            last_position = game_moves[node_index - 1].board()
            last_piece = last_position.piece_at(square)
            piece_has_been_sitting_here = last_piece is not None and last_piece.color == piece.color

            if not piece_has_been_sitting_here:
                continue

            # Get the attackers of the current square
            attacker_squares = board.attackers(not piece.color, square)
            attacker_values = sorted([PIECE_VALUES[board.piece_at(attacker).piece_type] for attacker in attacker_squares])

            # Get defenders of the current square
            defender_squares = board.attackers(piece.color, square)
            defender_values = [PIECE_VALUES[piece.piece_type]] + sorted([PIECE_VALUES[board.piece_at(defender).piece_type] for defender in defender_squares])

            for i in range(len(attacker_values)):
                if i == len(defender_values):
                    # There is nothing to take
                    break
                if i + 1 == len(defender_values):
                    # There is nothing defending this piece, we can simply take.
                    score += defender_values[i] ** .5
                elif attacker_values[i] < defender_values[i] and i <= len(defender_values):
                    # Can take this piece and, when the next defender takes back, we have gained material
                    score += (defender_values[i] - attacker_values[i]) ** .5

        # underpromotions, weighted towards their rarity
        if move.promotion == chess.QUEEN:
            score += 2.5
        elif move.promotion == chess.KNIGHT:
            score += 7.5
        elif move.promotion == chess.ROOK:
            score += 8.5
        elif move.promotion == chess.BISHOP:
            score += 12.5

        # pieces moving to their most uncommon squares,
        # example Qa1, Nh1 etc.
        if (
            "O-" not in move_node.san()
            and move.to_square in CORNER_SQUARES
            and board.piece_at(move.to_square).piece_type == chess.KNIGHT
        ):
            score += 0.5

        # is king in the centre of the board when there are lots of pieces left
        if (
            23 < king_square[turn_colour] < 40
                and material[opposite_colour(turn_colour)] > 30
        ):
            score += 1.5

        # discard threefold repetitions
        if board.can_claim_threefold_repetition():
            score -= 30

        move_scores.append(score)
    best_node_value = 0
    best_node = game_moves[0]
    ws = [1.3,1.5,1,1,.5,.5,.2,.2,.2,.2]

    for i in range(offset, len(move_scores) - len(ws)):
        if game_moves[i].board().turn: # white to move only
            cur_node_value = total_material[min(len(total_material) - 1, i + 4)] ** .3
            for j, w in enumerate(ws):
                cur_node_value += w * move_scores[i+j]
            if cur_node_value > best_node_value:
                best_node_value = cur_node_value
                best_node = game_moves[i]
    return best_node_value, best_node.board()


# takes in a PGN string and returns the estimated
# craziness score
def estimate_pgn_craziness(pgn: str):
    try:
        game = read_game(
            StringIO(pgn)
        )
    except:
        raise ValueError("failed to parse PGN.")

    return estimate_game_craziness(game)