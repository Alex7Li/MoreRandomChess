import ast
with open(f"rand_positions_tcec_short.txt", "r") as f:
    games = [ast.literal_eval(l)[0] for l in f.readlines() ]
    games = [game for game in games if 'Viewer Submitted Openings' not in game['headers']]

with open(f"rand_positions_tcec_filter.txt", "w+") as f:
    f.write(str(games))
