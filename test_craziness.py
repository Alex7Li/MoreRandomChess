import chess.pgn
import io

from craziness import estimate_game_craziness

test_pgn ="""1. d4 e6  2. e4 
d5  3. Nc3 Bb4  4. e5 Qd7  5. Nh3 b6  6. Nf4 Ba6  7. Bxa6 Nxa6  8. O-O Bxc3  9. bxc3 g6  10. a4 Ne7  11. h4 h5  12. 
Qf3 Nf5  13. Ne2 Nb8  14. Bg5 Qc6  15. Qd3 a5  16. f3 Nd7  17. Kf2 Ne7  18. Nf4 Nf8  19. Bf6 Rh6  20. Rfe1 Rb8  21. 
g4 Rh7  22. gxh5 Kd7  23. Bxe7 Kxe7  24. hxg6 Nxg6  25. h5 Nxf4  26. Qxh7 Qxc3  27. Rad1 Qc4  28. Kg3 Ne2+  29. Rxe2 
Qxe2  30. Rh1 Qd2  31. Qg7 Rh8  32. Qf6+ Kd7  33. Qxf7+ Kc6  34. Qxe6+ Kb7  35. h6 Qxd4  36. h7 Rf8  37. Qf6 Rxf6  
38. exf6 Qxf6  39. h8=Q Qg5+  40. Kh3 Qf5+  41. Kg2 Qg5+  42. Kf1 Qc1+  43. Ke2 Qxc2+  44. Ke3 Qxa4  45. Qd4 Qa3+  
46. Kf2 Qb3  47. f4 Qc2+  48. Kf3 Qb3+  49. Kg4 Qa2  50. Kf5 Qg2  51. Rg1 Qc2+  52. Kg5 Qh7  53. f5 c6  54. f6 Ka6  
55. Qe3 d4  56. Qxd4 Qg8+  57. Kf4 Qa2  58. Rg4 Qe6  59. Rg7 Qe2  60. f7 c5  61. Qe3 Qf1+  62. Qf3 Qc1+  63. Kf5 Qc2+
64. Qe4 Qf2+  65. Ke6 Qa2+  66. Ke7 c4  67. f8=Q Kb5  68. Qe8+ Kb4  69. Qe5 Qb3  70. Q8b5+ Ka3  71. Qa1+ Qa2  72. 
Rg3+ c3  73. Rxc3#"""

game = chess.pgn.read_game(io.StringIO(test_pgn))
estimate_game_craziness(game)
