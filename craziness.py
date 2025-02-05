import chess
from chess.pgn import read_game
from io import StringIO
import chess.pgn
from typing import Optional
import statistics
from stockfish import Stockfish

stockfish_path = '/home/alexli/fun/stockfish/stockfish-ubuntu-x86-64-avx2'
fish_params = {"Threads": 12, "Hash": 8192 * 2, "Slow Mover": 0}
engine = Stockfish(path=stockfish_path, parameters=fish_params)
engine.set_depth(23)
PIECE_VALUES = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 10
}

CORNER_SQUARES = [chess.A1, chess.A8, chess.H8, chess.H1]

def opposite_colour(colour: str):
    return "black" if colour == "white" else "white"

# takes in a parsed PGN, estimates game craziness
# and returns a score
def estimate_game_craziness(game: chess.pgn.Game):

    # Return [craziness_score, craziest_position, craziest_position_evaluation
    game_moves = list(game.mainline())
    last_book_move = 0
    for move in game_moves:
        # don't start in a book move or you'll get destroyed by TCEC Viewer Submitted Openings

        if 'book' in move.comment:
            last_book_move += 1

    offset = max(last_book_move, 20)
    pieces_moved: list[chess.PieceType] = []
    move_scores = [0] * offset
    total_material = [98] * offset
    imbalance_score = [0] * offset
    all_turn_piece_counts = [
       {'white': {}, 'black': {}}
    ] * offset
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
        all_turn_piece_counts.append(piece_counts)
        # Remove positions where we can castle but it doesn't look like it
        if board.has_chess960_castling_rights():
            score = -1000  # We have castling rights - but this is a 960 game
        else:
            # number of simultaneously hanging pieces of the opponent
            for square in chess.SQUARES:
                piece = board.piece_at(square)
                # The opponent has just made their move. What pieces have they left undefended?
                # Does not account for complex tactics like pins or moves on the other side of the board

                if (
                    piece is None
                    or piece.color == board.turn
                    or piece.piece_type == chess.KING
                ):
                    continue

                # If the piece being looked at was just traded off, there's no sacrifice
                last_position = game_moves[node_index - 1].board()
                last_piece = last_position.piece_at(square)
                piece_was_just_traded = last_piece is not None and last_piece.color != piece.color

                if piece_was_just_traded:
                    continue

                # Get the attackers of the current square that are not brand new - if they were just moved here last
                # turn, we didn't sacrifice since we can defend it.
                # attacker_squares = board.attackers(board.turn, square)
                # attacker_values = sorted([PIECE_VALUES[board.piece_at(attacker).piece_type] for attacker in attacker_squares])
                #
                # # Get defenders of the current square
                # defender_squares = board.attackers(piece.color, square)
                # defender_values = [PIECE_VALUES[piece.piece_type]] + sorted([PIECE_VALUES[board.piece_at(defender).piece_type] for defender in defender_squares])

                def compute_potential_material_gain_advanced(turn, board_copy):
                    current_attacker_squares = board_copy.attackers(turn, square)
                    if len(current_attacker_squares) == 0:
                        return 0
                    cheapest_attacker = min(current_attacker_squares, key=lambda attacker_square: PIECE_VALUES[board_copy.piece_at(attacker_square).piece_type])
                    captured_piece_value = PIECE_VALUES[board_copy.piece_at(square).piece_type]
                    board_copy.push(chess.Move(cheapest_attacker, square))
                    return max(0, captured_piece_value - compute_potential_material_gain_advanced(not turn, board_copy))

                potential_material_gain = compute_potential_material_gain_advanced(board.turn, board.copy())

                score += potential_material_gain ** .7

            # underpromotions, weighted towards their rarity
            if move.promotion == chess.QUEEN:
                score += 2.5
            elif move.promotion == chess.KNIGHT:
                score += 7.5
            elif move.promotion == chess.ROOK:
                score += 8.5
            elif move.promotion == chess.BISHOP:
                score += 12.5

            # is king in the centre of the board when there are lots of pieces left
            if (
                23 < king_square[turn_colour] < 40
                    and material[opposite_colour(turn_colour)] > 30
            ):
                score += 1.5

            # threefold repetitions are boring
            if board.can_claim_threefold_repetition():
                score -= 5

        move_scores.append(score)
    best_node_value = 0
    best_board = None
    ws = [2,1.5,1,1,.5,.5,.3,.3,.1,.1]
    for i in range(offset, len(move_scores) - len(ws)):
        cur_board = game_moves[i].board()
        if cur_board.turn: # white to move only
            future_non_capture_turn_ind = min(len(total_material) - 1, i + 4)
            while future_non_capture_turn_ind < len(total_material) - 1 and 'x' in game_moves[future_non_capture_turn_ind].san():
                future_non_capture_turn_ind += 1
            cur_node_value = (total_material[future_non_capture_turn_ind] - 20) ** .3
            imbalance = 0
            for piece_type in chess.PIECE_TYPES:
                imbalance += max(0, all_turn_piece_counts[future_non_capture_turn_ind]["white"][piece_type] - all_turn_piece_counts[i]["black"][piece_type])
                imbalance += max(0, all_turn_piece_counts[future_non_capture_turn_ind]["black"][piece_type] - all_turn_piece_counts[i]["white"][piece_type])
            cur_node_value += imbalance
            for j, w in enumerate(ws):
                cur_node_value += w * move_scores[i+j]
            # Don't start in a position where en passant is possible
            if cur_board.ep_square is not None:
                cur_node_value = -1
            # Remove positions where we can castle but it doesn't look like it
            if cur_board.has_chess960_castling_rights():
                cur_node_value = -1
            # Remove positions where we can't castle yet looks like it
            for color in [chess.WHITE, chess.BLACK]:
                # Enforce the king and rook are on their starting squares <=> you can castle
                can_castle_kingside = cur_board.has_kingside_castling_rights(color)
                can_castle_queenside = cur_board.has_queenside_castling_rights(color)
                rank = 0 if color == chess.WHITE else 7
                if (not can_castle_kingside and cur_board.piece_at(rank * 8 + 4) is not None and cur_board.piece_at(rank * 8 + 4).piece_type == chess.KING and
                        cur_board.piece_at(rank * 8) is not None and cur_board.piece_at(rank * 8).piece_type == chess.ROOK):
                    cur_node_value = -1
                if (not can_castle_queenside and cur_board.piece_at(rank * 8 + 4) is not None and cur_board.piece_at(rank * 8 + 4).piece_type == chess.KING and
                        cur_board.piece_at(rank * 8 + 7) is not None and cur_board.piece_at(rank * 8 + 7).piece_type == chess.ROOK):
                    cur_node_value = -1
            if cur_node_value > best_node_value:
                best_node_value = cur_node_value
                best_board = cur_board
    return best_node_value, best_board


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
