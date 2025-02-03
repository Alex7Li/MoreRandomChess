import ast
import os
from pathlib import Path
from os import listdir
from time import time
from chess.pgn import read_game
from craziness import estimate_game_craziness
import re
from rich.progress import Progress
from stockfish import Stockfish

stockfish_path = '/home/alexli/fun/stockfish/stockfish-ubuntu-x86-64-avx2'
fish_params = {"Threads": 12, "Hash": 8192 * 2, "Slow Mover": 0}
engine = Stockfish(path=stockfish_path, parameters=fish_params)
engine.set_depth(23)
def get_cp_evaluation(fen):
    engine.set_fen_position(fen)
    evaluation = engine.get_evaluation()
    if evaluation['type'] != 'cp':
        return 1000 * (1 if evaluation['value'] > 0 else -1)  # It's a mate-in-N
    else:
        return evaluation['value']  # Black lost and black's position is worse

skip_games_file = Path('games_to_skip.txt')
skip_games_file.touch()
keep_games_file = Path('games_to_keep.txt')
keep_games_file.touch()
with open(skip_games_file, 'r') as f:
    skip_games = set([l.strip() for l in f.readlines()])
with open(keep_games_file, 'r') as f:
    keep_games = set([l.strip() for l in f.readlines()])

if __name__ == "__main__":
    games_directory = "caissabase"

    high_score_game_count = 960
    low_score_game_count = 20

    pgn_files = [f for f in listdir(games_directory) if f.endswith('.pgn')]

    craziest_games = []
    start_time = time()
    with Progress() as progress:
        all_files_task = progress.add_task('read_files', total=len(pgn_files))

        games_seen = 0
        for file_index, pgn_file_name in list(enumerate(pgn_files)):
            progress.update(all_files_task, advance=1)
            # read current pgn file in directory
            pgn_file = open(f"{games_directory}/{pgn_file_name}", errors="ignore")

            # parse current pgn file
            game = read_game(pgn_file)

            # attempt to load game index from snapshot
            game_index = 0

            while game is not None:
                game_index += 1

                seen_fens = set()
                game_site = game.headers.get("Site")

                game_date = game.headers.get("Date")
                try:
                    white_elo = int(game.headers.get("WhiteElo"))
                    black_elo = int(game.headers.get("BlackElo"))
                except Exception:
                    game = read_game(pgn_file)

                if (
                    white_elo >= 3000
                    and black_elo >= 3000
                    and 'TerminationDetails' in game.headers
                    and 'GameEndTime' in game.headers
                    # Remove short games that end in an early 3-fold repetition trying to hold a draw since it's hard
                    # for one side to win
                    and not (len(list(game.mainline())) <= 140 and game.headers['TerminationDetails'] == '3-Fold repetition')
                ):
                    is_fair = None
                    if game.headers['GameEndTime'] in skip_games:
                        is_fair = False
                    elif game.headers['GameEndTime'] in keep_games:
                        is_fair = True
                    pgn = re.sub(' [0-9]+\.\.\. ', '', re.sub("[\{].*?[\}]", "", str(game.mainline_moves())))
                    DEBUG_GAME_TIME = None
                    if DEBUG_GAME_TIME is not None and game.headers['GameEndTime'].strip() != DEBUG_GAME_TIME:
                        game_score, best_position = 0, None
                    else:
                        game_score, best_position = estimate_game_craziness(game, is_fair)
                    if is_fair is None and DEBUG_GAME_TIME is None:
                        if best_position is None:
                            with open(skip_games_file, 'a') as f:
                                f.write(game.headers['GameEndTime'] + "\n")
                        else:
                            with open(keep_games_file, 'a') as f:
                                f.write(game.headers['GameEndTime'] + "\n")
                    if best_position is not None and best_position.fen() not in seen_fens:
                        seen_fens.add(best_position.fen())
                        header = f"{game.headers['White']} v {game.headers['Black']} a {game.headers['Event']} {game.headers['Event']}"
                        craziest_games.append({
                            "score": game_score,
                            "fen": best_position.fen(),
                            "headers": f"{game.headers.get('White', 'unknown')} (as white) v {game.headers.get('Black', 'unknown')} at tcec {game.headers.get('Event', '')}",
                            "pgn": pgn,
                        })
                        craziest_games.sort(
                            key=lambda game_data : game_data["score"],
                            reverse=True
                        )

                        craziest_games = craziest_games[:high_score_game_count]
                        progress.update(all_files_task, description=f"Seen: {games_seen + game_index} Min score: {craziest_games[-1]['score']:.1f} Max score: {craziest_games[0]['score']:.1f}")
                        if (games_seen + game_index) % 200 == 0 and len(craziest_games) > 50:
                            print(f"score {craziest_games[20]['score']} fen {craziest_games[20]['fen']} pgn {craziest_games[20]['pgn']} t [{craziest_games[20]['headers']['GameEndTime']}]")
                game = read_game(pgn_file)
            games_seen += game_index

    highest_scoring_leaderboard = ",\n".join([
        game for game in craziest_games
    ])
    output_log = open(f"output_{time()}.log", "w")

    output_log.write(f"the top {high_score_game_count} highest scoring games found were:\n{highest_scoring_leaderboard}",)

    output_log_2 = open(f"rand_positions_tcec_short.txt", "w")
    with Progress() as progress:
        add_eval_task = progress.add_task('cp eval', total=len(craziest_games))
        for i in range(len(craziest_games)):
            craziest_games[i]['eval'] = get_cp_evaluation(game['fen'])

    output_log_2.write(str(craziest_games))

    print(f"process finished in {round(time() - start_time, 2)}s")