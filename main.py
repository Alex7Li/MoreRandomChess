from os import listdir
from time import time
from chess.pgn import read_game
from craziness import estimate_game_craziness
import re
from rich.progress import track
games_directory = "caissabase"

high_score_game_count = 960
low_score_game_count = 20

pgn_files = [f for f in listdir(games_directory) if f.endswith('.pgn')]

craziest_games = []

start_time = time()
pbar = track(list(enumerate(pgn_files)))
games_seen = 0
output_log = open(f"output_{time()}.log", "w")
for file_index, pgn_file_name in pbar:
    # read current pgn file in directory
    pgn_file = open(f"{games_directory}/{pgn_file_name}", errors="ignore")

    # parse current pgn file
    game = read_game(pgn_file)

    # attempt to load game index from snapshot
    game_index = 0

    while game is not None:
        seen_fens = set()
        game_site = game.headers.get("Site")

        game_date = game.headers.get("Date")

        try:
            white_elo = int(game.headers.get("WhiteElo"))
            black_elo = int(game.headers.get("BlackElo"))
        except:
            try:
                game = read_game(pgn_file)
            except:
                print(f"failed to parse game {game_index + 2}, skipping to next file...")
                break

            game_index += 1
            continue
        if (
            len(list(game.mainline_moves())) >= 100
            and game_site is not None
            and "chess.com" not in game_site
            and "lichess" not in game_site
            and game_date is not None
            and white_elo >= 2200
            and black_elo >= 2200
            and game.headers.get("Event") != game.headers.get("Site")
        ):
            game_score, best_position = estimate_game_craziness(game)
            # if (games_seen + game_index) % 500 == 0 and len(craziest_games) > 50:
            #     output_log.write("\n".join([
            #         f"the top {high_score_game_count} highest scoring games found were:",
            #         "\n".join([
            #             str(game) for game in craziest_games
            #         ]) ,
            #     ]))
            #     exit(0)
            if (games_seen + game_index) % 200 == 0 and len(craziest_games) > 50:
                print(f"Min score {craziest_games[-1]['score']} Max score {craziest_games[0]['score']} Sample fen {craziest_games[50]['fen']}")
            if best_position is not None and best_position.fen() not in seen_fens:
                seen_fens.add(best_position.fen())
                craziest_games.append({
                    "score": game_score,
                    "fen": best_position.fen(),
                    'pgn': re.sub(' [0-9]+\.\.\. ', '', re.sub("[\{].*?[\}]", "", str(game.mainline_moves()))),
                    "headers": str(game.headers),
                })
                craziest_games.sort(
                    key=lambda game_data : game_data["score"],
                    reverse=True
                )

                craziest_games = craziest_games[:high_score_game_count]
        # try:
        game = read_game(pgn_file)
        # except:
        #     print(f"failed to parse game {game_index + 2}, skipping to next file...")
        #     break
        game_index += 1
    games_seen += game_index
highest_scoring_leaderboard = "\n".join([
    str(game) for game in craziest_games
])

output_log.write("\n".join([
    f"the top {high_score_game_count} highest scoring games found were:",
    highest_scoring_leaderboard,
]))

print(f"process finished in {round(time() - start_time, 2)}s")