import ast
import io
from chess.pgn import read_game

games = []
with open('chesscraziness/logs/tcecresults.log') as f:
    lines = f.readlines()
    for line in lines[1:]:
        if len(line):
            game_data = ast.literal_eval(line)
            game= read_game(io.StringIO(game_data['game']))
            games.append(game_data)