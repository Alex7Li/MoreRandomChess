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

def get_cp_evaluation(fen, engine):
    if fen in fen_cache:
        return fen_cache[fen]
    engine.set_fen_position(fen)
    evaluation = engine.get_evaluation()
    if evaluation['type'] != 'cp':
        result = 1000 * (1 if evaluation['value'] > 0 else -1)  # It's a mate-in-N
    else:
        result =  evaluation['value']  # Black lost and black's position is worse
    fen_cache[fen] = result
    return result

with open('fen_cache.txt', 'r') as f:
    fen_cache = ast.literal_eval(f.readline())

if __name__ == "__main__":
    stockfish_path = '/home/alexli/fun/stockfish/stockfish-ubuntu-x86-64-avx2'
    fish_params = {"Threads": 12, "Hash": 8192 * 2, "Slow Mover": 0}
    engine = Stockfish(path=stockfish_path, parameters=fish_params)
    engine.set_depth(23)
    games_directory = "caissabase"

    high_score_game_count = 960

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
                    and 'Result' in game.headers
                    and 'TerminationDetails' in game.headers
                    and 'GameEndTime' in game.headers
                    # Remove short games that end in an early 3-fold repetition trying to hold a draw since it's hard
                    # for one side to win
                    and not (len(list(game.mainline())) <= 140 and game.headers['TerminationDetails'] == '3-Fold repetition')
                ):
                    pgn = re.sub(' [0-9]+\.\.\. ', '', re.sub("[\{].*?[\}]", "", str(game.mainline_moves())))
                    game_score, best_position = estimate_game_craziness(game)
                    if best_position is not None and best_position.fen() not in seen_fens:
                        seen_fens.add(best_position.fen())
                        header = f"{game.headers['White']} v {game.headers['Black']} a {game.headers['Event']} {game.headers['Event']}"
                        craziest_games.append({
                            "score": game_score,
                            "fen": best_position.fen(),
                            "headers": f"{game.headers.get('White', 'unknown')} (as white) v {game.headers.get('Black', 'unknown')} at tcec {game.headers.get('Event', '')}",
                            "pgn": pgn,
                            "fair": 'maybe',
                            "eval": 'unknown',
                            'result': game.headers['Result']
                        })
                        progress.update(all_files_task, description=f"Seen: {games_seen + game_index} Min score: {craziest_games[-1]['score']:.1f} Max score: {craziest_games[0]['score']:.1f}")
                game = read_game(pgn_file)
            games_seen += game_index

            if file_index >= len(pgn_files) - 1:
                craziest_games.sort(
                    key=lambda game_data : game_data["score"],
                    reverse=True
                )
                game_eval_task = progress.add_task('game_eval', total=high_score_game_count)
                fair_crazy_games = []
                for game in craziest_games:
                    if len(fair_crazy_games) > high_score_game_count:
                        break
                    if game['fair'] == 'maybe':
                        evaluation = get_cp_evaluation(game['fen'], engine)
                        game['eval'] = evaluation
                        if -1.25 < evaluation < 0.75 and game['result'] == '1-0':
                            game['fair'] = 'yes'
                        elif -.75 < evaluation < 1.25 and game['result'] == '0-1':
                            game['fair'] = 'yes'
                        elif -1.25 < evaluation < 1.25 and game['result'] ==  '1/2-1/2':
                            game['fair'] = 'yes'

                    if game['fair'] == 'yes':
                        fair_crazy_games.append(game)
                        progress.update(game_eval_task, advance=1)
                craziest_games = fair_crazy_games
                half_ind = high_score_game_count // 2
                print(f"score {craziest_games[half_ind]['score']} fen {craziest_games[half_ind]['fen']} pgn {craziest_games[half_ind]['pgn']} t [{craziest_games[half_ind]['headers']}]")

    highest_scoring_leaderboard = ",\n".join([
        str(game) for game in craziest_games
    ])

    with Progress() as progress:
        add_eval_task = progress.add_task('cp eval', total=len(craziest_games))
        for i in range(len(craziest_games)):
            if craziest_games[i]['eval'] == 'unknown':
                craziest_games[i]['eval'] = get_cp_evaluation(craziest_games[i]['fen'], engine)
            progress.update(add_eval_task, advance=1)
    with open(f"rand_positions_tcec_short.txt", "w") as output_log:
        output_log.write(str(craziest_games))


    print(f"process finished in {round(time() - start_time, 2)}s")

with open('fen_cache.txt', 'w') as f:
    f.write(fen_cache)
